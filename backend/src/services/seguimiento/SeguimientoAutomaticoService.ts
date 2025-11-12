/**
 * ========================================
 * SERVICIO DE SEGUIMIENTO AUTOMÁTICO
 * ========================================
 * Seguimiento post-visita a propietarios:
 * - 4 horas después de la visita: primera verificación
 * - Si no responde: reintento diario por 7 días
 * - Cierre automático por falta de respuesta
 * - Reinicio de proceso si no fue solucionado
 */

import { getPrismaClient } from '../../config/database/postgres';
import { logger } from '../../utils/logger';
import { addHours, addDays, isAfter, differenceInDays } from 'date-fns';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { EstadoCaso, EstadoCita } from '@prisma/client';
import { EncuestaSatisfaccionService } from '../encuestas/EncuestaSatisfaccionService';
import { EmailNotificationService } from '../email/EmailNotificationService';

const prisma = getPrismaClient();

export interface SeguimientoEstado {
  casoId: string;
  numeroCaso: string;
  intentos: number;
  ultimoIntento: Date;
  esperandoRespuesta: boolean;
  fechaCierre?: Date;
  motivoCierre?: string;
}

export class SeguimientoAutomaticoService {
  private static instance: SeguimientoAutomaticoService;
  private encuestaService: EncuestaSatisfaccionService;
  private emailService: EmailNotificationService;

  // Configuración de seguimiento
  private readonly HORAS_DESPUES_VISITA = 4; // 4 horas después de la visita
  private readonly MAX_INTENTOS_SIN_RESPUESTA = 7; // 7 días de reintentos
  private readonly HORAS_ENTRE_REINTENTOS = 24; // 1 día entre reintentos

  private constructor() {
    this.encuestaService = EncuestaSatisfaccionService.getInstance();
    this.emailService = new EmailNotificationService();
  }

  public static getInstance(): SeguimientoAutomaticoService {
    if (!SeguimientoAutomaticoService.instance) {
      SeguimientoAutomaticoService.instance = new SeguimientoAutomaticoService();
    }
    return SeguimientoAutomaticoService.instance;
  }

  /**
   * Procesar seguimientos pendientes
   * Ejecutar cada hora por el cron job
   */
  public async procesarSeguimientosPendientes(): Promise<void> {
    try {
      logger.info('🔍 Iniciando proceso de seguimientos automáticos...');

      const ahora = new Date();

      // 1. Buscar citas completadas que requieren seguimiento inicial (4 horas después)
      await this.procesarSeguimientosIniciales(ahora);

      // 2. Buscar seguimientos pendientes que requieren reintento (1 día después)
      await this.procesarReintentos(ahora);

      // 3. Cerrar casos sin respuesta después de 7 días
      await this.cerrarCasosSinRespuesta(ahora);

      logger.info('✅ Proceso de seguimientos completado');
    } catch (error) {
      logger.error('❌ Error procesando seguimientos automáticos:', error);
    }
  }

  /**
   * Procesar seguimientos iniciales (4 horas después de la visita)
   */
  private async procesarSeguimientosIniciales(ahora: Date): Promise<void> {
    // Buscar citas completadas hace 4+ horas que no tienen seguimiento iniciado
    const citasParaSeguimiento = await prisma.cita.findMany({
      where: {
        estado: EstadoCita.completada,
        fechaCompletada: {
          lte: addHours(ahora, -this.HORAS_DESPUES_VISITA),
        },
        caso: {
          estado: {
            in: [EstadoCaso.en_visita, EstadoCaso.resuelto],
          },
          // No tiene seguimiento activo
          NOT: {
            seguimientos: {
              some: {
                activo: true,
              },
            },
          },
        },
      },
      include: {
        caso: {
          include: {
            usuario: true,
            condominio: true,
            tecnicoAsignado: true,
          },
        },
        bloqueHorario: true,
      },
    });

    logger.info(`📋 ${citasParaSeguimiento.length} citas requieren seguimiento inicial`);

    for (const cita of citasParaSeguimiento) {
      try {
        await this.iniciarSeguimiento(cita.caso.id, cita.id);
      } catch (error) {
        logger.error(`❌ Error iniciando seguimiento para caso ${cita.caso.numeroCaso}:`, error);
      }
    }
  }

