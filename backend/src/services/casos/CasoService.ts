/**
 * ========================================
 * SERVICIO DE GESTIÓN DE CASOS
 * ========================================
 */

import { PrismaClient, TipoCaso, CategoriaCaso, PrioridadCaso, EstadoCaso } from '@prisma/client';
import { getPrismaClient } from '../../config/database/postgres';
import { logger } from '../../utils/logger';
import { AppError } from '../../middleware/errorHandler';
import { NotificacionService } from '../notifications/NotificacionService';
import { CalendarioAsignacionService } from '../calendario/CalendarioAsignacionService';
import { EmailNotificationService } from '../email/EmailNotificationService';
import { WhatsAppGroupNotificationService } from '../whatsapp/WhatsAppGroupNotificationService';
import { SeguimientoCompletoService } from '../seguimiento/SeguimientoCompletoService';
import { WASocket } from '@whiskeysockets/baileys';
import { config } from '../../config';

const prisma = getPrismaClient();

interface CrearCasoWhatsAppData {
  tipo?: 'garantia' | 'condominio';
  categoria?: string;
  descripcion: string;
  urgencia?: boolean;
  fotosRecibidas?: number;
  evidencias?: {
    imagenes: string[];
    videos: string[];
    audios: string[];
    documentos: string[];
  };
}

export class CasoService {
  private notificacionService: NotificacionService;
  private _calendarioService: CalendarioAsignacionService | null = null;
  private _emailService: EmailNotificationService | null = null;
  private _whatsappGroupService: WhatsAppGroupNotificationService | null = null;
  private _seguimientoService: SeguimientoCompletoService | null = null;

  constructor() {
    this.notificacionService = new NotificacionService();
    // No instanciar servicios con getInstance aquí para evitar circular dependency
  }

  // Lazy loading getters
  private get calendarioService(): CalendarioAsignacionService {
    if (!this._calendarioService) {
      this._calendarioService = CalendarioAsignacionService.getInstance();
    }
    return this._calendarioService;
  }

  private get emailService(): EmailNotificationService {
    if (!this._emailService) {
      this._emailService = EmailNotificationService.getInstance();
    }
    return this._emailService;
  }

  private get whatsappGroupService(): WhatsAppGroupNotificationService {
    if (!this._whatsappGroupService) {
      this._whatsappGroupService = WhatsAppGroupNotificationService.getInstance();
    }
    return this._whatsappGroupService;
  }

  private get seguimientoService(): SeguimientoCompletoService {
    if (!this._seguimientoService) {
      this._seguimientoService = SeguimientoCompletoService.getInstance();
    }
    return this._seguimientoService;
  }

