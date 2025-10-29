// Test Simple de WhatsApp - Basado en tu whatsapp-bot-optica que funciona
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');

async function connectToWhatsApp() {
    console.log('🚀 Iniciando conexión a WhatsApp...\n');

    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false, // Lo hacemos manual
        logger: pino({ level: 'silent' })
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('\n📱 ESCANEA ESTE CÓDIGO QR CON WHATSAPP:\n');
            qrcode.generate(qr, { small: true });
            console.log('\n👆 Abre WhatsApp → Dispositivos Vinculados → Vincular Dispositivo\n');
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('🔴 Conexión cerrada');

            if (shouldReconnect) {
                console.log('🔄 Reconectando...');
                setTimeout(() => connectToWhatsApp(), 3000);
            }
        } else if (connection === 'open') {
            console.log('\n✅ ¡WHATSAPP CONECTADO EXITOSAMENTE!\n');
            console.log('🎉 El bot está listo para recibir mensajes\n');
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];

        if (!msg.key.fromMe && m.type === 'notify') {
            const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
            const from = msg.key.remoteJid;

            console.log(`\n📨 Mensaje recibido de ${from}:`);
            console.log(`   "${text}"\n`);

            // Respuesta de prueba
            if (text.toLowerCase().includes('hola')) {
                await sock.sendMessage(from, {
                    text: '👋 ¡Hola! Soy el bot de Amico Management.\n\n¿En qué puedo ayudarte?\n\n1️⃣ Reportar problema\n2️⃣ Ver mis casos\n3️⃣ Programar cita'
                });
                console.log('✅ Respuesta enviada\n');
            }
        }
    });
}

console.log('╔══════════════════════════════════════════╗');
console.log('║   AMICO MANAGEMENT - WHATSAPP BOT        ║');
console.log('║        Prueba de Conexión                ║');
console.log('╚══════════════════════════════════════════╝\n');

connectToWhatsApp();
