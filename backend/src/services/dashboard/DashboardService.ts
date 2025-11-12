/**
 * ========================================
 * SERVICIO DE DASHBOARD ADMINISTRATIVO
 * ========================================
 * Proporciona métricas, estadísticas y datos para el dashboard
 */

import { getPrismaClient } from '../../config/database/postgres';
import { logger } from '../../utils/logger';
import { Mensaje } from '../../models/mongodb/Mensaje';
import { Conversacion } from '../../models/mongodb/Conversacion';

const prisma = getPrismaClient();

export interface DashboardMetrics {
  // Casos
  casosAbiertos: number;
  casosCerrados: number;
  casosTotal: number;
  casosPorEstado: {
    nuevo: number;
    asignado: number;
    en_proceso: number;
    en_visita: number;
    esperando_repuestos: number;
    cerrado: number;
  };

  // Satisfacción
  scoreGeneral: number; // 0-5
  totalEncuestas: number;
  encuestasCompletadas: number;
  tasaRespuesta: number; // %

  // Rendimiento
  tiempoPromedioResolucion: number; // horas
  tiempoPromedioRespuesta: number; // minutos
  casosResueltosPrimerContacto: number;

  // Seguimiento
  seguimientosActivos: number;
  seguimientosCompletados: number;
  casosCerradosPorTimeout: number;

  // SLA
  casosEnSLA: number;
  casosVencidosSLA: number;
  porcentajeCumplimientoSLA: number;
}

export interface CasoDetallado {
  id: string;
  numeroCaso: string;
  estado: string;
  prioridad: string;
  categoria: string;
  descripcion: string;
  unidad: string;
  usuario: {
    id: string;
    nombreCompleto: string;
    telefono: string;
  };
  tecnicoAsignado?: {
    id: string;
    nombreCompleto: string;
    email: string;
  };
  condominio: {
    id: string;
    nombre: string;
  };
  fechaCreacion: Date;
  fechaCierre?: Date;
  tiempoResolucion?: number; // minutos
  satisfaccionCliente?: number; // 0-5
  slaVencido: boolean;
}

export interface ConversacionWhatsApp {
  id: string;
  telefono: string;
  nombreContacto: string;
  ultimoMensaje: string;
  fechaUltimoMensaje: Date;
  totalMensajes: number;
  mensajes: {
    id: string;
    contenido: string;
    tipo: 'entrante' | 'saliente';
    timestamp: Date;
    leido: boolean;
  }[];
}

export interface ReporteExportable {
  periodo: {
    inicio: Date;
    fin: Date;
  };
  metricas: DashboardMetrics;
  casosPorCondominio: {
    condominio: string;
    total: number;
    abiertos: number;
    cerrados: number;
    scorePromedio: number;
  }[];
  casosPorIngeniero: {
    ingeniero: string;
    total: number;
    resueltos: number;
    pendientes: number;
    scorePromedio: number;
    tiempoPromedioResolucion: number;
  }[];
  topProblemas: {
    categoria: string;
    total: number;
    porcentaje: number;
  }[];
}

export class DashboardService {
  private static instance: DashboardService;

  private constructor() {}

  public static getInstance(): DashboardService {
    if (!DashboardService.instance) {
      DashboardService.instance = new DashboardService();
    }
    return DashboardService.instance;
  }

