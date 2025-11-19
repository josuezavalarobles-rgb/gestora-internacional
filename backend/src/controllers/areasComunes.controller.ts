/**
 * ========================================
 * CONTROLADOR DE ÁREAS COMUNES
 * ========================================
 * Gestión de áreas comunes y reservas con validación de disponibilidad
 */

import { Request, Response } from 'express';
import { getPrismaClient } from '../config/database/postgres';
import { asyncHandler } from '../middleware/errorHandler';
import { AppError } from '../middleware/errorHandler';

const prisma = getPrismaClient();

/**
 * Obtener áreas comunes con disponibilidad
 * GET /api/areas-comunes?condominioId=xxx&estado=disponible
 */
export const obtenerAreasComunes = asyncHandler(async (req: Request, res: Response) => {
  const { condominioId, tipo, estado, requiereReserva } = req.query;

  if (!condominioId) {
    throw new AppError('condominioId es requerido', 400);
  }

  const whereClause: any = {
    condominioId: condominioId as string,
  };

  // Filtro por tipo
  if (tipo) {
    whereClause.tipo = tipo;
  }

  // Filtro por estado
  if (estado) {
    whereClause.estado = estado;
  }

  // Filtro por requiere reserva
  if (requiereReserva !== undefined) {
    whereClause.requiereReserva = requiereReserva === 'true';
  }

  const areas = await prisma.areaComun.findMany({
    where: whereClause,
    include: {
      condominio: {
        select: {
          id: true,
          nombre: true,
        },
      },
      _count: {
        select: {
          reservas: true,
        },
      },
    },
    orderBy: {
      nombre: 'asc',
    },
  });

  res.json({
    success: true,
    count: areas.length,
    data: areas,
  });
});

/**
 * Obtener área común por ID
 * GET /api/areas-comunes/:id
 */
export const obtenerAreaById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const area = await prisma.areaComun.findUnique({
    where: { id },
    include: {
      condominio: true,
      reservas: {
        where: {
          estado: {
            in: ['pendiente', 'confirmada'],
          },
          fechaReserva: {
            gte: new Date(),
          },
        },
        orderBy: {
          fechaReserva: 'asc',
        },
        include: {
          unidad: {
            select: {
              id: true,
              numero: true,
              edificio: true,
            },
          },
        },
      },
      _count: {
        select: {
          reservas: true,
        },
      },
    },
  });

  if (!area) {
    throw new AppError('Área común no encontrada', 404);
  }

  res.json({
    success: true,
    data: area,
  });
});

/**
 * Crear área común
 * POST /api/areas-comunes
 */
export const crearArea = asyncHandler(async (req: Request, res: Response) => {
  const {
    condominioId,
    nombre,
    tipo,
    descripcion,
    ubicacion,
    capacidad,
    metrosCuadrados,
    equipamiento,
    requiereReserva,
    horaApertura,
    horaCierre,
    diasDisponibles,
    costoReserva,
    requiereDeposito,
    montoDeposito,
    tiempoMaximoReserva,
    anticipacionMinima,
    fotos,
  } = req.body;

  // Validaciones
  if (!condominioId || !nombre || !tipo) {
    throw new AppError('Faltan campos requeridos: condominioId, nombre, tipo', 400);
  }

  const area = await prisma.areaComun.create({
    data: {
      condominioId,
      nombre,
      tipo,
      descripcion,
      ubicacion,
      capacidad: capacidad ? parseInt(capacidad) : null,
      metrosCuadrados: metrosCuadrados ? parseFloat(metrosCuadrados) : null,
      equipamiento,
      estado: 'disponible',
      requiereReserva: requiereReserva !== false,
      horaApertura,
      horaCierre,
      diasDisponibles,
      costoReserva: costoReserva ? parseFloat(costoReserva) : null,
      requiereDeposito: requiereDeposito === true,
      montoDeposito: montoDeposito ? parseFloat(montoDeposito) : null,
      tiempoMaximoReserva: tiempoMaximoReserva ? parseInt(tiempoMaximoReserva) : null,
      anticipacionMinima: anticipacionMinima ? parseInt(anticipacionMinima) : null,
      fotos,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Área común creada exitosamente',
    data: area,
  });
});

/**
 * Actualizar área común
 * PUT /api/areas-comunes/:id
 */
export const actualizarArea = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    nombre,
    tipo,
    descripcion,
    ubicacion,
    capacidad,
    metrosCuadrados,
    equipamiento,
    estado,
    requiereReserva,
    horaApertura,
    horaCierre,
    diasDisponibles,
    costoReserva,
    requiereDeposito,
    montoDeposito,
    tiempoMaximoReserva,
    anticipacionMinima,
    fotos,
  } = req.body;

  // Verificar que el área existe
  const areaExistente = await prisma.areaComun.findUnique({
    where: { id },
  });

  if (!areaExistente) {
    throw new AppError('Área común no encontrada', 404);
  }

  const area = await prisma.areaComun.update({
    where: { id },
    data: {
      nombre,
      tipo,
      descripcion,
      ubicacion,
      capacidad: capacidad ? parseInt(capacidad) : undefined,
      metrosCuadrados: metrosCuadrados ? parseFloat(metrosCuadrados) : undefined,
      equipamiento,
      estado,
      requiereReserva,
      horaApertura,
      horaCierre,
      diasDisponibles,
      costoReserva: costoReserva !== undefined ? parseFloat(costoReserva) : undefined,
      requiereDeposito,
      montoDeposito: montoDeposito !== undefined ? parseFloat(montoDeposito) : undefined,
      tiempoMaximoReserva: tiempoMaximoReserva ? parseInt(tiempoMaximoReserva) : undefined,
      anticipacionMinima: anticipacionMinima ? parseInt(anticipacionMinima) : undefined,
      fotos,
    },
  });

  res.json({
    success: true,
    message: 'Área común actualizada exitosamente',
    data: area,
  });
});

