/**
 * ========================================
 * SERVICIO DE ENCUESTAS DE SATISFACCIÓN
 * ========================================
 * Gestiona el envío y procesamiento de encuestas de satisfacción
 * - Envío automático cuando caso se cierra por confirmación
 * - NO envía cuando caso se cierra por timeout (7 días sin respuesta)
 * - Procesa respuestas con calificaciones 0-5
 * - Calcula promedio automático
 */

import { getPrismaClient } from '../../config/database/postgres';
import { logger } from '../../utils/logger';
import { addDays } from 'date-fns';

const prisma = getPrismaClient();

export class EncuestaSatisfaccionService {
  private static instance: EncuestaSatisfaccionService;

  private constructor() {}

  public static getInstance(): EncuestaSatisfaccionService {
    if (!EncuestaSatisfaccionService.instance) {
      EncuestaSatisfaccionService.instance = new EncuestaSatisfaccionService();
    }
    return EncuestaSatisfaccionService.instance;
  }

  /**
   * Crear encuesta de satisfacción cuando caso se cierra (solo si fue solucionado)
   */
  public async crearEncuesta(
    casoId: string,
    usuarioId: string,
    enviarPorWhatsApp: boolean = true,
    enviarPorEmail: boolean = true
  ): Promise<any> {
    try {
      const caso = await prisma.caso.findUnique({
        where: { id: casoId },
        include: {
          usuario: true,
          tecnicoAsignado: true,
        },
      });

      if (!caso) {
        throw new Error(`Caso ${casoId} no encontrado`);
      }

      // Crear encuesta
      const encuesta = await prisma.encuestaSatisfaccion.create({
        data: {
          casoId,
          usuarioId,
          enviadaPorWhatsApp: enviarPorWhatsApp,
          enviadaPorEmail: enviarPorEmail,
          fechaExpiracion: addDays(new Date(), 7), // Expira en 7 días
        },
      });

      logger.info(
        `✅ Encuesta de satisfacción creada para caso ${caso.numeroCaso} - Encuesta ID: ${encuesta.id}`
      );

      // Crear evento en timeline
      await prisma.timelineEvento.create({
        data: {
          casoId,
          descripcion: 'Encuesta de satisfacción enviada al propietario',
          metadata: {
            tipo: 'encuesta_enviada',
            encuestaId: encuesta.id,
            enviarPorWhatsApp,
            enviarPorEmail,
          },
        },
      });

      return encuesta;
    } catch (error) {
      logger.error('❌ Error creando encuesta de satisfacción:', error);
      throw error;
    }
  }

  /**
   * Procesar respuesta de encuesta
   */
  public async procesarRespuesta(
    encuestaId: string,
    actitudIngeniero: number,
    rapidezReparacion: number,
    calidadServicio: number,
    comentarios?: string
  ): Promise<any> {
    try {
      // Validar calificaciones (0-5)
      if (
        actitudIngeniero < 0 ||
        actitudIngeniero > 5 ||
        rapidezReparacion < 0 ||
        rapidezReparacion > 5 ||
        calidadServicio < 0 ||
        calidadServicio > 5
      ) {
        throw new Error('Las calificaciones deben estar entre 0 y 5');
      }

      // Calcular promedio
      const promedio = (actitudIngeniero + rapidezReparacion + calidadServicio) / 3;

      // Actualizar encuesta
      const encuesta = await prisma.encuestaSatisfaccion.update({
        where: { id: encuestaId },
        data: {
          estado: 'completada',
          actitudIngeniero,
          rapidezReparacion,
          calidadServicio,
          promedioGeneral: promedio,
          comentarios,
          fechaRespuesta: new Date(),
        },
        include: {
          caso: true,
          usuario: true,
        },
      });

      logger.info(
        `✅ Encuesta ${encuestaId} completada - Promedio: ${promedio.toFixed(2)} (${encuesta.caso.numeroCaso})`
      );

      // Actualizar satisfacción del cliente en el caso
      await prisma.caso.update({
        where: { id: encuesta.casoId },
        data: {
          satisfaccionCliente: Math.round(promedio),
          comentarioCliente: comentarios,
        },
      });

      // Crear evento en timeline
      await prisma.timelineEvento.create({
        data: {
          casoId: encuesta.casoId,
          descripcion: `Encuesta completada - Promedio: ${promedio.toFixed(2)}/5`,
          metadata: {
            tipo: 'encuesta_respondida',
            encuestaId,
            actitudIngeniero,
            rapidezReparacion,
            calidadServicio,
            promedioGeneral: promedio,
            comentarios,
          },
        },
      });

      return encuesta;
    } catch (error) {
      logger.error('❌ Error procesando respuesta de encuesta:', error);
      throw error;
    }
  }

