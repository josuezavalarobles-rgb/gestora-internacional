// ========================================
// SERVICIO DE GESTIÓN DE CITAS
// ========================================

import { getPrismaClient } from '../../config/database/postgres';
import { NotificacionService } from '../notifications/NotificacionService';
import { Prisma } from '@prisma/client';

const prisma = getPrismaClient();

export class CitasService {
  private notificacionService: NotificacionService;

  constructor() {
    this.notificacionService = new NotificacionService();
  }

  // ========================================
  // GESTIÓN DE BLOQUES HORARIOS
  // ========================================

  /**
   * Crear un bloque horario
   */
  async crearBloqueHorario(data: {
    diaSemana: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes';
    horaInicio: string;
    horaFin: string;
    capacidad?: number;
  }) {
    try {
      const bloque = await prisma.bloqueHorario.create({
        data: {
          diaSemana: data.diaSemana,
          horaInicio: data.horaInicio,
          horaFin: data.horaFin,
          capacidad: data.capacidad || 5,
          activo: true,
        },
      });

      return {
        success: true,
        data: bloque,
      };
    } catch (error) {
      console.error('Error al crear bloque horario:', error);
      return {
        success: false,
        error: 'Error al crear bloque horario',
      };
    }
  }

  /**
   * Inicializar bloques horarios estándar (ejecutar una sola vez)
   */
  async inicializarBloquesHorarios() {
    const bloquesEstandar = [
      { diaSemana: 'lunes', horaInicio: '09:00', horaFin: '11:00', capacidad: 5 },
      { diaSemana: 'lunes', horaInicio: '11:00', horaFin: '13:00', capacidad: 5 },
      { diaSemana: 'lunes', horaInicio: '13:00', horaFin: '15:00', capacidad: 5 },
      { diaSemana: 'lunes', horaInicio: '15:00', horaFin: '16:30', capacidad: 5 },

      { diaSemana: 'martes', horaInicio: '09:00', horaFin: '11:00', capacidad: 5 },
      { diaSemana: 'martes', horaInicio: '11:00', horaFin: '13:00', capacidad: 5 },
      { diaSemana: 'martes', horaInicio: '13:00', horaFin: '15:00', capacidad: 5 },
      { diaSemana: 'martes', horaInicio: '15:00', horaFin: '16:30', capacidad: 5 },

      { diaSemana: 'miercoles', horaInicio: '09:00', horaFin: '11:00', capacidad: 5 },
      { diaSemana: 'miercoles', horaInicio: '11:00', horaFin: '13:00', capacidad: 5 },
      { diaSemana: 'miercoles', horaInicio: '13:00', horaFin: '15:00', capacidad: 5 },
      { diaSemana: 'miercoles', horaInicio: '15:00', horaFin: '16:30', capacidad: 5 },

      { diaSemana: 'jueves', horaInicio: '09:00', horaFin: '11:00', capacidad: 5 },
      { diaSemana: 'jueves', horaInicio: '11:00', horaFin: '13:00', capacidad: 5 },
      { diaSemana: 'jueves', horaInicio: '13:00', horaFin: '15:00', capacidad: 5 },
      { diaSemana: 'jueves', horaInicio: '15:00', horaFin: '16:30', capacidad: 5 },

      { diaSemana: 'viernes', horaInicio: '09:00', horaFin: '11:00', capacidad: 5 },
      { diaSemana: 'viernes', horaInicio: '11:00', horaFin: '13:00', capacidad: 5 },
      { diaSemana: 'viernes', horaInicio: '13:00', horaFin: '15:00', capacidad: 5 },
      { diaSemana: 'viernes', horaInicio: '15:00', horaFin: '16:30', capacidad: 5 },
    ];

    try {
      const resultados = [];
      for (const bloque of bloquesEstandar) {
        const bloqueCreado = await this.crearBloqueHorario(bloque as any);
        resultados.push(bloqueCreado);
      }

      return {
        success: true,
        message: `Se crearon ${resultados.length} bloques horarios`,
      };
    } catch (error) {
      console.error('Error al inicializar bloques:', error);
      return {
        success: false,
        error: 'Error al inicializar bloques horarios',
      };
    }
  }

