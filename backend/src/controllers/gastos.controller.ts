/**
 * ========================================
 * CONTROLADOR DE GASTOS
 * ========================================
 * Gestión de gastos con NCF automático y distribución por alícuota
 */

import { Request, Response } from 'express';
import { getPrismaClient } from '../config/database/postgres';
import { asyncHandler } from '../middleware/errorHandler';
import { AppError } from '../middleware/errorHandler';

const prisma = getPrismaClient();

/**
 * Obtener gastos con filtros
 * GET /api/gastos?condominioId=xxx&tipo=xxx&pagado=true&mes=2024-12
 */
export const obtenerGastos = asyncHandler(async (req: Request, res: Response) => {
  const { condominioId, tipo, pagado, mes, proveedorId, search } = req.query;

  const whereClause: any = {};

  // Filtro por condominio
  if (condominioId) {
    whereClause.condominioId = condominioId as string;
  }

  // Filtro por tipo de gasto
  if (tipo) {
    whereClause.tipo = tipo;
  }

  // Filtro por estado de pago
  if (pagado !== undefined) {
    whereClause.pagado = pagado === 'true';
  }

  // Filtro por proveedor
  if (proveedorId) {
    whereClause.proveedorId = proveedorId as string;
  }

  // Filtro por mes (formato: 2024-12)
  if (mes) {
    const [year, month] = (mes as string).split('-');
    const startDate = new Date(`${year}-${month}-01`);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

    whereClause.fechaEmision = {
      gte: startDate,
      lte: endDate,
    };
  }

  // Búsqueda por concepto o número de factura
  if (search) {
    whereClause.OR = [
      { concepto: { contains: search as string, mode: 'insensitive' } },
      { numeroFactura: { contains: search as string, mode: 'insensitive' } },
      { ncf: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  const gastos = await prisma.gasto.findMany({
    where: whereClause,
    include: {
      condominio: {
        select: {
          id: true,
          nombre: true,
        },
      },
      proveedor: {
        select: {
          id: true,
          nombre: true,
          telefono: true,
        },
      },
      cuentaContable: {
        select: {
          id: true,
          codigo: true,
          nombre: true,
        },
      },
      _count: {
        select: {
          distribucion: true,
        },
      },
    },
    orderBy: {
      fechaEmision: 'desc',
    },
  });

  res.json({
    success: true,
    count: gastos.length,
    data: gastos,
  });
});

/**
 * Obtener gasto por ID
 * GET /api/gastos/:id
 */
export const obtenerGastoById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const gasto = await prisma.gasto.findUnique({
    where: { id },
    include: {
      condominio: true,
      proveedor: true,
      cuentaContable: true,
      ncfSecuencia: true,
      distribucion: {
        include: {
          unidad: {
            select: {
              id: true,
              numero: true,
              edificio: true,
              alicuota: true,
            },
          },
        },
      },
      facturaIA: true,
      evaluaciones: true,
    },
  });

  if (!gasto) {
    throw new AppError('Gasto no encontrado', 404);
  }

  res.json({
    success: true,
    data: gasto,
  });
});

/**
 * Generar NCF automáticamente
 */
const generarNCF = async (organizacionId: string, tipoNCF: string = 'B02') => {
  // Buscar secuencia activa del tipo especificado
  const secuencia = await prisma.nCFSecuencia.findFirst({
    where: {
      organizacionId,
      tipo: tipoNCF as any,
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
    throw new AppError('No hay secuencia NCF activa disponible', 400);
  }

  // Incrementar secuencia
  const nuevoNumero = secuencia.secuenciaActual + BigInt(1);

  await prisma.nCFSecuencia.update({
    where: { id: secuencia.id },
    data: {
      secuenciaActual: nuevoNumero,
    },
  });

  // Formatear NCF completo: E31000000001234567800000123
  const ncfCompleto = `${secuencia.serie}${String(nuevoNumero).padStart(8, '0')}`;

  return {
    ncf: ncfCompleto,
    ncfSecuenciaId: secuencia.id,
  };
};

/**
 * Crear nuevo gasto con NCF automático
 * POST /api/gastos
 */
export const crearGasto = asyncHandler(async (req: Request, res: Response) => {
  const {
    condominioId,
    cuentaContableId,
    proveedorId,
    numeroFactura,
    tipo,
    concepto,
    descripcion,
    subtotal,
    itbis,
    total,
    formaPago,
    fechaEmision,
    distribuirUnidades,
    adjuntoUrl,
    creadoPor,
    generarNCF: debeGenerarNCF,
  } = req.body;

  // Validaciones
  if (!condominioId || !cuentaContableId || !tipo || !concepto || !total || !formaPago || !creadoPor) {
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

  let ncfData: { ncf: string | null; ncfSecuenciaId: string | null } = { ncf: null, ncfSecuenciaId: null };

  // Generar NCF si se solicita
  if (debeGenerarNCF) {
    ncfData = await generarNCF(condominio.organizacionId);
  }

  // Crear gasto
  const gasto = await prisma.gasto.create({
    data: {
      condominioId,
      cuentaContableId,
      proveedorId,
      numeroFactura,
      ncf: ncfData.ncf,
      ncfSecuenciaId: ncfData.ncfSecuenciaId,
      tipo,
      concepto,
      descripcion,
      subtotal: parseFloat(subtotal),
      itbis: parseFloat(itbis || 0),
      total: parseFloat(total),
      formaPago,
      fechaEmision: fechaEmision ? new Date(fechaEmision) : new Date(),
      pagado: false,
      distribuirUnidades: distribuirUnidades !== false, // Por defecto true
      adjuntoUrl,
      creadoPor,
    },
    include: {
      condominio: true,
      proveedor: true,
      cuentaContable: true,
    },
  });

  // Si debe distribuir a unidades, crear distribución automática
  if (distribuirUnidades !== false) {
    const unidades = await prisma.unidad.findMany({
      where: { condominioId },
      select: { id: true, alicuota: true },
    });

    const distribucionData = unidades.map(unidad => ({
      gastoId: gasto.id,
      unidadId: unidad.id,
      montoAsignado: parseFloat(total) * parseFloat(unidad.alicuota.toString()),
      pagado: false,
    }));

    await prisma.distribucionGasto.createMany({
      data: distribucionData,
    });
  }

  res.status(201).json({
    success: true,
    message: 'Gasto creado exitosamente',
    data: gasto,
    ncfGenerado: ncfData.ncf,
  });
});

/**
 * Actualizar gasto
 * PUT /api/gastos/:id
 */
export const actualizarGasto = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    proveedorId,
    numeroFactura,
    tipo,
    concepto,
    descripcion,
    subtotal,
    itbis,
    total,
    formaPago,
    fechaEmision,
    adjuntoUrl,
  } = req.body;

  // Verificar que el gasto existe
  const gastoExistente = await prisma.gasto.findUnique({
    where: { id },
  });

  if (!gastoExistente) {
    throw new AppError('Gasto no encontrado', 404);
  }

  // No permitir editar gastos ya pagados
  if (gastoExistente.pagado) {
    throw new AppError('No se puede modificar un gasto ya pagado', 400);
  }

  const gasto = await prisma.gasto.update({
    where: { id },
    data: {
      proveedorId,
      numeroFactura,
      tipo,
      concepto,
      descripcion,
      subtotal: subtotal ? parseFloat(subtotal) : undefined,
      itbis: itbis !== undefined ? parseFloat(itbis) : undefined,
      total: total ? parseFloat(total) : undefined,
      formaPago,
      fechaEmision: fechaEmision ? new Date(fechaEmision) : undefined,
      adjuntoUrl,
    },
  });

  res.json({
    success: true,
    message: 'Gasto actualizado exitosamente',
    data: gasto,
  });
});

/**
 * Marcar gasto como pagado
 * PUT /api/gastos/:id/pagar
 */
export const marcarComoPagado = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { fechaPago } = req.body;

  const gasto = await prisma.gasto.update({
    where: { id },
    data: {
      pagado: true,
      fechaPago: fechaPago ? new Date(fechaPago) : new Date(),
    },
    include: {
      condominio: true,
      proveedor: true,
    },
  });

  res.json({
    success: true,
    message: 'Gasto marcado como pagado',
    data: gasto,
  });
});

