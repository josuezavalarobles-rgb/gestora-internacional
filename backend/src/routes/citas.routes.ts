// ========================================
// RUTAS DE CITAS
// ========================================

import { Router } from 'express';
import CitasController from '../controllers/citas.controller';

const router = Router();

// Bloques horarios
router.post('/bloques/inicializar', CitasController.inicializarBloques.bind(CitasController));
router.get('/bloques', CitasController.obtenerBloques.bind(CitasController));

// Disponibilidad
router.get('/disponibilidad/:fecha', CitasController.obtenerDisponibilidad.bind(CitasController));

// CRUD de citas
router.post('/', CitasController.programarCita.bind(CitasController));
router.get('/pendientes', CitasController.obtenerPendientes.bind(CitasController));
router.get('/dia/:fecha', CitasController.obtenerCitasDelDia.bind(CitasController));
router.get('/tecnico/:tecnicoId', CitasController.obtenerCitasPorTecnico.bind(CitasController));
router.get('/:citaId', CitasController.obtenerCitaPorId.bind(CitasController));

// Confirmaciones
router.put('/:citaId/confirmar-propietario', CitasController.confirmarPropietario.bind(CitasController));
router.put('/:citaId/confirmar-ingenieria', CitasController.confirmarIngenieria.bind(CitasController));

// Gestión de citas
router.put('/:citaId/reprogramar', CitasController.reprogramarCita.bind(CitasController));
router.put('/:citaId/cancelar', CitasController.cancelarCita.bind(CitasController));
router.put('/:citaId/completar', CitasController.completarCita.bind(CitasController));
router.put('/:citaId/no-realizada', CitasController.noRealizarCita.bind(CitasController));

// Estadísticas
router.get('/stats/resumen', CitasController.obtenerEstadisticas.bind(CitasController));

export default router;