  /**
   * Obtener todos los bloques horarios activos
   */
  async obtenerBloquesHorarios() {
    try {
      const bloques = await prisma.bloqueHorario.findMany({
        where: { activo: true },
        orderBy: [
          { diaSemana: 'asc' },
          { horaInicio: 'asc' },
        ],
      });

      return {
        success: true,
        data: bloques,
      };
    } catch (error) {
      console.error('Error al obtener bloques:', error);
      return {
        success: false,
        error: 'Error al obtener bloques horarios',
      };
    }
  }

  // ========================================
  // DISPONIBILIDAD
  // ========================================

  /**
   * Obtener horarios disponibles para una fecha específica
   */
  async obtenerHorariosDisponibles(fecha: Date) {
    try {
      const diaSemana = this.obtenerDiaSemana(fecha);

      if (!diaSemana) {
        return {
          success: false,
          error: 'No hay disponibilidad en fines de semana',
        };
      }

      // Obtener bloques del día
      const bloques = await prisma.bloqueHorario.findMany({
        where: {
          diaSemana,
          activo: true,
        },
        orderBy: { horaInicio: 'asc' },
      });

      // Obtener citas existentes para esa fecha
      const citasExistentes = await prisma.cita.findMany({
        where: {
          fecha,
          estado: {
            notIn: ['cancelada', 'reprogramada'],
          },
        },
        include: {
          bloqueHorario: true,
        },
      });

      // Calcular disponibilidad
      const disponibilidad = bloques.map((bloque) => {
        const citasEnBloque = citasExistentes.filter(
          (cita) => cita.bloqueHorarioId === bloque.id
        );
        const ocupados = citasEnBloque.length;
        const disponibles = bloque.capacidad - ocupados;

        return {
          id: bloque.id,
          diaSemana: bloque.diaSemana,
          horaInicio: bloque.horaInicio,
          horaFin: bloque.horaFin,
          capacidad: bloque.capacidad,
          ocupados,
          disponibles,
          disponible: disponibles > 0,
          porcentajeOcupacion: (ocupados / bloque.capacidad) * 100,
        };
      });

      return {
        success: true,
        data: disponibilidad,
      };
    } catch (error) {
      console.error('Error al obtener disponibilidad:', error);
      return {
        success: false,
        error: 'Error al obtener horarios disponibles',
      };
    }
  }

  /**
   * Obtener día de la semana en español
   */
  private obtenerDiaSemana(fecha: Date): 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | null {
    const dia = fecha.getDay();
    const diasSemana: { [key: number]: any } = {
      1: 'lunes',
      2: 'martes',
      3: 'miercoles',
      4: 'jueves',
      5: 'viernes',
    };
    return diasSemana[dia] || null;
  }

  // ========================================
  // PROGRAMACIÓN DE CITAS
  // ========================================