  /**
   * Iniciar seguimiento para un caso
   */
  public async iniciarSeguimiento(casoId: string, citaId: string): Promise<void> {
    try {
      const caso = await prisma.caso.findUnique({
        where: { id: casoId },
        include: {
          usuario: true,
          condominio: true,
        },
      });

      if (!caso) {
        throw new Error(`Caso ${casoId} no encontrado`);
      }

      logger.info(`📞 Iniciando seguimiento para caso ${caso.numeroCaso}`);

      // Crear registro de seguimiento
      const seguimiento = await prisma.seguimientoCaso.create({
        data: {
          casoId: caso.id,
          citaId,
          intentos: 1,
          proximoIntento: new Date(),
          activo: true,
          mensajesTipo: 'inicial',
        },
      });

      // Crear evento en timeline
      await prisma.timelineEvento.create({
        data: {
          casoId: caso.id,
          tipoEvento: 'seguimiento_iniciado',
          titulo: 'Seguimiento Iniciado',
          descripcion: 'Sistema inició seguimiento automático 4 horas post-visita',
          metadata: {
            seguimientoId: seguimiento.id,
            intentoNumero: 1,
          },
        },
      });

      logger.info(`✅ Seguimiento iniciado para caso ${caso.numeroCaso}`);
    } catch (error) {
      logger.error(`❌ Error iniciando seguimiento:`, error);
      throw error;
    }
  }

  /**
   * Obtener mensaje de seguimiento inicial
   */
  public getMensajeSeguimientoInicial(
    nombrePropietario: string,
    numeroCaso: string,
    unidad: string
  ): string {
    const nombre = nombrePropietario.split(' ')[0]; // Primer nombre

    return `
Hola ${nombre} 👋

Hace unas horas, nuestro ingeniero completó la visita a tu unidad ${unidad} para el caso *${numeroCaso}*.

Queremos asegurarnos de que todo quedó resuelto satisfactoriamente.

Por favor, responde a este mensaje indicando:

✅ *"Solucionado"* - Si el problema fue resuelto completamente
❌ *"No solucionado"* - Si aún persiste el problema o hay detalles pendientes

Tu respuesta nos ayuda a mantener un servicio de calidad.

_Amico Management - Sistema de Gestión de Condominios_
`.trim();
  }

  /**
   * Obtener mensaje de reintento
   */
  public getMensajeReintento(
    nombrePropietario: string,
    numeroCaso: string,
    unidad: string,
    intentoNumero: number
  ): string {
    const nombre = nombrePropietario.split(' ')[0];

    return `
Hola ${nombre} 👋

Seguimiento del caso *${numeroCaso}* - Unidad ${unidad}

Aún no hemos recibido tu respuesta sobre si el problema fue solucionado.

Por favor, responde:
✅ *"Solucionado"* - Si fue resuelto
❌ *"No solucionado"* - Si persiste el problema

_Intento ${intentoNumero} de ${this.MAX_INTENTOS_SIN_RESPUESTA}_

Amico Management
`.trim();
  }

  /**
   * Procesar reintentos (1 día después del último intento)
   */
  private async procesarReintentos(ahora: Date): Promise<void> {
    const seguimientosParaReintento = await prisma.seguimientoCaso.findMany({
      where: {
        activo: true,
        intentos: {
          lt: this.MAX_INTENTOS_SIN_RESPUESTA,
        },
        proximoIntento: {
          lte: ahora,
        },
      },
      include: {
        caso: {
          include: {
            usuario: true,
          },
        },
      },
    });

    logger.info(`🔄 ${seguimientosParaReintento.length} seguimientos requieren reintento`);

    for (const seguimiento of seguimientosParaReintento) {
      try {
        await this.ejecutarReintento(seguimiento.id);
      } catch (error) {
        logger.error(
          `❌ Error ejecutando reintento para caso ${seguimiento.caso.numeroCaso}:`,
          error
        );
      }
    }
  }