  /**
   * Obtener métricas generales del dashboard
   */
  public async obtenerMetricasGenerales(
    fechaInicio?: Date,
    fechaFin?: Date,
    condominioId?: string
  ): Promise<DashboardMetrics> {
    try {
      const whereClause: any = {};

      if (fechaInicio && fechaFin) {
        whereClause.fechaCreacion = {
          gte: fechaInicio,
          lte: fechaFin,
        };
      }

      if (condominioId) {
        whereClause.condominioId = condominioId;
      }

      // ========================================
      // CASOS
      // ========================================
      const [casosAbiertos, casosCerrados, casosTotal] = await Promise.all([
        prisma.caso.count({
          where: {
            ...whereClause,
            estado: {
              in: ['nuevo', 'asignado', 'en_proceso', 'en_visita', 'esperando_repuestos'],
            },
          },
        }),
        prisma.caso.count({
          where: {
            ...whereClause,
            estado: 'cerrado',
          },
        }),
        prisma.caso.count({ where: whereClause }),
      ]);

      // Casos por estado
      const casosPorEstadoArray = await prisma.caso.groupBy({
        by: ['estado'],
        where: whereClause,
        _count: true,
      });

      const casosPorEstado = {
        nuevo: 0,
        asignado: 0,
        en_proceso: 0,
        en_visita: 0,
        esperando_repuestos: 0,
        cerrado: 0,
      };

      casosPorEstadoArray.forEach((item) => {
        casosPorEstado[item.estado as keyof typeof casosPorEstado] = item._count;
      });

      // ========================================
      // SATISFACCIÓN
      // ========================================
      const totalEncuestas = await prisma.encuestaSatisfaccion.count({
        where: {
          caso: whereClause,
        },
      });

      const encuestasCompletadas = await prisma.encuestaSatisfaccion.count({
        where: {
          estado: 'completada',
          caso: whereClause,
        },
      });

      const encuestasCompletadasData = await prisma.encuestaSatisfaccion.findMany({
        where: {
          estado: 'completada',
          caso: whereClause,
        },
        select: {
          promedioGeneral: true,
        },
      });

      const scoreGeneral =
        encuestasCompletadasData.length > 0
          ? encuestasCompletadasData.reduce(
              (sum, e) => sum + (parseFloat(e.promedioGeneral?.toString() || '0') || 0),
              0
            ) / encuestasCompletadasData.length
          : 0;

      const tasaRespuesta = totalEncuestas > 0 ? (encuestasCompletadas / totalEncuestas) * 100 : 0;

      // ========================================
      // RENDIMIENTO
      // ========================================
      const casosCerradosData = await prisma.caso.findMany({
        where: {
          ...whereClause,
          estado: 'cerrado',
          fechaCierre: { not: null },
        },
        select: {
          fechaCreacion: true,
          fechaCierre: true,
        },
      });

      let tiempoPromedioResolucion = 0;
      if (casosCerradosData.length > 0) {
        const tiempos = casosCerradosData.map((caso) => {
          const inicio = new Date(caso.fechaCreacion).getTime();
          const fin = new Date(caso.fechaCierre!).getTime();
          return (fin - inicio) / (1000 * 60 * 60); // horas
        });
        tiempoPromedioResolucion = tiempos.reduce((a, b) => a + b, 0) / tiempos.length;
      }

      // Tiempo promedio de primera respuesta (placeholder - requiere tracking)
      const tiempoPromedioRespuesta = 15; // TODO: Implementar tracking de tiempos de respuesta

      // Casos resueltos primer contacto (placeholder)
      const casosResueltosPrimerContacto = Math.floor(casosCerrados * 0.15); // Estimado 15%

      // ========================================
      // SEGUIMIENTO
      // ========================================
      const seguimientosActivos = await prisma.seguimientoCaso.count({
        where: {
          activo: true,
          caso: whereClause,
        },
      });

      const seguimientosCompletados = await prisma.seguimientoCaso.count({
        where: {
          activo: false,
          caso: whereClause,
        },
      });

      const casosCerradosPorTimeout = await prisma.seguimientoCaso.count({
        where: {
          activo: false,
          resultado: 'cerrado_sin_respuesta',
          caso: whereClause,
        },
      });

      // ========================================
      // SLA
      // ========================================
      const casosEnSLA = await prisma.caso.count({
        where: {
          ...whereClause,
          slaVencido: false,
        },
      });

      const casosVencidosSLA = await prisma.caso.count({
        where: {
          ...whereClause,
          slaVencido: true,
        },
      });

      const porcentajeCumplimientoSLA =
        casosTotal > 0 ? (casosEnSLA / casosTotal) * 100 : 100;

      return {
        // Casos
        casosAbiertos,
        casosCerrados,
        casosTotal,
        casosPorEstado,

        // Satisfacción
        scoreGeneral: parseFloat(scoreGeneral.toFixed(2)),
        totalEncuestas,
        encuestasCompletadas,
        tasaRespuesta: parseFloat(tasaRespuesta.toFixed(2)),

        // Rendimiento
        tiempoPromedioResolucion: parseFloat(tiempoPromedioResolucion.toFixed(2)),
        tiempoPromedioRespuesta,
        casosResueltosPrimerContacto,

        // Seguimiento
        seguimientosActivos,
        seguimientosCompletados,
        casosCerradosPorTimeout,

        // SLA
        casosEnSLA,
        casosVencidosSLA,
        porcentajeCumplimientoSLA: parseFloat(porcentajeCumplimientoSLA.toFixed(2)),
      };
    } catch (error) {
      logger.error('❌ Error obteniendo métricas generales:', error);
      throw error;
    }
  }