  /**
   * Programar una nueva cita
   */
  async programarCita(data: {
    casoId: string;
    fecha: Date;
    bloqueHorarioId: string;
    tecnicoId?: string;
    notas?: string;
  }) {
    try {
      // Verificar disponibilidad
      const bloque = await prisma.bloqueHorario.findUnique({
        where: { id: data.bloqueHorarioId },
      });

      if (!bloque) {
        return {
          success: false,
          error: 'Bloque horario no encontrado',
        };
      }

      // Contar citas en ese bloque para esa fecha
      const citasEnBloque = await prisma.cita.count({
        where: {
          fecha: data.fecha,
          bloqueHorarioId: data.bloqueHorarioId,
          estado: {
            notIn: ['cancelada', 'reprogramada'],
          },
        },
      });

      if (citasEnBloque >= bloque.capacidad) {
        return {
          success: false,
          error: 'No hay disponibilidad en ese horario',
        };
      }

      // Verificar que el caso no tenga citas pendientes
      const citaPendiente = await prisma.cita.findFirst({
        where: {
          casoId: data.casoId,
          estado: {
            in: ['pendiente', 'confirmada_propietario', 'confirmada_ingenieria'],
          },
        },
      });

      if (citaPendiente) {
        return {
          success: false,
          error: 'El caso ya tiene una cita pendiente',
        };
      }

      // Crear la cita
      const cita = await prisma.cita.create({
        data: {
          casoId: data.casoId,
          fecha: data.fecha,
          bloqueHorarioId: data.bloqueHorarioId,
          tecnicoId: data.tecnicoId,
          notas: data.notas,
          estado: 'pendiente',
        },
        include: {
          caso: {
            include: {
              usuario: true,
              condominio: true,
            },
          },
          bloqueHorario: true,
        },
      });

      // Crear evento en timeline
      await prisma.timelineEvento.create({
        data: {
          casoId: data.casoId,
          tipoEvento: 'visita_programada',
          titulo: 'Cita programada',
          descripcion: `Cita programada para el ${data.fecha.toLocaleDateString()} de ${bloque.horaInicio} a ${bloque.horaFin}`,
          metadata: {
            citaId: cita.id,
            fecha: data.fecha,
            bloque: `${bloque.horaInicio} - ${bloque.horaFin}`,
          },
        },
      });

      // TODO: Descomentar cuando NotificacionService tenga el método crearNotificacion público
      // Enviar notificación al propietario
      // await this.notificacionService.crearNotificacion({
      //   usuarioId: cita.caso.usuarioId,
      //   tipo: 'visita_programada',
      //   prioridad: 'alta',
      //   titulo: 'Visita Programada',
      //   mensaje: `Se ha programado una visita para el ${data.fecha.toLocaleDateString()} de ${bloque.horaInicio} a ${bloque.horaFin}. Por favor confirme su disponibilidad.`,
      //   casoId: data.casoId,
      // });

      // Si hay técnico asignado, notificar
      // if (data.tecnicoId) {
      //   await this.notificacionService.crearNotificacion({
      //     usuarioId: data.tecnicoId,
      //     tipo: 'caso_asignado',
      //     prioridad: 'media',
      //     titulo: 'Nueva Visita Asignada',
      //     mensaje: `Se le ha asignado una visita para el ${data.fecha.toLocaleDateString()} de ${bloque.horaInicio} a ${bloque.horaFin}`,
      //     casoId: data.casoId,
      //   });
      // }

      return {
        success: true,
        data: cita,
        message: 'Cita programada exitosamente',
      };
    } catch (error) {
      console.error('Error al programar cita:', error);
      return {
        success: false,
        error: 'Error al programar cita',
      };
    }
  }

  // ========================================
  // CONFIRMACIONES
  // ========================================

  /**
   * Confirmar cita por parte del propietario
   */
  async confirmarCitaPropietario(citaId: string) {
    try {
      const cita = await prisma.cita.update({
        where: { id: citaId },
        data: {
          propietarioConfirmo: true,
          fechaConfirmacionProp: new Date(),
          estado: 'confirmada_propietario',
        },
        include: {
          caso: true,
          bloqueHorario: true,
        },
      });

      // Crear evento en timeline
      await prisma.timelineEvento.create({
        data: {
          casoId: cita.casoId,
          tipoEvento: 'comentario_agregado',
          titulo: 'Cita confirmada por propietario',
          descripcion: 'El propietario ha confirmado su disponibilidad para la visita',
        },
      });

      // Notificar a técnicos/admin
      await this.notificacionService.notificarAdmins({
        tipo: 'caso_actualizado',
        prioridad: 'media',
        titulo: 'Cita Confirmada',
        mensaje: `El propietario ha confirmado la cita del caso ${cita.caso.numeroCaso}`,
        casoId: cita.casoId,
      });

      return {
        success: true,
        data: cita,
        message: 'Cita confirmada exitosamente',
      };
    } catch (error) {
      console.error('Error al confirmar cita:', error);
      return {
        success: false,
        error: 'Error al confirmar cita',
      };
    }
  }

