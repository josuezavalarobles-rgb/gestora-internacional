/**
 * Controlador de Usuarios
 */

import { Request, Response } from 'express';
import { getPrismaClient } from '../config/database/postgres';
import { asyncHandler } from '../middleware/errorHandler';

const prisma = getPrismaClient();

export const obtenerTecnicos = asyncHandler(async (req: Request, res: Response) => {
  const tecnicos = await prisma.usuario.findMany({
    where: {
      tipoUsuario: 'tecnico',
      estado: 'activo',
    },
    select: {
      id: true,
      nombreCompleto: true,
      telefono: true,
      email: true,
    },
  });

  res.json(tecnicos);
});

export const obtenerUsuarios = asyncHandler(async (req: Request, res: Response) => {
  const usuarios = await prisma.usuario.findMany({
    include: {
      condominio: true,
    },
  });

  res.json(usuarios);
});
