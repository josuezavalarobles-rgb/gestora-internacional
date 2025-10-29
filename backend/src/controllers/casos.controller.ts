/**
 * Controlador de Casos
 */

import { Request, Response } from 'express';
import { CasoService } from '../services/casos/CasoService';
import { asyncHandler } from '../middleware/errorHandler';

const casoService = new CasoService();

export const obtenerTodosCasos = asyncHandler(async (req: Request, res: Response) => {
  const casos = await casoService.obtenerCasos();
  res.json(casos);
});

export const obtenerCasoPorId = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const caso = await casoService.obtenerCasoPorId(id);
  res.json(caso);
});

export const crearCaso = asyncHandler(async (req: Request, res: Response) => {
  // TODO: Implementar creación manual de caso
  res.json({ message: 'Crear caso - Por implementar' });
});

export const asignarTecnico = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { tecnicoId } = req.body;

  await casoService.asignarTecnico(id, tecnicoId);
  const caso = await casoService.obtenerCasoPorId(id);

  res.json({ success: true, caso });
});

export const actualizarEstado = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { estado, notas } = req.body;

  await casoService.actualizarEstado(id, estado, notas);
  const caso = await casoService.obtenerCasoPorId(id);

  res.json({ success: true, caso });
});