  /**
   * Crear caso desde WhatsApp con asignación automática completa
   */
  public async crearDesdeWhatsApp(
    telefono: string,
    datos: CrearCasoWhatsAppData,
    whatsappSock?: WASocket
  ): Promise<any> {
    try {
      logger.info(`🆕 Iniciando creación de caso desde WhatsApp para ${telefono}`);

      // 1. Buscar o crear usuario
      let usuario = await this.buscarOCrearUsuarioPorTelefono(telefono);

      // Si no tiene condominio, asignar el primero disponible
      if (!usuario.condominioId) {
        const primerCondominio = await prisma.condominio.findFirst({
          where: { estado: 'activo' }
        });

        if (primerCondominio) {
          usuario = await prisma.usuario.update({
            where: { id: usuario.id },
            data: {
              condominioId: primerCondominio.id,
              unidad: 'Por asignar'
            }
          });
        } else {
          throw new AppError('No hay condominios disponibles en el sistema', 400);
        }
      }

      // 2. Generar número de caso
      const numeroCaso = await this.generarNumeroCaso();

      // 3. Mapear categoría
      const categoria = this.mapearCategoria(datos.categoria || 'otro');

      // 4. Determinar prioridad
      const prioridad = datos.urgencia ? PrioridadCaso.urgente : PrioridadCaso.media;

      // 5. Crear caso
      const caso = await prisma.caso.create({
        data: {
          numeroCaso,
          usuarioId: usuario.id,
          condominioId: usuario.condominioId,
          unidad: usuario.unidad || 'No especificada',
          tipo: (datos.tipo as TipoCaso) || TipoCaso.condominio,
          categoria,
          descripcion: datos.descripcion,
          estado: EstadoCaso.nuevo,
          prioridad,
        },
        include: {
          usuario: true,
          condominio: true,
        },
      });

      logger.info(`✅ Caso ${numeroCaso} creado`);

      // 6. Crear evento en timeline
      await this.crearEventoTimeline(caso.id, 'creado', 'Caso creado desde WhatsApp', {
        origen: 'whatsapp',
        telefono,
      });

      // 7. 🎯 ASIGNACIÓN AUTOMÁTICA DE INGENIERO Y CALENDARIO
      logger.info(`📅 Iniciando asignación automática para caso ${numeroCaso}`);

      try {
        // 7.1. Asignar slot automático (fecha, hora, ingeniero)
        const slotAsignado = await this.calendarioService.asignarSlotAutomatico(
          caso.id,
          prioridad
        );

        logger.info(
          `✅ Slot asignado - Fecha: ${slotAsignado.fecha.toISOString()}, Hora: ${
            slotAsignado.bloqueHorario.horaInicio
          } - ${slotAsignado.bloqueHorario.horaFin}`
        );

        // 7.2. Crear evento de visita programada
        await this.crearEventoTimeline(
          caso.id,
          'visita_programada',
          `Visita programada automáticamente para ${slotAsignado.fecha.toLocaleDateString()}`,
          {
            fecha: slotAsignado.fecha,
            horaInicio: slotAsignado.bloqueHorario.horaInicio,
            horaFin: slotAsignado.bloqueHorario.horaFin,
            tecnicoId: slotAsignado.tecnicoAsignado?.id,
          }
        );

        // 7.3. Si hay ingeniero asignado, enviar notificaciones
        if (slotAsignado.tecnicoAsignado) {
          logger.info(
            `👷 Ingeniero asignado: ${slotAsignado.tecnicoAsignado.nombreCompleto}`
          );

          // 7.3.1. 📧 Enviar email al ingeniero
          const emailExito = await this.emailService.enviarEmailAsignacionCaso({
            caso: {
              numeroCaso: caso.numeroCaso,
              descripcion: caso.descripcion,
              categoria: caso.categoria,
              prioridad: caso.prioridad,
              tipo: caso.tipo,
            },
            propietario: {
              nombreCompleto: usuario.nombreCompleto,
              unidad: usuario.unidad || 'No especificada',
              telefono: usuario.telefono,
            },
            condominio: {
              nombre: caso.condominio.nombre,
              direccion: caso.condominio.direccion || '',
            },
            cita: {
              fecha: slotAsignado.fecha,
              horaInicio: slotAsignado.bloqueHorario.horaInicio,
              horaFin: slotAsignado.bloqueHorario.horaFin,
            },
            ingeniero: {
              nombreCompleto: slotAsignado.tecnicoAsignado.nombreCompleto,
              email: slotAsignado.tecnicoAsignado.email,
            },
            evidencias: datos.evidencias
              ? {
                  imagenes: datos.evidencias.imagenes,
                  videos: datos.evidencias.videos,
                  audios: datos.evidencias.audios,
                  documentos: datos.evidencias.documentos,
                }
              : undefined,
          });

          if (emailExito) {
            logger.info(`✅ Email enviado al ingeniero`);
          } else {
            logger.warn(`⚠️  No se pudo enviar el email al ingeniero`);
          }

          // 7.3.2. 📱 Notificar al grupo de WhatsApp
          if (whatsappSock && config.whatsapp.groupJid) {
            const whatsappExito = await this.whatsappGroupService.notificarNuevoCaso(
              whatsappSock,
              config.whatsapp.groupJid,
              {
                caso: {
                  numeroCaso: caso.numeroCaso,
                  descripcion: caso.descripcion,
                  categoria: caso.categoria,
                  prioridad: caso.prioridad,
                  tipo: caso.tipo,
                },
                propietario: {
                  nombreCompleto: usuario.nombreCompleto,
                  unidad: usuario.unidad || 'No especificada',
                  telefono: usuario.telefono,
                },
                condominio: {
                  nombre: caso.condominio.nombre,
                  direccion: caso.condominio.direccion || '',
                },
                cita: {
                  fecha: slotAsignado.fecha,
                  horaInicio: slotAsignado.bloqueHorario.horaInicio,
                  horaFin: slotAsignado.bloqueHorario.horaFin,
                },
                ingeniero: {
                  nombreCompleto: slotAsignado.tecnicoAsignado.nombreCompleto,
                  telefono: slotAsignado.tecnicoAsignado.telefono,
                },
                evidencias: datos.evidencias
                  ? {
                      totalImagenes: datos.evidencias.imagenes.length,
                      totalVideos: datos.evidencias.videos.length,
                      totalAudios: datos.evidencias.audios.length,
                    }
                  : undefined,
              }
            );

            if (whatsappExito) {
              logger.info(`✅ Notificación enviada al grupo de WhatsApp`);
            } else {
              logger.warn(`⚠️  No se pudo enviar notificación al grupo de WhatsApp`);
            }

            // 7.3.3. Si es urgente, enviar notificación urgente adicional
            if (prioridad === PrioridadCaso.urgente) {
              await this.whatsappGroupService.notificarCasoUrgente(
                whatsappSock,
                config.whatsapp.groupJid,
                {
                  caso: {
                    numeroCaso: caso.numeroCaso,
                    descripcion: caso.descripcion,
                    categoria: caso.categoria,
                    prioridad: caso.prioridad,
                    tipo: caso.tipo,
                  },
                  propietario: {
                    nombreCompleto: usuario.nombreCompleto,
                    unidad: usuario.unidad || 'No especificada',
                    telefono: usuario.telefono,
                  },
                  condominio: {
                    nombre: caso.condominio.nombre,
                    direccion: caso.condominio.direccion || '',
                  },
                  cita: {
                    fecha: slotAsignado.fecha,
                    horaInicio: slotAsignado.bloqueHorario.horaInicio,
                    horaFin: slotAsignado.bloqueHorario.horaFin,
                  },
                  ingeniero: {
                    nombreCompleto: slotAsignado.tecnicoAsignado.nombreCompleto,
                    telefono: slotAsignado.tecnicoAsignado.telefono,
                  },
                }
              );

              logger.info(`🚨 Notificación urgente enviada`);
            }
          } else {
            logger.warn(
              `⚠️  WhatsApp socket no disponible o groupJid no configurado - notificación grupal omitida`
            );
          }

          // 7.4. 📱 ENVIAR WHATSAPP DIRECTO AL TÉCNICO (NUEVO)
          logger.info(`📱 Enviando WhatsApp directo al técnico ${slotAsignado.tecnicoAsignado.nombreCompleto}...`);
          // TODO: Implementar notificarTecnicoPorWhatsApp
          const whatsappTecnico = null; // await this.seguimientoService.notificarTecnicoPorWhatsApp(caso.id, slotAsignado.tecnicoAsignado.id);

          if (whatsappTecnico) {
            logger.info(`✅ WhatsApp enviado al técnico exitosamente`);
          } else {
            logger.warn(`⚠️  No se pudo enviar WhatsApp al técnico`);
          }
        }
      } catch (asignacionError) {
        logger.error('❌ Error en asignación automática:', asignacionError);
        // El caso fue creado exitosamente, pero la asignación falló
        // No hacemos throw para que el caso no se pierda
      }

      // 8. Notificación general (opcional)
      await this.notificacionService.notificarNuevoCaso(caso);

      logger.info(`✅ Caso ${numeroCaso} creado y procesado exitosamente`);

      return caso;
    } catch (error) {
      logger.error('❌ Error al crear caso desde WhatsApp:', error);
      throw error;
    }
  }

