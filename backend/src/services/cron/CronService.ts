/**
 * ========================================
 * SERVICIO DE TAREAS PROGRAMADAS (CRON)
 * ========================================
 * Ejecuta tareas automáticas periódicas:
 * - Seguimiento automático de casos (cada hora)
 * - Limpieza de archivos temporales (diario)
 * - Verificación de SLA (cada 30 min)
 * - Recordatorios de citas (1 hora antes)
 */

import cron from 'node-cron';
import { logger } from '../../utils/logger';
import { SeguimientoAutomaticoService } from '../seguimiento/SeguimientoAutomaticoService';
import { WhatsAppSeguimientoIntegration } from '../seguimiento/WhatsAppSeguimientoIntegration';
import { ExportService } from '../export/ExportService';
import { EncuestaSatisfaccionService } from '../encuestas/EncuestaSatisfaccionService';
import { WASocket } from '@whiskeysockets/baileys';

export class CronService {
  private static instance: CronService;
  private seguimientoService: SeguimientoAutomaticoService;
  private whatsappIntegration: WhatsAppSeguimientoIntegration;
  private exportService: ExportService;
  private encuestaService: EncuestaSatisfaccionService;
  private jobs: Map<string, ReturnType<typeof cron.schedule>> = new Map();
  private whatsappSock: WASocket | null = null;

  private constructor() {
    this.seguimientoService = SeguimientoAutomaticoService.getInstance();
    this.whatsappIntegration = WhatsAppSeguimientoIntegration.getInstance();
    this.exportService = ExportService.getInstance();
    this.encuestaService = EncuestaSatisfaccionService.getInstance();
  }

  public static getInstance(): CronService {
    if (!CronService.instance) {
      CronService.instance = new CronService();
    }
    return CronService.instance;
  }

  /**
   * Inyectar el socket de WhatsApp para enviar mensajes de seguimiento
   */
  public setWhatsAppSocket(sock: WASocket): void {
    this.whatsappSock = sock;
    logger.info('✅ WhatsApp socket conectado al servicio de CRON');
  }

  /**
   * Iniciar todos los cron jobs
   */
  public iniciar(): void {
    logger.info('⏰ Iniciando sistema de tareas programadas (CRON)...');

    // 1. Seguimiento automático de casos - cada hora
    this.registrarJob(
      'seguimiento-automatico',
      '0 * * * *', // Cada hora en punto
      async () => {
        logger.info('🔄 Ejecutando seguimiento automático de casos...');
        try {
          await this.seguimientoService.procesarSeguimientosPendientes();

          // Enviar mensajes de seguimiento pendientes por WhatsApp
          if (this.whatsappSock) {
            await this.whatsappIntegration.enviarSeguimientosPendientes(this.whatsappSock);
          } else {
            logger.warn('⚠️ WhatsApp socket no disponible, omitiendo envío de mensajes de seguimiento');
          }
        } catch (error) {
          logger.error('❌ Error en seguimiento automático:', error);
        }
      }
    );

    // 2. Verificación de SLA - cada 30 minutos
    this.registrarJob(
      'verificacion-sla',
      '*/30 * * * *', // Cada 30 minutos
      async () => {
        logger.info('🔍 Verificando SLA de casos...');
        try {
          // TODO: Implementar verificación de SLA
        } catch (error) {
          logger.error('❌ Error verificando SLA:', error);
        }
      }
    );

    // 3. Limpieza de archivos temporales - diario a las 2 AM
    this.registrarJob(
      'limpieza-archivos',
      '0 2 * * *', // Diario a las 2:00 AM
      async () => {
        logger.info('🧹 Limpiando archivos de exportación antiguos...');
        try {
          await this.exportService.limpiarExportacionesAntiguas();
        } catch (error) {
          logger.error('❌ Error limpiando archivos:', error);
        }
      }
    );

    // 4. Marcar encuestas expiradas - diario a las 3 AM
    this.registrarJob(
      'encuestas-expiradas',
      '0 3 * * *', // Diario a las 3:00 AM
      async () => {
        logger.info('📋 Marcando encuestas expiradas...');
        try {
          await this.encuestaService.marcarExpiradas();
        } catch (error) {
          logger.error('❌ Error marcando encuestas expiradas:', error);
        }
      }
    );

    // 4. Recordatorios de citas - cada 15 minutos
    this.registrarJob(
      'recordatorios-citas',
      '*/15 * * * *', // Cada 15 minutos
      async () => {
        logger.info('🔔 Verificando citas para recordatorios...');
        try {
          // TODO: Implementar recordatorios de citas
        } catch (error) {
          logger.error('❌ Error enviando recordatorios:', error);
        }
      }
    );

    logger.info(`✅ ${this.jobs.size} tareas programadas iniciadas exitosamente`);
  }

  /**
   * Registrar un nuevo cron job
   */
  private registrarJob(nombre: string, schedule: string, callback: () => void | Promise<void>): void {
    try {
      const job = cron.schedule(schedule, callback, {
        timezone: 'America/Santo_Domingo', // República Dominicana
      });

      this.jobs.set(nombre, job);
      logger.info(`✅ Tarea programada registrada: ${nombre} (${schedule})`);
    } catch (error) {
      logger.error(`❌ Error registrando tarea ${nombre}:`, error);
    }
  }

  /**
   * Detener un cron job específico
   */
  public detenerJob(nombre: string): void {
    const job = this.jobs.get(nombre);
    if (job) {
      job.stop();
      this.jobs.delete(nombre);
      logger.info(`🛑 Tarea programada detenida: ${nombre}`);
    } else {
      logger.warn(`⚠️ Tarea no encontrada: ${nombre}`);
    }
  }

  /**
   * Detener todos los cron jobs
   */
  public detenerTodos(): void {
    logger.info('🛑 Deteniendo todas las tareas programadas...');
    this.jobs.forEach((job, nombre) => {
      job.stop();
      logger.info(`🛑 Detenido: ${nombre}`);
    });
    this.jobs.clear();
    logger.info('✅ Todas las tareas programadas han sido detenidas');
  }

  /**
   * Obtener estado de los cron jobs
   */
  public obtenerEstado(): {
    nombre: string;
    activo: boolean;
  }[] {
    return Array.from(this.jobs.entries()).map(([nombre, job]) => ({
      nombre,
      activo: job.getStatus() === 'scheduled',
    }));
  }

  /**
   * Ejecutar manualmente una tarea (para pruebas)
   */
  public async ejecutarManualmente(nombre: string): Promise<void> {
    logger.info(`🔧 Ejecutando manualmente tarea: ${nombre}`);

    switch (nombre) {
      case 'seguimiento-automatico':
        await this.seguimientoService.procesarSeguimientosPendientes();
        break;
      default:
        logger.warn(`⚠️ Tarea no reconocida: ${nombre}`);
    }
  }
}
