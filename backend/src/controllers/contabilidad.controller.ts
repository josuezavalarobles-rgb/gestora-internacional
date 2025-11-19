/**
 * ========================================
 * CONTROLADOR DE CONTABILIDAD
 * ========================================
 * Gestión del plan de cuentas y balance general
 */

import { Request, Response } from 'express';
import { getPrismaClient } from '../config/database/postgres';
import { asyncHandler } from '../middleware/errorHandler';
import { AppError } from '../middleware/errorHandler';

const prisma = getPrismaClient();

/**
 * Obtener plan de cuentas jerárquico
 * GET /api/contabilidad/plan-cuentas?organizacionId=xxx
 */
export const obtenerPlanCuentas = asyncHandler(async (req: Request, res: Response) => {
  const { organizacionId, tipo, activa } = req.query;

  if (!organizacionId) {
    throw new AppError('organizacionId es requerido', 400);
  }

  const whereClause: any = {
    organizacionId: organizacionId as string,
  };

  // Filtro por tipo de cuenta
  if (tipo) {
    whereClause.tipo = tipo;
  }

  // Filtro por estado activo
  if (activa !== undefined) {
    whereClause.activa = activa === 'true';
  }

  // Obtener todas las cuentas
  const cuentas = await prisma.planCuentas.findMany({
    where: whereClause,
    include: {
      cuentaPadre: {
        select: {
          id: true,
          codigo: true,
          nombre: true,
        },
      },
      subCuentas: {
        include: {
          subCuentas: true, // Incluir sub-sub-cuentas
        },
      },
      _count: {
        select: {
          gastos: true,
          ingresos: true,
        },
      },
    },
    orderBy: {
      codigo: 'asc',
    },
  });

  // Organizar en estructura jerárquica
  const cuentasNivel1 = cuentas.filter(c => c.nivel === 1);

  const jerarquia = cuentasNivel1.map(nivel1 => ({
    ...nivel1,
    subCuentas: cuentas
      .filter(c => c.cuentaPadreId === nivel1.id)
      .map(nivel2 => ({
        ...nivel2,
        subCuentas: cuentas.filter(c => c.cuentaPadreId === nivel2.id),
      })),
  }));

  res.json({
    success: true,
    count: cuentas.length,
    data: {
      todasLasCuentas: cuentas,
      jerarquia,
    },
  });
});

/**
 * Obtener cuenta por ID
 * GET /api/contabilidad/cuentas/:id
 */
export const obtenerCuentaById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const cuenta = await prisma.planCuentas.findUnique({
    where: { id },
    include: {
      cuentaPadre: true,
      subCuentas: true,
      gastos: {
        take: 20,
        orderBy: { fechaEmision: 'desc' },
        select: {
          id: true,
          concepto: true,
          total: true,
          fechaEmision: true,
          pagado: true,
        },
      },
      ingresos: {
        take: 20,
        orderBy: { fechaEmision: 'desc' },
        select: {
          id: true,
          concepto: true,
          monto: true,
          fechaEmision: true,
          cobrado: true,
        },
      },
      _count: {
        select: {
          gastos: true,
          ingresos: true,
          subCuentas: true,
        },
      },
    },
  });

  if (!cuenta) {
    throw new AppError('Cuenta no encontrada', 404);
  }

  // Calcular saldo de la cuenta
  const sumaGastos = await prisma.gasto.aggregate({
    where: { cuentaContableId: id },
    _sum: { total: true },
  });

  const sumaIngresos = await prisma.ingreso.aggregate({
    where: { cuentaContableId: id },
    _sum: { monto: true },
  });

  res.json({
    success: true,
    data: {
      ...cuenta,
      saldo: {
        totalGastos: sumaGastos._sum.total || 0,
        totalIngresos: sumaIngresos._sum.monto || 0,
      },
    },
  });
});

/**
 * Crear nueva cuenta contable
 * POST /api/contabilidad/cuentas
 */
export const crearCuenta = asyncHandler(async (req: Request, res: Response) => {
  const {
    organizacionId,
    codigo,
    nombre,
    descripcion,
    tipo,
    nivel,
    cuentaPadreId,
    aceptaMovimientos,
  } = req.body;

  // Validaciones
  if (!organizacionId || !codigo || !nombre || !tipo || !nivel) {
    throw new AppError('Faltan campos requeridos: organizacionId, codigo, nombre, tipo, nivel', 400);
  }

  // Verificar que el código no esté duplicado
  const cuentaExistente = await prisma.planCuentas.findFirst({
    where: {
      organizacionId,
      codigo,
    },
  });

  if (cuentaExistente) {
    throw new AppError('Ya existe una cuenta con ese código', 400);
  }

  // Si tiene cuenta padre, verificar que exista
  if (cuentaPadreId) {
    const cuentaPadre = await prisma.planCuentas.findUnique({
      where: { id: cuentaPadreId },
    });

    if (!cuentaPadre) {
      throw new AppError('Cuenta padre no encontrada', 404);
    }

    // Verificar que el nivel sea correcto (padre + 1)
    if (nivel !== cuentaPadre.nivel + 1) {
      throw new AppError(`El nivel debe ser ${cuentaPadre.nivel + 1}`, 400);
    }
  } else {
    // Si no tiene padre, debe ser nivel 1
    if (nivel !== 1) {
      throw new AppError('Las cuentas sin padre deben ser nivel 1', 400);
    }
  }

  const cuenta = await prisma.planCuentas.create({
    data: {
      organizacionId,
      codigo,
      nombre,
      descripcion,
      tipo,
      nivel,
      cuentaPadreId,
      aceptaMovimientos: aceptaMovimientos !== false,
      activa: true,
    },
    include: {
      cuentaPadre: true,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Cuenta creada exitosamente',
    data: cuenta,
  });
});

/**
 * Actualizar cuenta contable
 * PUT /api/contabilidad/cuentas/:id
 */
export const actualizarCuenta = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    nombre,
    descripcion,
    activa,
    aceptaMovimientos,
  } = req.body;

  // Verificar que la cuenta existe
  const cuentaExistente = await prisma.planCuentas.findUnique({
    where: { id },
  });

  if (!cuentaExistente) {
    throw new AppError('Cuenta no encontrada', 404);
  }

  // No permitir desactivar cuentas con movimientos
  if (activa === false) {
    const tieneMovimientos = await prisma.gasto.count({
      where: { cuentaContableId: id },
    });

    const tieneIngresos = await prisma.ingreso.count({
      where: { cuentaContableId: id },
    });

    if (tieneMovimientos > 0 || tieneIngresos > 0) {
      throw new AppError('No se puede desactivar una cuenta con movimientos', 400);
    }
  }

  const cuenta = await prisma.planCuentas.update({
    where: { id },
    data: {
      nombre,
      descripcion,
      activa,
      aceptaMovimientos,
    },
  });

  res.json({
    success: true,
    message: 'Cuenta actualizada exitosamente',
    data: cuenta,
  });
});

