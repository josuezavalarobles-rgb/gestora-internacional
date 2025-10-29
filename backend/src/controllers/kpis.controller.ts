/**
 * Controlador de KPIs
 */

import { Request, Response } from 'express';
import { getPrismaClient } from '../config/database/postgres';
import { asyncHandler } from '../middleware/errorHandler';

const prisma = getPrismaClient();

export const obtenerDashboard = asyncHandler(async (req: Request, res: Response) => {
  // Contar casos por estado
  const casosNuevos = await prisma.caso.count({ where: { estado: 'nuevo' } });
  const casosEnProceso = await prisma.caso.count({
    where: { estado: { in: ['asignado', 'en_proceso', 'en_visita'] } }
  });
  const casosResueltos = await prisma.caso.count({
    where: { estado: { in: ['resuelto', 'cerrado'] } }
  });

  // Calcular satisfacción promedio
  const casosConSatisfaccion = await prisma.caso.findMany({
    where: { satisfaccionCliente: { not: null } },
    select: { satisfaccionCliente: true },
  });

  const satisfaccionPromedio = casosConSatisfaccion.length > 0
    ? casosConSatisfaccion.reduce((sum, c) => sum + (c.satisfaccionCliente || 0), 0) / casosConSatisfaccion.length
    : 0;

  res.json({
    casosNuevos,
    casosEnProceso,
    casosResueltos,
    satisfaccionPromedio: Math.round(satisfaccionPromedio * 10) / 10,
    tiempoRespuestaPromedio: 120, // Mock - calcular después
  });
});