  /**
   * Ejecutar reintento de seguimiento
   */
  public async ejecutarReintento(seguimientoId: string): Promise<void> {
    const seguimiento = await prisma.seguimientoCaso.findUnique({
      where: { id: seguimientoId },
      include: {
        caso: {
          include: {
            usuario: true,
          },
        },
      },
    });

    if (!seguimiento) {
      throw new Error(`Seguimiento ${seguimientoId} no encontrado`);
    }

    const nuevoIntento = seguimiento.intentos + 1;

    logger.info(
      `🔄 Reintento ${nuevoIntento}/${this.MAX_INTENTOS_SIN_RESPUESTA} para caso ${seguimiento.caso.numeroCaso}`
    );

    // Actualizar seguimiento
    await prisma.seguimientoCaso.update({
      where: { id: seguimientoId },
      data: {
        intentos: nuevoIntento,
        ultimoIntento: new Date(),
        proximoIntento: addHours(new Date(), this.HORAS_ENTRE_REINTENTOS),
      },
    });

    // Crear evento en timeline
    await prisma.timelineEvento.create({
      data: {
        casoId: seguimiento.casoId,
        tipoEvento: 'seguimiento_reintento',
        titulo: `Seguimiento - Intento ${nuevoIntento}`,
        descripcion: `Sistema envió recordatorio automático (intento ${nuevoIntento} de ${this.MAX_INTENTOS_SIN_RESPUESTA})`,
        metadata: {
          seguimientoId: seguimiento.id,
          intentoNumero: nuevoIntento,
        },
      },
    });

    logger.info(`✅ Reintento registrado para caso ${seguimiento.caso.numeroCaso}`);
  }

  /**
   * Procesar respuesta del propietario al seguimiento
   */
  public async procesarRespuestaSeguimiento(
    casoId: string,
    respuesta: string
  ): Promise<{ accion: 'cerrar' | 'reabrir' | 'ninguna'; mensaje: string }> {
    try {
      const seguimiento = await prisma.seguimientoCaso.findFirst({
        where: {
          casoId,
          activo: true,
        },
        include: {
          caso: {
            include: {
              usuario: true,
              condominio: true,
            },
          },
        },
      });

      if (!seguimiento) {
        return {
          accion: 'ninguna',
          mensaje: 'No hay seguimiento activo para este caso',
        };
      }

      const respuestaLower = respuesta.toLowerCase().trim();

      // Detectar si fue solucionado
      const solucionadoKeywords = [
        'solucionado',
        'resuelto',
        'arreglado',
        'listo',
        'ok',
        'bien',
        'perfecto',
        'todo bien',
        'si',
        'sí',
      ];

      const noSolucionadoKeywords = [
        'no',
        'no solucionado',
        'no resuelto',
        'persiste',
        'sigue',
        'aún',
        'todavía',
        'problema',
      ];

      const esSolucionado = solucionadoKeywords.some((keyword) =>
        respuestaLower.includes(keyword)
      );
      const noEsSolucionado = noSolucionadoKeywords.some((keyword) =>
        respuestaLower.includes(keyword)
      );

      if (esSolucionado) {
        // CASO SOLUCIONADO - Cerrar automáticamente
        await this.cerrarCasoPorRespuesta(casoId, seguimiento.id, 'solucionado', respuesta);

        const nombre = seguimiento.caso.usuario.nombreCompleto.split(' ')[0];

        return {
          accion: 'cerrar',
          mensaje: `
¡Excelente, ${nombre}! 🎉

Nos alegra que el problema haya sido resuelto satisfactoriamente.

📋 Caso *${seguimiento.caso.numeroCaso}* ha sido cerrado exitosamente.

Gracias por tu tiempo y confianza en nuestro servicio. Si en el futuro necesitas ayuda, no dudes en contactarnos nuevamente.

_Amico Management_
`.trim(),
        };
      } else if (noEsSolucionado) {
        // PROBLEMA NO SOLUCIONADO - Reabrir/Crear nuevo caso
        await this.reabrirCasoPorRespuesta(casoId, seguimiento.id, respuesta);

        const nombre = seguimiento.caso.usuario.nombreCompleto.split(' ')[0];

        return {
          accion: 'reabrir',
          mensaje: `
Entendido, ${nombre}.

Lamentamos que el problema aún persista. Vamos a generar un nuevo seguimiento con la información que nos proporcionaste.

📋 Hemos actualizado el caso *${seguimiento.caso.numeroCaso}*

Un ingeniero será asignado nuevamente y recibirás la fecha y hora de la próxima visita.

¿Puedes proporcionar detalles adicionales sobre lo que sigue sin funcionar?
`.trim(),
        };
      } else {
        // Respuesta ambigua - solicitar aclaración
        return {
          accion: 'ninguna',
          mensaje: `
Por favor, ayúdanos a entender mejor tu respuesta.

Responde claramente:
✅ *"Solucionado"* - Si el problema fue resuelto
❌ *"No solucionado"* - Si persiste el problema

Gracias 🙏
`.trim(),
        };
      }
    } catch (error) {
      logger.error('❌ Error procesando respuesta de seguimiento:', error);
      throw error;
    }
  }

