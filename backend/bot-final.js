// BOT FINAL COMPLETO - CONECTADO CON API
require('dotenv').config();
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { OpenAI } = require('openai');
const axios = require('axios');
const qrcode = require('qrcode');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

let currentQR = null;
let isConnected = false;
let sock = null;

// API del sistema
const API_URL = 'https://amico-management-production.up.railway.app/api/v1';

// Configurar OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Historial de conversaciones
const conversaciones = {};

async function crearCasoEnSistema(telefono, datos) {
    try {
        console.log('📝 Creando caso en el sistema...');

        // Buscar o crear usuario
        let usuario = await axios.get(`${API_URL}/usuarios?telefono=${telefono}`).catch(() => null);

        if (!usuario || !usuario.data || usuario.data.length === 0) {
            // Crear usuario temporal
            usuario = await axios.post(`${API_URL}/usuarios`, {
                nombreCompleto: `Usuario ${telefono}`,
                telefono: telefono,
                tipoUsuario: 'propietario',
                estado: 'pendiente'
            });
        }

        // Crear caso
        const caso = await axios.post(`${API_URL}/casos`, {
            usuarioId: usuario.data.id || usuario.data[0]?.id,
            tipo: datos.tipo || 'condominio',
            categoria: datos.categoria || 'otro',
            descripcion: datos.descripcion,
            prioridad: datos.urgente ? 'urgente' : 'media',
            estado: 'nuevo'
        });

        console.log(`✅ Caso creado: ${caso.data.numeroCaso}`);
        return caso.data;

    } catch (error) {
        console.error('❌ Error creando caso:', error.message);
        return null;
    }
}

async function procesarConIA(telefono, mensaje) {
    try {
        if (!conversaciones[telefono]) {
            conversaciones[telefono] = {
                mensajes: [],
                datosRecopilados: {}
            };
        }

        conversaciones[telefono].mensajes.push({
            role: 'user',
            content: mensaje
        });

        const completion = await openai.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages: [
                {
                    role: 'system',
                    content: `Eres un asistente de Amico Management, empresa dominicana de administración de condominios.

PERSONALIDAD: Amable, profesional, hablas en español dominicano con tuteo natural.

FUNCIÓN: Ayudar a reportar problemas técnicos conversacionalmente.

INFORMACIÓN A RECOPILAR:
1. Tipo: garantía (defectos de construcción) o condominio (mantenimiento)
2. Categoría: filtración, eléctrico, plomería, puertas/ventanas, aires, áreas comunes
3. Descripción clara del problema
4. Urgencia (detecta palabras como "urgente", "grave", "emergencia")

RESPONDE EN JSON:
{
  "respuesta": "tu respuesta conversacional",
  "tipo_detectado": "garantia" o "condominio" (si detectaste),
  "categoria_detectada": "filtracion", "electrico", etc (si detectaste),
  "descripcion": "resumen del problema" (si la entendiste),
  "urgente": true/false,
  "crear_caso": true (solo si tienes tipo, categoría y descripción)
}

Si detectas que tiene toda la info, marca crear_caso: true.
Sé conversacional, NO formulario.`
                },
                ...conversaciones[telefono].mensajes.slice(-8)
            ],
            max_tokens: 400,
            temperature: 0.7
        });

        const respuestaCompleta = completion.choices[0].message.content;

        // Intentar parsear JSON
        let respuesta = respuestaCompleta;
        let datosExtraidos = {};

        try {
            const jsonMatch = respuestaCompleta.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                datosExtraidos = JSON.parse(jsonMatch[0]);
                respuesta = datosExtraidos.respuesta || respuestaCompleta;

                // Guardar datos recopilados
                if (datosExtraidos.tipo_detectado) {
                    conversaciones[telefono].datosRecopilados.tipo = datosExtraidos.tipo_detectado;
                }
                if (datosExtraidos.categoria_detectada) {
                    conversaciones[telefono].datosRecopilados.categoria = datosExtraidos.categoria_detectada;
                }
                if (datosExtraidos.descripcion) {
                    conversaciones[telefono].datosRecopilados.descripcion = datosExtraidos.descripcion;
                }
                if (datosExtraidos.urgente !== undefined) {
                    conversaciones[telefono].datosRecopilados.urgente = datosExtraidos.urgente;
                }

                // Crear caso si está completo
                if (datosExtraidos.crear_caso) {
                    const caso = await crearCasoEnSistema(telefono, conversaciones[telefono].datosRecopilados);

                    if (caso) {
                        respuesta += `\n\n✅ Tu caso ${caso.numeroCaso} ha sido creado exitosamente.\nUn técnico revisará tu caso pronto.`;
                    }
                }
            }
        } catch (e) {
            // No es JSON, usar respuesta como está
        }

        conversaciones[telefono].mensajes.push({
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
            console.log('✅ ¡WHATSAPP CONECTADO!');
            console.log('🤖 Bot con GPT-4 activo');
            console.log('🔗 Conectado con: ' + API_URL);
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

            console.log(`\n📨 [${numeroTelefono}]: "${texto}"`);

            // Procesar con IA
            const respuesta = await procesarConIA(numeroTelefono, texto);

            console.log(`🤖 Bot: "${respuesta.substring(0, 150)}..."\n`);

            // Enviar respuesta
            await sock.sendMessage(telefono, { text: respuesta });
        }
    });
}