  /**
   * Confirmar cita por parte de ingeniería (técnico)
   */
  async confirmarCitaIngenieria(citaId: string, tecnicoId: string) {
    try {
      const cita = await prisma.cita.update({
        where: { id: citaId },
        data: {
          ingenieriaConfirmo: true,
          fechaConfirmacionIng: new Date(),
          tecnicoId,
          estado: 'confirmada_ingenieria',
        },
        include: {
          caso: {
            include: {
              usuario: true,
            },
          },
          bloqueHorario: true,
        },
      });

      // Actualizar estado del caso
      await prisma.caso.update({
        where: { id: cita.casoId },
        data: {
          estado: 'en_visita',
          tecnicoAsignadoId: tecnicoId,
        },
      });

      // Crear evento en timeline
      await prisma.timelineEvento.create({
        data: {
          casoId: cita.casoId,
          tipoEvento: 'visita_programada',
          titulo: 'Cita confirmada por técnico',
          descripcion: 'El técnico ha confirmado la visita',
          usuarioId: tecnicoId,
        },
      });

      // Notificar al propietario
      await this.notificacionService.crearNotificacion({
        usuarioId: cita.caso.usuarioId,
        tipo: 'caso_actualizado',
        prioridad: 'alta',
        titulo: 'Visita Confirmada',
        mensaje: `Su visita ha sido confirmada por nuestro equipo técnico`,
        casoId: cita.casoId,
      });

      return {
        success: true,
        data: cita,
        message: 'Cita confirmada por ingeniería',
      };
    } catch (error) {
      console.error('Error al confirmar cita por ingeniería:', error);
      return {
        success: false,
        error: 'Error al confirmar cita',
      };
    }
  }

  // ========================================
  // REPROGRAMACIÓN
  // ========================================

  /**
   * Reprogramar una cita existente
   */
  async reprogramarCita(data: {
    citaId: string;
    nuevaFecha: Date;
    nuevoBloqueId: string;
    motivo?: string;
  }) {
    try {
      // Verificar disponibilidad en el nuevo horario
      const disponibilidad = await this.obtenerHorariosDisponibles(data.nuevaFecha);

      if (!disponibilidad.success) {
        return disponibilidad;
      }

      const bloqueDisponible = disponibilidad.data?.find(
        (b) => b.id === data.nuevoBloqueId && b.disponible
      );

      if (!bloqueDisponible) {
        return {
          success: false,
          error: 'El horario seleccionado no está disponible',
        };
      }

      // Obtener cita actual
      const citaActual = await prisma.cita.findUnique({
        where: { id: data.citaId },
        include: {
          caso: {
            include: {
              usuario: true,
            },
          },
        },
      });

      if (!citaActual) {
        return {
          success: false,
          error: 'Cita no encontrada',
        };
      }

      // Marcar cita actual como reprogramada
      await prisma.cita.update({
        where: { id: data.citaId },
        data: {
          estado: 'reprogramada',
          motivoCancelacion: data.motivo || 'Reprogramada a solicitud',
        },
      });

      // Crear nueva cita
      const nuevaCita = await prisma.cita.create({
        data: {
          casoId: citaActual.casoId,
          fecha: data.nuevaFecha,
          bloqueHorarioId: data.nuevoBloqueId,
          tecnicoId: citaActual.tecnicoId,
          notas: citaActual.notas,
          estado: 'pendiente',
        },
        include: {
          bloqueHorario: true,
          caso: true,
        },
      });

      // Crear evento en timeline
      await prisma.timelineEvento.create({
        data: {
          casoId: citaActual.casoId,
          tipoEvento: 'visita_programada',
          titulo: 'Cita reprogramada',
          descripcion: `Cita reprogramada para el ${data.nuevaFecha.toLocaleDateString()} de ${bloqueDisponible.horaInicio} a ${bloqueDisponible.horaFin}. Motivo: ${data.motivo || 'No especificado'}`,
        },
      });

      // Notificar al propietario
      await this.notificacionService.crearNotificacion({
        usuarioId: citaActual.caso.usuarioId,
        tipo: 'visita_programada',
        prioridad: 'alta',
        titulo: 'Visita Reprogramada',
        mensaje: `Su visita ha sido reprogramada para el ${data.nuevaFecha.toLocaleDateString()} de ${bloqueDisponible.horaInicio} a ${bloqueDisponible.horaFin}`,
        casoId: citaActual.casoId,
      });

      return {
        success: true,
        data: nuevaCita,
        message: 'Cita reprogramada exitosamente',
      };
    } catch (error) {
      console.error('Error al reprogramar cita:', error);
      return {
        success: false,
        error: 'Error al reprogramar cita',
      };
    }
  }

