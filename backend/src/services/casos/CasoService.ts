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

const prisma = getPrismaClient();

interface CrearCasoWhatsAppData {
  tipo?: 'garantia' | 'condominio';
  categoria?: string;
  descripcion: string;
  urgencia?: boolean;
  fotosRecibidas?: number;
}

export class CasoService {
  private notificacionService: NotificacionService;

  constructor() {
    this.notificacionService = new NotificacionService();
  }

  /**
   * Crear caso desde WhatsApp
   */
  public async crearDesdeWhatsApp(
    telefono: string,
    datos: CrearCasoWhatsAppData
  ): Promise<any> {
    try {
      // 1. Buscar o crear usuario
      const usuario = await this.buscarOCrearUsuarioPorTelefono(telefono);

      if (!usuario.condominioId) {
        throw new AppError('Usuario no tiene condominio asignado', 400);
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

      // 6. Crear evento en timeline
      await this.crearEventoTimeline(caso.id, 'creado', 'Caso creado desde WhatsApp', {
        origen: 'whatsapp',
        telefono,
      });

      // 7. Asignar técnico automáticamente si está habilitado
      if (prioridad === PrioridadCaso.urgente) {
        await this.asignarTecnicoAutomaticamente(caso.id);
      }

      // 8. Notificar
      await this.notificacionService.notificarNuevoCaso(caso);

      logger.info(`✅ Caso ${numeroCaso} creado exitosamente`);

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