/**
 * Obtener estadísticas de gastos
 * GET /api/gastos/estadisticas?condominioId=xxx&mes=2024-12
 */
export const obtenerEstadisticasGastos = asyncHandler(async (req: Request, res: Response) => {
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

  // Total de gastos
  const totalGastos = await prisma.gasto.count({ where: whereClause });

  // Suma total de gastos
  const sumaGastos = await prisma.gasto.aggregate({
    where: whereClause,
    _sum: {
      total: true,
    },
  });

  // Gastos pagados vs pendientes
  const gastosPagados = await prisma.gasto.count({
    where: { ...whereClause, pagado: true },
  });

  const gastosNoPagados = await prisma.gasto.count({
    where: { ...whereClause, pagado: false },
  });

  // Suma de pagados y pendientes
  const sumaPagados = await prisma.gasto.aggregate({
    where: { ...whereClause, pagado: true },
    _sum: { total: true },
  });

  const sumaPendientes = await prisma.gasto.aggregate({
    where: { ...whereClause, pagado: false },
    _sum: { total: true },
  });

  // Gastos por tipo
  const gastosPorTipo = await prisma.gasto.groupBy({
    by: ['tipo'],
    where: whereClause,
    _sum: {
      total: true,
    },
    _count: true,
  });

  // Top proveedores
  const topProveedores = await prisma.gasto.groupBy({
    by: ['proveedorId'],
    where: whereClause,
    _sum: {
      total: true,
    },
    _count: true,
    orderBy: {
      _sum: {
        total: 'desc',
      },
    },
    take: 5,
  });

  // Obtener nombres de proveedores
  const proveedoresIds = topProveedores.map(p => p.proveedorId).filter(Boolean);
  const proveedores = await prisma.proveedor.findMany({
    where: {
      id: { in: proveedoresIds as string[] },
    },
    select: {
      id: true,
      nombre: true,
    },
  });

  const topProveedoresConNombre = topProveedores.map(tp => ({
    ...tp,
    proveedor: proveedores.find(p => p.id === tp.proveedorId),
  }));

  res.json({
    success: true,
    data: {
      totalGastos,
      sumaTotal: sumaGastos._sum.total || 0,
      gastosPagados,
      gastosNoPagados,
      sumaPagados: sumaPagados._sum.total || 0,
      sumaPendientes: sumaPendientes._sum.total || 0,
      gastosPorTipo,
      topProveedores: topProveedoresConNombre,
    },
  });
});