  /**
   * Obtener todos los casos con detalles
   */
  public async obtenerCasosDetallados(
    filtros?: {
      estado?: string;
      condominioId?: string;
      tecnicoId?: string;
      fechaInicio?: Date;
      fechaFin?: Date;
      prioridad?: string;
    },
    paginacion?: {
      pagina: number;
      limite: number;
    }
  ): Promise<{ casos: CasoDetallado[]; total: number }> {
    try {
      const whereClause: any = {};

      if (filtros?.estado) {
        whereClause.estado = filtros.estado;
      }

      if (filtros?.condominioId) {
        whereClause.condominioId = filtros.condominioId;
      }

      if (filtros?.tecnicoId) {
        whereClause.tecnicoAsignadoId = filtros.tecnicoId;
      }

      if (filtros?.prioridad) {
        whereClause.prioridad = filtros.prioridad;
      }

      if (filtros?.fechaInicio && filtros?.fechaFin) {
        whereClause.fechaCreacion = {
          gte: filtros.fechaInicio,
          lte: filtros.fechaFin,
        };
      }

      const skip = paginacion ? (paginacion.pagina - 1) * paginacion.limite : 0;
      const take = paginacion?.limite || 50;

      const [casos, total] = await Promise.all([
        prisma.caso.findMany({
          where: whereClause,
          include: {
            usuario: {
              select: {
                id: true,
                nombreCompleto: true,
                telefono: true,
              },
            },
            tecnicoAsignado: {
              select: {
                id: true,
                nombreCompleto: true,
                email: true,
              },
            },
            condominio: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
          orderBy: {
            fechaCreacion: 'desc',
          },
          skip,
          take,
        }),
        prisma.caso.count({ where: whereClause }),
      ]);

      const casosDetallados: CasoDetallado[] = casos.map((caso) => {
        let tiempoResolucion: number | undefined;

        if (caso.fechaCierre) {
          const inicio = new Date(caso.fechaCreacion).getTime();
          const fin = new Date(caso.fechaCierre).getTime();
          tiempoResolucion = (fin - inicio) / (1000 * 60); // minutos
        }

        // Calcular si el SLA está vencido (más de 48 horas sin cerrar)
        const horasDesdeCreacion =
          (Date.now() - new Date(caso.fechaCreacion).getTime()) / (1000 * 60 * 60);
        const slaVencido = caso.estado !== 'cerrado' && horasDesdeCreacion > 48;

        return {
          id: caso.id,
          numeroCaso: caso.numeroCaso,
          estado: caso.estado,
          prioridad: caso.prioridad,
          categoria: caso.categoria,
          descripcion: caso.descripcion,
          unidad: caso.unidad,
          usuario: caso.usuario,
          tecnicoAsignado: caso.tecnicoAsignado
            ? {
                id: caso.tecnicoAsignado.id,
                nombreCompleto: caso.tecnicoAsignado.nombreCompleto,
                email: caso.tecnicoAsignado.email || '',
              }
            : undefined,
          condominio: caso.condominio,
          fechaCreacion: caso.fechaCreacion,
          fechaCierre: caso.fechaCierre || undefined,
          tiempoResolucion,
          satisfaccionCliente: caso.satisfaccionCliente
            ? parseFloat(caso.satisfaccionCliente.toString())
            : undefined,
          slaVencido,
        };
      });

      return {
        casos: casosDetallados,
        total,
      };
    } catch (error) {
      logger.error('❌ Error obteniendo casos detallados:', error);
      throw error;
    }
  }

  /**
   * Obtener historial completo de conversaciones por WhatsApp
   */
  public async obtenerHistorialConversaciones(
    filtros?: {
      telefono?: string;
      fechaInicio?: Date;
      fechaFin?: Date;
    },
    paginacion?: {
      pagina: number;
      limite: number;
    }
  ): Promise<{ conversaciones: ConversacionWhatsApp[]; total: number }> {
    try {
      const query: any = {};

      if (filtros?.telefono) {
        query.telefono = filtros.telefono;
      }

      if (filtros?.fechaInicio && filtros?.fechaFin) {
        query.updatedAt = {
          $gte: filtros.fechaInicio,
          $lte: filtros.fechaFin,
        };
      }

      const skip = paginacion ? (paginacion.pagina - 1) * paginacion.limite : 0;
      const limit = paginacion?.limite || 20;

      const [conversaciones, total] = await Promise.all([
        Conversacion.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit),
        Conversacion.countDocuments(query),
      ]);

      const conversacionesDetalladas: ConversacionWhatsApp[] = await Promise.all(
        conversaciones.map(async (conv: any) => {
          // Obtener mensajes de la conversación
          const mensajes = await Mensaje.find({
            telefono: conv.telefono,
          })
            .sort({ fechaEnvio: 1 })
            .limit(100); // Últimos 100 mensajes

          const ultimoMensaje =
            mensajes.length > 0 ? mensajes[mensajes.length - 1].contenido : '';

          return {
            id: conv._id.toString(),
            telefono: conv.telefono,
            nombreContacto: (conv as any).nombreContacto || conv.telefono,
            ultimoMensaje: ultimoMensaje.substring(0, 100), // Truncar a 100 caracteres
            fechaUltimoMensaje: (conv as any).updatedAt || new Date(),
            totalMensajes: mensajes.length,
            mensajes: mensajes.map((msg: any) => ({
              id: msg._id.toString(),
              contenido: msg.contenido,
              tipo: msg.direccion, // 'entrante' o 'saliente'
              timestamp: msg.fechaEnvio,
              leido: msg.estadoEntrega === 'leido',
            })),
          };
        })
      );

      return {
        conversaciones: conversacionesDetalladas,
        total,
      };
    } catch (error) {
      logger.error('❌ Error obteniendo historial de conversaciones:', error);
      throw error;
    }
  }

