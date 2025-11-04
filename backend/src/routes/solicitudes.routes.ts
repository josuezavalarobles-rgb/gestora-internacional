import { Router } from 'express';
import {
  crearSolicitudWhatsApp,
  obtenerSolicitudes,
  obtenerSolicitudPorCodigo,
  actualizarEstadoSolicitud,
  obtenerEstadisticasSolicitudes,
  calificarSolicitud
} from '../controllers/solicitudes.controller';

const router = Router();

// Crear solicitud desde WhatsApp
router.post('/whatsapp', crearSolicitudWhatsApp);

// Obtener todas las solicitudes con filtros
router.get('/', obtenerSolicitudes);

// Obtener estadísticas
router.get('/estadisticas', obtenerEstadisticasSolicitudes);

// Obtener solicitud por código único
router.get('/codigo/:codigo', obtenerSolicitudPorCodigo);

// Actualizar estado de solicitud
router.patch('/:id/estado', actualizarEstadoSolicitud);

// Calificar solicitud
router.post('/:id/calificar', calificarSolicitud);

export default router;