/**
 * Obtener balance general con totales por tipo
 * GET /api/contabilidad/balance?organizacionId=xxx&fechaInicio=2024-01-01&fechaFin=2024-12-31
 */
export const obtenerBalance = asyncHandler(async (req: Request, res: Response) => {
  const { organizacionId, fechaInicio, fechaFin, condominioId } = req.query;

  if (!organizacionId) {
    throw new AppError('organizacionId es requerido', 400);
  }

  // Construir filtros de fecha
  const fechaFilter: any = {};
  if (fechaInicio) {
    fechaFilter.gte = new Date(fechaInicio as string);
  }
  if (fechaFin) {
    fechaFilter.lte = new Date(fechaFin as string);
  }

  // Obtener todas las cuentas de la organización
  const cuentas = await prisma.planCuentas.findMany({
    where: {
      organizacionId: organizacionId as string,
      activa: true,
    },
    orderBy: {
      codigo: 'asc',
    },
  });

  // Calcular totales por cuenta
  const balance = await Promise.all(
    cuentas.map(async (cuenta) => {
      const whereGastos: any = {
        cuentaContableId: cuenta.id,
        pagado: true,
      };

      const whereIngresos: any = {
        cuentaContableId: cuenta.id,
        cobrado: true,
      };

      // Filtrar por condominio si se proporciona
      if (condominioId) {
        whereGastos.condominioId = condominioId;
        whereIngresos.condominioId = condominioId;
      }

      // Aplicar filtros de fecha
      if (Object.keys(fechaFilter).length > 0) {
        whereGastos.fechaEmision = fechaFilter;
        whereIngresos.fechaEmision = fechaFilter;
      }

      // Sumar gastos
      const sumaGastos = await prisma.gasto.aggregate({
        where: whereGastos,
        _sum: { total: true },
      });

      // Sumar ingresos
      const sumaIngresos = await prisma.ingreso.aggregate({
        where: whereIngresos,
        _sum: { monto: true },
      });

      const totalGastos = parseFloat(sumaGastos._sum.total?.toString() || '0');
      const totalIngresos = parseFloat(sumaIngresos._sum.monto?.toString() || '0');

      // Calcular saldo según tipo de cuenta
      let saldo = 0;
      if (cuenta.tipo === 'activo' || cuenta.tipo === 'gasto') {
        saldo = totalGastos - totalIngresos;
      } else if (cuenta.tipo === 'pasivo' || cuenta.tipo === 'patrimonio' || cuenta.tipo === 'ingreso') {
        saldo = totalIngresos - totalGastos;
      }

      return {
        cuentaId: cuenta.id,
        codigo: cuenta.codigo,
        nombre: cuenta.nombre,
        tipo: cuenta.tipo,
        nivel: cuenta.nivel,
        totalGastos,
        totalIngresos,
        saldo,
      };
    })
  );

  // Agrupar por tipo de cuenta
  const balancePorTipo = {
    activos: balance.filter(c => c.tipo === 'activo'),
    pasivos: balance.filter(c => c.tipo === 'pasivo'),
    patrimonio: balance.filter(c => c.tipo === 'patrimonio'),
    ingresos: balance.filter(c => c.tipo === 'ingreso'),
    gastos: balance.filter(c => c.tipo === 'gasto'),
  };

  // Calcular totales por tipo
  const totales = {
    totalActivos: balancePorTipo.activos.reduce((sum, c) => sum + c.saldo, 0),
    totalPasivos: balancePorTipo.pasivos.reduce((sum, c) => sum + c.saldo, 0),
    totalPatrimonio: balancePorTipo.patrimonio.reduce((sum, c) => sum + c.saldo, 0),
    totalIngresos: balancePorTipo.ingresos.reduce((sum, c) => sum + c.saldo, 0),
    totalGastos: balancePorTipo.gastos.reduce((sum, c) => sum + c.saldo, 0),
  };

  // Calcular utilidad/pérdida
  const utilidadNeta = totales.totalIngresos - totales.totalGastos;

  res.json({
    success: true,
    data: {
      balance,
      balancePorTipo,
      totales,
      utilidadNeta,
      ecuacionContable: {
        activos: totales.totalActivos,
        pasivos: totales.totalPasivos,
        patrimonio: totales.totalPatrimonio + utilidadNeta,
        cumpleEcuacion: Math.abs(totales.totalActivos - (totales.totalPasivos + totales.totalPatrimonio + utilidadNeta)) < 0.01,
      },
    },
  });
});