  /**
   * Obtener conversación específica por teléfono
   */
  public async obtenerConversacionPorTelefono(telefono: string): Promise<ConversacionWhatsApp | null> {
    try {
      const conversacion = await Conversacion.findOne({ telefono });

      if (!conversacion) {
        return null;
      }

      const mensajes = await Mensaje.find({
        telefono: telefono,
      }).sort({ fechaEnvio: 1 });

      const ultimoMensaje = mensajes.length > 0 ? mensajes[mensajes.length - 1].contenido : '';

      return {
        id: String(conversacion._id),
        telefono: conversacion.telefono,
        nombreContacto: (conversacion as any).nombreContacto || conversacion.telefono,
        ultimoMensaje,
        fechaUltimoMensaje: (conversacion as any).updatedAt || new Date(),
        totalMensajes: mensajes.length,
        mensajes: mensajes.map((msg: any) => ({
          id: msg._id.toString(),
          contenido: msg.contenido,
          tipo: msg.direccion, // 'entrante' o 'saliente'
          timestamp: msg.fechaEnvio,
          leido: msg.estadoEntrega === 'leido',
        })),
      };
    } catch (error) {
      logger.error('❌ Error obteniendo conversación por teléfono:', error);
      throw error;
    }
  }

  /**
   * Generar reporte exportable completo
   */
  public async generarReporteExportable(
    fechaInicio: Date,
    fechaFin: Date,
    condominioId?: string
  ): Promise<ReporteExportable> {
    try {
      // Métricas generales
      const metricas = await this.obtenerMetricasGenerales(fechaInicio, fechaFin, condominioId);

      // Casos por condominio
      const casosPorCondominioData = await prisma.caso.groupBy({
        by: ['condominioId'],
        where: {
          fechaCreacion: {
            gte: fechaInicio,
            lte: fechaFin,
          },
          ...(condominioId ? { condominioId } : {}),
        },
        _count: true,
      });

      const casosPorCondominio = await Promise.all(
        casosPorCondominioData.map(async (item) => {
          const condominio = await prisma.condominio.findUnique({
            where: { id: item.condominioId! },
          });

          const abiertos = await prisma.caso.count({
            where: {
              condominioId: item.condominioId!,
              estado: {
                in: ['nuevo', 'asignado', 'en_proceso', 'en_visita', 'esperando_repuestos'],
              },
              fechaCreacion: {
                gte: fechaInicio,
                lte: fechaFin,
              },
            },
          });

          const cerrados = await prisma.caso.count({
            where: {
              condominioId: item.condominioId!,
              estado: 'cerrado',
              fechaCreacion: {
                gte: fechaInicio,
                lte: fechaFin,
              },
            },
          });

          const encuestas = await prisma.encuestaSatisfaccion.findMany({
            where: {
              estado: 'completada',
              caso: {
                condominioId: item.condominioId!,
                fechaCreacion: {
                  gte: fechaInicio,
                  lte: fechaFin,
                },
              },
            },
            select: {
              promedioGeneral: true,
            },
          });

          const scorePromedio =
            encuestas.length > 0
              ? encuestas.reduce((sum, e) => sum + parseFloat(e.promedioGeneral?.toString() || '0'), 0) /
                encuestas.length
              : 0;

          return {
            condominio: condominio?.nombre || 'Sin condominio',
            total: item._count,
            abiertos,
            cerrados,
            scorePromedio: parseFloat(scorePromedio.toFixed(2)),
          };
        })
      );

      // Casos por ingeniero
      const casosPorIngenieroData = await prisma.caso.groupBy({
        by: ['tecnicoAsignadoId'],
        where: {
          fechaCreacion: {
            gte: fechaInicio,
            lte: fechaFin,
          },
          tecnicoAsignadoId: { not: null },
          ...(condominioId ? { condominioId } : {}),
        },
        _count: true,
      });

      const casosPorIngeniero = await Promise.all(
        casosPorIngenieroData.map(async (item) => {
          const ingeniero = await prisma.usuario.findUnique({
            where: { id: item.tecnicoAsignadoId! },
          });

          const resueltos = await prisma.caso.count({
            where: {
              tecnicoAsignadoId: item.tecnicoAsignadoId!,
              estado: 'cerrado',
              fechaCreacion: {
                gte: fechaInicio,
                lte: fechaFin,
              },
            },
          });

          const pendientes = item._count - resueltos;

          const encuestas = await prisma.encuestaSatisfaccion.findMany({
            where: {
              estado: 'completada',
              caso: {
                tecnicoAsignadoId: item.tecnicoAsignadoId!,
                fechaCreacion: {
                  gte: fechaInicio,
                  lte: fechaFin,
                },
              },
            },
            select: {
              promedioGeneral: true,
            },
          });

          const scorePromedio =
            encuestas.length > 0
              ? encuestas.reduce((sum, e) => sum + parseFloat(e.promedioGeneral?.toString() || '0'), 0) /
                encuestas.length
              : 0;

          const casosCerrados = await prisma.caso.findMany({
            where: {
              tecnicoAsignadoId: item.tecnicoAsignadoId!,
              estado: 'cerrado',
              fechaCierre: { not: null },
              fechaCreacion: {
                gte: fechaInicio,
                lte: fechaFin,
              },
            },
            select: {
              fechaCreacion: true,
              fechaCierre: true,
            },
          });

          let tiempoPromedioResolucion = 0;
          if (casosCerrados.length > 0) {
            const tiempos = casosCerrados.map((caso) => {
              const inicio = new Date(caso.fechaCreacion).getTime();
              const fin = new Date(caso.fechaCierre!).getTime();
              return (fin - inicio) / (1000 * 60 * 60); // horas
            });
            tiempoPromedioResolucion = tiempos.reduce((a, b) => a + b, 0) / tiempos.length;
          }

          return {
            ingeniero: ingeniero?.nombreCompleto || 'Sin asignar',
            total: item._count,
            resueltos,
            pendientes,
            scorePromedio: parseFloat(scorePromedio.toFixed(2)),
            tiempoPromedioResolucion: parseFloat(tiempoPromedioResolucion.toFixed(2)),
          };
        })
      );

      // Top problemas (categorías más frecuentes)
      const topProblemasData = await prisma.caso.groupBy({
        by: ['categoria'],
        where: {
          fechaCreacion: {
            gte: fechaInicio,
            lte: fechaFin,
          },
          ...(condominioId ? { condominioId } : {}),
        },
        _count: true,
        orderBy: {
          _count: {
            categoria: 'desc',
          },
        },
        take: 10,
      });

      const totalCasos = topProblemasData.reduce((sum, item) => sum + item._count, 0);

      const topProblemas = topProblemasData.map((item) => ({
        categoria: item.categoria,
        total: item._count,
        porcentaje: parseFloat(((item._count / totalCasos) * 100).toFixed(2)),
      }));

      return {
        periodo: {
          inicio: fechaInicio,
          fin: fechaFin,
        },
        metricas,
        casosPorCondominio,
        casosPorIngeniero,
        topProblemas,
      };
    } catch (error) {
      logger.error('❌ Error generando reporte exportable:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de encuestas de satisfacción
   */
  public async obtenerEstadisticasSatisfaccion(
    fechaInicio?: Date,
    fechaFin?: Date,
    condominioId?: string
  ): Promise<any> {
    try {
      const whereClause: any = {
        estado: 'completada',
      };

      if (fechaInicio && fechaFin) {
        whereClause.fechaRespuesta = {
          gte: fechaInicio,
          lte: fechaFin,
        };
      }

      if (condominioId) {
        whereClause.caso = {
          condominioId,
        };
      }

      const encuestas = await prisma.encuestaSatisfaccion.findMany({
        where: whereClause,
        select: {
          actitudIngeniero: true,
          rapidezReparacion: true,
          calidadServicio: true,
          promedioGeneral: true,
          comentarios: true,
          fechaRespuesta: true,
        },
      });

      if (encuestas.length === 0) {
        return {
          total: 0,
          promedios: {
            actitudIngeniero: 0,
            rapidezReparacion: 0,
            calidadServicio: 0,
            general: 0,
          },
          distribucion: {
            excelente: 0,
            muyBueno: 0,
            bueno: 0,
            regular: 0,
            malo: 0,
          },
          comentariosDestacados: [],
        };
      }

      const promedios = {
        actitudIngeniero:
          encuestas.reduce((sum, e) => sum + (e.actitudIngeniero || 0), 0) / encuestas.length,
        rapidezReparacion:
          encuestas.reduce((sum, e) => sum + (e.rapidezReparacion || 0), 0) / encuestas.length,
        calidadServicio:
          encuestas.reduce((sum, e) => sum + (e.calidadServicio || 0), 0) / encuestas.length,
        general:
          encuestas.reduce((sum, e) => sum + parseFloat(e.promedioGeneral?.toString() || '0'), 0) /
          encuestas.length,
      };

      const distribucion = {
        excelente: 0, // 4.5-5.0
        muyBueno: 0, // 3.5-4.49
        bueno: 0, // 2.5-3.49
        regular: 0, // 1.5-2.49
        malo: 0, // 0-1.49
      };

      encuestas.forEach((e) => {
        const promedio = parseFloat(e.promedioGeneral?.toString() || '0');
        if (promedio >= 4.5) distribucion.excelente++;
        else if (promedio >= 3.5) distribucion.muyBueno++;
        else if (promedio >= 2.5) distribucion.bueno++;
        else if (promedio >= 1.5) distribucion.regular++;
        else distribucion.malo++;
      });

      const comentariosDestacados = encuestas
        .filter((e) => e.comentarios && e.comentarios.length > 0)
        .slice(0, 10)
        .map((e) => ({
          comentario: e.comentarios,
          promedio: parseFloat(e.promedioGeneral?.toString() || '0'),
          fecha: e.fechaRespuesta,
        }));

      return {
        total: encuestas.length,
        promedios: {
          actitudIngeniero: parseFloat(promedios.actitudIngeniero.toFixed(2)),
          rapidezReparacion: parseFloat(promedios.rapidezReparacion.toFixed(2)),
          calidadServicio: parseFloat(promedios.calidadServicio.toFixed(2)),
          general: parseFloat(promedios.general.toFixed(2)),
        },
        distribucion,
        comentariosDestacados,
      };
    } catch (error) {
      logger.error('❌ Error obteniendo estadísticas de satisfacción:', error);
      throw error;
    }
  }
}