  /**
   * Cancelar una cita
   */
  async cancelarCita(citaId: string, motivo: string) {
    try {
      const cita = await prisma.cita.update({
        where: { id: citaId },
        data: {
          estado: 'cancelada',
          motivoCancelacion: motivo,
        },
        include: {
          caso: {
            include: {
              usuario: true,
            },
          },
        },
      });

      // Crear evento en timeline
      await prisma.timelineEvento.create({
        data: {
          casoId: cita.casoId,
          tipoEvento: 'comentario_agregado',
          titulo: 'Cita cancelada',
          descripcion: `Motivo: ${motivo}`,
        },
      });

      // Notificar al propietario
      await this.notificacionService.crearNotificacion({
        usuarioId: cita.caso.usuarioId,
        tipo: 'caso_actualizado',
        prioridad: 'alta',
        titulo: 'Visita Cancelada',
        mensaje: `Su visita ha sido cancelada. Motivo: ${motivo}`,
        casoId: cita.casoId,
      });

      return {
        success: true,
        data: cita,
        message: 'Cita cancelada exitosamente',
      };
    } catch (error) {
      console.error('Error al cancelar cita:', error);
      return {
        success: false,
        error: 'Error al cancelar cita',
      };
    }
  }

  // ========================================
  // COMPLETAR VISITA
  // ========================================

  /**
   * Marcar cita como completada (post-visita)
   */
  async marcarCitaCompletada(data: {
    citaId: string;
    solucionado: boolean;
    comentarioPropietario?: string;
  }) {
    try {
      const cita = await prisma.cita.update({
        where: { id: data.citaId },
        data: {
          estado: 'completada',
          visitaRealizada: true,
          solucionado: data.solucionado,
          comentarioPropietario: data.comentarioPropietario,
        },
        include: {
          caso: true,
        },
      });

      // Actualizar estado del caso
      const nuevoEstadoCaso = data.solucionado ? 'resuelto' : 'en_proceso';
      await prisma.caso.update({
        where: { id: cita.casoId },
        data: {
          estado: nuevoEstadoCaso,
          fechaResolucion: data.solucionado ? new Date() : undefined,
        },
      });

      // Crear evento en timeline
      await prisma.timelineEvento.create({
        data: {
          casoId: cita.casoId,
          tipoEvento: 'visita_completada',
          titulo: 'Visita completada',
          descripcion: data.solucionado
            ? 'La visita fue completada y el problema fue resuelto'
            : 'La visita fue completada pero requiere seguimiento',
        },
      });

      return {
        success: true,
        data: cita,
        message: 'Visita marcada como completada',
      };
    } catch (error) {
      console.error('Error al completar visita:', error);
      return {
        success: false,
        error: 'Error al completar visita',
      };
    }
  }

  /**
   * Marcar cita como no realizada
   */
  async marcarCitaNoRealizada(citaId: string, motivo: string) {
    try {
      const cita = await prisma.cita.update({
        where: { id: citaId },
        data: {
          estado: 'no_realizada',
          visitaRealizada: false,
          motivoCancelacion: motivo,
        },
        include: {
          caso: true,
        },
      });

      // Crear evento en timeline
      await prisma.timelineEvento.create({
        data: {
          casoId: cita.casoId,
          tipoEvento: 'comentario_agregado',
          titulo: 'Visita no realizada',
          descripcion: `Motivo: ${motivo}`,
        },
      });

      return {
        success: true,
        data: cita,
        message: 'Cita marcada como no realizada',
      };
    } catch (error) {
      console.error('Error al marcar cita como no realizada:', error);
      return {
        success: false,
        error: 'Error al marcar cita',
      };
    }
  }

  // ========================================
  // CONSULTAS
  // ========================================

  /**
   * Obtener citas del día
   */
  async obtenerCitasDelDia(fecha: Date) {
    try {
      const citas = await prisma.cita.findMany({
        where: {
          fecha,
          estado: {
            notIn: ['cancelada', 'reprogramada'],
          },
        },
        include: {
          caso: {
            include: {
              usuario: true,
              condominio: true,
            },
          },
          bloqueHorario: true,
        },
        orderBy: {
          bloqueHorario: {
            horaInicio: 'asc',
          },
        },
      });

      return {
        success: true,
        data: citas,
      };
    } catch (error) {
      console.error('Error al obtener citas del día:', error);
      return {
        success: false,
        error: 'Error al obtener citas',
      };
    }
  }

