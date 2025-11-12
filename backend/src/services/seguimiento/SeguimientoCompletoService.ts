/**
 * =========================================================================
 * SERVICIO DE SEGUIMIENTO COMPLETO AUTOMATIZADO
 * =========================================================================
 *
 * FLUJO COMPLETO:
 * 1. Caso creado → Asigna técnico → Agenda cita → Notifica técnico por WhatsApp
 * 2. Día de la cita → Envía recordatorio al técnico
 * 3. Después de la cita → Pregunta al propietario el status
 * 4. Según respuesta:
 *    - "Resuelto" → Envía encuesta → Cierra caso
 *    - "No fue" → Reagenda → Notifica técnico
 *    - "Reagendó" → Crea nueva cita → Notifica técnico
 */

import { getPrismaClient } from '../../config/database/postgres';
import { logger } from '../../utils/logger';
import { WhatsAppService } from '../whatsapp/WhatsAppService';
import { EncuestaSatisfaccionService } from '../encuestas/EncuestaSatisfaccionService';
import { CalendarioAsignacionService } from '../calendario/CalendarioAsignacionService';
import { addHours, addDays, format, isAfter, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { EstadoCaso, PrioridadCaso } from '@prisma/client';

const prisma = getPrismaClient();

export interface StatusCitaRespuesta {
  casoId: string;
  status: 'resuelto' | 'no_fue' | 'reagendo' | 'pendiente';
  comentario?: string;
}

export class SeguimientoCompletoService {
  private static instance: SeguimientoCompletoService;
  private whatsappService: WhatsAppService;
  private encuestaService: EncuestaSatisfaccionService;
  private calendarioService: CalendarioAsignacionService;

  private constructor() {
    this.whatsappService = WhatsAppService.getInstance();
    this.encuestaService = EncuestaSatisfaccionService.getInstance();
    this.calendarioService = CalendarioAsignacionService.getInstance();
  }

  public static getInstance(): SeguimientoCompletoService {
    if (!SeguimientoCompletoService.instance) {
      SeguimientoCompletoService.instance = new SeguimientoCompletoService();
    }
    return SeguimientoCompletoService.instance;
  }

  /**
   * 📱 PASO 1: Enviar notificación al técnico por WhatsApp
   * Se ejecuta cuando se crea el caso y se asigna técnico
   */
  public async notificarTecnicoPorWhatsApp(
    casoId: string,
    tecnicoId: string
  ): Promise<boolean> {
    try {
      const caso = await prisma.caso.findUnique({
        where: { id: casoId },
        include: {
          usuario: true,
          condominio: true,
          tecnicoAsignado: true,
          citas: {
            where: { estado: 'programada' },
            orderBy: { fechaHora: 'asc' },
            take: 1,
          },
        },
      });

      if (!caso || !caso.tecnicoAsignado) {
        logger.error(`❌ Caso ${casoId} no encontrado o sin técnico asignado`);
        return false;
      }

      const tecnico = caso.tecnicoAsignado;
      const cita = caso.citas[0];

      if (!cita) {
        logger.error(`❌ No hay cita programada para caso ${caso.numeroCaso}`);
        return false;
      }

      // Formatear fecha y hora
      const fechaFormateada = format(cita.fechaHora, "EEEE d 'de' MMMM, yyyy", {
        locale: es,
      });
      const horaInicio = format(cita.fechaHora, 'HH:mm', { locale: es });
      const horaFin = cita.fechaHoraFin
        ? format(cita.fechaHoraFin, 'HH:mm', { locale: es })
        : '';

      // Construir mensaje
      const mensaje = `
🔧 *NUEVA ASIGNACIÓN DE CASO*

*Caso:* ${caso.numeroCaso}
*Prioridad:* ${caso.prioridad.toUpperCase()}

📅 *Fecha:* ${fechaFormateada}
🕒 *Hora:* ${horaInicio}${horaFin ? ` - ${horaFin}` : ''}

👤 *Propietario:* ${caso.usuario.nombreCompleto}
📍 *Ubicación:* ${caso.condominio.nombre}
🏠 *Unidad:* ${caso.unidad}
📞 *Teléfono:* ${caso.usuario.telefono}

📝 *Problema:*
${caso.descripcion}

${caso.prioridad === 'urgente' ? '🚨 *CASO URGENTE - PRIORIDAD ALTA*' : ''}

_Por favor confirma tu asistencia_
`.trim();

      // Enviar mensaje al técnico
      const exito = await this.whatsappService.enviarMensaje(
        tecnico.telefono,
        mensaje
      );

      if (exito) {
        logger.info(
          `✅ Notificación enviada al técnico ${tecnico.nombreCompleto} (${tecnico.telefono})`
        );

        // Registrar en timeline
        await prisma.timelineEvento.create({
          data: {
            casoId,
            descripcion: `Notificación enviada al técnico ${tecnico.nombreCompleto}`,
            metadata: {
              tipo: 'notificacion_tecnico',
              tecnicoId: tecnico.id,
              telefono: tecnico.telefono,
            },
          },
        });

        return true;
      } else {
        logger.error(
          `❌ Error enviando notificación al técnico ${tecnico.nombreCompleto}`
        );
        return false;
      }
    } catch (error) {
      logger.error('❌ Error en notificarTecnicoPorWhatsApp:', error);
      return false;
    }
  }

  /**
   * ⏰ PASO 2: Enviar recordatorio al técnico (día de la cita)
   * Se ejecuta por cron job en la mañana del día de la cita
   */
  public async enviarRecordatoriosTecnicos(): Promise<void> {
    try {
      logger.info('⏰ Enviando recordatorios a técnicos...');

      const hoy = startOfDay(new Date());
      const mañana = addDays(hoy, 1);

      // Buscar citas programadas para hoy
      const citasHoy = await prisma.cita.findMany({
        where: {
          fechaHora: {
            gte: hoy,
            lt: mañana,
          },
          estado: 'programada',
        },
        include: {
          caso: {
            include: {
              usuario: true,
              condominio: true,
              tecnicoAsignado: true,
            },
          },
        },
      });

      logger.info(`📋 ${citasHoy.length} citas encontradas para hoy`);

      for (const cita of citasHoy) {
        const caso = cita.caso;
        const tecnico = caso.tecnicoAsignado;

        if (!tecnico) continue;

        const horaInicio = format(cita.fechaHora, 'HH:mm', { locale: es });

        const mensaje = `
🔔 *RECORDATORIO DE CITA HOY*

*Caso:* ${caso.numeroCaso}
🕒 *Hora:* ${horaInicio}

👤 *Propietario:* ${caso.usuario.nombreCompleto}
📍 *Ubicación:* ${caso.condominio.nombre}
🏠 *Unidad:* ${caso.unidad}
📞 *Teléfono:* ${caso.usuario.telefono}

📝 *Problema:* ${caso.descripcion}

_¡Éxito en tu visita!_
`.trim();

        await this.whatsappService.enviarMensaje(tecnico.telefono, mensaje);

        logger.info(`✅ Recordatorio enviado a ${tecnico.nombreCompleto}`);
      }

      logger.info('✅ Recordatorios enviados');
    } catch (error) {
      logger.error('❌ Error enviando recordatorios:', error);
    }
  }

  /**
   * 📞 PASO 3: Preguntar al propietario el status post-cita
   * Se ejecuta 4 horas después de la hora programada de la cita
   */
  public async preguntarStatusCita(): Promise<void> {
    try {
      logger.info('📞 Preguntando status de citas completadas...');

      const hace4Horas = addHours(new Date(), -4);

      // Buscar citas que debieron completarse hace 4 horas
      const citas = await prisma.cita.findMany({
        where: {
          estado: 'programada',
          fechaHoraFin: {
            lte: hace4Horas,
          },
        },
        include: {
          caso: {
            include: {
              usuario: true,
              tecnicoAsignado: true,
            },
          },
        },
      });

      logger.info(`📋 ${citas.length} citas pendientes de confirmar status`);

      for (const cita of citas) {
        const caso = cita.caso;
        const propietario = caso.usuario;
        const tecnico = caso.tecnicoAsignado;

        const mensaje = `
Hola ${propietario.nombreCompleto} 👋

Hoy ${tecnico?.nombreCompleto || 'nuestro técnico'} debió atender su caso *${caso.numeroCaso}*:
_"${caso.descripcion}"_

Por favor, indícanos el status escribiendo el número:

*1️⃣ - Problema resuelto* ✅
*2️⃣ - El técnico no asistió* ❌
*3️⃣ - Se reagendó la cita* 📅

Tu respuesta es muy importante para dar seguimiento.
`.trim();

        await this.whatsappService.enviarMensaje(propietario.telefono, mensaje);

        // Marcar cita como "esperando_confirmacion"
        await prisma.cita.update({
          where: { id: cita.id },
          data: { estado: 'esperando_confirmacion' },
        });

        logger.info(
          `✅ Pregunta de status enviada a ${propietario.nombreCompleto} - Caso ${caso.numeroCaso}`
        );
      }

      logger.info('✅ Preguntas de status enviadas');
    } catch (error) {
      logger.error('❌ Error preguntando status de citas:', error);
    }
  }

  /**
   * ✅ PASO 4: Procesar respuesta del propietario
   * Se ejecuta cuando el propietario responde 1, 2 o 3
   */
  public async procesarRespuestaStatus(
    telefono: string,
    respuesta: string
  ): Promise<StatusCitaRespuesta | null> {
    try {
      // Buscar caso con cita en "esperando_confirmacion" del propietario
      const usuario = await prisma.usuario.findUnique({
        where: { telefono },
      });

      if (!usuario) {
        logger.warn(`⚠️  Usuario no encontrado con teléfono ${telefono}`);
        return null;
      }

      const caso = await prisma.caso.findFirst({
        where: {
          usuarioId: usuario.id,
          estado: { in: ['asignado', 'en_proceso'] },
          citas: {
            some: { estado: 'esperando_confirmacion' },
          },
        },
        include: {
          citas: {
            where: { estado: 'esperando_confirmacion' },
            orderBy: { fechaHora: 'desc' },
            take: 1,
          },
          usuario: true,
          tecnicoAsignado: true,
        },
      });

      if (!caso || !caso.citas[0]) {
        logger.warn(`⚠️  No hay casos pendientes de confirmación para ${telefono}`);
        return null;
      }

      const cita = caso.citas[0];
      const respuestaLimpia = respuesta.trim();

      // Procesar según respuesta
      if (respuestaLimpia === '1' || respuestaLimpia.toLowerCase().includes('resuelto')) {
        return await this.procesarCasoResuelto(caso.id, cita.id);
      } else if (respuestaLimpia === '2' || respuestaLimpia.toLowerCase().includes('no asist') || respuestaLimpia.toLowerCase().includes('no fue')) {
        return await this.procesarTecnicoNoAsistio(caso.id, cita.id);
      } else if (respuestaLimpia === '3' || respuestaLimpia.toLowerCase().includes('reagend')) {
        return await this.procesarReagendamiento(caso.id, cita.id);
      }

      logger.warn(`⚠️  Respuesta no reconocida: "${respuesta}"`);
      return null;
    } catch (error) {
      logger.error('❌ Error procesando respuesta de status:', error);
      return null;
    }
  }

  /**
   * ✅ CASO RESUELTO: Enviar encuesta y cerrar caso
   */
  private async procesarCasoResuelto(
    casoId: string,
    citaId: string
  ): Promise<StatusCitaRespuesta> {
    try {
      logger.info(`✅ Procesando caso RESUELTO: ${casoId}`);

      const caso = await prisma.caso.findUnique({
        where: { id: casoId },
        include: { usuario: true },
      });

      if (!caso) throw new Error('Caso no encontrado');

      // 1. Marcar cita como completada
      await prisma.cita.update({
        where: { id: citaId },
        data: {
          estado: 'completada',
          fechaCompletado: new Date(),
        },
      });

      // 2. Actualizar caso a "resuelto"
      await prisma.caso.update({
        where: { id: casoId },
        data: {
          estado: EstadoCaso.resuelto,
          fechaResolucion: new Date(),
        },
      });

      // 3. Registrar en timeline
      await prisma.timelineEvento.create({
        data: {
          casoId,
          descripcion: 'Propietario confirmó que el problema fue resuelto',
          metadata: { tipo: 'confirmacion_resolucion', origen: 'whatsapp' },
        },
      });

      // 4. Enviar encuesta de satisfacción
      await this.encuestaService.crearEncuesta(casoId, caso.usuarioId, true, false);

      // 5. Enviar mensaje de agradecimiento
      const mensaje = `
¡Excelente! ✅

Gracias por confirmar que el problema fue resuelto.

Hemos enviado una breve encuesta para conocer tu opinión sobre el servicio. Tu feedback nos ayuda a mejorar.

*Caso ${caso.numeroCaso}:* CERRADO
`.trim();

      await this.whatsappService.enviarMensaje(caso.usuario.telefono, mensaje);

      logger.info(`✅ Caso ${caso.numeroCaso} cerrado con encuesta enviada`);

      return {
        casoId,
        status: 'resuelto',
      };
    } catch (error) {
      logger.error('❌ Error procesando caso resuelto:', error);
      throw error;
    }
  }

  /**
   * ❌ TÉCNICO NO ASISTIÓ: Reagendar automáticamente
   */
  private async procesarTecnicoNoAsistio(
    casoId: string,
    citaId: string
  ): Promise<StatusCitaRespuesta> {
    try {
      logger.info(`❌ Procesando TÉCNICO NO ASISTIÓ: ${casoId}`);

      const caso = await prisma.caso.findUnique({
        where: { id: casoId },
        include: {
          usuario: true,
          tecnicoAsignado: true,
        },
      });

      if (!caso) throw new Error('Caso no encontrado');

      // 1. Marcar cita como "no_asistio"
      await prisma.cita.update({
        where: { id: citaId },
        data: { estado: 'cancelada' },
      });

      // 2. Registrar en timeline
      await prisma.timelineEvento.create({
        data: {
          casoId,
          descripcion: 'Propietario reportó que el técnico no asistió',
          metadata: { tipo: 'tecnico_no_asistio', citaId },
        },
      });

      // 3. Reagendar automáticamente con PRIORIDAD ALTA
      const slotNuevo = await this.calendarioService.asignarSlotAutomatico(
        casoId,
        PrioridadCaso.alta
      );

      // 4. Notificar al técnico por WhatsApp
      if (slotNuevo.tecnicoAsignado) {
        await this.notificarTecnicoPorWhatsApp(casoId, slotNuevo.tecnicoAsignado.id);
      }

      // 5. Notificar al propietario
      const fechaNueva = format(slotNuevo.fecha, "EEEE d 'de' MMMM", { locale: es });
      const horaNueva = slotNuevo.bloqueHorario.horaInicio;

      const mensaje = `
Lamentamos lo ocurrido. 😔

Hemos reagendado tu caso automáticamente:

📅 *Nueva fecha:* ${fechaNueva}
🕒 *Hora:* ${horaNueva}
👷 *Técnico:* ${slotNuevo.tecnicoAsignado?.nombreCompleto || 'Por asignar'}

*Caso ${caso.numeroCaso}:* REAGENDADO
`.trim();

      await this.whatsappService.enviarMensaje(caso.usuario.telefono, mensaje);

      logger.info(`✅ Caso ${caso.numeroCaso} reagendado por inasistencia`);

      return {
        casoId,
        status: 'no_fue',
      };
    } catch (error) {
      logger.error('❌ Error procesando técnico no asistió:', error);
      throw error;
    }
  }

  /**
   * 📅 REAGENDAMIENTO: Crear nueva cita
   */
  private async procesarReagendamiento(
    casoId: string,
    citaId: string
  ): Promise<StatusCitaRespuesta> {
    try {
      logger.info(`📅 Procesando REAGENDAMIENTO: ${casoId}`);

      const caso = await prisma.caso.findUnique({
        where: { id: casoId },
        include: { usuario: true, tecnicoAsignado: true },
      });

      if (!caso) throw new Error('Caso no encontrado');

      // 1. Cancelar cita anterior
      await prisma.cita.update({
        where: { id: citaId },
        data: { estado: 'cancelada' },
      });

      // 2. Registrar en timeline
      await prisma.timelineEvento.create({
        data: {
          casoId,
          descripcion: 'Cita reagendada por el propietario/técnico',
          metadata: { tipo: 'reagendamiento', citaAnteriorId: citaId },
        },
      });

      // 3. Asignar nuevo slot
      const slotNuevo = await this.calendarioService.asignarSlotAutomatico(
        casoId,
        caso.prioridad
      );

      // 4. Notificar al técnico
      if (slotNuevo.tecnicoAsignado) {
        await this.notificarTecnicoPorWhatsApp(casoId, slotNuevo.tecnicoAsignado.id);
      }

      // 5. Confirmar al propietario
      const fechaNueva = format(slotNuevo.fecha, "EEEE d 'de' MMMM", { locale: es });
      const horaNueva = slotNuevo.bloqueHorario.horaInicio;

      const mensaje = `
Entendido 📅

Tu cita ha sido reagendada:

📅 *Nueva fecha:* ${fechaNueva}
🕒 *Hora:* ${horaNueva}
👷 *Técnico:* ${slotNuevo.tecnicoAsignado?.nombreCompleto || caso.tecnicoAsignado?.nombreCompleto}

*Caso ${caso.numeroCaso}:* REAGENDADO
`.trim();

      await this.whatsappService.enviarMensaje(caso.usuario.telefono, mensaje);

      logger.info(`✅ Caso ${caso.numeroCaso} reagendado exitosamente`);

      return {
        casoId,
        status: 'reagendo',
      };
    } catch (error) {
      logger.error('❌ Error procesando reagendamiento:', error);
      throw error;
    }
  }

  /**
   * 🔄 RECORDATORIO: Si propietario no responde en 24h, repreguntar
   */
  public async repreguntarCasossSinRespuesta(): Promise<void> {
    try {
      logger.info('🔄 Repreguntando casos sin respuesta...');

      const hace24Horas = addHours(new Date(), -24);

      const citas = await prisma.cita.findMany({
        where: {
          estado: 'esperando_confirmacion',
          updatedAt: { lte: hace24Horas },
        },
        include: {
          caso: {
            include: {
              usuario: true,
            },
          },
        },
      });

      for (const cita of citas) {
        const caso = cita.caso;
        const propietario = caso.usuario;

        const mensaje = `
Hola ${propietario.nombreCompleto} 👋

Aún no hemos recibido tu respuesta sobre el caso *${caso.numeroCaso}*.

Por favor, indícanos:

*1️⃣ - Problema resuelto* ✅
*2️⃣ - El técnico no asistió* ❌
*3️⃣ - Se reagendó la cita* 📅
`.trim();

        await this.whatsappService.enviarMensaje(propietario.telefono, mensaje);

        logger.info(`🔄 Recordatorio enviado a ${propietario.nombreCompleto}`);
      }
    } catch (error) {
      logger.error('❌ Error repreguntando casos:', error);
    }
  }
}
