// ========================================
// VISITAS SERVICE
// Control de portería y visitantes
// ========================================

import { PrismaClient, Visita, VisitaFrecuente } from '@prisma/client';
import { logger } from '../../utils/logger';

const prisma = new PrismaClient();

export interface RegistrarVisitaDTO {
  condominioId: string;
  unidadId: string;
  nombreVisitante: string;
  cedulaVisitante?: string;
  telefonoVisitante?: string;
  vehiculoPlaca?: string;
  vehiculoMarca?: string;
  vehiculoColor?: string;
  motivo?: string;
  autorizadoPor?: string;
  observaciones?: string;
  guardiaRegistro: string;
}

export interface RegistrarVisitaFrecuenteDTO {
  unidadId: string;
  nombre: string;
  cedula?: string;
  telefono?: string;
  parentesco?: string;
  empresa?: string;
  vehiculoPlaca?: string;
  vehiculoMarca?: string;
  foto?: string;
  observaciones?: string;
}

export class VisitasService {
  private static instance: VisitasService;

  private constructor() {}

  public static getInstance(): VisitasService {
    if (!VisitasService.instance) {
      VisitasService.instance = new VisitasService();
    }
    return VisitasService.instance;
  }

  // ========================================
  // VISITAS
  // ========================================

  /**
   * Registrar entrada de visita
   */
  async registrarEntrada(data: RegistrarVisitaDTO): Promise<Visita> {
    try {
      logger.info(`Registrando entrada de visita: ${data.nombreVisitante}`);

      // Verificar si es visitante frecuente
      let visitanteFrecuenteId: string | undefined;
      if (data.cedulaVisitante) {
        const visitanteFrecuente = await prisma.visitaFrecuente.findFirst({
          where: {
            unidadId: data.unidadId,
            cedula: data.cedulaVisitante,
            activo: true,
          },
        });

        if (visitanteFrecuente) {
          visitanteFrecuenteId = visitanteFrecuente.id;
          logger.info(`Visitante frecuente detectado: ${visitanteFrecuente.nombre}`);
        }
      }

      const visita = await prisma.visita.create({
        data: {
          condominioId: data.condominioId,
          unidadId: data.unidadId,
          visitanteFrecuenteId,
          nombreVisitante: data.nombreVisitante,
          cedulaVisitante: data.cedulaVisitante,
          telefonoVisitante: data.telefonoVisitante,
          vehiculoPlaca: data.vehiculoPlaca,
          vehiculoMarca: data.vehiculoMarca,
          vehiculoColor: data.vehiculoColor,
          motivo: data.motivo,
          autorizadoPor: data.autorizadoPor,
          observaciones: data.observaciones,
          guardiaRegistro: data.guardiaRegistro,
          horaEntrada: new Date(),
        },
        include: {
          unidad: {
            include: {
              propietario: true,
            },
          },
          visitanteFrecuente: true,
        },
      });

      logger.info(`✅ Entrada registrada: ${visita.id}`);
      return visita;
    } catch (error) {
      logger.error('Error al registrar entrada:', error);
      throw error;
    }
  }

  /**
   * Registrar salida de visita
   */
  async registrarSalida(
    visitaId: string,
    guardiaSalida: string,
    observaciones?: string
  ): Promise<Visita> {
    try {
      const visita = await prisma.visita.update({
        where: { id: visitaId },
        data: {
          horaSalida: new Date(),
          guardiaSalida,
          observaciones: observaciones
            ? `${observaciones}\n---\nSalida: ${observaciones}`
            : undefined,
        },
        include: {
          unidad: true,
        },
      });

      // Calcular tiempo de permanencia
      const tiempoMinutos = Math.floor(
        (visita.horaSalida!.getTime() - visita.horaEntrada.getTime()) / (1000 * 60)
      );

      logger.info(
        `✅ Salida registrada: ${visitaId} - Tiempo: ${tiempoMinutos} minutos`
      );
      return visita;
    } catch (error) {
      logger.error('Error al registrar salida:', error);
      throw error;
    }
  }

