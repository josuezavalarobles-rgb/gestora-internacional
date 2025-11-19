/**
 * ========================================
 * CONTROLADOR DE NÓMINA
 * ========================================
 * Gestión de personal y nómina con cálculos de AFP, ARS, ISR (República Dominicana)
 */

import { Request, Response } from 'express';
import { getPrismaClient } from '../config/database/postgres';
import { asyncHandler } from '../middleware/errorHandler';
import { AppError } from '../middleware/errorHandler';

const prisma = getPrismaClient();

/**
 * Tasas de descuentos República Dominicana
 */
const TASAS_RD = {
  AFP: 0.0287, // 2.87%
  ARS: 0.0304, // 3.04%
  // ISR: Escala progresiva (calculado por función)
};

/**
 * Calcular ISR según escala progresiva RD (2024)
 */
const calcularISR = (salarioAnual: number): number => {
  let isr = 0;

  // Escala progresiva ISR República Dominicana
  if (salarioAnual <= 416220) {
    isr = 0; // Exento
  } else if (salarioAnual <= 624329) {
    isr = (salarioAnual - 416220) * 0.15;
  } else if (salarioAnual <= 867123) {
    isr = 31216 + (salarioAnual - 624329) * 0.20;
  } else {
    isr = 79775 + (salarioAnual - 867123) * 0.25;
  }

  return isr / 12; // Retornar ISR mensual
};

/**
 * Obtener personal
 * GET /api/nomina/personal?organizacionId=xxx&tipo=xxx&estado=activo
 */
export const obtenerPersonal = asyncHandler(async (req: Request, res: Response) => {
  const { organizacionId, tipo, estado, search } = req.query;

  if (!organizacionId) {
    throw new AppError('organizacionId es requerido', 400);
  }

  const whereClause: any = {
    organizacionId: organizacionId as string,
  };

  // Filtro por tipo
  if (tipo) {
    whereClause.tipo = tipo;
  }

  // Filtro por estado
  if (estado) {
    whereClause.estado = estado;
  }

  // Búsqueda por nombre o cédula
  if (search) {
    whereClause.OR = [
      { nombreCompleto: { contains: search as string, mode: 'insensitive' } },
      { cedula: { contains: search as string, mode: 'insensitive' } },
      { puesto: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  const personal = await prisma.personal.findMany({
    where: whereClause,
    include: {
      _count: {
        select: {
          nominas: true,
        },
      },
    },
    orderBy: {
      nombreCompleto: 'asc',
    },
  });

  res.json({
    success: true,
    count: personal.length,
    data: personal,
  });
});

/**
 * Obtener personal por ID
 * GET /api/nomina/personal/:id
 */
export const obtenerPersonalById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const personal = await prisma.personal.findUnique({
    where: { id },
    include: {
      organizacion: {
        select: {
          id: true,
          nombre: true,
        },
      },
      nominas: {
        orderBy: {
          periodo: 'desc',
        },
        take: 12,
      },
    },
  });

  if (!personal) {
    throw new AppError('Personal no encontrado', 404);
  }

  res.json({
    success: true,
    data: personal,
  });
});

/**
 * Crear personal
 * POST /api/nomina/personal
 */
export const crearPersonal = asyncHandler(async (req: Request, res: Response) => {
  const {
    organizacionId,
    nombreCompleto,
    cedula,
    telefono,
    email,
    direccion,
    tipo,
    puesto,
    fechaIngreso,
    salarioMensual,
    afiliacionAFP,
    afiliacionARS,
    banco,
    numeroCuenta,
    fotoUrl,
  } = req.body;

  // Validaciones
  if (!organizacionId || !nombreCompleto || !cedula || !telefono || !tipo || !puesto || !salarioMensual) {
    throw new AppError('Faltan campos requeridos', 400);
  }

  // Verificar que la cédula no esté duplicada
  const personalExistente = await prisma.personal.findUnique({
    where: { cedula },
  });

  if (personalExistente) {
    throw new AppError('Ya existe un empleado con esa cédula', 400);
  }

  const personal = await prisma.personal.create({
    data: {
      organizacionId,
      nombreCompleto,
      cedula,
      telefono,
      email,
      direccion,
      tipo,
      puesto,
      fechaIngreso: fechaIngreso ? new Date(fechaIngreso) : new Date(),
      estado: 'activo',
      salarioMensual: parseFloat(salarioMensual),
      afiliacionAFP,
      afiliacionARS,
      banco,
      numeroCuenta,
      fotoUrl,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Personal creado exitosamente',
    data: personal,
  });
});

/**
 * Actualizar personal
 * PUT /api/nomina/personal/:id
 */
export const actualizarPersonal = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    nombreCompleto,
    telefono,
    email,
    direccion,
    tipo,
    puesto,
    fechaSalida,
    estado,
    salarioMensual,
    afiliacionAFP,
    afiliacionARS,
    banco,
    numeroCuenta,
    fotoUrl,
  } = req.body;

  // Verificar que el personal existe
  const personalExistente = await prisma.personal.findUnique({
    where: { id },
  });

  if (!personalExistente) {
    throw new AppError('Personal no encontrado', 404);
  }

  const personal = await prisma.personal.update({
    where: { id },
    data: {
      nombreCompleto,
      telefono,
      email,
      direccion,
      tipo,
      puesto,
      fechaSalida: fechaSalida ? new Date(fechaSalida) : undefined,
      estado,
      salarioMensual: salarioMensual ? parseFloat(salarioMensual) : undefined,
      afiliacionAFP,
      afiliacionARS,
      banco,
      numeroCuenta,
      fotoUrl,
    },
  });

  res.json({
    success: true,
    message: 'Personal actualizado exitosamente',
    data: personal,
  });
});

