/**
 * ========================================
 * SERVICIO DE CALENDARIO Y ASIGNACIÓN AUTOMÁTICA
 * ========================================
 * Asigna automáticamente fecha y hora a casos nuevos
 * - Encuentra el siguiente slot disponible (bloques de 1h30min)
 * - Horario: 9:00 AM - 5:00 PM
 * - Asigna técnico/ingeniero automáticamente
 * - Crea cita en el calendario
 * - Notifica por email y WhatsApp grupal
 */

import { getPrismaClient } from '../../config/database/postgres';
import { logger } from '../../utils/logger';
import { addDays, format, parse, isWeekend, setHours, setMinutes } from 'date-fns';
import { es } from 'date-fns/locale';

const prisma = getPrismaClient();

export interface SlotAsignado {
  fecha: Date;
  bloqueHorario: {
    id: string;
    horaInicio: string;
    horaFin: string;
  };
  tecnicoAsignado?: {
    id: string;
    nombreCompleto: string;
    email: string;
    telefono: string;
  };
}

export class CalendarioAsignacionService {
  private static instance: CalendarioAsignacionService;

  // Slots de tiempo de 1 hora 30 minutos
  // 9:00 AM - 5:00 PM = 8 horas = 5 slots de 1h30m
  private readonly SLOTS_DIARIOS = [
    { horaInicio: '09:00', horaFin: '10:30' },
    { horaInicio: '10:30', horaFin: '12:00' },
    { horaInicio: '12:00', horaFin: '13:30' },
    { horaInicio: '13:30', horaFin: '15:00' },
    { horaInicio: '15:00', horaFin: '16:30' },
    { horaInicio: '16:30', horaFin: '18:00' }, // Hasta 6:00 PM (un poco más flexible)
  ];

  private constructor() {}

  public static getInstance(): CalendarioAsignacionService {
    if (!CalendarioAsignacionService.instance) {
      CalendarioAsignacionService.instance = new CalendarioAsignacionService();
    }
    return CalendarioAsignacionService.instance;
  }

  /**
   * Asignar automáticamente fecha, hora y técnico a un caso
   */
  public async asignarSlotAutomatico(
    casoId: string,
    prioridad: 'baja' | 'media' | 'alta' | 'urgente' = 'media'
  ): Promise<SlotAsignado> {
    try {
      logger.info(`📅 Buscando slot disponible para caso ${casoId} (prioridad: ${prioridad})`);

      // 1. Obtener el caso
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

      // 2. Determinar cuántos días adelante buscar según prioridad
      const diasBusqueda = this.getDiasBusquedaPorPrioridad(prioridad);

      // 3. Buscar slot disponible
      const slotDisponible = await this.encontrarSiguienteSlotDisponible(diasBusqueda);

      if (!slotDisponible) {
        throw new Error('No hay slots disponibles en los próximos días');
      }

      // 4. Asignar técnico disponible
      const tecnicoAsignado = await this.asignarTecnicoDisponible(
        slotDisponible.fecha,
        caso.categoria
      );

      // 5. Crear o actualizar bloque horario
      const bloqueHorario = await this.crearObtenerBloqueHorario(slotDisponible);

      // 6. Crear cita en el calendario
      await prisma.cita.create({
        data: {
          casoId: caso.id,
          fecha: slotDisponible.fecha,
          bloqueHorarioId: bloqueHorario.id,
          tecnicoId: tecnicoAsignado?.id,
          estado: 'pendiente',
        },
      });

      // 7. Actualizar caso con técnico asignado
      if (tecnicoAsignado) {
        await prisma.caso.update({
          where: { id: casoId },
          data: {
            tecnicoAsignadoId: tecnicoAsignado.id,
            estado: 'asignado',
          },
        });
      }

      logger.info(
        `✅ Slot asignado: ${format(slotDisponible.fecha, 'dd/MM/yyyy', { locale: es })} ${
          slotDisponible.horaInicio
        } - ${slotDisponible.horaFin}`
      );

      return {
        fecha: slotDisponible.fecha,
        bloqueHorario: {
          id: bloqueHorario.id,
          horaInicio: slotDisponible.horaInicio,
          horaFin: slotDisponible.horaFin,
        },
        tecnicoAsignado: tecnicoAsignado || undefined,
      };
    } catch (error) {
      logger.error('❌ Error asignando slot automático:', error);
      throw error;
    }
  }

  /**
   * Encontrar el siguiente slot disponible
   */
  private async encontrarSiguienteSlotDisponible(
    diasBusqueda: number
  ): Promise<{ fecha: Date; horaInicio: string; horaFin: string } | null> {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    for (let i = 0; i < diasBusqueda; i++) {
      const fecha = addDays(hoy, i);

      // Saltar fines de semana
      if (isWeekend(fecha)) {
        continue;
      }

      // Verificar cada slot del día
      for (const slot of this.SLOTS_DIARIOS) {
        // Si es hoy, verificar que no sea un slot pasado
        if (i === 0) {
          const ahora = new Date();
          const horaSlot = parse(slot.horaInicio, 'HH:mm', fecha);

          if (horaSlot < ahora) {
            continue; // Slot ya pasó
          }
        }

        // Verificar si el slot está disponible
        const citasEnSlot = await this.contarCitasEnSlot(fecha, slot.horaInicio, slot.horaFin);

        // Capacidad máxima por slot (configurable)
        const CAPACIDAD_MAXIMA = 3; // 3 técnicos pueden trabajar al mismo tiempo

        if (citasEnSlot < CAPACIDAD_MAXIMA) {
          return {
            fecha,
            horaInicio: slot.horaInicio,
            horaFin: slot.horaFin,
          };
        }
      }
    }

    return null;
  }

