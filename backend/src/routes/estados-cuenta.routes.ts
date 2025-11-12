// ========================================
// ESTADOS DE CUENTA ROUTES
// ========================================

import { Router } from 'express';
import { EstadosCuentaController } from '../controllers';

const router = Router();

/**
 * @route   POST /api/v1/estados-cuenta
 * @desc    Crear estado de cuenta
 */
router.post('/', EstadosCuentaController.crear.bind(EstadosCuentaController));

/**
 * @route   POST /api/v1/estados-cuenta/transaccion
 * @desc    Registrar transacción
 */
router.post('/transaccion', EstadosCuentaController.registrarTransaccion.bind(EstadosCuentaController));

/**
 * @route   POST /api/v1/estados-cuenta/distribuir
 * @desc    Procesar distribución de gastos del periodo
 */
router.post('/distribuir', EstadosCuentaController.procesarDistribucion.bind(EstadosCuentaController));

/**
 * @route   POST /api/v1/estados-cuenta/pago
 * @desc    Registrar pago de propietario
 */
router.post('/pago', EstadosCuentaController.registrarPago.bind(EstadosCuentaController));

/**
 * @route   GET /api/v1/estados-cuenta
 * @desc    Obtener estado de cuenta por unidad y periodo
 * @query   unidadId, periodo
 */
router.get('/', EstadosCuentaController.obtener.bind(EstadosCuentaController));

/**
 * @route   GET /api/v1/estados-cuenta/historial/:unidadId
 * @desc    Obtener historial de estados de cuenta
 */
router.get('/historial/:unidadId', EstadosCuentaController.obtenerHistorial.bind(EstadosCuentaController));

/**
 * @route   GET /api/v1/estados-cuenta/morosas
 * @desc    Obtener unidades morosas
 * @query   condominioId, periodo
 */
router.get('/morosas', EstadosCuentaController.obtenerMorosas.bind(EstadosCuentaController));

/**
 * @route   GET /api/v1/estados-cuenta/reporte-recaudacion
 * @desc    Generar reporte de recaudación
 * @query   condominioId, periodo
 */
router.get('/reporte-recaudacion', EstadosCuentaController.generarReporteRecaudacion.bind(EstadosCuentaController));

/**
 * @route   GET /api/v1/estados-cuenta/recordatorios
 * @desc    Generar recordatorios de pago
 * @query   condominioId, periodo
 */
router.get('/recordatorios', EstadosCuentaController.generarRecordatorios.bind(EstadosCuentaController));

export default router;
