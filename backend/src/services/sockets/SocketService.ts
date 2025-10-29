/**
 * ========================================
 * SERVICIO DE WEBSOCKETS
 * ========================================
 * Comunicación en tiempo real con el panel admin
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { logger } from '../../utils/logger';
import { getPrismaClient } from '../../config/database/postgres';
import jwt from 'jsonwebtoken';
import { config } from '../../config';

const prisma = getPrismaClient();

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userType?: string;
}

export class SocketService {
  private static instance: SocketService;
  private io: SocketIOServer;
  private connectedUsers: Map<string, string> = new Map(); // userId -> socketId

  private constructor(io: SocketIOServer) {
    this.io = io;
  }

  public static getInstance(io?: SocketIOServer): SocketService {
    if (!SocketService.instance) {
      if (!io) {
        throw new Error('SocketIO server is required for first initialization');
      }
      SocketService.instance = new SocketService(io);
    }
    return SocketService.instance;
  }

  /**
   * Inicializar eventos de Socket.IO
   */
  public initialize(): void {
    // Middleware de autenticación
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token;

        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        // Verificar JWT
        const decoded = jwt.verify(token, config.jwt.secret) as any;

        socket.userId = decoded.userId;
        socket.userType = decoded.userType;

        next();
      } catch (error) {
        logger.error('❌ Socket authentication error:', error);
        next(new Error('Authentication error: Invalid token'));
      }
    });

    // Evento de conexión
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      this.handleConnection(socket);
    });

    logger.info('✅ WebSocket Service inicializado');
  }

  /**
   * Manejar nueva conexión
   */
  private handleConnection(socket: AuthenticatedSocket): void {
    const userId = socket.userId!;

    logger.info(`🔌 Usuario ${userId} conectado (Socket: ${socket.id})`);

    // Registrar usuario conectado
    this.connectedUsers.set(userId, socket.id);

    // Unir a room personal
    socket.join(`user-${userId}`);

    // Crear o actualizar sesión
    this.crearSesion(userId, socket.id, socket.handshake.address);

    // Eventos del socket
    socket.on('disconnect', () => this.handleDisconnect(socket));
    socket.on('cambiar-estado', (estado) => this.handleCambiarEstado(socket, estado));
    socket.on('unirse-caso', (casoId) => this.handleUnirseCaso(socket, casoId));
    socket.on('salir-caso', (casoId) => this.handleSalirCaso(socket, casoId));
    socket.on('mensaje-chat', (data) => this.handleMensajeChat(socket, data));
    socket.on('typing', (data) => this.handleTyping(socket, data));

    // Emitir estado online a otros usuarios
    this.io.emit('user-online', {
      userId,
      timestamp: new Date(),
    });

    // Enviar notificaciones pendientes
    this.enviarNotificacionesPendientes(userId);
  }

  /**
   * Manejar desconexión
   */
  private async handleDisconnect(socket: AuthenticatedSocket): Promise<void> {
    const userId = socket.userId!;

    logger.info(`🔌 Usuario ${userId} desconectado`);

    this.connectedUsers.delete(userId);

    // Actualizar sesión
    await prisma.sesion.updateMany({
      where: {
        usuarioId: userId,
        socketId: socket.id,
      },
      data: {
        estado: 'offline',
        fechaLogout: new Date(),
      },
    });

    // Emitir estado offline
    this.io.emit('user-offline', {
      userId,
      timestamp: new Date(),
    });
  }

  /**
   * Cambiar estado del usuario (online, ausente, ocupado)
   */
  private async handleCambiarEstado(socket: AuthenticatedSocket, estado: string): Promise<void> {
    const userId = socket.userId!;

    await prisma.sesion.updateMany({
      where: {
        usuarioId: userId,
        socketId: socket.id,
      },
      data: {
        estado: estado as any,
      },
    });

    // Emitir cambio de estado
    this.io.emit('user-estado-changed', {
      userId,
      estado,
      timestamp: new Date(),
    });

    logger.info(`👤 Usuario ${userId} cambió estado a: ${estado}`);
  }

  /**
   * Usuario se une a un caso (para ver actualizaciones en tiempo real)
   */
  private handleUnirseCaso(socket: AuthenticatedSocket, casoId: string): void {
    socket.join(`caso-${casoId}`);
    logger.info(`📋 Usuario ${socket.userId} se unió al caso ${casoId}`);
  }

  /**
   * Usuario sale de un caso
   */
  private handleSalirCaso(socket: AuthenticatedSocket, casoId: string): void {
    socket.leave(`caso-${casoId}`);
    logger.info(`📋 Usuario ${socket.userId} salió del caso ${casoId}`);
  }

  /**
   * Manejar mensaje de chat en vivo
   */
  private async handleMensajeChat(
    socket: AuthenticatedSocket,
    data: { casoId: string; mensaje: string }
  ): Promise<void> {
    const { casoId, mensaje } = data;
    const userId = socket.userId!;

    // Obtener información del usuario
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
    });

    if (!usuario) return;

    const mensajeData = {
      casoId,
      usuarioId: userId,
      nombreUsuario: usuario.nombreCompleto,
      mensaje,
      timestamp: new Date(),
    };

    // Emitir mensaje a todos los que estén viendo el caso
    this.io.to(`caso-${casoId}`).emit('nuevo-mensaje-chat', mensajeData);

    // TODO: Guardar mensaje en BD o MongoDB

    logger.info(`💬 Mensaje en caso ${casoId} de ${usuario.nombreCompleto}`);
  }

  /**
   * Manejar evento de "escribiendo..."
   */
  private handleTyping(
    socket: AuthenticatedSocket,
    data: { casoId: string; typing: boolean }
  ): void {
    const { casoId, typing } = data;

    socket.to(`caso-${casoId}`).emit('user-typing', {
      userId: socket.userId,
      typing,
    });
  }

  /**
   * Crear sesión en BD
   */
  private async crearSesion(userId: string, socketId: string, ipAddress: string): Promise<void> {
    try {
      await prisma.sesion.create({
        data: {
          usuarioId: userId,
          socketId,
          ipAddress,
          estado: 'online',
        },
      });
    } catch (error) {
      logger.error('❌ Error al crear sesión:', error);
    }
  }

  /**
   * Enviar notificaciones pendientes al conectarse
   */
  private async enviarNotificacionesPendientes(userId: string): Promise<void> {
    try {
      const notificaciones = await prisma.notificacion.findMany({
        where: {
          usuarioId,
          leida: false,
        },
        orderBy: {
          fechaCreacion: 'desc',
        },
        take: 20,
      });

      if (notificaciones.length > 0) {
        this.io.to(`user-${userId}`).emit('notificaciones-pendientes', notificaciones);
      }
    } catch (error) {
      logger.error('❌ Error al enviar notificaciones pendientes:', error);
    }
  }

  /**
   * Emitir actualización de caso a todos los interesados
   */
  public emitirActualizacionCaso(casoId: string, data: any): void {
    this.io.to(`caso-${casoId}`).emit('caso-actualizado', {
      casoId,
      data,
      timestamp: new Date(),
    });
  }

  /**
   * Emitir nuevo caso a administradores
   */
  public emitirNuevoCaso(caso: any): void {
    this.io.emit('nuevo-caso', {
      caso,
      timestamp: new Date(),
    });
  }

  /**
   * Obtener IO instance
   */
  public getIO(): SocketIOServer {
    return this.io;
  }

  /**
   * Verificar si un usuario está conectado
   */
  public isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  /**
   * Obtener socket ID de un usuario
   */
  public getUserSocketId(userId: string): string | undefined {
    return this.connectedUsers.get(userId);
  }

  /**
   * Obtener usuarios conectados
   */
  public getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  /**
   * Emitir evento a un usuario específico
   */
  public emitToUser(userId: string, event: string, data: any): void {
    this.io.to(`user-${userId}`).emit(event, data);
  }
}
