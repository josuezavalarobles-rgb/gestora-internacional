# 📱 CÓDIGO PARA CONECTAR WHATSAPP - COPIA Y EJECUTA

## ✅ **PASO 1: Crea este archivo**

**Ubicación:** `c:\Users\josue\mis-sitios-bluehost\public_html\amico\backend\wa-qr.js`

**Copia este código:**

```javascript
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

let currentQR = null;
let isConnected = false;

async function connectWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('📱 QR generado!');
            currentQR = await qrcode.toDataURL(qr);
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                console.log('Reconectando...');
                setTimeout(connectWhatsApp, 3000);
            }
        } else if (connection === 'open') {
            console.log('✅ WHATSAPP CONECTADO!');
            isConnected = true;
            currentQR = null;
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.key.fromMe && m.type === 'notify') {
            const text = msg.message?.conversation || '';
            console.log(`📨 Mensaje: ${text}`);

            if (text.toLowerCase().includes('hola')) {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: '¡Hola! Bot de Amico funcionando ✅'
                });
            }
        }
    });
}

// API para obtener QR
app.get('/qr', (req, res) => {
    if (isConnected) {
        res.json({ connected: true, qr: null });
    } else if (currentQR) {
        res.json({ connected: false, qr: currentQR });
    } else {
        res.json({ connected: false, qr: null, message: 'Generando QR...' });
    }
});

// Página HTML para mostrar QR
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>WhatsApp QR - Amico</title>
            <style>
                body {
                    font-family: Arial;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                }
                .container {
                    background: white;
                    padding: 40px;
                    border-radius: 20px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    text-align: center;
                }
                #qr { max-width: 300px; margin: 20px 0; }
                .status { padding: 15px; border-radius: 10px; margin: 20px 0; font-weight: bold; }
                .success { background: #d4edda; color: #155724; }
                .loading { background: #fff3cd; color: #856404; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>📱 WhatsApp - Amico Management</h1>
                <div id="status" class="status loading">⏳ Generando QR...</div>
                <img id="qr" src="" style="display:none">
                <div>
                    <strong>Instrucciones:</strong><br>
                    1. Abre WhatsApp<br>
                    2. Dispositivos vinculados<br>
                    3. Vincular dispositivo<br>
                    4. Escanea el QR<br>
                </div>
            </div>
            <script>
                async function loadQR() {
                    try {
                        const res = await fetch('/qr');
                        const data = await res.json();

                        if (data.connected) {
                            document.getElementById('status').className = 'status success';
                            document.getElementById('status').textContent = '✅ WhatsApp Conectado!';
                            document.getElementById('qr').style.display = 'none';
                        } else if (data.qr) {
                            document.getElementById('qr').src = data.qr;
                            document.getElementById('qr').style.display = 'block';
                            document.getElementById('status').className = 'status success';
                            document.getElementById('status').textContent = '👆 Escanea este QR';
                        }
                    } catch (e) {
                        console.error(e);
                    }
                    setTimeout(loadQR, 2000);
                }
                loadQR();
            </script>
        </body>
        </html>
    `);
});

app.listen(4000, () => {
    console.log('🌐 Abre tu navegador en: http://localhost:4000');
    connectWhatsApp();
});
```

---

## ✅ **PASO 2: Ejecuta este comando**

Abre PowerShell o CMD y ejecuta:

```bash
cd c:\Users\josue\mis-sitios-bluehost\public_html\amico\backend
node wa-qr.js
```

---

## ✅ **PASO 3: Abre tu navegador**

```
http://localhost:4000
```

Verás el QR code como **IMAGEN** que SÍ puedes escanear.

---

## 📱 **PASO 4: Escanea con WhatsApp**

1. Abre WhatsApp en tu celular
2. Configuración → Dispositivos vinculados
3. Vincular un dispositivo
4. Escanea el QR que aparece en http://localhost:4000

---

**¡Copia el código arriba, créalo como `wa-qr.js` y ejecútalo!** 🚀
