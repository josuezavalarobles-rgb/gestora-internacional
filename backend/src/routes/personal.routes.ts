/**
 * ========================================
 * PERSONAL Y NÓMINA ROUTES
 * ========================================
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/requireRole';
import { NominaService } from '../services/rrhh/NominaService';

const router = Router();
const nominaService = new NominaService();

// Todas las rutas requieren autenticación y rol admin
router.use(authenticate);
router.use(requireRole(['admin']));

// ========================================
// PERSONAL
// ========================================

/**
 * @route   GET /api/v1/personal
 * @desc    Obtener todo el personal
 * @access  Admin
 */
router.get('/', async (req, res, next) => {
  try {
    const { organizacionId, tipo, estado } = req.query;
    const personal = await nominaService.obtenerPersonal({
      organizacionId: organizacionId as string,
      tipo: tipo as any,
      estado: estado as any,
    });
    res.json({ success: true, data: personal });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/personal/:id
 * @desc    Obtener detalle de un empleado
 * @access  Admin
 */
router.get('/:id', async (req, res, next) => {
  try {
    const empleado = await nominaService.obtenerEmpleadoPorId(req.params.id);
    res.json({ success: true, data: empleado });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/personal
 * @desc    Registrar nuevo empleado
 * @access  Admin
 */
router.post('/', async (req, res, next) => {
  try {
    const empleado = await nominaService.crearEmpleado(req.body);
    res.status(201).json({ success: true, data: empleado });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/v1/personal/:id
 * @desc    Actualizar datos de empleado
 * @access  Admin
 */
router.put('/:id', async (req, res, next) => {
  try {
    const empleado = await nominaService.actualizarEmpleado(req.params.id, req.body);
    res.json({ success: true, data: empleado });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/v1/personal/:id/desactivar
 * @desc    Desactivar empleado (despido/renuncia)
 * @access  Admin
 */
router.put('/:id/desactivar', async (req, res, next) => {
  try {
    const { fechaSalida, motivo } = req.body;
    const empleado = await nominaService.desactivarEmpleado(
      req.params.id,
      fechaSalida,
      motivo
    );
    res.json({ success: true, data: empleado });
  } catch (error) {
    next(error);
  }
});

// ========================================
// NÓMINA
// ========================================

/**
 * @route   GET /api/v1/personal/nominas
 * @desc    Obtener nóminas (con filtros)
 * @access  Admin
 */
router.get('/nominas/listado', async (req, res, next) => {
  try {
    const { periodo, personalId, pagado } = req.query;
    const nominas = await nominaService.obtenerNominas({
      periodo: periodo as string,
      personalId: personalId as string,
      pagado: pagado === 'true',
    });
    res.json({ success: true, data: nominas });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/personal/:personalId/nominas
 * @desc    Obtener historial de nóminas de un empleado
 * @access  Admin
 */
router.get('/:personalId/nominas', async (req, res, next) => {
  try {
    const nominas = await nominaService.obtenerNominasEmpleado(req.params.personalId);
    res.json({ success: true, data: nominas });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/personal/nominas/generar
 * @desc    Generar nómina mensual para todos los empleados
 * @access  Admin
 */
router.post('/nominas/generar', async (req, res, next) => {
  try {
    const { periodo, organizacionId } = req.body;
    const nominas = await nominaService.generarNominaMensual(
      periodo,
      organizacionId,
      req.user!.id
    );
    res.status(201).json({
      success: true,
      data: nominas,
      message: `${nominas.length} nóminas generadas`,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/personal/:personalId/nominas
 * @desc    Crear nómina individual
 * @access  Admin
 */
router.post('/:personalId/nominas', async (req, res, next) => {
  try {
    const nomina = await nominaService.crearNomina({
      ...req.body,
      personalId: req.params.personalId,
      creadoPor: req.user!.id,
    });
    res.status(201).json({ success: true, data: nomina });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/v1/personal/nominas/:nominaId/marcar-pagada
 * @desc    Marcar nómina como pagada
 * @access  Admin
 */
router.put('/nominas/:nominaId/marcar-pagada', async (req, res, next) => {
  try {
    const nomina = await nominaService.marcarNominaPagada(req.params.nominaId);
    res.json({ success: true, data: nomina });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/personal/reportes/costos-laborales
 * @desc    Reporte de costos laborales
 * @access  Admin
 */
router.get('/reportes/costos-laborales', async (req, res, next) => {
  try {
    const { organizacionId, periodo } = req.query;
    const reporte = await nominaService.obtenerReporteCostosLaborales({
      organizacionId: organizacionId as string,
      periodo: periodo as string,
    });
    res.json({ success: true, data: reporte });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/personal/:personalId/comprobante-pago/:nominaId
 * @desc    Generar comprobante de pago (PDF)
 * @access  Admin
 */
router.get('/:personalId/comprobante-pago/:nominaId', async (req, res, next) => {
  try {
    const pdf = await nominaService.generarComprobantePago(
      req.params.personalId,
      req.params.nominaId
    );
    res.json({ success: true, data: { pdfUrl: pdf } });
  } catch (error) {
    next(error);
  }
});

export default router;
