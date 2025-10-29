/**
 * ========================================
 * AMICO MANAGEMENT - BACKEND ENTRY POINT
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

// Rutas
import authRoutes from './routes/auth.routes';
import casosRoutes from './routes/casos.routes';
import usuariosRoutes from './routes/usuarios.routes';
import condominiosRoutes from './routes/condominios.routes';
import notificacionesRoutes from './routes/notificaciones.routes';
import kpisRoutes from './routes/kpis.routes';
import whatsappRoutes from './routes/whatsapp.routes';

// Servicios
import { WhatsAppService } from './services/whatsapp/WhatsAppService';
import { SocketService } from './services/sockets/SocketService';

class Application {
  public app: express.Application;
  public httpServer: http.Server;
  public io: SocketIOServer;
  private whatsappService: WhatsAppService;
  private socketService: SocketService;

  constructor() {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.io = new SocketIOServer(this.httpServer, {
      cors: {
        origin: config.cors.origin,
        credentials: config.cors.credentials,
      },
    });

    this.whatsappService = WhatsAppService.getInstance();
    this.socketService = SocketService.getInstance(this.io);
  }

  private async initializeDatabases(): Promise<void> {
    logger.info('🔌 Conectando a bases de datos...');

    await connectPostgreSQL();
    await connectMongoDB();
    await connectRedis();

    logger.info('✅ Bases de datos conectadas');
  }

  private initializeMiddlewares(): void {
    // Seguridad
    this.app.use(helmet());

    // CORS
    this.app.use(
      cors({
        origin: config.cors.origin,
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

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.env,
      });
    });

    // API Routes
    this.app.use(`${apiPrefix}/auth`, authRoutes);
    this.app.use(`${apiPrefix}/casos`, casosRoutes);
    this.app.use(`${apiPrefix}/usuarios`, usuariosRoutes);
    this.app.use(`${apiPrefix}/condominios`, condominiosRoutes);
    this.app.use(`${apiPrefix}/notificaciones`, notificacionesRoutes);
    this.app.use(`${apiPrefix}/kpis`, kpisRoutes);
    this.app.use(`${apiPrefix}/whatsapp`, whatsappRoutes);

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

      // Cerrar WhatsApp
      if (this.whatsappService) {
        await this.whatsappService.disconnect();
      }

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
      logger.info('╔══════════════════════════════════════════╗');
      logger.info('║     AMICO MANAGEMENT - BACKEND API       ║');
      logger.info('║   Sistema de Gestión de Condominios     ║');
      logger.info('╚══════════════════════════════════════════╝');
      logger.info('');

      // Inicializar componentes
      await this.initializeDatabases();
      this.initializeMiddlewares();
      this.initializeRoutes();
      this.initializeSockets();
      await this.initializeWhatsApp();

      // Iniciar servidor
      const port = config.port;
      this.httpServer.listen(port, () => {
        logger.info('');
        logger.info('✅ Servidor iniciado correctamente');
        logger.info(`🚀 API disponible en: http://localhost:${port}`);
        logger.info(`📚 API Docs: http://localhost:${port}/api-docs`);
        logger.info(`🌍 Environment: ${config.env}`);
        logger.info(`📱 WhatsApp Bot: ${config.bot.enabled ? 'Habilitado' : 'Deshabilitado'}`);
        logger.info('');
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
