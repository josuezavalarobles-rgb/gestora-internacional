// ========================================
// CALENDARIO SERVICE
// Gestión de eventos y recordatorios
// ========================================

import { PrismaClient, CalendarioEvento, Recordatorio, TipoEventoCalendario } from '@prisma/client';
import { logger } from '../../utils/logger';

const prisma = new PrismaClient();

export interface CrearEventoDTO {
  condominioId: string;
  tipo: TipoEventoCalendario;
  titulo: string;
  descripcion?: string;
  fechaInicio: Date;
  fechaFin: Date;
  ubicacion?: string;
  organizador?: string;
  participantes?: string[]; // IDs de usuarios
  adjuntos?: string[];
  todoElDia?: boolean;
  color?: string;
}

export interface CrearRecordatorioDTO {
  eventoId: string;
  usuarioId: string;
  tiempoAntes: number; // Minutos antes del evento
  metodo: 'email' | 'whatsapp' | 'notificacion';
  mensaje?: string;
}

export class CalendarioService {
  private static instance: CalendarioService;

  private constructor() {}

  public static getInstance(): CalendarioService {
    if (!CalendarioService.instance) {
      CalendarioService.instance = new CalendarioService();
    }
    return CalendarioService.instance;
  }

  // ========================================
  // EVENTOS
  // ========================================

  /**
   * Crear evento
   */
  async crearEvento(data: CrearEventoDTO): Promise<CalendarioEvento> {
    try {
      logger.info(`Creando evento: ${data.titulo}`);

      const evento = await prisma.calendarioEvento.create({
        data: {
          condominioId: data.condominioId,
          tipo: data.tipo,
          titulo: data.titulo,
          descripcion: data.descripcion,
          fechaInicio: data.fechaInicio,
          fechaFin: data.fechaFin,
          ubicacion: data.ubicacion,
          organizador: data.organizador,
          participantes: data.participantes,
          adjuntos: data.adjuntos,
          todoElDia: data.todoElDia || false,
          color: data.color,
        },
      });

      logger.info(`✅ Evento creado: ${evento.id}`);
      return evento;
    } catch (error) {
      logger.error('Error al crear evento:', error);
      throw error;
    }
  }

  /**
   * Obtener eventos de un condominio
   */
  async obtenerEventos(
    condominioId: string,
    filtros?: {
      tipo?: TipoEventoCalendario;
      fechaDesde?: Date;
      fechaHasta?: Date;
      activo?: boolean;
    }
  ): Promise<CalendarioEvento[]> {
    try {
      const where: any = { condominioId };

      if (filtros?.tipo) {
        where.tipo = filtros.tipo;
      }

      if (filtros?.activo !== undefined) {
        where.activo = filtros.activo;
      }

      if (filtros?.fechaDesde || filtros?.fechaHasta) {
        where.fechaInicio = {};
        if (filtros.fechaDesde) {
          where.fechaInicio.gte = filtros.fechaDesde;
        }
        if (filtros.fechaHasta) {
          where.fechaInicio.lte = filtros.fechaHasta;
        }
      }

      const eventos = await prisma.calendarioEvento.findMany({
        where,
        include: {
          recordatorios: true,
          _count: {
            select: {
              recordatorios: true,
            },
          },
        },
        orderBy: {
          fechaInicio: 'asc',
        },
      });

      return eventos;
    } catch (error) {
      logger.error('Error al obtener eventos:', error);
      throw error;
    }
  }

  /**
   * Obtener eventos del mes
   */
  async obtenerEventosDelMes(
    condominioId: string,
    anio: number,
    mes: number
  ): Promise<CalendarioEvento[]> {
    try {
      const fechaInicio = new Date(anio, mes - 1, 1);
      const fechaFin = new Date(anio, mes, 0, 23, 59, 59);

      return this.obtenerEventos(condominioId, {
        fechaDesde: fechaInicio,
        fechaHasta: fechaFin,
        activo: true,
      });
    } catch (error) {
      logger.error('Error al obtener eventos del mes:', error);
      throw error;
    }
  }

