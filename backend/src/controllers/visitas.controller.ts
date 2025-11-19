/**
 * ========================================
 * CONTROLADOR DE VISITAS
 * ========================================
 * Sistema de control de visitas para garita de seguridad
 */

import { Request, Response } from 'express';
import { getPrismaClient } from '../config/database/postgres';
import { asyncHandler } from '../middleware/errorHandler';
import { AppError } from '../middleware/errorHandler';
import { EstadoVisita } from '@prisma/client';

const prisma = getPrismaClient();

/**
 * Obtener visitas con filtros
 * GET /api/visitas?condominioId=xxx&estado=xxx&fecha=2024-12-01&tipo=xxx
 */
export const obtenerVisitas = asyncHandler(async (req: Request, res: Response) => {
  const { condominioId, unidadId, estado, fecha, tipo, search } = req.query;

  const whereClause: any = {};

  // Filtro por condominio
  if (condominioId) {
    whereClause.condominioId = condominioId as string;
  }

  // Filtro por unidad
  if (unidadId) {
    whereClause.unidadId = unidadId as string;
  }

  // Filtro por estado
  if (estado) {
    whereClause.estado = estado;
  }

  // Filtro por tipo
  if (tipo) {
    whereClause.tipo = tipo;
  }

  // Filtro por fecha
  if (fecha) {
    const fechaInicio = new Date(fecha as string);
    const fechaFin = new Date(fechaInicio);
    fechaFin.setDate(fechaFin.getDate() + 1);

    whereClause.OR = [
      {
        fechaHoraLlegada: {
          gte: fechaInicio,
          lt: fechaFin,
        },
      },
      {
        fechaEsperada: {
          gte: fechaInicio,
          lt: fechaFin,
        },
      },
    ];
  }

  // Búsqueda por nombre o cédula
  if (search) {
    whereClause.OR = [
      { nombreVisitante: { contains: search as string, mode: 'insensitive' } },
      { cedula: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  const visitas = await prisma.visita.findMany({
    where: whereClause,
    include: {
      condominio: {
        select: {
          id: true,
          nombre: true,
        },
      },
      unidad: {
        select: {
          id: true,
          numero: true,
          edificio: true,
        },
      },
      vehiculo: {
        select: {
          id: true,
          tipo: true,
          marca: true,
          modelo: true,
          placa: true,
        },
      },
      visitaFrecuente: {
        select: {
          id: true,
          nombreCompleto: true,
          relacion: true,
        },
      },
    },
    orderBy: {
      fechaRegistro: 'desc',
    },
  });

  res.json({
    success: true,
    count: visitas.length,
    data: visitas,
  });
});

/**
 * Obtener visita por ID
 * GET /api/visitas/:id
 */
export const obtenerVisitaById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const visita = await prisma.visita.findUnique({
    where: { id },
    include: {
      condominio: true,
      unidad: true,
      vehiculo: true,
      visitaFrecuente: true,
    },
  });

  if (!visita) {
    throw new AppError('Visita no encontrada', 404);
  }

  res.json({
    success: true,
    data: visita,
  });
});

/**
 * Registrar nueva visita (llegada a garita)
 * POST /api/visitas
 */
export const registrarVisita = asyncHandler(async (req: Request, res: Response) => {
  const {
    condominioId,
    unidadId,
    nombreVisitante,
    cedula,
    telefono,
    vehiculoId,
    tipo,
    fotoVisitante,
    fotoVehiculo,
    observaciones,
    registradoPor,
    visitaFrecuenteId,
  } = req.body;

  // Validaciones
  if (!condominioId || !unidadId || !nombreVisitante || !tipo || !registradoPor) {
    throw new AppError('Faltan campos requeridos', 400);
  }

  // Si es visita frecuente, obtener datos pre-autorizados
  let estadoInicial: EstadoVisita = EstadoVisita.en_espera;
  let autorizadoPor = null;
  let fechaAutorizacion = null;

  if (visitaFrecuenteId) {
    const visitaFrecuente = await prisma.visitaFrecuente.findUnique({
      where: { id: visitaFrecuenteId },
    });

    if (visitaFrecuente && visitaFrecuente.autorizacionActiva) {
      // Verificar si está dentro de los días y horarios autorizados
      const diaActual = new Date().toLocaleDateString('es', { weekday: 'long' });
      const horaActual = new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });

      const diasAutorizados = visitaFrecuente.diasAutorizados as any;
      const horarioAutorizado = visitaFrecuente.horarioAutorizado as any;

      if (
        diasAutorizados &&
        Array.isArray(diasAutorizados) &&
        diasAutorizados.includes(diaActual) &&
        horarioAutorizado
      ) {
        estadoInicial = EstadoVisita.autorizada;
        autorizadoPor = 'Sistema (Visita Frecuente Pre-autorizada)';
        fechaAutorizacion = new Date();
      }
    }
  }

  // Crear visita
  const visita = await prisma.visita.create({
    data: {
      condominioId,
      unidadId,
      nombreVisitante,
      cedula,
      telefono,
      vehiculoId,
      tipo,
      estado: estadoInicial,
      fechaHoraLlegada: new Date(),
      autorizadoPor,
      fechaAutorizacion,
      fotoVisitante,
      fotoVehiculo,
      observaciones,
      registradoPor,
      visitaFrecuenteId,
    },
    include: {
      condominio: true,
      unidad: true,
      vehiculo: true,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Visita registrada exitosamente',
    data: visita,
    notificarResidente: estadoInicial === 'en_espera', // Si está en espera, notificar al residente
  });
});

