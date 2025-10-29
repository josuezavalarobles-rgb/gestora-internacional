// WhatsApp Simple - Versión que FUNCIONA
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');

async function startWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('\n📱 ESCANEA ESTE QR CON WHATSAPP:\n');
            qrcode.generate(qr, { small: true });
            console.log('\n');
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                startWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('✅ WHATSAPP CONECTADO!\n');
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

console.log('🚀 Iniciando WhatsApp Bot...\n');
startWhatsApp();