  /**
   * Obtener eventos próximos
   */
  async obtenerEventosProximos(
    condominioId: string,
    diasAdelante: number = 7
  ): Promise<CalendarioEvento[]> {
    try {
      const ahora = new Date();
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() + diasAdelante);

      return this.obtenerEventos(condominioId, {
        fechaDesde: ahora,
        fechaHasta: fechaLimite,
        activo: true,
      });
    } catch (error) {
      logger.error('Error al obtener eventos próximos:', error);
      throw error;
    }
  }

  /**
   * Actualizar evento
   */
  async actualizarEvento(
    eventoId: string,
    data: Partial<CrearEventoDTO>
  ): Promise<CalendarioEvento> {
    try {
      const evento = await prisma.calendarioEvento.update({
        where: { id: eventoId },
        data,
      });

      logger.info(`✅ Evento actualizado: ${eventoId}`);
      return evento;
    } catch (error) {
      logger.error('Error al actualizar evento:', error);
      throw error;
    }
  }

  /**
   * Cancelar evento
   */
  async cancelarEvento(eventoId: string, motivo?: string): Promise<CalendarioEvento> {
    try {
      const evento = await prisma.calendarioEvento.update({
        where: { id: eventoId },
        data: {
          activo: false,
          descripcion: motivo
            ? `CANCELADO - ${motivo}\n\n${(await prisma.calendarioEvento.findUnique({ where: { id: eventoId } }))?.descripcion || ''}`
            : undefined,
        },
      });

      logger.info(`✅ Evento cancelado: ${eventoId}`);
      return evento;
    } catch (error) {
      logger.error('Error al cancelar evento:', error);
      throw error;
    }
  }

  // ========================================
  // RECORDATORIOS
  // ========================================

  /**
   * Crear recordatorio para un evento
   */
  async crearRecordatorio(data: CrearRecordatorioDTO): Promise<Recordatorio> {
    try {
      logger.info(`Creando recordatorio para evento ${data.eventoId}`);

      // Obtener evento para calcular fecha de envío
      const evento = await prisma.calendarioEvento.findUnique({
        where: { id: data.eventoId },
      });

      if (!evento) {
        throw new Error('Evento no encontrado');
      }

      // Calcular fecha de envío
      const fechaEnvio = new Date(evento.fechaInicio);
      fechaEnvio.setMinutes(fechaEnvio.getMinutes() - data.tiempoAntes);

      const recordatorio = await prisma.recordatorio.create({
        data: {
          eventoId: data.eventoId,
          usuarioId: data.usuarioId,
          tiempoAntes: data.tiempoAntes,
          fechaEnvio,
          metodo: data.metodo,
          mensaje: data.mensaje,
        },
        include: {
          evento: true,
        },
      });

      logger.info(`✅ Recordatorio creado: ${recordatorio.id}`);
      return recordatorio;
    } catch (error) {
      logger.error('Error al crear recordatorio:', error);
      throw error;
    }
  }

  /**
   * Obtener recordatorios pendientes de enviar
   */
  async obtenerRecordatoriosPendientes(): Promise<Recordatorio[]> {
    try {
      const ahora = new Date();

      const recordatorios = await prisma.recordatorio.findMany({
        where: {
          enviado: false,
          fechaEnvio: {
            lte: ahora,
          },
          evento: {
            activo: true,
          },
        },
        include: {
          evento: {
            include: {
              condominio: true,
            },
          },
        },
        orderBy: {
          fechaEnvio: 'asc',
        },
      });

      return recordatorios;
    } catch (error) {
      logger.error('Error al obtener recordatorios pendientes:', error);
      throw error;
    }
  }

  /**
   * Marcar recordatorio como enviado
   */
  async marcarRecordatorioEnviado(recordatorioId: string): Promise<void> {
    try {
      await prisma.recordatorio.update({
        where: { id: recordatorioId },
        data: {
          enviado: true,
          fechaEnvioReal: new Date(),
        },
      });

      logger.info(`✅ Recordatorio marcado como enviado: ${recordatorioId}`);
    } catch (error) {
      logger.error('Error al marcar recordatorio como enviado:', error);
      throw error;
    }
  }

  /**
   * Procesar y enviar recordatorios pendientes
   */
  async procesarRecordatorios(): Promise<number> {
    try {
      logger.info('Procesando recordatorios pendientes...');

      const recordatorios = await this.obtenerRecordatoriosPendientes();

      for (const recordatorio of recordatorios) {
        try {
          // Aquí se integraría con el servicio de notificaciones
          // (WhatsApp, Email, etc.)
          const mensaje = recordatorio.mensaje ||
            `Recordatorio: ${recordatorio.evento.titulo} - ${recordatorio.evento.fechaInicio.toLocaleString('es-DO')}`;

          logger.info(`Enviando recordatorio: ${mensaje}`);

          // Simular envío (en producción se enviaría realmente)
          await this.marcarRecordatorioEnviado(recordatorio.id);
        } catch (error) {
          logger.error(`Error al enviar recordatorio ${recordatorio.id}:`, error);
        }
      }

      logger.info(`✅ ${recordatorios.length} recordatorios procesados`);
      return recordatorios.length;
    } catch (error) {
      logger.error('Error al procesar recordatorios:', error);
      throw error;
    }
  }

  // ========================================
  // EVENTOS RECURRENTES
  // ========================================

  /**
   * Crear eventos recurrentes (mensual)
   */
  async crearEventosRecurrentes(
    data: CrearEventoDTO,
    cantidadMeses: number
  ): Promise<CalendarioEvento[]> {
    try {
      logger.info(`Creando ${cantidadMeses} eventos recurrentes: ${data.titulo}`);

      const eventos: CalendarioEvento[] = [];

      for (let i = 0; i < cantidadMeses; i++) {
        const fechaInicio = new Date(data.fechaInicio);
        fechaInicio.setMonth(fechaInicio.getMonth() + i);

        const fechaFin = new Date(data.fechaFin);
        fechaFin.setMonth(fechaFin.getMonth() + i);

        const evento = await this.crearEvento({
          ...data,
          fechaInicio,
          fechaFin,
          titulo: `${data.titulo} - ${fechaInicio.toLocaleDateString('es-DO', { month: 'long', year: 'numeric' })}`,
        });

        eventos.push(evento);
      }

      logger.info(`✅ ${eventos.length} eventos recurrentes creados`);
      return eventos;
    } catch (error) {
      logger.error('Error al crear eventos recurrentes:', error);
      throw error;
    }
  }

  // ========================================
  // ESTADÍSTICAS
  // ========================================

  /**
   * Obtener estadísticas de eventos
   */
  async obtenerEstadisticas(
    condominioId: string,
    fechaDesde: Date,
    fechaHasta: Date
  ): Promise<{
    totalEventos: number;
    eventosPorTipo: Record<string, number>;
    proximosEventos: number;
    eventosCompletados: number;
  }> {
    try {
      const eventos = await this.obtenerEventos(condominioId, {
        fechaDesde,
        fechaHasta,
      });

      const totalEventos = eventos.length;

      // Eventos por tipo
      const eventosPorTipo: Record<string, number> = {};
      eventos.forEach((evento) => {
        const tipo = evento.tipo;
        eventosPorTipo[tipo] = (eventosPorTipo[tipo] || 0) + 1;
      });

      // Próximos eventos (desde ahora)
      const ahora = new Date();
      const proximosEventos = eventos.filter(
        (e) => e.fechaInicio >= ahora && e.activo
      ).length;

      // Eventos completados (antes de ahora)
      const eventosCompletados = eventos.filter(
        (e) => e.fechaFin < ahora
      ).length;

      return {
        totalEventos,
        eventosPorTipo,
        proximosEventos,
        eventosCompletados,
      };
    } catch (error) {
      logger.error('Error al obtener estadísticas:', error);
      throw error;
    }
  }
}