  /**
   * Obtener visitas activas (sin salida)
   */
  async obtenerVisitasActivas(condominioId: string): Promise<Visita[]> {
    try {
      const visitas = await prisma.visita.findMany({
        where: {
          condominioId,
          horaSalida: null,
        },
        include: {
          unidad: {
            include: {
              propietario: true,
            },
          },
          visitanteFrecuente: true,
        },
        orderBy: {
          horaEntrada: 'desc',
        },
      });

      return visitas;
    } catch (error) {
      logger.error('Error al obtener visitas activas:', error);
      throw error;
    }
  }

  /**
   * Obtener historial de visitas con filtros
   */
  async obtenerHistorialVisitas(filtros?: {
    condominioId?: string;
    unidadId?: string;
    fechaDesde?: Date;
    fechaHasta?: Date;
    cedulaVisitante?: string;
    vehiculoPlaca?: string;
  }): Promise<Visita[]> {
    try {
      const where: any = {};

      if (filtros?.condominioId) {
        where.condominioId = filtros.condominioId;
      }

      if (filtros?.unidadId) {
        where.unidadId = filtros.unidadId;
      }

      if (filtros?.fechaDesde || filtros?.fechaHasta) {
        where.horaEntrada = {};
        if (filtros.fechaDesde) {
          where.horaEntrada.gte = filtros.fechaDesde;
        }
        if (filtros.fechaHasta) {
          where.horaEntrada.lte = filtros.fechaHasta;
        }
      }

      if (filtros?.cedulaVisitante) {
        where.cedulaVisitante = filtros.cedulaVisitante;
      }

      if (filtros?.vehiculoPlaca) {
        where.vehiculoPlaca = {
          contains: filtros.vehiculoPlaca,
          mode: 'insensitive',
        };
      }

      const visitas = await prisma.visita.findMany({
        where,
        include: {
          unidad: {
            include: {
              propietario: true,
            },
          },
          visitanteFrecuente: true,
        },
        orderBy: {
          horaEntrada: 'desc',
        },
        take: 100,
      });

      return visitas;
    } catch (error) {
      logger.error('Error al obtener historial de visitas:', error);
      throw error;
    }
  }

  /**
   * Buscar visita por cédula o placa
   */
  async buscarVisita(busqueda: string): Promise<Visita[]> {
    try {
      const visitas = await prisma.visita.findMany({
        where: {
          OR: [
            { cedulaVisitante: { contains: busqueda, mode: 'insensitive' } },
            { vehiculoPlaca: { contains: busqueda, mode: 'insensitive' } },
            { nombreVisitante: { contains: busqueda, mode: 'insensitive' } },
          ],
        },
        include: {
          unidad: {
            include: {
              propietario: true,
            },
          },
        },
        orderBy: {
          horaEntrada: 'desc',
        },
        take: 20,
      });

      return visitas;
    } catch (error) {
      logger.error('Error al buscar visita:', error);
      throw error;
    }
  }

  // ========================================
  // VISITANTES FRECUENTES
  // ========================================

  /**
   * Registrar visitante frecuente
   */
  async registrarVisitanteFrecuente(
    data: RegistrarVisitaFrecuenteDTO
  ): Promise<VisitaFrecuente> {
    try {
      logger.info(`Registrando visitante frecuente: ${data.nombre}`);

      const visitante = await prisma.visitaFrecuente.create({
        data: {
          unidadId: data.unidadId,
          nombre: data.nombre,
          cedula: data.cedula,
          telefono: data.telefono,
          parentesco: data.parentesco,
          empresa: data.empresa,
          vehiculoPlaca: data.vehiculoPlaca,
          vehiculoMarca: data.vehiculoMarca,
          foto: data.foto,
          observaciones: data.observaciones,
        },
        include: {
          unidad: true,
        },
      });

      logger.info(`✅ Visitante frecuente registrado: ${visitante.id}`);
      return visitante;
    } catch (error) {
      logger.error('Error al registrar visitante frecuente:', error);
      throw error;
    }
  }

