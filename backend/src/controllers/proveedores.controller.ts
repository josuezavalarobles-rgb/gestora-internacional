/**
 * ========================================
 * CONTROLADOR DE PROVEEDORES
 * ========================================
 * Gestión completa de proveedores y evaluaciones
 */

import { Request, Response } from 'express';
import { getPrismaClient } from '../config/database/postgres';
import { asyncHandler } from '../middleware/errorHandler';
import { AppError } from '../middleware/errorHandler';

const prisma = getPrismaClient();

/**
 * Obtener todos los proveedores con filtros
 * GET /api/proveedores?organizacionId=xxx&tipo=xxx&activo=true
 */
export const obtenerProveedores = asyncHandler(async (req: Request, res: Response) => {
  const { organizacionId, tipo, activo, search } = req.query;

  // Validar que organizacionId esté presente
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

  // Filtro por estado activo/inactivo
  if (activo !== undefined) {
    whereClause.activo = activo === 'true';
  }

  // Búsqueda por nombre
  if (search) {
    whereClause.OR = [
      { nombre: { contains: search as string, mode: 'insensitive' } },
      { nombreComercial: { contains: search as string, mode: 'insensitive' } },
      { rnc: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  const proveedores = await prisma.proveedor.findMany({
    where: whereClause,
    include: {
      _count: {
        select: {
          gastos: true,
          evaluaciones: true,
          condominios: true,
        },
      },
    },
    orderBy: {
      nombre: 'asc',
    },
  });

  res.json({
    success: true,
    count: proveedores.length,
    data: proveedores,
  });
});

/**
 * Obtener proveedor por ID
 * GET /api/proveedores/:id
 */
export const obtenerProveedorById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const proveedor = await prisma.proveedor.findUnique({
    where: { id },
    include: {
      condominios: {
        include: {
          condominio: {
            select: {
              id: true,
              nombre: true,
              ciudad: true,
            },
          },
        },
      },
      gastos: {
        take: 10,
        orderBy: { fechaEmision: 'desc' },
        select: {
          id: true,
          concepto: true,
          total: true,
          fechaEmision: true,
          pagado: true,
        },
      },
      evaluaciones: {
        orderBy: { fechaEvaluacion: 'desc' },
        include: {
          gasto: {
            select: {
              id: true,
              concepto: true,
              fechaEmision: true,
            },
          },
        },
      },
      _count: {
        select: {
          gastos: true,
          evaluaciones: true,
        },
      },
    },
  });

  if (!proveedor) {
    throw new AppError('Proveedor no encontrado', 404);
  }

  res.json({
    success: true,
    data: proveedor,
  });
});

/**
 * Crear nuevo proveedor
 * POST /api/proveedores
 */
export const crearProveedor = asyncHandler(async (req: Request, res: Response) => {
  const {
    organizacionId,
    nombre,
    nombreComercial,
    rnc,
    tipo,
    telefono,
    email,
    direccion,
    personaContacto,
    telefonoContacto,
    banco,
    numeroCuenta,
    tipoCuenta,
    notas,
    condominiosIds, // Array de IDs de condominios para asociar
  } = req.body;

  // Validaciones
  if (!organizacionId || !nombre || !tipo || !telefono) {
    throw new AppError('Faltan campos requeridos: organizacionId, nombre, tipo, telefono', 400);
  }

  // Verificar si ya existe un proveedor con ese RNC
  if (rnc) {
    const proveedorExistente = await prisma.proveedor.findUnique({
      where: { rnc },
    });

    if (proveedorExistente) {
      throw new AppError('Ya existe un proveedor con ese RNC', 400);
    }
  }

  // Crear proveedor con relaciones a condominios
  const proveedor = await prisma.proveedor.create({
    data: {
      organizacionId,
      nombre,
      nombreComercial,
      rnc,
      tipo,
      telefono,
      email,
      direccion,
      personaContacto,
      telefonoContacto,
      banco,
      numeroCuenta,
      tipoCuenta,
      notas,
      activo: true,
      // Asociar condominios si se proporcionan
      ...(condominiosIds && condominiosIds.length > 0 && {
        condominios: {
          create: condominiosIds.map((condominioId: string) => ({
            condominioId,
            activo: true,
          })),
        },
      }),
    },
    include: {
      condominios: true,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Proveedor creado exitosamente',
    data: proveedor,
  });
});

/**
 * Actualizar proveedor
 * PUT /api/proveedores/:id
 */
export const actualizarProveedor = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    nombre,
    nombreComercial,
    rnc,
    tipo,
    telefono,
    email,
    direccion,
    personaContacto,
    telefonoContacto,
    banco,
    numeroCuenta,
    tipoCuenta,
    activo,
    notas,
  } = req.body;

  // Verificar que el proveedor existe
  const proveedorExistente = await prisma.proveedor.findUnique({
    where: { id },
  });

  if (!proveedorExistente) {
    throw new AppError('Proveedor no encontrado', 404);
  }

  // Si se está actualizando el RNC, verificar que no esté duplicado
  if (rnc && rnc !== proveedorExistente.rnc) {
    const rncDuplicado = await prisma.proveedor.findUnique({
      where: { rnc },
    });

    if (rncDuplicado) {
      throw new AppError('Ya existe un proveedor con ese RNC', 400);
    }
  }

  const proveedor = await prisma.proveedor.update({
    where: { id },
    data: {
      nombre,
      nombreComercial,
      rnc,
      tipo,
      telefono,
      email,
      direccion,
      personaContacto,
      telefonoContacto,
      banco,
      numeroCuenta,
      tipoCuenta,
      activo,
      notas,
    },
  });

  res.json({
    success: true,
    message: 'Proveedor actualizado exitosamente',
    data: proveedor,
  });
});