/**
 * Autorizar visita (residente autoriza)
 * PUT /api/visitas/:id/autorizar
 */
export const autorizarVisita = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { autorizadoPor } = req.body;

  if (!autorizadoPor) {
    throw new AppError('autorizadoPor es requerido', 400);
  }

  // Verificar que la visita existe
  const visitaExistente = await prisma.visita.findUnique({
    where: { id },
  });

  if (!visitaExistente) {
    throw new AppError('Visita no encontrada', 404);
  }

  // Solo se pueden autorizar visitas en espera
  if (visitaExistente.estado !== 'en_espera' && visitaExistente.estado !== 'esperada') {
    throw new AppError('Solo se pueden autorizar visitas en espera o esperadas', 400);
  }

  const visita = await prisma.visita.update({
    where: { id },
    data: {
      estado: 'autorizada',
      autorizadoPor,
      fechaAutorizacion: new Date(),
    },
    include: {
      condominio: true,
      unidad: true,
    },
  });

  res.json({
    success: true,
    message: 'Visita autorizada exitosamente',
    data: visita,
  });
});

/**
 * Rechazar visita
 * PUT /api/visitas/:id/rechazar
 */
export const rechazarVisita = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { motivoRechazo, autorizadoPor } = req.body;

  if (!autorizadoPor) {
    throw new AppError('autorizadoPor es requerido', 400);
  }

  // Verificar que la visita existe
  const visitaExistente = await prisma.visita.findUnique({
    where: { id },
  });

  if (!visitaExistente) {
    throw new AppError('Visita no encontrada', 404);
  }

  // Solo se pueden rechazar visitas en espera
  if (visitaExistente.estado !== 'en_espera' && visitaExistente.estado !== 'esperada') {
    throw new AppError('Solo se pueden rechazar visitas en espera o esperadas', 400);
  }

  const visita = await prisma.visita.update({
    where: { id },
    data: {
      estado: 'rechazada',
      motivoRechazo,
      autorizadoPor,
      fechaAutorizacion: new Date(),
    },
  });

  res.json({
    success: true,
    message: 'Visita rechazada',
    data: visita,
  });
});

/**
 * Registrar salida de visita
 * PUT /api/visitas/:id/salida
 */