  /**
   * Obtener visitantes frecuentes de una unidad
   */
  async obtenerVisitantesFrecuentes(unidadId: string): Promise<VisitaFrecuente[]> {
    try {
      const visitantes = await prisma.visitaFrecuente.findMany({
        where: {
          unidadId,
          activo: true,
        },
        include: {
          unidad: true,
          _count: {
            select: {
              visitas: true,
            },
          },
        },
        orderBy: {
          nombre: 'asc',
        },
      });

      return visitantes;
    } catch (error) {
      logger.error('Error al obtener visitantes frecuentes:', error);
      throw error;
    }
  }

  /**
   * Buscar visitante frecuente por cédula
   */
  async buscarVisitanteFrecuente(
    unidadId: string,
    cedula: string
  ): Promise<VisitaFrecuente | null> {
    try {
      const visitante = await prisma.visitaFrecuente.findFirst({
        where: {
          unidadId,
          cedula,
          activo: true,
        },
        include: {
          unidad: true,
        },
      });

      return visitante;
    } catch (error) {
      logger.error('Error al buscar visitante frecuente:', error);
      throw error;
    }
  }

  /**
   * Desactivar visitante frecuente
   */
  async desactivarVisitanteFrecuente(visitanteId: string): Promise<void> {
    try {
      await prisma.visitaFrecuente.update({
        where: { id: visitanteId },
        data: { activo: false },
      });

      logger.info(`✅ Visitante frecuente desactivado: ${visitanteId}`);
    } catch (error) {
      logger.error('Error al desactivar visitante frecuente:', error);
      throw error;
    }
  }

  // ========================================
  // REPORTES Y ESTADÍSTICAS
  // ========================================

  /**
   * Reporte de visitas del día
   */
  async obtenerReporteDelDia(condominioId: string, fecha: Date): Promise<{
    totalVisitas: number;
    visitasActivas: number;
    visitasConVehiculo: number;
    unidadesMasVisitadas: Array<{
      unidad: string;
      totalVisitas: number;
    }>;
  }> {
    try {
      const inicioDia = new Date(fecha);
      inicioDia.setHours(0, 0, 0, 0);

      const finDia = new Date(fecha);
      finDia.setHours(23, 59, 59, 999);

      const visitas = await prisma.visita.findMany({
        where: {
          condominioId,
          horaEntrada: {
            gte: inicioDia,
            lte: finDia,
          },
        },
        include: {
          unidad: true,
        },
      });

      const totalVisitas = visitas.length;
      const visitasActivas = visitas.filter((v) => !v.horaSalida).length;
      const visitasConVehiculo = visitas.filter((v) => v.vehiculoPlaca).length;

      // Agrupar por unidad
      const visitasPorUnidad = new Map<string, number>();
      visitas.forEach((visita) => {
        const unidadNumero = visita.unidad.numero;
        visitasPorUnidad.set(
          unidadNumero,
          (visitasPorUnidad.get(unidadNumero) || 0) + 1
        );
      });

      const unidadesMasVisitadas = Array.from(visitasPorUnidad.entries())
        .map(([unidad, totalVisitas]) => ({ unidad, totalVisitas }))
        .sort((a, b) => b.totalVisitas - a.totalVisitas)
        .slice(0, 5);

      return {
        totalVisitas,
        visitasActivas,
        visitasConVehiculo,
        unidadesMasVisitadas,
      };
    } catch (error) {
      logger.error('Error al obtener reporte del día:', error);
      throw error;
    }
  }

