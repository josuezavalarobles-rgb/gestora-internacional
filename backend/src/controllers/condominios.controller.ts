/**
 * Controlador de Condominios
 */

import { Request, Response } from 'express';
import { getPrismaClient } from '../config/database/postgres';
import { asyncHandler } from '../middleware/errorHandler';

const prisma = getPrismaClient();

export const obtenerCondominios = asyncHandler(async (req: Request, res: Response) => {
  const condominios = await prisma.condominio.findMany({
    where: {
      estado: 'activo',
    },
    select: {
      id: true,
      nombre: true,
      direccion: true,
      ciudad: true,
      provincia: true,
      telefono: true,
      email: true,
      totalUnidades: true,
      estado: true,
    },
  });

  res.json(condominios);
});

export const obtenerCondominioById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const condominio = await prisma.condominio.findUnique({
    where: { id },
    include: {
      usuarios: {
        select: {
          id: true,
          nombreCompleto: true,
          telefono: true,
          email: true,
          tipoUsuario: true,
          unidad: true,
        },
      },
      casos: {
        take: 10,
        orderBy: {
          fechaCreacion: 'desc',
        },
        select: {
          id: true,
          numeroCaso: true,
          tipo: true,
          categoria: true,
          estado: true,
          prioridad: true,
          fechaCreacion: true,
        },
      },
    },
  });

  if (!condominio) {
    return res.status(404).json({ error: 'Condominio no encontrado' });
  }

  res.json(condominio);
});

export const crearCondominio = asyncHandler(async (req: Request, res: Response) => {
  const {
    nombre,
    direccion,
    ciudad,
    provincia,
    codigoPostal,
    telefono,
    email,
    totalUnidades,
    slaGarantia,
    slaCondominio,
  } = req.body;

  const condominio = await prisma.condominio.create({
    data: {
      nombre,
      direccion,
      ciudad,
      provincia,
      codigoPostal,
      telefono,
      email,
      totalUnidades: parseInt(totalUnidades),
      slaGarantia: slaGarantia || 24,
      slaCondominio: slaCondominio || 72,
      estado: 'activo',
    },
  });

  res.status(201).json(condominio);
});

export const actualizarCondominio = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;

  const condominio = await prisma.condominio.update({
    where: { id },
    data: updateData,
  });

  res.json(condominio);
});

export const obtenerEstadisticasCondominio = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Total de casos
  const totalCasos = await prisma.caso.count({
    where: { condominioId: id },
  });

  // Casos por estado
  const casosPorEstado = await prisma.caso.groupBy({
    by: ['estado'],
    where: { condominioId: id },
    _count: true,
  });

  // Casos por prioridad
  const casosPorPrioridad = await prisma.caso.groupBy({
    by: ['prioridad'],
    where: { condominioId: id },
    _count: true,
  });

  // Total de usuarios
  const totalUsuarios = await prisma.usuario.count({
    where: { condominioId: id },
  });

  // Usuarios por tipo
  const usuariosPorTipo = await prisma.usuario.groupBy({
    by: ['tipoUsuario'],
    where: { condominioId: id },
    _count: true,
  });

  // Satisfacción promedio
  const casosConSatisfaccion = await prisma.caso.aggregate({
    where: {
      condominioId: id,
      satisfaccionCliente: { not: null },
    },
    _avg: {
      satisfaccionCliente: true,
    },
    _count: true,
  });

  res.json({
    totalCasos,
    casosPorEstado,
    casosPorPrioridad,
    totalUsuarios,
    usuariosPorTipo,
    satisfaccionPromedio: casosConSatisfaccion._avg.satisfaccionCliente || 0,
    totalEncuestasRespondidas: casosConSatisfaccion._count,
  });
});