  /**
   * Buscar o crear usuario por teléfono
   */
  private async buscarOCrearUsuarioPorTelefono(telefono: string): Promise<any> {
    let usuario = await prisma.usuario.findUnique({
      where: { telefono },
    });

    if (!usuario) {
      // Crear usuario temporal (pendiente de validación)
      usuario = await prisma.usuario.create({
        data: {
          nombreCompleto: `Usuario ${telefono}`,
          telefono,
          tipoUsuario: 'propietario',
          estado: 'pendiente',
        },
      });

      logger.info(`📝 Usuario temporal creado para ${telefono}`);
    }

    return usuario;
  }

  /**
   * Generar número de caso único
   */
  private async generarNumeroCaso(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.caso.count();
    const numero = (count + 1).toString().padStart(4, '0');

    return `AMC-${year}-${numero}`;
  }

  /**
   * Mapear categoría string a enum
   */
  private mapearCategoria(categoria: string): CategoriaCaso {
    const mapeo: Record<string, CategoriaCaso> = {
      'filtraciones': CategoriaCaso.filtraciones_humedad,
      'humedad': CategoriaCaso.filtraciones_humedad,
      'electrico': CategoriaCaso.problemas_electricos,
      'electricidad': CategoriaCaso.problemas_electricos,
      'plomeria': CategoriaCaso.plomeria,
      'agua': CategoriaCaso.plomeria,
      'puertas': CategoriaCaso.puertas_ventanas,
      'ventanas': CategoriaCaso.puertas_ventanas,
      'pisos': CategoriaCaso.pisos_paredes_techo,
      'paredes': CategoriaCaso.pisos_paredes_techo,
      'techo': CategoriaCaso.pisos_paredes_techo,
      'aire': CategoriaCaso.aires_acondicionados,
      'aires': CategoriaCaso.aires_acondicionados,
      'areas comunes': CategoriaCaso.areas_comunes,
      'seguridad': CategoriaCaso.seguridad,
      'limpieza': CategoriaCaso.limpieza,
    };

    const categoriaLower = categoria.toLowerCase();

    for (const [key, value] of Object.entries(mapeo)) {
      if (categoriaLower.includes(key)) {
        return value;
      }
    }

    return CategoriaCaso.otro;
  }