  /**
   * Cerrar caso por respuesta positiva del propietario
   * + Enviar email de cierre en el mismo hilo
   * + Enviar encuesta de satisfacción por WhatsApp
   */
  private async cerrarCasoPorRespuesta(
    casoId: string,
    seguimientoId: string,
    resultado: string,
    respuesta: string
  ): Promise<void> {
    let caso: any;

    await prisma.$transaction(async (tx) => {
      // Actualizar caso
      caso = await tx.caso.update({
        where: { id: casoId },
        data: {
          estado: EstadoCaso.cerrado,
          fechaCierre: new Date(),
        },
        include: {
          usuario: true,
          tecnicoAsignado: true,
          condominio: true,
        },
      });

      // Desactivar seguimiento
      await tx.seguimientoCaso.update({
        where: { id: seguimientoId },
        data: {
          activo: false,
          resultado,
          respuestaPropietario: respuesta,
          fechaRespuesta: new Date(),
        },
      });

      // Crear evento en timeline
      await tx.timelineEvento.create({
        data: {
          casoId,
          tipoEvento: 'cerrado',
          titulo: 'Caso Cerrado Automáticamente',
          descripcion: `Propietario confirmó que el problema fue solucionado: "${respuesta}"`,
          metadata: {
            seguimientoId,
            resultado,
            respuestaPropietario: respuesta,
          },
        },
      });
    });

    logger.info(`✅ Caso ${casoId} cerrado por respuesta positiva del propietario`);

    // ========================================
    // ENVIAR EMAIL DE CIERRE EN EL MISMO HILO
    // ========================================
    try {
      if (caso.tecnicoAsignado?.email) {
        await this.emailService.enviarNotificacionCierreCaso(
          caso.tecnicoAsignado.email,
          caso.numeroCaso,
          caso.tecnicoAsignado.nombreCompleto,
          caso.usuario.nombreCompleto,
          caso.unidad,
          caso.condominio.nombre,
          respuesta
        );
        logger.info(`📧 Email de cierre enviado a ingeniero para caso ${caso.numeroCaso}`);
      }
    } catch (error) {
      logger.error(`❌ Error enviando email de cierre para caso ${caso.numeroCaso}:`, error);
      // No detener el flujo si falla el email
    }

    // ========================================
    // CREAR Y RETORNAR ENCUESTA DE SATISFACCIÓN
    // ========================================
    try {
      const encuesta = await this.encuestaService.crearEncuesta(
        casoId,
        caso.usuarioId,
        true, // enviar por WhatsApp
        false // no enviar por email (por ahora)
      );

      logger.info(
        `📋 Encuesta de satisfacción creada para caso ${caso.numeroCaso} - ID: ${encuesta.id}`
      );

      // La encuesta será enviada por WhatsApp desde WhatsAppSeguimientoIntegration
      return { encuestaCreada: true, encuestaId: encuesta.id } as any;
    } catch (error) {
      logger.error(`❌ Error creando encuesta para caso ${caso.numeroCaso}:`, error);
      // No detener el flujo si falla la encuesta
      return { encuestaCreada: false } as any;
    }
  }

