const express = require("express");
const fs = require("fs");
const { exec } = require("child_process");
const router = express.Router();
const pino = require("pino");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  delay,
  makeCacheableSignalKeyStore,
  Browsers,
  jidNormalizedUser,
} = require("@whiskeysockets/baileys");
const { upload } = require("./mega");

function removeFile(FilePath) {
  if (fs.existsSync(FilePath)) {
    fs.rmSync(FilePath, { recursive: true, force: true });
  }
}

router.get("/", async (req, res) => {
  let num = req.query.number;
  if (!num) return res.status(400).send({ error: "Number is required" });

  const { state, saveCreds } = await useMultiFileAuthState(`./session`);

  try {
    const RobinPairWeb = makeWASocket({
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(
          state.keys,
          pino({ level: "fatal" }).child({ level: "fatal" })
        ),
      },
      printQRInTerminal: false,
      logger: pino({ level: "fatal" }).child({ level: "fatal" }),
      browser: Browsers.macOS("Safari"),
    });

    if (!RobinPairWeb.authState.creds.registered) {
      await delay(1500);
      num = num.replace(/[^0-9]/g, "");
      const code = await RobinPairWeb.requestPairingCode(num);
      if (!res.headersSent) res.send({ code });
    }

    RobinPairWeb.ev.on("creds.update", saveCreds);
    RobinPairWeb.ev.on("connection.update", async (s) => {
      const { connection, lastDisconnect } = s;

      if (connection === "open") {
        try {
          await delay(10000);
          const sessionFile = "./session/creds.json";
          const user_jid = jidNormalizedUser(RobinPairWeb.user.id);

          function randomMegaId(length = 6, numberLength = 4) {
            const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            let text = "";
            for (let i = 0; i < length; i++) {
              text += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            const number = Math.floor(Math.random() * Math.pow(10, numberLength));
            return `${text}${number}`;
          }

          let mega_url;
          try {
            mega_url = await upload(
              fs.createReadStream(sessionFile),
              `${randomMegaId()}.json`
            );
          } catch (e) {
            console.error("Upload failed:", e);
            return;
          }

          const sessionString = mega_url.replace("https://mega.nz/file/", "");
          const caption = `*ROBIN [The powerful WA BOT]*\n\n👉 ${sessionString} 👈\n\n*This is your Session ID. Copy and paste into config.js*\n\n*You can ask questions here:* wa.me/message/WKGLBR2PCETWD1\n\n*Join group:* https://chat.whatsapp.com/GAOhr0qNK7KEvJwbenGivZ`;
          const warning = `🛑 *Do not share this code with anyone* 🛑`;

          await RobinPairWeb.sendMessage(user_jid, {
            image: {
              url: "https://raw.githubusercontent.com/Dark-Robin/Bot-Helper/refs/heads/main/autoimage/Bot%20robin%20WP.jpg",
            },
            caption,
          });
          await RobinPairWeb.sendMessage(user_jid, { text: sessionString });
          await RobinPairWeb.sendMessage(user_jid, { text: warning });
        } catch (err) {
          console.error("Message sending failed:", err);
          exec("pm2 restart prabath");
        }

        await delay(100);
        removeFile("./session");
      } else if (
        connection === "close" &&
        lastDisconnect?.error?.output?.statusCode !== 401
      ) {
        console.log("Reconnecting...");
      }
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    exec("pm2 restart Robin-md");
    removeFile("./session");
    if (!res.headersSent) res.status(500).send({ code: "Service Unavailable" });
  }
});

process.on("uncaughtException", (err) => {
  console.error("Caught exception:", err);
  exec("pm2 restart Robin");
});