  /**
   * Obtener citas por técnico
   */
  async obtenerCitasPorTecnico(tecnicoId: string, fechaInicio?: Date, fechaFin?: Date) {
    try {
      const where: any = {
        tecnicoId,
        estado: {
          notIn: ['cancelada', 'reprogramada'],
        },
      };

      if (fechaInicio && fechaFin) {
        where.fecha = {
          gte: fechaInicio,
          lte: fechaFin,
        };
      }

      const citas = await prisma.cita.findMany({
        where,
        include: {
          caso: {
            include: {
              usuario: true,
              condominio: true,
            },
          },
          bloqueHorario: true,
        },
        orderBy: [
          { fecha: 'asc' },
          { bloqueHorario: { horaInicio: 'asc' } },
        ],
      });

      return {
        success: true,
        data: citas,
      };
    } catch (error) {
      console.error('Error al obtener citas por técnico:', error);
      return {
        success: false,
        error: 'Error al obtener citas',
      };
    }
  }

  /**
   * Obtener cita por ID
   */
  async obtenerCitaPorId(citaId: string) {
    try {
      const cita = await prisma.cita.findUnique({
        where: { id: citaId },
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

      if (!cita) {
        return {
          success: false,
          error: 'Cita no encontrada',
        };
      }

      return {
        success: true,
        data: cita,
      };
    } catch (error) {
      console.error('Error al obtener cita:', error);
      return {
        success: false,
        error: 'Error al obtener cita',
      };
    }
  }

  /**
   * Obtener citas pendientes de confirmación
   */
  async obtenerCitasPendientesConfirmacion() {
    try {
      const citas = await prisma.cita.findMany({
        where: {
          estado: {
            in: ['pendiente', 'confirmada_propietario'],
          },
          fecha: {
            gte: new Date(),
          },
        },
        include: {
          caso: {
            include: {
              usuario: true,
              condominio: true,
            },
          },
          bloqueHorario: true,
        },
        orderBy: [
          { fecha: 'asc' },
          { bloqueHorario: { horaInicio: 'asc' } },
        ],
      });

      return {
        success: true,
        data: citas,
      };
    } catch (error) {
      console.error('Error al obtener citas pendientes:', error);
      return {
        success: false,
        error: 'Error al obtener citas pendientes',
      };
    }
  }

  /**
   * Obtener estadísticas de citas
   */
  async obtenerEstadisticasCitas(fechaInicio: Date, fechaFin: Date) {
    try {
      const totalCitas = await prisma.cita.count({
        where: {
          fechaCreacion: {
            gte: fechaInicio,
            lte: fechaFin,
          },
        },
      });

      const citasCompletadas = await prisma.cita.count({
        where: {
          fechaCreacion: {
            gte: fechaInicio,
            lte: fechaFin,
          },
          estado: 'completada',
        },
      });

      const citasCanceladas = await prisma.cita.count({
        where: {
          fechaCreacion: {
            gte: fechaInicio,
            lte: fechaFin,
          },
          estado: 'cancelada',
        },
      });

      const citasNoRealizadas = await prisma.cita.count({
        where: {
          fechaCreacion: {
            gte: fechaInicio,
            lte: fechaFin,
          },
          estado: 'no_realizada',
        },
      });

      const citasSolucionadas = await prisma.cita.count({
        where: {
          fechaCreacion: {
            gte: fechaInicio,
            lte: fechaFin,
          },
          solucionado: true,
        },
      });

      return {
        success: true,
        data: {
          totalCitas,
          citasCompletadas,
          citasCanceladas,
          citasNoRealizadas,
          citasSolucionadas,
          tasaCompletadas: totalCitas > 0 ? (citasCompletadas / totalCitas) * 100 : 0,
          tasaSolucion: citasCompletadas > 0 ? (citasSolucionadas / citasCompletadas) * 100 : 0,
        },
      };
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      return {
        success: false,
        error: 'Error al obtener estadísticas',
      };
    }
  }
}

export default new CitasService();