  /**
   * Crear evento en timeline
   */
  private async crearEventoTimeline(
    casoId: string,
    tipoEvento: string,
    descripcion: string,
    metadata?: any
  ): Promise<void> {
    await prisma.timelineEvento.create({
      data: {
        casoId,
        tipoEvento: tipoEvento as any,
        titulo: this.getTituloEvento(tipoEvento),
        descripcion,
        metadata,
      },
    });
  }

  /**
   * Obtener título del evento
   */
  private getTituloEvento(tipo: string): string {
    const titulos: Record<string, string> = {
      creado: 'Caso Creado',
      asignado: 'Caso Asignado',
      reasignado: 'Caso Reasignado',
      estado_cambiado: 'Estado Actualizado',
      visita_programada: 'Visita Programada',
      visita_completada: 'Visita Completada',
      diagnostico_enviado: 'Diagnóstico Enviado',
      reparacion_programada: 'Reparación Programada',
      reparacion_completada: 'Reparación Completada',
      cerrado: 'Caso Cerrado',
      reabierto: 'Caso Reabierto',
    };

    return titulos[tipo] || 'Evento';
  }

  /**
   * Asignar técnico automáticamente
   */
  private async asignarTecnicoAutomaticamente(casoId: string): Promise<void> {
    try {
      // Buscar técnicos disponibles
      const tecnicos = await prisma.usuario.findMany({
        where: {
          tipoUsuario: 'tecnico',
          estado: 'activo',
        },
        include: {
          casosAsignados: {
            where: {
              estado: {
                in: [EstadoCaso.nuevo, EstadoCaso.asignado, EstadoCaso.en_proceso],
              },
            },
          },
        },
      });

      if (tecnicos.length === 0) {
        logger.warn('⚠️  No hay técnicos disponibles');
        return;
      }

      // Asignar al técnico con menos casos activos
      const tecnicoOptimo = tecnicos.reduce((prev, current) =>
        prev.casosAsignados.length < current.casosAsignados.length ? prev : current
      );

      await this.asignarTecnico(casoId, tecnicoOptimo.id);

      logger.info(`✅ Caso ${casoId} asignado automáticamente a ${tecnicoOptimo.nombreCompleto}`);
    } catch (error) {
      logger.error('❌ Error al asignar técnico automáticamente:', error);
    }
  }

  /**
   * Asignar técnico manualmente
   */
  public async asignarTecnico(casoId: string, tecnicoId: string): Promise<void> {
    const caso = await prisma.caso.findUnique({
      where: { id: casoId },
    });

    if (!caso) {
      throw new AppError('Caso no encontrado', 404);
    }

    await prisma.caso.update({
      where: { id: casoId },
      data: {
        tecnicoAsignadoId: tecnicoId,
        fechaAsignacion: new Date(),
        estado: EstadoCaso.asignado,
      },
    });

    await this.crearEventoTimeline(casoId, 'asignado', 'Caso asignado a técnico', {
      tecnicoId,
    });

    // Notificar al técnico
    await this.notificacionService.notificarCasoAsignado(casoId, tecnicoId);
  }

