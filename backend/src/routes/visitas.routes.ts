/**
 * ========================================
 * CONTROL DE VISITAS ROUTES
 * Sistema de Garita de Seguridad
 * ========================================
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/requireRole';
import { VisitasService } from '../services/seguridad/VisitasService';

const router = Router();
const visitasService = new VisitasService();

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * @route   GET /api/v1/visitas
 * @desc    Obtener todas las visitas (con filtros)
 * @access  Admin, Seguridad
 * @query   condominioId, unidadId, estado, tipo, fecha
 */
router.get('/', requireRole(['admin', 'tecnico']), async (req, res, next) => {
  try {
    const { condominioId, unidadId, estado, tipo, fecha } = req.query;
    const visitas = await visitasService.obtenerVisitas({
      condominioId: condominioId as string,
      unidadId: unidadId as string,
      estado: estado as any,
      tipo: tipo as any,
      fecha: fecha as string,
    });
    res.json({ success: true, data: visitas });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/visitas/mis-visitas
 * @desc    Obtener visitas de mi unidad
 * @access  Propietario
 */
router.get('/mis-visitas', async (req, res, next) => {
  try {
    // Obtener unidad del usuario
    const visitas = await visitasService.obtenerVisitasUsuario(req.user!.id);
    res.json({ success: true, data: visitas });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/visitas/activas
 * @desc    Obtener visitas activas (en el condominio ahora)
 * @access  Admin, Seguridad
 */
router.get('/activas', requireRole(['admin', 'tecnico']), async (req, res, next) => {
  try {
    const { condominioId } = req.query;
    const visitas = await visitasService.obtenerVisitasActivas(condominioId as string);
    res.json({ success: true, data: visitas });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/visitas/pre-autorizar
 * @desc    Pre-autorizar una visita (propietario)
 * @access  Propietario
 */
router.post('/pre-autorizar', async (req, res, next) => {
  try {
    const visita = await visitasService.preAutorizarVisita({
      ...req.body,
      autorizadoPor: req.user!.id,
    });
    res.status(201).json({ success: true, data: visita });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/visitas/registrar-llegada
 * @desc    Registrar llegada de visita (guardia de seguridad)
 * @access  Admin, Técnico
 */
router.post(
  '/registrar-llegada',
  requireRole(['admin', 'tecnico']),
  async (req, res, next) => {
    try {
      const visita = await visitasService.registrarLlegada({
        ...req.body,
        registradoPor: req.user!.id,
      });
      res.status(201).json({ success: true, data: visita });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   PUT /api/v1/visitas/:id/autorizar
 * @desc    Autorizar ingreso de visita
 * @access  Propietario, Admin
 */
router.put('/:id/autorizar', async (req, res, next) => {
  try {
    const visita = await visitasService.autorizarIngreso(
      req.params.id,
      req.user!.id
    );
    res.json({ success: true, data: visita });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/v1/visitas/:id/rechazar
 * @desc    Rechazar ingreso de visita
 * @access  Propietario, Admin
 */
router.put('/:id/rechazar', async (req, res, next) => {
  try {
    const { motivoRechazo } = req.body;
    const visita = await visitasService.rechazarIngreso(
      req.params.id,
      req.user!.id,
      motivoRechazo
    );
    res.json({ success: true, data: visita });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/v1/visitas/:id/registrar-salida
 * @desc    Registrar salida de visita (guardia)
 * @access  Admin, Técnico
 */
router.put(
  '/:id/registrar-salida',
  requireRole(['admin', 'tecnico']),
  async (req, res, next) => {
    try {
      const visita = await visitasService.registrarSalida(req.params.id);
      res.json({ success: true, data: visita });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/v1/visitas/frecuentes/:unidadId
 * @desc    Obtener visitas frecuentes de una unidad
 * @access  Propietario, Admin
 */
router.get('/frecuentes/:unidadId', async (req, res, next) => {
  try {
    const visitasFrecuentes = await visitasService.obtenerVisitasFrecuentes(
      req.params.unidadId
    );
    res.json({ success: true, data: visitasFrecuentes });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/visitas/frecuentes
 * @desc    Registrar visita frecuente (empleada doméstica, familiar, etc)
 * @access  Propietario
 */
router.post('/frecuentes', async (req, res, next) => {
  try {
    const visitaFrecuente = await visitasService.crearVisitaFrecuente({
      ...req.body,
      autorizadoPor: req.user!.id,
    });
    res.status(201).json({ success: true, data: visitaFrecuente });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/v1/visitas/frecuentes/:id/desactivar
 * @desc    Desactivar autorización permanente
 * @access  Propietario, Admin
 */
router.put('/frecuentes/:id/desactivar', async (req, res, next) => {
  try {
    const visitaFrecuente = await visitasService.desactivarVisitaFrecuente(
      req.params.id
    );
    res.json({ success: true, data: visitaFrecuente });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/visitas/reportes/estadisticas
 * @desc    Estadísticas de visitas
 * @access  Admin
 */
router.get(
  '/reportes/estadisticas',
  requireRole(['admin']),
  async (req, res, next) => {
    try {
      const { condominioId, fechaInicio, fechaFin } = req.query;
      const estadisticas = await visitasService.obtenerEstadisticas({
        condominioId: condominioId as string,
        fechaInicio: fechaInicio as string,
        fechaFin: fechaFin as string,
      });
      res.json({ success: true, data: estadisticas });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
