import { Router } from 'express';
import {
  obtenerTodosCasos,
  obtenerCasoPorId,
  crearCaso,
  asignarTecnico,
  actualizarEstado
} from '../controllers/casos.controller';

const router = Router();

router.get('/', obtenerTodosCasos);
router.get('/:id', obtenerCasoPorId);
router.post('/', crearCaso);
router.put('/:id/asignar', asignarTecnico);
router.put('/:id/estado', actualizarEstado);

export default router;