  /**
   * Obtener encuesta por caso
   */
  public async obtenerPorCaso(casoId: string): Promise<any> {
    try {
      const encuesta = await prisma.encuestaSatisfaccion.findFirst({
        where: { casoId },
        include: {
          caso: true,
          usuario: true,
        },
        orderBy: { fechaEnvio: 'desc' },
      });

      return encuesta;
    } catch (error) {
      logger.error('❌ Error obteniendo encuesta por caso:', error);
      throw error;
    }
  }

  /**
   * Obtener encuesta por ID
   */
  public async obtenerPorId(encuestaId: string): Promise<any> {
    try {
      const encuesta = await prisma.encuestaSatisfaccion.findUnique({
        where: { id: encuestaId },
        include: {
          caso: {
            include: {
              tecnicoAsignado: true,
            },
          },
          usuario: true,
        },
      });

      return encuesta;
    } catch (error) {
      logger.error('❌ Error obteniendo encuesta por ID:', error);
      throw error;
    }
  }

  /**
   * Obtener encuesta pendiente por usuario
   */
  public async obtenerEncuestaPendientePorUsuario(usuarioId: string): Promise<any> {
    try {
      const encuesta = await prisma.encuestaSatisfaccion.findFirst({
        where: {
          usuarioId,
          estado: 'pendiente',
        },
        include: {
          caso: true,
          usuario: true,
        },
        orderBy: { fechaEnvio: 'desc' },
      });

      return encuesta;
    } catch (error) {
      logger.error('❌ Error obteniendo encuesta pendiente por usuario:', error);
      throw error;
    }
  }

  /**
   * Marcar encuestas expiradas
   * Ejecutado por cron diariamente
   */
  public async marcarExpiradas(): Promise<void> {
    try {
      const ahora = new Date();

      const resultado = await prisma.encuestaSatisfaccion.updateMany({
        where: {
          estado: 'pendiente',
          fechaExpiracion: {
            lte: ahora,
          },
        },
        data: {
          estado: 'expirada',
        },
      });

      if (resultado.count > 0) {
        logger.info(`⏰ ${resultado.count} encuestas marcadas como expiradas`);
      }
    } catch (error) {
      logger.error('❌ Error marcando encuestas expiradas:', error);
    }
  }