  /**
   * Estadísticas de visitas por periodo
   */
  async obtenerEstadisticas(
    condominioId: string,
    fechaDesde: Date,
    fechaHasta: Date
  ): Promise<{
    totalVisitas: number;
    promedioVisitasPorDia: number;
    tiempoPromedioEstancia: number; // minutos
    visitasPorDiaSemana: Record<string, number>;
    visitasPorHora: Record<number, number>;
  }> {
    try {
      const visitas = await prisma.visita.findMany({
        where: {
          condominioId,
          horaEntrada: {
            gte: fechaDesde,
            lte: fechaHasta,
          },
        },
      });

      const totalVisitas = visitas.length;

      // Calcular días del periodo
      const diasPeriodo = Math.ceil(
        (fechaHasta.getTime() - fechaDesde.getTime()) / (1000 * 60 * 60 * 24)
      );
      const promedioVisitasPorDia = totalVisitas / diasPeriodo;

      // Calcular tiempo promedio de estancia
      const visitasConSalida = visitas.filter((v) => v.horaSalida);
      let tiempoTotalMinutos = 0;
      visitasConSalida.forEach((visita) => {
        const minutos =
          (visita.horaSalida!.getTime() - visita.horaEntrada.getTime()) /
          (1000 * 60);
        tiempoTotalMinutos += minutos;
      });
      const tiempoPromedioEstancia =
        visitasConSalida.length > 0
          ? tiempoTotalMinutos / visitasConSalida.length
          : 0;

      // Visitas por día de la semana
      const diasSemana = [
        'domingo',
        'lunes',
        'martes',
        'miércoles',
        'jueves',
        'viernes',
        'sábado',
      ];
      const visitasPorDiaSemana: Record<string, number> = {};
      diasSemana.forEach((dia) => (visitasPorDiaSemana[dia] = 0));

      visitas.forEach((visita) => {
        const dia = diasSemana[visita.horaEntrada.getDay()];
        visitasPorDiaSemana[dia]++;
      });

      // Visitas por hora
      const visitasPorHora: Record<number, number> = {};
      for (let i = 0; i < 24; i++) {
        visitasPorHora[i] = 0;
      }

      visitas.forEach((visita) => {
        const hora = visita.horaEntrada.getHours();
        visitasPorHora[hora]++;
      });

      return {
        totalVisitas,
        promedioVisitasPorDia,
        tiempoPromedioEstancia,
        visitasPorDiaSemana,
        visitasPorHora,
      };
    } catch (error) {
      logger.error('Error al obtener estadísticas:', error);
      throw error;
    }
  }

  /**
   * Alertas de seguridad (visitas sospechosas)
   */
  async obtenerAlertasSeguridad(condominioId: string): Promise<
    Array<{
      tipo: string;
      descripcion: string;
      visitaId: string;
      prioridad: 'baja' | 'media' | 'alta';
    }>
  > {
    try {
      const alertas: Array<{
        tipo: string;
        descripcion: string;
        visitaId: string;
        prioridad: 'baja' | 'media' | 'alta';
      }> = [];

      // Visitas activas por más de 12 horas
      const hace12Horas = new Date(Date.now() - 12 * 60 * 60 * 1000);
      const visitasLargas = await prisma.visita.findMany({
        where: {
          condominioId,
          horaSalida: null,
          horaEntrada: {
            lte: hace12Horas,
          },
        },
        include: {
          unidad: true,
        },
      });

      visitasLargas.forEach((visita) => {
        const horas = Math.floor(
          (Date.now() - visita.horaEntrada.getTime()) / (1000 * 60 * 60)
        );
        alertas.push({
          tipo: 'estancia_prolongada',
          descripcion: `Visita en unidad ${visita.unidad.numero} por ${horas} horas`,
          visitaId: visita.id,
          prioridad: horas > 24 ? 'alta' : 'media',
        });
      });

      // Visitantes frecuentes con muchas visitas recientes (posible irregularidad)
      const hace7Dias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const visitasRecientes = await prisma.visita.groupBy({
        by: ['visitanteFrecuenteId'],
        where: {
          condominioId,
          visitanteFrecuenteId: { not: null },
          horaEntrada: {
            gte: hace7Dias,
          },
        },
        _count: {
          id: true,
        },
        having: {
          id: {
            _count: {
              gt: 20, // Más de 20 visitas en 7 días
            },
          },
        },
      });

      for (const grupo of visitasRecientes) {
        const visitante = await prisma.visitaFrecuente.findUnique({
          where: { id: grupo.visitanteFrecuenteId! },
          include: { unidad: true },
        });

        if (visitante) {
          alertas.push({
            tipo: 'visitante_muy_frecuente',
            descripcion: `${visitante.nombre} ha visitado ${grupo._count.id} veces en 7 días`,
            visitaId: grupo.visitanteFrecuenteId!,
            prioridad: 'baja',
          });
        }
      }

      return alertas;
    } catch (error) {
      logger.error('Error al obtener alertas de seguridad:', error);
      throw error;
    }
  }
}
