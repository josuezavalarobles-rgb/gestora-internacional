// ========================================
// RUTAS DE APROBACIONES
// ========================================

import { Router } from 'express';
import AprobacionesController from '../controllers/aprobaciones.controller';

const router = Router();

// CRUD de aprobaciones
router.post('/', AprobacionesController.solicitarAprobacion.bind(AprobacionesController));
router.get('/', AprobacionesController.obtenerTodas.bind(AprobacionesController));
router.get('/pendientes', AprobacionesController.obtenerPendientes.bind(AprobacionesController));
router.get('/caso/:casoId', AprobacionesController.obtenerPorCaso.bind(AprobacionesController));
router.get('/tecnico/:tecnicoId', AprobacionesController.obtenerPorTecnico.bind(AprobacionesController));
router.get('/:aprobacionId', AprobacionesController.obtenerPorId.bind(AprobacionesController));

// Acciones sobre aprobaciones
router.put('/:aprobacionId/aprobar', AprobacionesController.aprobar.bind(AprobacionesController));
router.put('/:aprobacionId/rechazar', AprobacionesController.rechazar.bind(AprobacionesController));
router.put('/:aprobacionId/solicitar-info', AprobacionesController.solicitarInfo.bind(AprobacionesController));
router.put('/:aprobacionId', AprobacionesController.actualizarAprobacion.bind(AprobacionesController));
router.delete('/:aprobacionId', AprobacionesController.eliminarAprobacion.bind(AprobacionesController));

// Estadísticas
router.get('/stats/resumen', AprobacionesController.obtenerEstadisticas.bind(AprobacionesController));

export default router;