  /**
   * Actualizar estado del caso
   */
  public async actualizarEstado(
    casoId: string,
    nuevoEstado: EstadoCaso,
    notas?: string
  ): Promise<void> {
    const caso = await prisma.caso.update({
      where: { id: casoId },
      data: {
        estado: nuevoEstado,
        ...(nuevoEstado === EstadoCaso.resuelto && {
          fechaResolucion: new Date(),
        }),
        ...(nuevoEstado === EstadoCaso.cerrado && {
          fechaCierre: new Date(),
        }),
      },
    });

    await this.crearEventoTimeline(casoId, 'estado_cambiado', `Estado cambiado a: ${nuevoEstado}`, {
      estadoAnterior: caso.estado,
      estadoNuevo: nuevoEstado,
      notas,
    });

    // Notificar al usuario
    await this.notificacionService.notificarCambioEstado(casoId, nuevoEstado);
  }

  /**
   * Programar visita
   */
  public async programarVisita(
    casoId: string,
    fechaVisita: Date,
    notas?: string
  ): Promise<void> {
    await prisma.caso.update({
      where: { id: casoId },
      data: {
        fechaVisita,
        estado: EstadoCaso.en_visita,
      },
    });

    await this.crearEventoTimeline(casoId, 'visita_programada', 'Visita técnica programada', {
      fechaVisita,
      notas,
    });

    // Notificar al usuario
    await this.notificacionService.notificarVisitaProgramada(casoId, fechaVisita);
  }

  /**
   * Agregar diagnóstico
   */
  public async agregarDiagnostico(
    casoId: string,
    diagnostico: string,
    tiempoEstimado?: string
  ): Promise<void> {
    await prisma.caso.update({
      where: { id: casoId },
      data: {
        diagnostico,
        tiempoEstimado,
      },
    });

    await this.crearEventoTimeline(casoId, 'diagnostico_enviado', diagnostico, {
      tiempoEstimado,
    });
  }

  /**
   * Obtener casos por filtros
   */
  public async obtenerCasos(filtros: any = {}): Promise<any[]> {
    return prisma.caso.findMany({
      where: filtros,
      include: {
        usuario: true,
        condominio: true,
        tecnicoAsignado: true,
        adjuntos: true,
      },
      orderBy: {
        fechaCreacion: 'desc',
      },
    });
  }

  /**
   * Obtener caso por ID
   */
  public async obtenerCasoPorId(casoId: string): Promise<any> {
    const caso = await prisma.caso.findUnique({
      where: { id: casoId },
      include: {
        usuario: true,
        condominio: true,
        tecnicoAsignado: true,
        adjuntos: true,
        timelineEventos: {
          orderBy: { fecha: 'desc' },
        },
        transferencias: true,
      },
    });

    if (!caso) {
      throw new AppError('Caso no encontrado', 404);
    }

    return caso;
  }

  /**
   * Calcular SLA
   */
  public async calcularSLA(casoId: string): Promise<any> {
    const caso = await prisma.caso.findUnique({
      where: { id: casoId },
      include: { condominio: true },
    });

    if (!caso) {
      throw new AppError('Caso no encontrado', 404);
    }

    const slaHoras =
      caso.prioridad === PrioridadCaso.urgente
        ? 4
        : caso.tipo === TipoCaso.garantia
        ? caso.condominio.slaGarantia
        : caso.condominio.slaCondominio;

    const fechaLimite = new Date(caso.fechaCreacion);
    fechaLimite.setHours(fechaLimite.getHours() + slaHoras);

    const ahora = new Date();
    const horasTranscurridas = Math.floor(
      (ahora.getTime() - caso.fechaCreacion.getTime()) / (1000 * 60 * 60)
    );

    const slaViolado = ahora > fechaLimite && caso.estado !== EstadoCaso.cerrado;

    return {
      slaHoras,
      fechaLimite,
      horasTranscurridas,
      slaViolado,
      porcentajeTranscurrido: (horasTranscurridas / slaHoras) * 100,
    };
  }
}