// API endpoints
app.get('/qr', (req, res) => {
    res.json({
        connected: isConnected,
        qr: currentQR,
        message: isConnected ? 'Conectado' : (currentQR ? 'QR disponible' : 'Generando...')
    });
});

app.get('/status', (req, res) => {
    res.json({
        connected: isConnected,
        apiUrl: API_URL,
        conversaciones: Object.keys(conversaciones).length
    });
});

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Amico Bot</title>
            <style>
                body { font-family: Arial; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0; }
                .container { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); text-align: center; max-width: 500px; }
                h1 { color: #333; margin: 0 0 10px 0; }
                .badge { display: inline-block; padding: 5px 15px; background: #28a745; color: white; border-radius: 20px; margin: 10px 5px; font-size: 12px; }
                #qr { max-width: 300px; margin: 20px auto; border: 3px solid #667eea; border-radius: 10px; display: block; }
                .status { padding: 15px; border-radius: 10px; margin: 20px 0; font-weight: bold; }
                .success { background: #d4edda; color: #155724; }
                .loading { background: #fff3cd; color: #856404; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🤖 Amico Bot</h1>
                <div>
                    <span class="badge">GPT-4</span>
                    <span class="badge">WhatsApp</span>
                    <span class="badge">Railway API</span>
                </div>
                <div id="status" class="status loading">⏳ Cargando...</div>
                <img id="qr" src="" style="display:none">
                <div style="text-align: left; background: #f8f9fa; padding: 20px; border-radius: 10px; margin-top: 20px;">
                    <strong>🎯 El bot puede:</strong><br>
                    ✅ Conversar con GPT-4<br>
                    ✅ Clasificar problemas<br>
                    ✅ Crear casos en Railway<br>
                    ✅ Ver casos en: <a href="http://kbj.ebq.mybluehost.me/amico-app/" target="_blank">Panel Web</a>
                </div>
            </div>
            <script>
                async function load() {
                    try {
                        const res = await fetch('/qr');
                        const data = await res.json();
                        if (data.connected) {
                            document.getElementById('status').className = 'status success';
                            document.getElementById('status').innerHTML = '✅ Conectado y funcionando<br><small>Bot con IA + API activo</small>';
                            document.getElementById('qr').style.display = 'none';
                        } else if (data.qr) {
                            document.getElementById('qr').src = data.qr;
                            document.getElementById('qr').style.display = 'block';
                            document.getElementById('status').textContent = '👆 Escanea el QR';
                            document.getElementById('status').className = 'status success';
                        }
                    } catch(e){}
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
    console.log('║   AMICO BOT - SISTEMA COMPLETO           ║');
    console.log('║   WhatsApp + GPT-4 + Railway API         ║');
    console.log('╚══════════════════════════════════════════╝');
    console.log('');
    console.log('🌐 Panel: http://localhost:4000');
    console.log('🔗 API: ' + API_URL);
    console.log('🤖 IA: GPT-4 Turbo');
    console.log('');
    connectWhatsApp();
});
