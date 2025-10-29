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
                    text: '¡Hola! Soy el bot de Amico Management ✅\n\n¿En qué puedo ayudarte?\n\n1️⃣ Reportar problema\n2️⃣ Ver mis casos\n3️⃣ Programar cita'
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

// Página HTML
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>WhatsApp QR</title>
            <style>
                body { font-family: Arial; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
                .container { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); text-align: center; }
                #qr { max-width: 300px; margin: 20px 0; border: 3px solid #667eea; border-radius: 10px; }
                .status { padding: 15px; border-radius: 10px; margin: 20px 0; font-weight: bold; }
                .success { background: #d4edda; color: #155724; }
                .loading { background: #fff3cd; color: #856404; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>📱 WhatsApp QR</h1>
                <div id="status" class="status loading">⏳ Cargando...</div>
                <img id="qr" src="" style="display:none">
                <p><strong>1.</strong> Abre WhatsApp<br><strong>2.</strong> Dispositivos vinculados<br><strong>3.</strong> Escanea el QR</p>
            </div>
            <script>
                async function load() {
                    const res = await fetch('/qr');
                    const data = await res.json();
                    if (data.connected) {
                        document.getElementById('status').className = 'status success';
                        document.getElementById('status').textContent = '✅ Conectado!';
                    } else if (data.qr) {
                        document.getElementById('qr').src = data.qr;
                        document.getElementById('qr').style.display = 'block';
                        document.getElementById('status').textContent = '👆 Escanea';
                        document.getElementById('status').className = 'status success';
                    }
                    setTimeout(load, 2000);
                }
                load();
            </script>
        </body>
        </html>
    `);
});

app.listen(4000, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════╗');
    console.log('║   WHATSAPP QR CODE - AMICO MANAGEMENT    ║');
    console.log('╚══════════════════════════════════════════╝');
    console.log('');
    console.log('🌐 ABRE TU NAVEGADOR EN:');
    console.log('   http://localhost:4000');
    console.log('');
    console.log('📱 Verás el QR code como IMAGEN');
    console.log('');
    connectWhatsApp();
});