  /**
   * Reabrir caso por respuesta negativa del propietario
   */
  private async reabrirCasoPorRespuesta(
    casoId: string,
    seguimientoId: string,
    respuesta: string
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // Actualizar caso
      await tx.caso.update({
        where: { id: casoId },
        data: {
          estado: EstadoCaso.reabierto,
          // No cambiar fechaCierre - caso no está cerrado
        },
      });

      // Desactivar seguimiento actual
      await tx.seguimientoCaso.update({
        where: { id: seguimientoId },
        data: {
          activo: false,
          resultado: 'no_solucionado',
          respuestaPropietario: respuesta,
          fechaRespuesta: new Date(),
        },
      });

      // Crear evento en timeline
      await tx.timelineEvento.create({
        data: {
          casoId,
          tipoEvento: 'reabierto',
          titulo: 'Caso Reabierto',
          descripcion: `Propietario indicó que el problema persiste: "${respuesta}"`,
          metadata: {
            seguimientoId,
            respuestaPropietario: respuesta,
          },
        },
      });
    });

    logger.info(`🔄 Caso ${casoId} reabierto por respuesta negativa del propietario`);
  }

  /**
   * Cerrar casos sin respuesta después de 7 días
   */
  private async cerrarCasosSinRespuesta(ahora: Date): Promise<void> {
    const seguimientosSinRespuesta = await prisma.seguimientoCaso.findMany({
      where: {
        activo: true,
        intentos: {
          gte: this.MAX_INTENTOS_SIN_RESPUESTA,
        },
        ultimoIntento: {
          lte: addHours(ahora, -this.HORAS_ENTRE_REINTENTOS),
        },
      },
      include: {
        caso: true,
      },
    });

    logger.info(`🔒 ${seguimientosSinRespuesta.length} casos para cerrar por falta de respuesta`);

    for (const seguimiento of seguimientosSinRespuesta) {
      try {
        await this.cerrarCasoSinRespuesta(seguimiento.casoId, seguimiento.id);
      } catch (error) {
        logger.error(
          `❌ Error cerrando caso sin respuesta ${seguimiento.caso.numeroCaso}:`,
          error
        );
      }
    }
  }

  /**
   * Cerrar caso por falta de respuesta
   */
  public async cerrarCasoSinRespuesta(casoId: string, seguimientoId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const caso = await tx.caso.update({
        where: { id: casoId },
        data: {
          estado: EstadoCaso.cerrado,
          fechaCierre: new Date(),
        },
        include: {
          usuario: true,
        },
      });

      // Desactivar seguimiento
      await tx.seguimientoCaso.update({
        where: { id: seguimientoId },
        data: {
          activo: false,
          resultado: 'sin_respuesta',
          fechaCierre: new Date(),
        },
      });

      // Crear evento en timeline
      await tx.timelineEvento.create({
        data: {
          casoId,
          tipoEvento: 'cerrado',
          titulo: 'Caso Cerrado por Falta de Respuesta',
          descripcion: `Caso cerrado automáticamente después de 7 días sin respuesta del propietario`,
          metadata: {
            seguimientoId,
            motivoCierre: 'Cierre por falta de respuesta del propietario',
            intentosRealizados: this.MAX_INTENTOS_SIN_RESPUESTA,
          },
        },
      });

      logger.info(`🔒 Caso ${caso.numeroCaso} cerrado por falta de respuesta`);
    });
  }

  /**
   * Obtener seguimiento activo de un caso
   */
  public async obtenerSeguimientoActivo(casoId: string) {
    return prisma.seguimientoCaso.findFirst({
      where: {
        casoId,
        activo: true,
      },
      include: {
        caso: {
          include: {
            usuario: true,
          },
        },
      },
    });
  }

  /**
   * Verificar si un caso tiene seguimiento activo
   */
  public async tieneSeguimientoActivo(casoId: string): Promise<boolean> {
    const seguimiento = await this.obtenerSeguimientoActivo(casoId);
    return seguimiento !== null;
  }

  /**
   * Obtener estadísticas de seguimientos
   */
  public async obtenerEstadisticas() {
    const [total, activos, cerradosSolucionados, cerradosSinRespuesta, reabiertos] =
      await Promise.all([
        prisma.seguimientoCaso.count(),
        prisma.seguimientoCaso.count({ where: { activo: true } }),
        prisma.seguimientoCaso.count({ where: { resultado: 'solucionado' } }),
        prisma.seguimientoCaso.count({ where: { resultado: 'sin_respuesta' } }),
        prisma.seguimientoCaso.count({ where: { resultado: 'no_solucionado' } }),
      ]);

    return {
      total,
      activos,
      cerradosSolucionados,
      cerradosSinRespuesta,
      reabiertos,
      tasaRespuesta:
        total > 0 ? ((cerradosSolucionados + reabiertos) / total) * 100 : 0,
      tasaSolucion: total > 0 ? (cerradosSolucionados / total) * 100 : 0,
    };
  }
}