export const registrarSalida = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { observaciones } = req.body;

  // Verificar que la visita existe
  const visitaExistente = await prisma.visita.findUnique({
    where: { id },
  });

  if (!visitaExistente) {
    throw new AppError('Visita no encontrada', 404);
  }

  // Solo se puede registrar salida de visitas autorizadas o ingresadas
  if (visitaExistente.estado !== 'autorizada' && visitaExistente.estado !== 'ingresada') {
    throw new AppError('Solo se puede registrar salida de visitas autorizadas o ingresadas', 400);
  }

  const visita = await prisma.visita.update({
    where: { id },
    data: {
      estado: 'salida_registrada',
      fechaHoraSalida: new Date(),
      observaciones: observaciones || visitaExistente.observaciones,
    },
  });

  // Calcular tiempo de permanencia
  const tiempoPermanencia = visitaExistente.fechaHoraLlegada
    ? Math.floor(
        (new Date().getTime() - visitaExistente.fechaHoraLlegada.getTime()) / (1000 * 60)
      )
    : 0;

  res.json({
    success: true,
    message: 'Salida registrada exitosamente',
    data: visita,
    tiempoPermanenciaMinutos: tiempoPermanencia,
  });
});

/**
 * Obtener estadísticas de visitas
 * GET /api/visitas/estadisticas?condominioId=xxx&fecha=2024-12-01
 */
export const obtenerEstadisticasVisitas = asyncHandler(async (req: Request, res: Response) => {
  const { condominioId, fecha, mes } = req.query;

  if (!condominioId) {
    throw new AppError('condominioId es requerido', 400);
  }

  const whereClause: any = {
    condominioId: condominioId as string,
  };

  // Filtro por fecha específica
  if (fecha) {
    const fechaInicio = new Date(fecha as string);
    const fechaFin = new Date(fechaInicio);
    fechaFin.setDate(fechaFin.getDate() + 1);

    whereClause.fechaHoraLlegada = {
      gte: fechaInicio,
      lt: fechaFin,
    };
  }

  // Filtro por mes
  if (mes) {
    const [year, month] = (mes as string).split('-');
    const startDate = new Date(`${year}-${month}-01`);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

    whereClause.fechaHoraLlegada = {
      gte: startDate,
      lte: endDate,
    };
  }

  // Total de visitas
  const totalVisitas = await prisma.visita.count({ where: whereClause });

  // Visitas por estado
  const visitasPorEstado = await prisma.visita.groupBy({
    by: ['estado'],
    where: whereClause,
    _count: true,
  });

  // Visitas por tipo
  const visitasPorTipo = await prisma.visita.groupBy({
    by: ['tipo'],
    where: whereClause,
    _count: true,
  });

  // Visitas por unidad (top 10)
  const visitasPorUnidad = await prisma.visita.groupBy({
    by: ['unidadId'],
    where: whereClause,
    _count: true,
    orderBy: {
      _count: {
        unidadId: 'desc',
      },
    },
    take: 10,
  });

  // Obtener información de las unidades
  const unidadesIds = visitasPorUnidad.map(v => v.unidadId);
  const unidades = await prisma.unidad.findMany({
    where: {
      id: { in: unidadesIds },
    },
    select: {
      id: true,
      numero: true,
      edificio: true,
    },
  });

  const visitasPorUnidadConInfo = visitasPorUnidad.map(v => ({
    ...v,
    unidad: unidades.find(u => u.id === v.unidadId),
  }));

  // Visitas rechazadas
  const visitasRechazadas = await prisma.visita.count({
    where: { ...whereClause, estado: 'rechazada' },
  });

  // Visitas en espera (actualmente)
  const visitasEnEspera = await prisma.visita.count({
    where: {
      condominioId: condominioId as string,
      estado: 'en_espera',
    },
  });

  // Visitas dentro del condominio (actualmente)
  const visitasDentro = await prisma.visita.count({
    where: {
      condominioId: condominioId as string,
      estado: {
        in: ['autorizada', 'ingresada'],
      },
    },
  });

  res.json({
    success: true,
    data: {
      totalVisitas,
      visitasPorEstado,
      visitasPorTipo,
      visitasPorUnidad: visitasPorUnidadConInfo,
      visitasRechazadas,
      estadoActual: {
        enEspera: visitasEnEspera,
        dentroCondominio: visitasDentro,
      },
    },
  });
});