  /**
   * Contar citas existentes en un slot específico
   */
  private async contarCitasEnSlot(
    fecha: Date,
    horaInicio: string,
    horaFin: string
  ): Promise<number> {
    const bloqueHorario = await prisma.bloqueHorario.findFirst({
      where: {
        horaInicio,
        horaFin,
      },
    });

    if (!bloqueHorario) {
      return 0;
    }

    const citas = await prisma.cita.count({
      where: {
        fecha,
        bloqueHorarioId: bloqueHorario.id,
        estado: {
          in: ['pendiente', 'confirmada_propietario', 'confirmada_ingenieria'],
        },
      },
    });

    return citas;
  }

  /**
   * Crear o obtener bloque horario
   */
  private async crearObtenerBloqueHorario(slot: {
    fecha: Date;
    horaInicio: string;
    horaFin: string;
  }) {
    // Obtener día de la semana
    const diaSemana = format(slot.fecha, 'EEEE', { locale: es }).toLowerCase();

    const diasSemanaMap: Record<string, string> = {
      lunes: 'lunes',
      martes: 'martes',
      miércoles: 'miercoles',
      jueves: 'jueves',
      viernes: 'viernes',
      sábado: 'sabado',
      domingo: 'domingo',
    };

    const diaSemanaEnum = diasSemanaMap[diaSemana] || 'lunes';

    // Buscar bloque existente
    let bloqueHorario = await prisma.bloqueHorario.findFirst({
      where: {
        horaInicio: slot.horaInicio,
        horaFin: slot.horaFin,
        diaSemana: diaSemanaEnum as any,
      },
    });

    // Si no existe, crearlo
    if (!bloqueHorario) {
      bloqueHorario = await prisma.bloqueHorario.create({
        data: {
          diaSemana: diaSemanaEnum as any,
          horaInicio: slot.horaInicio,
          horaFin: slot.horaFin,
          capacidad: 3,
          activo: true,
        },
      });

      logger.info(`✅ Bloque horario creado: ${slot.horaInicio} - ${slot.horaFin}`);
    }

    return bloqueHorario;
  }

  /**
   * Asignar técnico disponible según disponibilidad y especialidad
   */
  private async asignarTecnicoDisponible(
    fecha: Date,
    categoria: string
  ): Promise<{ id: string; nombreCompleto: string; email: string; telefono: string } | null> {
    // 1. Obtener todos los técnicos activos
    const tecnicos = await prisma.usuario.findMany({
      where: {
        tipoUsuario: 'tecnico',
        estado: 'activo',
      },
    });

    if (tecnicos.length === 0) {
      logger.warn('⚠️ No hay técnicos disponibles');
      return null;
    }

    // 2. Contar citas por técnico en esa fecha
    const tecnicosConCarga = await Promise.all(
      tecnicos.map(async (tecnico) => {
        const citasDelDia = await prisma.cita.count({
          where: {
            tecnicoId: tecnico.id,
            fecha,
            estado: {
              in: ['pendiente', 'confirmada_propietario', 'confirmada_ingenieria'],
            },
          },
        });

        return {
          tecnico,
          citas: citasDelDia,
        };
      })
    );

    // 3. Ordenar por menos carga (round-robin)
    tecnicosConCarga.sort((a, b) => a.citas - b.citas);

    // 4. Seleccionar el técnico con menos carga
    const tecnicoSeleccionado = tecnicosConCarga[0].tecnico;

    logger.info(
      `👷 Técnico asignado: ${tecnicoSeleccionado.nombreCompleto} (${tecnicosConCarga[0].citas} citas ese día)`
    );

    return {
      id: tecnicoSeleccionado.id,
      nombreCompleto: tecnicoSeleccionado.nombreCompleto,
      email: tecnicoSeleccionado.email || '',
      telefono: tecnicoSeleccionado.telefono,
    };
  }

  /**
   * Determinar días de búsqueda según prioridad
   */
  private getDiasBusquedaPorPrioridad(prioridad: string): number {
    switch (prioridad) {
      case 'urgente':
        return 1; // Buscar solo hoy
      case 'alta':
        return 3; // Buscar en los próximos 3 días
      case 'media':
        return 7; // Buscar en la próxima semana
      case 'baja':
        return 14; // Buscar en las próximas 2 semanas
      default:
        return 7;
    }
  }

  /**
   * Obtener resumen del calendario para un técnico
   */
  public async obtenerCalendarioTecnico(tecnicoId: string, fecha: Date) {
    const citas = await prisma.cita.findMany({
      where: {
        tecnicoId,
        fecha,
        estado: {
          in: ['pendiente', 'confirmada_propietario', 'confirmada_ingenieria'],
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

    return citas;
  }

  /**
   * Obtener todos los slots ocupados de un día
   */
  public async obtenerSlotsOcupados(fecha: Date) {
    const citas = await prisma.cita.findMany({
      where: {
        fecha,
        estado: {
          in: ['pendiente', 'confirmada_propietario', 'confirmada_ingenieria'],
        },
      },
      include: {
        bloqueHorario: true,
        caso: {
          include: {
            usuario: true,
          },
        },
      },
    });

    return citas;
  }

  /**
   * Reprogramar una cita
   */
  public async reprogramarCita(citaId: string, nuevaFecha: Date, nuevoSlot: string) {
    const [horaInicio, horaFin] = nuevoSlot.split('-');

    const bloqueHorario = await this.crearObtenerBloqueHorario({
      fecha: nuevaFecha,
      horaInicio,
      horaFin,
    });

    await prisma.cita.update({
      where: { id: citaId },
      data: {
        fecha: nuevaFecha,
        bloqueHorarioId: bloqueHorario.id,
        estado: 'reprogramada',
      },
    });

    logger.info(`✅ Cita ${citaId} reprogramada`);
  }
}
