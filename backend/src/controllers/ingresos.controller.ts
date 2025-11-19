/**
 * ========================================
 * CONTROLADOR DE INGRESOS
 * ========================================
 * Gestión de ingresos con recibos automáticos
 */

import { Request, Response } from 'express';
import { getPrismaClient } from '../config/database/postgres';
import { asyncHandler } from '../middleware/errorHandler';
import { AppError } from '../middleware/errorHandler';

const prisma = getPrismaClient();

/**
 * Obtener ingresos con filtros
 * GET /api/ingresos?condominioId=xxx&tipo=xxx&cobrado=true&mes=2024-12
 */
export const obtenerIngresos = asyncHandler(async (req: Request, res: Response) => {
  const { condominioId, tipo, cobrado, mes, unidadId, search } = req.query;

  const whereClause: any = {};

  // Filtro por condominio
  if (condominioId) {
    whereClause.condominioId = condominioId as string;
  }

  // Filtro por tipo de ingreso
  if (tipo) {
    whereClause.tipo = tipo;
  }

  // Filtro por estado de cobro
  if (cobrado !== undefined) {
    whereClause.cobrado = cobrado === 'true';
  }

  // Filtro por unidad
  if (unidadId) {
    whereClause.unidadId = unidadId as string;
  }

  // Filtro por mes
  if (mes) {
    const [year, month] = (mes as string).split('-');
    const startDate = new Date(`${year}-${month}-01`);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

    whereClause.fechaEmision = {
      gte: startDate,
      lte: endDate,
    };
  }

  // Búsqueda por concepto o número de recibo
  if (search) {
    whereClause.OR = [
      { concepto: { contains: search as string, mode: 'insensitive' } },
      { numeroRecibo: { contains: search as string, mode: 'insensitive' } },
      { ncf: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  const ingresos = await prisma.ingreso.findMany({
    where: whereClause,
    include: {
      condominio: {
        select: {
          id: true,
          nombre: true,
        },
      },
      cuentaContable: {
        select: {
          id: true,
          codigo: true,
          nombre: true,
        },
      },
    },
    orderBy: {
      fechaEmision: 'desc',
    },
  });

  res.json({
    success: true,
    count: ingresos.length,
    data: ingresos,
  });
});

/**
 * Obtener ingreso por ID
 * GET /api/ingresos/:id
 */
export const obtenerIngresoById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const ingreso = await prisma.ingreso.findUnique({
    where: { id },
    include: {
      condominio: true,
      cuentaContable: true,
      ncfSecuencia: true,
    },
  });

  if (!ingreso) {
    throw new AppError('Ingreso no encontrado', 404);
  }

  res.json({
    success: true,
    data: ingreso,
  });
});

/**
 * Generar número de recibo automático
 */
const generarNumeroRecibo = async (condominioId: string) => {
  // Obtener el último recibo del condominio
  const ultimoRecibo = await prisma.ingreso.findFirst({
    where: {
      condominioId,
      numeroRecibo: { not: null },
    },
    orderBy: {
      fechaCreacion: 'desc',
    },
    select: {
      numeroRecibo: true,
    },
  });

  let nuevoNumero = 1;

  if (ultimoRecibo && ultimoRecibo.numeroRecibo) {
    // Extraer el número del formato REC-2024-00001
    const match = ultimoRecibo.numeroRecibo.match(/REC-\d{4}-(\d+)/);
    if (match) {
      nuevoNumero = parseInt(match[1]) + 1;
    }
  }

  const year = new Date().getFullYear();
  const numeroRecibo = `REC-${year}-${String(nuevoNumero).padStart(5, '0')}`;

  return numeroRecibo;
};

/**
 * Generar NCF para ingreso (si aplica)
 */
const generarNCFIngreso = async (organizacionId: string) => {
  // Buscar secuencia activa B02 (Facturas de Consumo)
  const secuencia = await prisma.nCFSecuencia.findFirst({
    where: {
      organizacionId,
      tipo: 'B02',
      activa: true,
      secuenciaActual: {
        lt: prisma.nCFSecuencia.fields.secuenciaFin,
      },
      fechaVencimiento: {
        gte: new Date(),
      },
    },
  });

  if (!secuencia) {
    return { ncf: null, ncfSecuenciaId: null };
  }

  // Incrementar secuencia
  const nuevoNumero = secuencia.secuenciaActual + BigInt(1);

  await prisma.nCFSecuencia.update({
    where: { id: secuencia.id },
    data: {
      secuenciaActual: nuevoNumero,
    },
  });

  const ncfCompleto = `${secuencia.serie}${String(nuevoNumero).padStart(8, '0')}`;

  return {
    ncf: ncfCompleto,
    ncfSecuenciaId: secuencia.id,
  };
};

/**
 * Crear nuevo ingreso con recibo automático
 * POST /api/ingresos
 */
export const crearIngreso = asyncHandler(async (req: Request, res: Response) => {
  const {
    condominioId,
    cuentaContableId,
    tipo,
    concepto,
    descripcion,
    monto,
    formaPago,
    fechaEmision,
    unidadId,
    adjuntoUrl,
    creadoPor,
    generarNCF: debeGenerarNCF,
  } = req.body;

  // Validaciones
  if (!condominioId || !cuentaContableId || !tipo || !concepto || !monto || !formaPago || !creadoPor) {
    throw new AppError('Faltan campos requeridos', 400);
  }

  // Obtener organizacionId del condominio
  const condominio = await prisma.condominioExtendido.findUnique({
    where: { id: condominioId },
    select: { organizacionId: true },
  });

  if (!condominio) {
    throw new AppError('Condominio no encontrado', 404);
  }

  // Generar número de recibo automático
  const numeroRecibo = await generarNumeroRecibo(condominioId);

  // Generar NCF si se solicita
  let ncfData: { ncf: string | null; ncfSecuenciaId: string | null } = { ncf: null, ncfSecuenciaId: null };
  if (debeGenerarNCF) {
    ncfData = await generarNCFIngreso(condominio.organizacionId);
  }

  // Crear ingreso
  const ingreso = await prisma.ingreso.create({
    data: {
      condominioId,
      cuentaContableId,
      numeroRecibo,
      ncf: ncfData.ncf,
      ncfSecuenciaId: ncfData.ncfSecuenciaId,
      tipo,
      concepto,
      descripcion,
      monto: parseFloat(monto),
      formaPago,
      fechaEmision: fechaEmision ? new Date(fechaEmision) : new Date(),
      cobrado: false,
      unidadId,
      adjuntoUrl,
      creadoPor,
    },
    include: {
      condominio: true,
      cuentaContable: true,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Ingreso creado exitosamente',
    data: ingreso,
    numeroRecibo,
    ncfGenerado: ncfData.ncf,
  });
});

/**
 * Actualizar ingreso
 * PUT /api/ingresos/:id
 */
export const actualizarIngreso = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    tipo,
    concepto,
    descripcion,
    monto,
    formaPago,
    fechaEmision,
    unidadId,
    adjuntoUrl,
  } = req.body;

  // Verificar que el ingreso existe
  const ingresoExistente = await prisma.ingreso.findUnique({
    where: { id },
  });

  if (!ingresoExistente) {
    throw new AppError('Ingreso no encontrado', 404);
  }

  // No permitir editar ingresos ya cobrados
  if (ingresoExistente.cobrado) {
    throw new AppError('No se puede modificar un ingreso ya cobrado', 400);
  }

  const ingreso = await prisma.ingreso.update({
    where: { id },
    data: {
      tipo,
      concepto,
      descripcion,
      monto: monto ? parseFloat(monto) : undefined,
      formaPago,
      fechaEmision: fechaEmision ? new Date(fechaEmision) : undefined,
      unidadId,
      adjuntoUrl,
    },
  });

  res.json({
    success: true,
    message: 'Ingreso actualizado exitosamente',
    data: ingreso,
  });
});

