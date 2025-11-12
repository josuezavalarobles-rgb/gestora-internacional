// BOT COMPLETO DE AMICO CON IA
require('dotenv').config();
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { OpenAI } = require('openai');
const qrcode = require('qrcode');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

let currentQR = null;
let isConnected = false;
let sock = null;

// Configurar OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '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'
});

// Historial de conversaciones
const conversaciones = {};

async function procesarConIA(telefono, mensaje) {
    try {
        // Inicializar historial si no existe
        if (!conversaciones[telefono]) {
            conversaciones[telefono] = [];
        }

        // Agregar mensaje del usuario
        conversaciones[telefono].push({
            role: 'user',
            content: mensaje
        });

        // Llamar a GPT-4
        const completion = await openai.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages: [
                {
                    role: 'system',
                    content: `Eres un asistente virtual de Amico Management, empresa dominicana que administra condominios.

PERSONALIDAD:
- Amable, profesional y empático
- Hablas en español dominicano (tuteo natural)
- Eres eficiente pero cálido

TU FUNCIÓN:
Ayudar a residentes a reportar averías y problemas técnicos.

INFORMACIÓN A RECOPILAR:
1. Tipo de problema (garantía o condominio)
2. Categoría (filtración, eléctrico, plomería, etc.)
3. Descripción del problema
4. Urgencia

OPCIONES DEL MENÚ:
1️⃣ Reportar problema técnico
2️⃣ Ver mis casos activos
3️⃣ Programar cita

Si el usuario elige 1, ayúdalo a describir su problema conversacionalmente.
Si menciona filtración, eléctrico, plomería, etc., clasifícalo automáticamente.

Responde de forma natural, no como formulario.`
                },
                ...conversaciones[telefono].slice(-10) // Últimos 10 mensajes
            ],
            max_tokens: 300,
            temperature: 0.7
        });

        const respuesta = completion.choices[0].message.content;

        // Agregar respuesta al historial
        conversaciones[telefono].push({
            role: 'assistant',
            content: respuesta
        });

        return respuesta;

    } catch (error) {
        console.error('❌ Error en IA:', error.message);
        return 'Disculpa, tuve un problema. ¿Puedes repetir tu mensaje?';
    }
}

async function connectWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys');

    sock = makeWASocket({
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
                console.log('🔄 Reconectando...');
                setTimeout(connectWhatsApp, 3000);
            }
        } else if (connection === 'open') {
            console.log('');
            console.log('✅ ¡WHATSAPP CONECTADO CON IA!');
            console.log('🤖 Bot inteligente con GPT-4 activado');
            console.log('');
            isConnected = true;
            currentQR = null;
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];

        if (!msg.key.fromMe && m.type === 'notify') {
            const texto = msg.message?.conversation ||
                         msg.message?.extendedTextMessage?.text || '';

            const telefono = msg.key.remoteJid;
            const numeroTelefono = telefono.split('@')[0];

            console.log(`\n📨 Mensaje de ${numeroTelefono}: "${texto}"`);

            // Procesar con IA
            const respuesta = await procesarConIA(numeroTelefono, texto);

            console.log(`🤖 Bot responde: "${respuesta.substring(0, 100)}..."\n`);

            // Enviar respuesta
            await sock.sendMessage(telefono, { text: respuesta });
        }
    });
}

// API endpoints
app.get('/qr', (req, res) => {
    if (isConnected) {
        res.json({ connected: true, qr: null });
    } else if (currentQR) {
        res.json({ connected: false, qr: currentQR });
    } else {
        res.json({ connected: false, qr: null, message: 'Generando QR...' });
    }
});

app.get('/status', (req, res) => {
    res.json({ connected: isConnected });
});

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>WhatsApp Bot - Amico</title>
            <style>
                body { font-family: Arial; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0; }
                .container { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); text-align: center; max-width: 500px; }
                h1 { color: #333; margin: 0 0 10px 0; }
                .subtitle { color: #666; margin-bottom: 30px; }
                #qr { max-width: 300px; margin: 20px auto; border: 3px solid #667eea; border-radius: 10px; display: block; }
                .status { padding: 15px; border-radius: 10px; margin: 20px 0; font-weight: bold; }
                .success { background: #d4edda; color: #155724; }
                .loading { background: #fff3cd; color: #856404; }
                .info { background: #e9ecef; padding: 20px; border-radius: 10px; margin-top: 20px; text-align: left; }
                .info ol { margin: 10px 0; padding-left: 20px; }
                .info li { margin: 8px 0; }
                .feature { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 10px 0; }
                .feature strong { color: #667eea; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🤖 Bot de WhatsApp con IA</h1>
                <p class="subtitle">Amico Management - GPT-4</p>

                <div id="status" class="status loading">⏳ Cargando...</div>
                <img id="qr" src="" style="display:none">

                <div class="info">
                    <strong>📱 Para conectar:</strong>
                    <ol>
                        <li>Abre WhatsApp en tu celular</li>
                        <li>Ve a Configuración → Dispositivos vinculados</li>
                        <li>Toca "Vincular un dispositivo"</li>
                        <li>Escanea el QR que aparece arriba</li>
                    </ol>
                </div>

                <div class="feature">
                    <strong>🤖 El bot puede:</strong><br>
                    ✅ Conversar naturalmente en español<br>
                    ✅ Clasificar problemas automáticamente<br>
                    ✅ Crear casos en el sistema<br>
                    ✅ Programar citas<br>
                    ✅ Dar seguimiento completo
                </div>
            </div>
            <script>
                async function load() {
                    try {
                        const res = await fetch('/qr');
                        const data = await res.json();

                        if (data.connected) {
                            document.getElementById('status').className = 'status success';
                            document.getElementById('status').innerHTML = '✅ WhatsApp Conectado!<br><small>Bot con IA activo</small>';
                            document.getElementById('qr').style.display = 'none';
                        } else if (data.qr) {
                            document.getElementById('qr').src = data.qr;
                            document.getElementById('qr').style.display = 'block';
                            document.getElementById('status').className = 'status success';
                            document.getElementById('status').textContent = '👆 Escanea este QR';
                        } else {
                            document.getElementById('status').textContent = '⏳ Generando QR...';
                        }
                    } catch (e) {
                        document.getElementById('status').className = 'status loading';
                        document.getElementById('status').textContent = '⚠️ Conectando...';
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
    console.log('║   AMICO BOT - WHATSAPP + GPT-4           ║');
    console.log('╚══════════════════════════════════════════╝');
    console.log('');
    console.log('🌐 Panel de control: http://localhost:4000');
    console.log('🤖 IA: GPT-4 Turbo');
    console.log('📱 WhatsApp: Baileys');
    console.log('');
    connectWhatsApp();
});