  /**
   * Obtener estadísticas de encuestas
   */
  public async obtenerEstadisticas(condominioId?: string): Promise<any> {
    try {
      const where: any = {
        estado: 'completada',
      };

      if (condominioId) {
        where.caso = {
          condominioId,
        };
      }

      const encuestas = await prisma.encuestaSatisfaccion.findMany({
        where,
        include: {
          caso: {
            include: {
              tecnicoAsignado: true,
            },
          },
        },
      });

      if (encuestas.length === 0) {
        return {
          totalEncuestas: 0,
          promedioGeneral: 0,
          promedioActitudIngeniero: 0,
          promedioRapidezReparacion: 0,
          promedioCalidadServicio: 0,
          distribucion: {
            excelente: 0, // 4.5-5
            bueno: 0, // 3.5-4.4
            regular: 0, // 2.5-3.4
            malo: 0, // 1.5-2.4
            muyMalo: 0, // 0-1.4
          },
        };
      }

      const totalEncuestas = encuestas.length;
      const sumaActitud = encuestas.reduce((sum, e) => sum + (e.actitudIngeniero || 0), 0);
      const sumaRapidez = encuestas.reduce((sum, e) => sum + (e.rapidezReparacion || 0), 0);
      const sumaCalidad = encuestas.reduce((sum, e) => sum + (e.calidadServicio || 0), 0);
      const sumaPromedio = encuestas.reduce(
        (sum, e) => sum + (e.promedioGeneral ? Number(e.promedioGeneral) : 0),
        0
      );

      // Distribución
      const distribucion = {
        excelente: encuestas.filter((e) => Number(e.promedioGeneral) >= 4.5).length,
        bueno: encuestas.filter(
          (e) => Number(e.promedioGeneral) >= 3.5 && Number(e.promedioGeneral) < 4.5
        ).length,
        regular: encuestas.filter(
          (e) => Number(e.promedioGeneral) >= 2.5 && Number(e.promedioGeneral) < 3.5
        ).length,
        malo: encuestas.filter(
          (e) => Number(e.promedioGeneral) >= 1.5 && Number(e.promedioGeneral) < 2.5
        ).length,
        muyMalo: encuestas.filter((e) => Number(e.promedioGeneral) < 1.5).length,
      };

      return {
        totalEncuestas,
        promedioGeneral: (sumaPromedio / totalEncuestas).toFixed(2),
        promedioActitudIngeniero: (sumaActitud / totalEncuestas).toFixed(2),
        promedioRapidezReparacion: (sumaRapidez / totalEncuestas).toFixed(2),
        promedioCalidadServicio: (sumaCalidad / totalEncuestas).toFixed(2),
        distribucion,
      };
    } catch (error) {
      logger.error('❌ Error obteniendo estadísticas de encuestas:', error);
      throw error;
    }
  }

  /**
   * Obtener mensaje de encuesta para WhatsApp
   */
  public getMensajeEncuesta(nombrePropietario: string, numeroCaso: string): string {
    return `
¡Hola ${nombrePropietario}! 👋

Gracias por confirmar que el problema del caso ${numeroCaso} fue solucionado. ✅

Nos gustaría conocer tu opinión sobre el servicio recibido. Por favor, califica del 0 al 5 los siguientes aspectos:

📋 *ENCUESTA DE SATISFACCIÓN*

1️⃣ *Actitud del ingeniero:* ¿Cómo fue el trato y profesionalismo?
2️⃣ *Rapidez en la reparación:* ¿Qué tan rápido se resolvió el problema?
3️⃣ *Calidad del servicio:* ¿Quedaste satisfecho con la atención recibida?

*Responde con 3 números del 0 al 5, separados por espacios.*
Ejemplo: "5 4 5"

- 0 = Muy malo
- 1 = Malo
- 2 = Regular
- 3 = Bueno
- 4 = Muy bueno
- 5 = Excelente

También puedes agregar comentarios adicionales después de las calificaciones.

¡Gracias por tu tiempo! 😊
`.trim();
  }

  /**
   * Parsear respuesta de encuesta desde WhatsApp
   */
  public parsearRespuestaWhatsApp(mensaje: string): {
    valido: boolean;
    actitudIngeniero?: number;
    rapidezReparacion?: number;
    calidadServicio?: number;
    comentarios?: string;
  } {
    try {
      // Extraer números del mensaje
      const numeros = mensaje.match(/\d+/g);

      if (!numeros || numeros.length < 3) {
        return { valido: false };
      }

      const actitudIngeniero = parseInt(numeros[0]);
      const rapidezReparacion = parseInt(numeros[1]);
      const calidadServicio = parseInt(numeros[2]);

      // Validar rango 0-5
      if (
        actitudIngeniero < 0 ||
        actitudIngeniero > 5 ||
        rapidezReparacion < 0 ||
        rapidezReparacion > 5 ||
        calidadServicio < 0 ||
        calidadServicio > 5
      ) {
        return { valido: false };
      }

      // Extraer comentarios (texto después de los números)
      const comentarios = mensaje
        .replace(/\d+/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      return {
        valido: true,
        actitudIngeniero,
        rapidezReparacion,
        calidadServicio,
        comentarios: comentarios || undefined,
      };
    } catch (error) {
      logger.error('❌ Error parseando respuesta de encuesta:', error);
      return { valido: false };
    }
  }
}