/**
 * Marcar ingreso como cobrado
 * PUT /api/ingresos/:id/cobrar
 */
export const marcarComoCobrado = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { fechaCobro } = req.body;

  const ingreso = await prisma.ingreso.update({
    where: { id },
    data: {
      cobrado: true,
      fechaCobro: fechaCobro ? new Date(fechaCobro) : new Date(),
    },
    include: {
      condominio: true,
    },
  });

  res.json({
    success: true,
    message: 'Ingreso marcado como cobrado',
    data: ingreso,
  });
});

/**
 * Obtener estadísticas de ingresos
 * GET /api/ingresos/estadisticas?condominioId=xxx&mes=2024-12
 */
export const obtenerEstadisticasIngresos = asyncHandler(async (req: Request, res: Response) => {
  const { condominioId, mes } = req.query;

  if (!condominioId) {
    throw new AppError('condominioId es requerido', 400);
  }

  const whereClause: any = {
    condominioId: condominioId as string,
  };

  // Filtro por mes
  if (mes) {
    const [year, month] = (mes as string).split('-');
    const startDate = new Date(`${year}-${month}-01`);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

    whereClause.fechaEmision = {
      gte: startDate,
      lte: endDate,
    };
  }

  // Total de ingresos
  const totalIngresos = await prisma.ingreso.count({ where: whereClause });

  // Suma total de ingresos
  const sumaIngresos = await prisma.ingreso.aggregate({
    where: whereClause,
    _sum: {
      monto: true,
    },
  });

  // Ingresos cobrados vs pendientes
  const ingresosCobrados = await prisma.ingreso.count({
    where: { ...whereClause, cobrado: true },
  });

  const ingresosNoCobrados = await prisma.ingreso.count({
    where: { ...whereClause, cobrado: false },
  });

  // Suma de cobrados y pendientes
  const sumaCobrados = await prisma.ingreso.aggregate({
    where: { ...whereClause, cobrado: true },
    _sum: { monto: true },
  });

  const sumaPendientes = await prisma.ingreso.aggregate({
    where: { ...whereClause, cobrado: false },
    _sum: { monto: true },
  });

  // Ingresos por tipo
  const ingresosPorTipo = await prisma.ingreso.groupBy({
    by: ['tipo'],
    where: whereClause,
    _sum: {
      monto: true,
    },
    _count: true,
  });

  // Ingresos por forma de pago
  const ingresosPorFormaPago = await prisma.ingreso.groupBy({
    by: ['formaPago'],
    where: whereClause,
    _sum: {
      monto: true,
    },
    _count: true,
  });

  res.json({
    success: true,
    data: {
      totalIngresos,
      sumaTotal: sumaIngresos._sum.monto || 0,
      ingresosCobrados,
      ingresosNoCobrados,
      sumaCobrados: sumaCobrados._sum.monto || 0,
      sumaPendientes: sumaPendientes._sum.monto || 0,
      ingresosPorTipo,
      ingresosPorFormaPago,
    },
  });
});