/**
 * Evaluar proveedor
 * POST /api/proveedores/:id/evaluar
 */
export const evaluarProveedor = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    gastoId,
    calidad,
    puntualidad,
    precioJusto,
    comunicacion,
    comentarios,
    evaluadoPor,
  } = req.body;

  // Validaciones
  if (!calidad || !puntualidad || !precioJusto || !comunicacion || !evaluadoPor) {
    throw new AppError('Faltan campos requeridos para la evaluación', 400);
  }

  // Verificar que las calificaciones estén en rango 1-5
  if (
    calidad < 1 || calidad > 5 ||
    puntualidad < 1 || puntualidad > 5 ||
    precioJusto < 1 || precioJusto > 5 ||
    comunicacion < 1 || comunicacion > 5
  ) {
    throw new AppError('Las calificaciones deben estar entre 1 y 5', 400);
  }

  // Verificar que el proveedor existe
  const proveedor = await prisma.proveedor.findUnique({
    where: { id },
  });

  if (!proveedor) {
    throw new AppError('Proveedor no encontrado', 404);
  }

  // Calcular promedio general
  const promedioGeneral = (calidad + puntualidad + precioJusto + comunicacion) / 4;

  // Crear evaluación
  const evaluacion = await prisma.evaluacionProveedor.create({
    data: {
      proveedorId: id,
      gastoId,
      calidad,
      puntualidad,
      precioJusto,
      comunicacion,
      promedioGeneral,
      comentarios,
      evaluadoPor,
    },
  });

  // Actualizar calificación promedio del proveedor
  const todasLasEvaluaciones = await prisma.evaluacionProveedor.findMany({
    where: { proveedorId: id },
    select: { promedioGeneral: true },
  });

  const sumaPromedios = todasLasEvaluaciones.reduce((sum, evaluacion) => {
    return sum + parseFloat(evaluacion.promedioGeneral.toString());
  }, 0);

  const calificacionPromedio = sumaPromedios / todasLasEvaluaciones.length;

  await prisma.proveedor.update({
    where: { id },
    data: {
      calificacion: calificacionPromedio,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Evaluación registrada exitosamente',
    data: evaluacion,
  });
});