/**
 * Obtener reservas con calendario
 * GET /api/areas-comunes/:id/reservas?fecha=2024-12-01
 */
export const obtenerReservas = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { fecha, mes } = req.query;

  const whereClause: any = {
    areaId: id,
    estado: {
      in: ['pendiente', 'confirmada'],
    },
  };

  // Filtro por fecha específica
  if (fecha) {
    const fechaReserva = new Date(fecha as string);
    whereClause.fechaReserva = fechaReserva;
  }

  // Filtro por mes completo
  if (mes) {
    const [year, month] = (mes as string).split('-');
    const startDate = new Date(`${year}-${month}-01`);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

    whereClause.fechaReserva = {
      gte: startDate,
      lte: endDate,
    };
  }

  const reservas = await prisma.reservaArea.findMany({
    where: whereClause,
    include: {
      area: {
        select: {
          id: true,
          nombre: true,
          tipo: true,
        },
      },
      unidad: {
        select: {
          id: true,
          numero: true,
          edificio: true,
        },
      },
    },
    orderBy: [
      { fechaReserva: 'asc' },
      { horaInicio: 'asc' },
    ],
  });

  res.json({
    success: true,
    count: reservas.length,
    data: reservas,
  });
});

/**
 * Validar disponibilidad de área
 */
const validarDisponibilidad = async (
  areaId: string,
  fechaReserva: Date,
  horaInicio: string,
  horaFin: string,
  reservaIdExcluir?: string
) => {
  // Buscar reservas confirmadas o pendientes en la misma fecha y horario
  const reservasConflicto = await prisma.reservaArea.findMany({
    where: {
      areaId,
      fechaReserva,
      estado: {
        in: ['pendiente', 'confirmada'],
      },
      ...(reservaIdExcluir && { id: { not: reservaIdExcluir } }),
      OR: [
        // La nueva reserva inicia durante una reserva existente
        {
          AND: [
            { horaInicio: { lte: horaInicio } },
            { horaFin: { gt: horaInicio } },
          ],
        },
        // La nueva reserva termina durante una reserva existente
        {
          AND: [
            { horaInicio: { lt: horaFin } },
            { horaFin: { gte: horaFin } },
          ],
        },
        // La nueva reserva contiene completamente una reserva existente
        {
          AND: [
            { horaInicio: { gte: horaInicio } },
            { horaFin: { lte: horaFin } },
          ],
        },
      ],
    },
  });

  return reservasConflicto.length === 0;
};

/**
 * Crear reserva con validación de disponibilidad
 * POST /api/areas-comunes/:id/reservas
 */
export const crearReserva = asyncHandler(async (req: Request, res: Response) => {
  const { id: areaId } = req.params;
  const {
    unidadId,
    usuarioId,
    fechaReserva,
    horaInicio,
    horaFin,
    numeroPersonas,
    tipoEvento,
    notas,
  } = req.body;

  // Validaciones
  if (!unidadId || !usuarioId || !fechaReserva || !horaInicio || !horaFin) {
    throw new AppError('Faltan campos requeridos', 400);
  }

  // Verificar que el área existe y está disponible
  const area = await prisma.areaComun.findUnique({
    where: { id: areaId },
  });

  if (!area) {
    throw new AppError('Área común no encontrada', 404);
  }

  if (area.estado !== 'disponible') {
    throw new AppError('El área no está disponible para reservas', 400);
  }

  // Validar disponibilidad
  const fechaReservaDate = new Date(fechaReserva);
  const disponible = await validarDisponibilidad(areaId, fechaReservaDate, horaInicio, horaFin);

  if (!disponible) {
    throw new AppError('El área no está disponible en el horario solicitado', 400);
  }

  // Validar anticipación mínima
  if (area.anticipacionMinima) {
    const diasAnticipacion = Math.floor(
      (fechaReservaDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diasAnticipacion < area.anticipacionMinima) {
      throw new AppError(
        `Se requiere una anticipación mínima de ${area.anticipacionMinima} días`,
        400
      );
    }
  }

  // Crear reserva
  const reserva = await prisma.reservaArea.create({
    data: {
      areaId,
      unidadId,
      usuarioId,
      fechaReserva: fechaReservaDate,
      horaInicio,
      horaFin,
      numeroPersonas: numeroPersonas ? parseInt(numeroPersonas) : null,
      tipoEvento,
      estado: 'pendiente',
      costoReserva: area.costoReserva,
      depositoPagado: area.requiereDeposito ? area.montoDeposito : null,
      notas,
    },
    include: {
      area: true,
      unidad: true,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Reserva creada exitosamente',
    data: reserva,
  });
});

/**
 * Cancelar reserva
 * PUT /api/areas-comunes/reservas/:id/cancelar
 */
export const cancelarReserva = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { motivoCancelacion, canceladoPor } = req.body;

  // Verificar que la reserva existe
  const reservaExistente = await prisma.reservaArea.findUnique({
    where: { id },
  });

  if (!reservaExistente) {
    throw new AppError('Reserva no encontrada', 404);
  }

  // No permitir cancelar reservas ya completadas
  if (reservaExistente.estado === 'completada') {
    throw new AppError('No se puede cancelar una reserva completada', 400);
  }

  const reserva = await prisma.reservaArea.update({
    where: { id },
    data: {
      estado: 'cancelada',
      motivoCancelacion,
      canceladoPor,
    },
  });

  res.json({
    success: true,
    message: 'Reserva cancelada exitosamente',
    data: reserva,
  });
});
