const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 8000;

// Set max event listeners
require('events').EventEmitter.defaultMaxListeners = 500;

// Load routes
const qrRouter = require('./qr');
const codeRouter = require('./pair');

// Middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/qr', qrRouter);
app.use('/code', codeRouter);

app.get('/pair', (req, res) => {
  res.sendFile(path.join(__dirname, 'pair.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`
Don't forget to give a star!

Server running on http://localhost:${PORT}`);
});

module.exports = app;


---

2. qr.js

const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');

// Sample QR code generator
router.get('/', async (req, res) => {
  try {
    const qrText = 'Hello from Maher-Zubair QR!';
    const qrImage = await QRCode.toDataURL(qrText);
    res.send(`<img src="${qrImage}" alt="QR Code" />`);
  } catch (err) {
    res.status(500).send('Error generating QR Code');
  }
});

module.exports = router;


---

3. pair.js

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    message: 'Pair endpoint working!',
    developer: 'Maher-Zubair'
  });
});

module.exports = router;


---

4. index.html

<!DOCTYPE html>
<html>
<head>
  <title>Index</title>
</head>
<body>
  <h1>Welcome to the Maher-Zubair WhatsApp QR Bot</h1>
  <a href="/qr">Generate QR</a> |
  <a href="/pair">Pair Page</a>
</body>
</html>


---

5. pair.html

<!DOCTYPE html>
<html>
<head>
  <title>Pair Page</title>
</head>
<body>
  <h1>This is the Pair Page</h1>
  <p>Ready to connect your WhatsApp!</p>
</body>
</html>


---

6. package.json (fixed)

{
  "name": "qr-whatsapp-bot",
  "version": "1.0.0",
  "description": "QR Code based WhatsApp bot using Baileys",
  "main": "app.js",
  "engines": {
    "npm": ">=9.7.2",
    "node": ">=20.0.0"
  },
  "scripts": {
    "start": "node app.js"
  },
  "author": "Maher-Zubair",
  "license": "GPL-3.0",
  "dependencies": {
    "@whiskeysockets/baileys": "^6.5.0",
    "maher-zubair-baileys": "^6.6.5",
    "qrcode": "^1.5.3",
    "awesome-phonenumber": "^2.64.0",
    "pino": "^8.1.0",
    "phone": "3.1.30",
    "body-parser": "^1.20.1",
    "pastebin-js": "^1.0.6",
    "express": "^4.18.1",
    "path": "^0.12.7"
  }
}
