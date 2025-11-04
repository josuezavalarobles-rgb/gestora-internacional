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

async function crearSolicitudEnSistema(telefono, datos) {
    try {
        console.log('📝 Creando solicitud en el sistema...');

        // Mapear tipo_solicitud a formato correcto
        const tipoMap = {
            'mantenimiento': 'mantenimiento',
            'pago': 'pago',
            'reserva': 'reserva',
            'acceso': 'acceso',
            'emergencia': 'emergencia',
            'consulta': 'consulta'
        };

        const urgenciaMap = {
            'critica': 'critica',
            'alta': 'alta',
            'media': 'media',
            'baja': 'baja'
        };

        // Crear solicitud con código único
        const solicitud = await axios.post(`${API_URL}/solicitudes/whatsapp`, {
            telefono: telefono,
            nombreUsuario: conversaciones[telefono]?.nombreUsuario || null,
            tipoSolicitud: tipoMap[datos.tipo_solicitud] || 'mantenimiento',
            urgencia: urgenciaMap[datos.urgencia] || 'media',
            categoria: datos.categoria || 'otro',
            descripcion: datos.descripcion || 'Sin descripción',
            mensajesWhatsApp: conversaciones[telefono]?.mensajes || [],
            emocionDetectada: datos.emocion_detectada || 'neutral'
        });

        console.log(`✅ Solicitud creada: ${solicitud.data.solicitud.codigoUnico}`);
        return {
            numeroCaso: solicitud.data.solicitud.codigoUnico,
            id: solicitud.data.solicitud.id
        };

    } catch (error) {
        console.error('❌ Error creando solicitud:', error.message);
        return null;
    }
}

async function procesarConIA(telefono, mensaje) {
    try {
        if (!conversaciones[telefono]) {
            conversaciones[telefono] = {
                mensajes: [],
                datosRecopilados: {},
                nombreUsuario: null
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
                    content: `Eres Daniel, el asistente virtual profesional de Amico Management, administradora de condominios en República Dominicana.

PERSONALIDAD:
- Profesional pero cálido (7/10 formal, 8/10 empático)
- Eficiente y proactivo
- Hablas español dominicano con tuteo natural
- Usas nombres de pila para cercanía

NEUROCIENCIA CONVERSACIONAL:
1. RAPPORT: Usa el nombre del residente, valida emociones
2. EMPATÍA: Si detectas frustración ("llevo días", "nadie me ayuda"), RECONOCE primero
3. SOLUCIÓN: Siempre ofrece próximo paso claro
4. ANTICIPACIÓN: Pregunta "¿Necesitas algo más mientras tanto?"

CASOS QUE MANEJAS:
- Mantenimiento (plomería, eléctrico, A/C, filtraciones, etc.)
- Pagos y estados de cuenta
- Reservas de áreas comunes
- Autorización de visitantes
- Emergencias

FLUJO:
1. Saluda por nombre si lo tienes
2. Si no conoces su nombre, pregúntalo de forma natural en el primer mensaje
3. Identifica TIPO de solicitud
4. Clasifica URGENCIA (detecta: "urgente", "emergencia", "grave", "ya", "ahora")
5. Recopila INFO necesaria conversacionalmente
6. Confirma y CREA ticket
7. Da código de ticket único
8. Explica próximos pasos

RESPONDE EN JSON:
{
  "respuesta": "tu respuesta empática y profesional",
  "tipo_solicitud": "mantenimiento|pago|reserva|acceso|emergencia",
  "urgencia": "baja|media|alta|critica",
  "categoria": "filtracion|electrico|plomeria|puertas|aires|etc",
  "descripcion": "resumen claro del problema",
  "crear_ticket": true/false,
  "emocion_detectada": "neutral|frustrado|satisfecho|urgente",
  "solicitar_nombre": true/false
}

EJEMPLOS DE RESPUESTAS EMPÁTICAS:

Usuario: "Llevo 3 días sin agua caliente"
Tú: "Wow, 3 días sin agua caliente debe ser muy incómodo. Lamento mucho esto. Lo priorizo como URGENTE ahora mismo. Un plomero estará en camino pronto. ¿Necesitas algo más mientras tanto?"

Usuario: "Gracias"
Tú: "Para eso estamos! Te mantengo informado. ¿Algo más en lo que pueda ayudarte?"

Usuario: "Tengo una filtración en el baño"
Tú: "Entiendo tu preocupación. Las filtraciones pueden causar daños si no se atienden rápido. Déjame crear tu solicitud ahora mismo para que un técnico vaya a revisar."

IMPORTANTE: Construye confianza, muestra empatía, y siempre da seguimiento claro.`
                },
                ...conversaciones[telefono].mensajes.slice(-8)
            ],
            max_tokens: 500,
            temperature: 0.8
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
                if (datosExtraidos.crear_ticket) {
                    const caso = await crearSolicitudEnSistema(telefono, {
                        ...conversaciones[telefono].datosRecopilados,
                        tipo_solicitud: datosExtraidos.tipo_solicitud,
                        urgencia: datosExtraidos.urgencia,
                        categoria: datosExtraidos.categoria,
                        descripcion: datosExtraidos.descripcion
                    });

                    if (caso) {
                        const tiempoEstimado = datosExtraidos.urgencia === 'critica' ? '1-2 horas' :
                                              datosExtraidos.urgencia === 'alta' ? '4-6 horas' :
                                              datosExtraidos.urgencia === 'media' ? '24 horas' : '48-72 horas';

                        respuesta += `\n\n✅ Listo! Tu solicitud ha sido creada.\n\nCódigo de seguimiento: *${caso.numeroCaso}*\nPrioridad: ${datosExtraidos.urgencia}\nTiempo estimado de atención: ${tiempoEstimado}\n\nTe mantendremos informado del progreso.`;
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
