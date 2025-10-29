/**
 * ========================================
 * SERVICIO WHATSAPP CON BAILEYS
 * ========================================
 * Maneja la conexión con WhatsApp y procesamiento de mensajes
 */

import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  proto,
  downloadMediaMessage,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

import { logger } from '../../utils/logger';
import { config } from '../../config';
import { AIService } from '../ai/AIService';
import { CasoService } from '../casos/CasoService';
import { NotificacionService } from '../notifications/NotificacionService';
import { Mensaje } from '../../models/mongodb/Mensaje';
import { Conversacion } from '../../models/mongodb/Conversacion';

export class WhatsAppService {
  private static instance: WhatsAppService;
  private sock: WASocket | null = null;
  private qrCode: string | null = null;
  private isConnected: boolean = false;

  private aiService: AIService;
  private casoService: CasoService;
  private notificacionService: NotificacionService;

  private constructor() {
    this.aiService = AIService.getInstance();
    this.casoService = new CasoService();
    this.notificacionService = new NotificacionService();
  }

  public static getInstance(): WhatsAppService {
    if (!WhatsAppService.instance) {
      WhatsAppService.instance = new WhatsAppService();
    }
    return WhatsAppService.instance;
  }

  /**
   * Inicializar conexión WhatsApp
   */
  public async initialize(): Promise<void> {
    try {
      const authPath = path.join(__dirname, '../../../auth_info_baileys');

      // Crear directorio de autenticación si no existe
      if (!fs.existsSync(authPath)) {
        fs.mkdirSync(authPath, { recursive: true });
      }

      const { state, saveCreds } = await useMultiFileAuthState(authPath);

      this.sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: logger as any,
        browser: ['Amico Management', 'Chrome', '110.0.0'],
        defaultQueryTimeoutMs: undefined,
      });

      // Event: Actualización de conexión
      this.sock.ev.on('connection.update', async (update) => {
        await this.handleConnectionUpdate(update, saveCreds);
      });

      // Event: Credenciales actualizadas
      this.sock.ev.on('creds.update', saveCreds);