/**
 * Obtener nóminas por período
 * GET /api/nomina/nominas?periodo=2024-12&personalId=xxx
 */
export const obtenerNominas = asyncHandler(async (req: Request, res: Response) => {
  const { periodo, personalId, pagado } = req.query;

  const whereClause: any = {};

  // Filtro por período
  if (periodo) {
    whereClause.periodo = periodo as string;
  }

  // Filtro por personal
  if (personalId) {
    whereClause.personalId = personalId as string;
  }

  // Filtro por estado de pago
  if (pagado !== undefined) {
    whereClause.pagado = pagado === 'true';
  }

  const nominas = await prisma.nomina.findMany({
    where: whereClause,
    include: {
      personal: {
        select: {
          id: true,
          nombreCompleto: true,
          cedula: true,
          puesto: true,
          tipo: true,
        },
      },
    },
    orderBy: [
      { periodo: 'desc' },
      { personal: { nombreCompleto: 'asc' } },
    ],
  });

  // Calcular totales
  const totales = nominas.reduce(
    (acc, nomina) => ({
      totalDevengado: acc.totalDevengado + parseFloat(nomina.totalDevengado.toString()),
      totalDeducciones: acc.totalDeducciones + parseFloat(nomina.totalDeducciones.toString()),
      totalNeto: acc.totalNeto + parseFloat(nomina.salarioNeto.toString()),
    }),
    { totalDevengado: 0, totalDeducciones: 0, totalNeto: 0 }
  );

  res.json({
    success: true,
    count: nominas.length,
    data: nominas,
    totales,
  });
});

/**
 * Generar nómina con cálculos automáticos
 * POST /api/nomina/generar
 */
export const generarNomina = asyncHandler(async (req: Request, res: Response) => {
  const {
    personalId,
    periodo,
    fechaPago,
    bonificaciones,
    horasExtra,
    otrasDeducciones,
    notas,
    creadoPor,
  } = req.body;

  // Validaciones
  if (!personalId || !periodo || !creadoPor) {
    throw new AppError('Faltan campos requeridos: personalId, periodo, creadoPor', 400);
  }

  // Obtener datos del personal
  const personal = await prisma.personal.findUnique({
    where: { id: personalId },
  });

  if (!personal) {
    throw new AppError('Personal no encontrado', 404);
  }

  if (personal.estado !== 'activo') {
    throw new AppError('El personal debe estar activo para generar nómina', 400);
  }

  // Verificar si ya existe nómina para este período
  const nominaExistente = await prisma.nomina.findFirst({
    where: {
      personalId,
      periodo,
    },
  });

  if (nominaExistente) {
    throw new AppError('Ya existe una nómina para este personal en este período', 400);
  }

  // Calcular salario base
  const salarioBase = parseFloat(personal.salarioMensual.toString());
  const bonificacionesNum = bonificaciones ? parseFloat(bonificaciones) : 0;
  const horasExtraNum = horasExtra ? parseFloat(horasExtra) : 0;

  // Calcular total devengado
  const totalDevengado = salarioBase + bonificacionesNum + horasExtraNum;

  // Calcular deducciones
  const deduccionAFP = totalDevengado * TASAS_RD.AFP;
  const deduccionARS = totalDevengado * TASAS_RD.ARS;
  const salarioAnual = totalDevengado * 12;
  const deduccionISR = calcularISR(salarioAnual);
  const otrasDeduccionesNum = otrasDeducciones ? parseFloat(otrasDeducciones) : 0;

  // Calcular total deducciones
  const totalDeducciones = deduccionAFP + deduccionARS + deduccionISR + otrasDeduccionesNum;

  // Calcular salario neto
  const salarioNeto = totalDevengado - totalDeducciones;

  // Crear nómina
  const nomina = await prisma.nomina.create({
    data: {
      personalId,
      periodo,
      fechaPago: fechaPago ? new Date(fechaPago) : new Date(),
      salarioBase,
      bonificaciones: bonificacionesNum,
      horasExtra: horasExtraNum,
      deduccionAFP,
      deduccionARS,
      deduccionISR,
      otrasDeducciones: otrasDeduccionesNum,
      totalDevengado,
      totalDeducciones,
      salarioNeto,
      pagado: false,
      notas,
      creadoPor,
    },
    include: {
      personal: true,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Nómina generada exitosamente',
    data: nomina,
    desglose: {
      salarioBase,
      bonificaciones: bonificacionesNum,
      horasExtra: horasExtraNum,
      totalDevengado,
      deducciones: {
        afp: deduccionAFP,
        ars: deduccionARS,
        isr: deduccionISR,
        otras: otrasDeduccionesNum,
        total: totalDeducciones,
      },
      salarioNeto,
    },
  });
});

/**
 * Marcar nómina como pagada
 * PUT /api/nomina/:id/pagar
 */
export const marcarNominaPagada = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Verificar que la nómina existe
  const nominaExistente = await prisma.nomina.findUnique({
    where: { id },
  });

  if (!nominaExistente) {
    throw new AppError('Nómina no encontrada', 404);
  }

  if (nominaExistente.pagado) {
    throw new AppError('Esta nómina ya fue marcada como pagada', 400);
  }

  const nomina = await prisma.nomina.update({
    where: { id },
    data: {
      pagado: true,
    },
    include: {
      personal: true,
    },
  });

  res.json({
    success: true,
    message: 'Nómina marcada como pagada',
    data: nomina,
  });
});
