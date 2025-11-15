/**
 * ========================================
 * GESTORA INTERNACIONAL SRL - BACKEND
 * Sistema Integral de Administración de Condominios
 * ========================================
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import http, { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

import { config } from './config';
import { logger } from './utils/logger';
import { connectPostgreSQL } from './config/database/postgres';
import { connectMongoDB } from './config/database/mongodb';
import { connectRedis } from './config/database/redis';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { rateLimiter } from './middleware/rateLimiter';

// Rutas Base (Amico)
import authRoutes from './routes/auth.routes';
import casosRoutes from './routes/casos.routes';
import usuariosRoutes from './routes/usuarios.routes';
import condominiosRoutes from './routes/condominios.routes';
import notificacionesRoutes from './routes/notificaciones.routes';
import kpisRoutes from './routes/kpis.routes';
import whatsappRoutes from './routes/whatsapp.routes';
import citasRoutes from './routes/citas.routes';
import aprobacionesRoutes from './routes/aprobaciones.routes';
import webhooksRoutes from './routes/webhooks.routes';
import solicitudesRoutes from './routes/solicitudes.routes';
import dashboardRoutes from './routes/dashboard.routes';

// Rutas Nuevas (Gestora Internacional)
import proveedoresRoutes from './routes/proveedores.routes';
import contabilidadRoutes from './routes/contabilidad.routes';
import estadosCuentaRoutes from './routes/estados-cuenta.routes';
import iaRoutes from './routes/ia.routes';
import adminRoutes from './routes/admin.routes';
import importRoutes from './routes/import.routes';
import areasComunesRoutes from './routes/areas-comunes.routes';
import visitasRoutes from './routes/visitas.routes';
import personalRoutes from './routes/personal.routes';
import unidadesRoutes from './routes/unidades.routes';
import calendarioRoutes from './routes/calendario.routes';
import documentosRoutes from './routes/documentos.routes';

// Servicios
import { WhatsAppService } from './services/whatsapp/WhatsAppService';
import { SocketService } from './services/sockets/SocketService';

// Jobs
import { iniciarTodosLosJobs } from './jobs';

class Application {
  public app: express.Application;
  public httpServer: http.Server;
  public io: SocketIOServer;
  private whatsappService: WhatsAppService;
  private socketService: SocketService;

  constructor() {
    this.app = express();
    this.httpServer = createServer(this.app);

    // Socket.IO con CORS para múltiples orígenes
    const allowedOrigins = config.cors.origin.split(',').map(o => o.trim());
    this.io = new SocketIOServer(this.httpServer, {
      cors: {
        origin: allowedOrigins,
        credentials: config.cors.credentials,
      },
    });

    this.whatsappService = WhatsAppService.getInstance();
    this.socketService = SocketService.getInstance(this.io);
  }

  private async initializeDatabases(): Promise<void> {
    logger.info('🔌 Conectando a bases de datos...');

    // PostgreSQL (obligatorio)
    await connectPostgreSQL();

    // MongoDB (opcional - para logs)
    if (process.env.MONGODB_URI) {
      await connectMongoDB();
    } else {
      logger.warn('⚠️  MongoDB no configurado - los logs se guardarán solo en PostgreSQL');
    }

    // Redis (opcional - para cache)
    if (process.env.REDIS_URL) {
      await connectRedis();
    } else {
      logger.warn('⚠️  Redis no configurado - cache deshabilitado');
    }

    logger.info('✅ Bases de datos conectadas');
  }

  private initializeMiddlewares(): void {
    // Seguridad
    this.app.use(helmet());

    // CORS - permitir múltiples orígenes
    const allowedOrigins = config.cors.origin.split(',').map(o => o.trim());
    this.app.use(
      cors({
        origin: (origin, callback) => {
          // Permitir requests sin origin (mobile apps, curl, etc)
          if (!origin) return callback(null, true);

          if (allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'));
          }
        },
        credentials: config.cors.credentials,
      })
    );

    // Rate limiting
    this.app.use('/api', rateLimiter);

    // Body parsers
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logger HTTP
    if (config.env === 'development') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined'));
    }

    logger.info('✅ Middlewares inicializados');
  }

  private initializeRoutes(): void {
    const apiPrefix = `/api/${config.apiVersion}`;

    // Health check ya está registrado en start() antes de inicializar las rutas
    // para que esté disponible INMEDIATAMENTE para Railway healthchecks

    // API Routes - Base (Amico)
    this.app.use(`${apiPrefix}/auth`, authRoutes);
    this.app.use(`${apiPrefix}/casos`, casosRoutes);
    this.app.use(`${apiPrefix}/usuarios`, usuariosRoutes);
    this.app.use(`${apiPrefix}/condominios`, condominiosRoutes);
    this.app.use(`${apiPrefix}/notificaciones`, notificacionesRoutes);
    this.app.use(`${apiPrefix}/kpis`, kpisRoutes);
    this.app.use(`${apiPrefix}/whatsapp`, whatsappRoutes);
    this.app.use(`${apiPrefix}/citas`, citasRoutes);
    this.app.use(`${apiPrefix}/aprobaciones`, aprobacionesRoutes);
    this.app.use(`${apiPrefix}/webhooks`, webhooksRoutes);
    this.app.use(`${apiPrefix}/solicitudes`, solicitudesRoutes);
    this.app.use(`${apiPrefix}/dashboard`, dashboardRoutes);

    // API Routes - Gestora Internacional (Nuevas)
    this.app.use(`${apiPrefix}/proveedores`, proveedoresRoutes);
    this.app.use(`${apiPrefix}/contabilidad`, contabilidadRoutes);
    this.app.use(`${apiPrefix}/estados-cuenta`, estadosCuentaRoutes);
    this.app.use(`${apiPrefix}/ia`, iaRoutes);
    this.app.use(`${apiPrefix}/admin`, adminRoutes);
    this.app.use(`${apiPrefix}/import`, importRoutes);
    this.app.use(`${apiPrefix}/areas-comunes`, areasComunesRoutes);
    this.app.use(`${apiPrefix}/visitas`, visitasRoutes);
    this.app.use(`${apiPrefix}/personal`, personalRoutes);
    this.app.use(`${apiPrefix}/unidades`, unidadesRoutes);
    this.app.use(`${apiPrefix}/calendario`, calendarioRoutes);
    this.app.use(`${apiPrefix}/documentos`, documentosRoutes);

    // Error handlers
    this.app.use(notFoundHandler);
    this.app.use(errorHandler);

    logger.info('✅ Rutas inicializadas');
  }

  private async initializeWhatsApp(): Promise<void> {
    if (!config.bot.enabled) {
      logger.warn('⚠️  WhatsApp Bot deshabilitado en configuración');
      return;
    }

    try {
      logger.info('📱 Iniciando WhatsApp Bot...');
      await this.whatsappService.initialize();
      logger.info('✅ WhatsApp Bot iniciado correctamente');
    } catch (error) {
      logger.error('❌ Error al iniciar WhatsApp Bot:', error);
      throw error;
    }
  }

  private initializeSockets(): void {
    this.socketService.initialize();
    logger.info('✅ WebSockets inicializados');
  }

  private handleGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      logger.info(`${signal} recibido. Cerrando aplicación gracefully...`);

      // Cerrar WhatsApp (TEMPORALMENTE DESHABILITADO)
      // if (this.whatsappService) {
      //   await this.whatsappService.disconnect();
      // }

      // Cerrar servidor HTTP
      this.httpServer.close(() => {
        logger.info('✅ Servidor HTTP cerrado');
        process.exit(0);
      });

      // Forzar cierre después de 10 segundos
      setTimeout(() => {
        logger.error('⚠️  Forzando cierre después de timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }

  public async start(): Promise<void> {
    try {
      // Banner
      logger.info('');
      logger.info('╔════════════════════════════════════════════════╗');
      logger.info('║     GESTORA INTERNACIONAL SRL - BACKEND        ║');
      logger.info('║  Sistema Integral de Administración de        ║');
      logger.info('║         Condominios con IA y NCF              ║');
      logger.info('╚════════════════════════════════════════════════╝');
      logger.info('');

      // CRÍTICO: Iniciar servidor HTTP PRIMERO para que Railway pueda hacer healthchecks
      const port = config.port;
      const host = '0.0.0.0'; // Escuchar en todas las interfaces (requerido para Railway/Docker)

      logger.info(`🔧 DEBUG: PORT variable = ${process.env.PORT || 'undefined'}`);
      logger.info(`🔧 DEBUG: Using port = ${port}`);
      logger.info(`🔧 DEBUG: Using host = ${host}`);

      // Configurar middlewares básicos ANTES de iniciar servidor
      this.initializeMiddlewares();

      // Health endpoint disponible INMEDIATAMENTE (antes de todo lo demás)
      this.app.get('/health', (req, res) => {
        res.json({
          status: 'ok',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          environment: config.env,
        });
      });

      // Iniciar servidor HTTP AHORA (antes de DB, rutas, jobs, etc.)
      await new Promise<void>((resolve, reject) => {
        this.httpServer.listen(port, host, () => {
          logger.info('');
          logger.info('✅ Servidor HTTP iniciado - Railway puede hacer healthchecks');
          logger.info(`🚀 API disponible en: http://${host}:${port}`);
          logger.info(`🌍 Environment: ${config.env}`);
          logger.info('');
          resolve();
        }).on('error', (err) => {
          logger.error('❌ Error al iniciar servidor HTTP:', err);
          reject(err);
        });
      });

      // AHORA sí, inicializar el resto en background (SIN AWAIT - NO BLOQUEANTE)
      logger.info('🔌 Inicializando servicios en background (no bloqueante)...');

      // Inicializar servicios de forma NO BLOQUEANTE
      // Si fallan, el servidor HTTP sigue funcionando
      this.initializeDatabases()
        .then(() => {
          logger.info('✅ Base de datos conectada');
          this.initializeRoutes();
          logger.info('✅ Rutas inicializadas');
          this.initializeSockets();
          logger.info('✅ Sockets inicializados');
          // Iniciar jobs programados
          iniciarTodosLosJobs();
          logger.info('✅ Jobs programados iniciados');
          logger.info('✅ TODOS los servicios iniciados correctamente');
          logger.info(`📚 API Docs: http://${host}:${port}/api-docs`);
          logger.info(`📱 WhatsApp Bot: ${config.bot.enabled ? 'Habilitado' : 'Deshabilitado'}`);
        })
        .catch((error) => {
          logger.error('❌ Error al inicializar servicios en background:', error);
          logger.warn('⚠️  Servidor HTTP sigue funcionando, pero con funcionalidad limitada');
        });

      // Graceful shutdown
      this.handleGracefulShutdown();
    } catch (error) {
      logger.error('❌ Error al iniciar aplicación:', error);
      process.exit(1);
    }
  }
}

// Iniciar aplicación
const app = new Application();
app.start();

export default app;
