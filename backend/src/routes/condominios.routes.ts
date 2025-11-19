import { Router } from 'express';
import {
  obtenerCondominios,
  obtenerCondominioById,
  crearCondominio,
  actualizarCondominio,
  obtenerEstadisticasCondominio,
} from '../controllers/condominios.controller';

const router = Router();

router.get('/', obtenerCondominios);
router.get('/:id', obtenerCondominioById);
router.post('/', crearCondominio);
router.put('/:id', actualizarCondominio);
router.get('/:id/estadisticas', obtenerEstadisticasCondominio);

export default router;