      // Event: Mensajes recibidos
      this.sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type === 'notify') {
          for (const message of messages) {
            await this.handleIncomingMessage(message);
          }
        }
      });

      // Event: Actualización de mensajes (leídos, entregados)
      this.sock.ev.on('messages.update', async (updates) => {
        for (const update of updates) {
          await this.handleMessageUpdate(update);
        }
      });

      logger.info('✅ WhatsApp Service inicializado');
    } catch (error) {
      logger.error('❌ Error al inicializar WhatsApp Service:', error);
      throw error;
    }
  }

  /**
   * Manejar actualizaciones de conexión
   */
  private async handleConnectionUpdate(
    update: any,
    saveCreds: () => Promise<void>
  ): Promise<void> {
    const { connection, lastDisconnect, qr } = update;

    // QR Code generado
    if (qr) {
      this.qrCode = await QRCode.toDataURL(qr);
      logger.info('📱 QR Code generado. Escanea con WhatsApp.');
      logger.info(this.qrCode);
    }

    // Conexión cerrada
    if (connection === 'close') {
      const shouldReconnect =
        (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;

      logger.warn('⚠️  Conexión cerrada. Reconectar:', shouldReconnect);

      if (shouldReconnect) {
        await this.initialize();
      } else {
        this.isConnected = false;
      }
    }

    // Conexión abierta
    if (connection === 'open') {
      this.isConnected = true;
      this.qrCode = null;
      logger.info('✅ WhatsApp conectado correctamente');
    }
  }

  /**
   * Procesar mensaje entrante
   */
  private async handleIncomingMessage(message: proto.IWebMessageInfo): Promise<void> {
    try {
      // Ignorar mensajes propios y de estado
      if (message.key.fromMe || message.key.remoteJid === 'status@broadcast') {
        return;
      }

      const telefono = message.key.remoteJid?.replace('@s.whatsapp.net', '') || '';
      const messageId = message.key.id || uuidv4();

      // Extraer contenido del mensaje
      const messageContent = this.extractMessageContent(message);

      if (!messageContent.texto && !messageContent.mediaUrl) {
        logger.warn('⚠️  Mensaje sin contenido válido');
        return;
      }

      logger.info(`📥 Mensaje recibido de ${telefono}: ${messageContent.texto}`);

      // Guardar mensaje en MongoDB
      await Mensaje.create({
        whatsappMessageId: messageId,
        telefono,
        direccion: 'entrante',
        tipo: messageContent.tipo,
        contenido: messageContent.texto || '[Multimedia]',
        mediaUrl: messageContent.mediaUrl,
        enviadoPor: 'humano',
        procesadoPorIA: false,
        estadoEntrega: 'entregado',
        fechaEnvio: new Date(),
      });

      // Obtener o crear conversación
      let conversacion = await Conversacion.findOne({ telefono });

      if (!conversacion) {
        conversacion = await Conversacion.create({
          telefono,
          estado: 'activa',
          etapa: 'inicial',
          contexto: {
            historialIntents: [],
          },
          casosActivos: [],
        });
      }

      // Actualizar actividad
      await conversacion.actualizarActividad();

      // Marcar como leído (opcional)
      if (config.whatsapp.autoMarkRead && this.sock) {
        await this.sock.readMessages([message.key]);
      }

      // Procesar con IA
      await this.processMessageWithAI(telefono, messageContent, conversacion);
    } catch (error) {
      logger.error('❌ Error al procesar mensaje entrante:', error);
    }
  }

  /**
   * Procesar mensaje con IA
   */
  private async processMessageWithAI(
    telefono: string,
    messageContent: any,
    conversacion: any
  ): Promise<void> {
    try {
      // Obtener contexto de conversación reciente
      const mensajesRecientes = await Mensaje.find({ telefono })
        .sort({ fechaEnvio: -1 })
        .limit(config.bot.maxContextMessages)
        .lean();

      // Analizar con IA
      const aiResponse = await this.aiService.processMessage({
        telefono,
        mensaje: messageContent.texto,
        mediaUrl: messageContent.mediaUrl,
        contextoConversacion: mensajesRecientes,
        datosRecopilados: conversacion.contexto.datosRecopilados || {},
        etapa: conversacion.etapa,
      });

      // Guardar contexto IA
      conversacion.contexto.ultimoIntent = aiResponse.intent;
      conversacion.contexto.historialIntents.push(aiResponse.intent);

      // Actualizar datos recopilados
      if (aiResponse.datosRecopilados) {
        conversacion.contexto.datosRecopilados = {
          ...conversacion.contexto.datosRecopilados,
          ...aiResponse.datosRecopilados,
        };
      }

      // Actualizar etapa
      if (aiResponse.nuevaEtapa) {
        conversacion.etapa = aiResponse.nuevaEtapa;
      }

      // ¿Requiere escalamiento a humano?
      if (aiResponse.requiereHumano) {
        conversacion.contexto.requiereHumano = true;
        conversacion.contexto.razonEscalamiento = aiResponse.razonEscalamiento;

        // Notificar a agentes
        await this.notificacionService.notificarNuevoCasoRequiereHumano(
          telefono,
          aiResponse.razonEscalamiento || 'Usuario solicita atención humana'
        );
      }

      await conversacion.save();

      // Enviar respuesta
      if (aiResponse.respuesta) {
        await this.sendMessage(telefono, aiResponse.respuesta);

        // Guardar respuesta en MongoDB
        await Mensaje.create({
          whatsappMessageId: uuidv4(),
          telefono,
          direccion: 'saliente',
          tipo: 'texto',
          contenido: aiResponse.respuesta,
          enviadoPor: 'bot',
          procesadoPorIA: true,
          respuestaIA: aiResponse.respuesta,
          contextoIA: {
            intent: aiResponse.intent,
            confidence: aiResponse.confidence,
            requiereHumano: aiResponse.requiereHumano,
          },
          estadoEntrega: 'enviado',
          fechaEnvio: new Date(),
        });
      }

      // Crear caso si está completo
      if (aiResponse.crearCaso && conversacion.contexto.datosRecopilados) {
        const caso = await this.casoService.crearDesdeWhatsApp(
          telefono,
          conversacion.contexto.datosRecopilados
        );

        conversacion.casosActivos.push(caso.id);
        conversacion.casoActual = caso.id;
        await conversacion.save();

        logger.info(`✅ Caso ${caso.numeroCaso} creado exitosamente`);
      }
    } catch (error) {
      logger.error('❌ Error al procesar mensaje con IA:', error);

      // Enviar mensaje de error genérico
      await this.sendMessage(
        telefono,
        'Disculpa, tuve un problema procesando tu mensaje. ¿Puedes intentar de nuevo?'
      );
    }
  }

  /**
   * Extraer contenido del mensaje
   */
  private extractMessageContent(message: proto.IWebMessageInfo): any {
    const messageType = Object.keys(message.message || {})[0];

    switch (messageType) {
      case 'conversation':
        return {
          tipo: 'texto',
          texto: message.message?.conversation || '',
        };

      case 'extendedTextMessage':
        return {
          tipo: 'texto',
          texto: message.message?.extendedTextMessage?.text || '',
        };

      case 'imageMessage':
        return {
          tipo: 'imagen',
          texto: message.message?.imageMessage?.caption || '[Imagen]',
          mediaUrl: 'pending', // Se descargará después
        };

      case 'videoMessage':
        return {
          tipo: 'video',
          texto: message.message?.videoMessage?.caption || '[Video]',
          mediaUrl: 'pending',
        };

      case 'audioMessage':
        return {
          tipo: 'audio',
          texto: '[Audio]',
          mediaUrl: 'pending',
        };

      case 'documentMessage':
        return {
          tipo: 'documento',
          texto: message.message?.documentMessage?.fileName || '[Documento]',
          mediaUrl: 'pending',
        };

      default:
        return {
          tipo: 'texto',
          texto: '[Mensaje no soportado]',
        };
    }
  }

  /**
   * Enviar mensaje de texto
   */
  public async sendMessage(telefono: string, mensaje: string): Promise<void> {
    if (!this.sock || !this.isConnected) {
      throw new Error('WhatsApp no está conectado');
    }

    try {
      const jid = `${telefono}@s.whatsapp.net`;

      // Simular escritura (opcional)
      await this.sock.presenceSubscribe(jid);
      await this.sock.sendPresenceUpdate('composing', jid);

      // Delay para simular escritura humana
      await new Promise((resolve) => setTimeout(resolve, config.bot.responseDelay));

      await this.sock.sendPresenceUpdate('paused', jid);

      // Enviar mensaje
      await this.sock.sendMessage(jid, { text: mensaje });

      logger.info(`📤 Mensaje enviado a ${telefono}: ${mensaje}`);
    } catch (error) {
      logger.error('❌ Error al enviar mensaje:', error);
      throw error;
    }
  }

  /**
   * Enviar imagen con caption
   */
  public async sendImage(
    telefono: string,
    imagePath: string,
    caption?: string
  ): Promise<void> {
    if (!this.sock || !this.isConnected) {
      throw new Error('WhatsApp no está conectado');
    }

    try {
      const jid = `${telefono}@s.whatsapp.net`;

      await this.sock.sendMessage(jid, {
        image: { url: imagePath },
        caption,
      });

      logger.info(`📤 Imagen enviada a ${telefono}`);
    } catch (error) {
      logger.error('❌ Error al enviar imagen:', error);
      throw error;
    }
  }

  /**
   * Manejar actualización de estado de mensaje
   */
  private async handleMessageUpdate(update: any): Promise<void> {
    try {
      const messageId = update.key.id;
      const status = update.update.status;

      const statusMap: Record<number, string> = {
        0: 'enviando',
        1: 'enviado',
        2: 'entregado',
        3: 'leido',
      };

      await Mensaje.findOneAndUpdate(
        { whatsappMessageId: messageId },
        {
          estadoEntrega: statusMap[status] || 'enviado',
          ...(status === 2 && { fechaEntrega: new Date() }),
          ...(status === 3 && { fechaLeido: new Date() }),
        }
      );
    } catch (error) {
      logger.error('❌ Error al actualizar estado de mensaje:', error);
    }
  }

  /**
   * Obtener QR Code
   */
  public getQRCode(): string | null {
    return this.qrCode;
  }

  /**
   * Estado de conexión
   */
  public isWhatsAppConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Desconectar
   */
  public async disconnect(): Promise<void> {
    if (this.sock) {
      await this.sock.logout();
      this.sock = null;
      this.isConnected = false;
      logger.info('✅ WhatsApp desconectado');
    }
  }
}
