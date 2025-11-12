// ========================================
// IA ROUTES
// Facturas IA y Predicciones ML
// ========================================

import { Router } from 'express';
import { IAController } from '../controllers';

const router = Router();

// ========================================
// FACTURAS IA
// ========================================

/**
 * @route   POST /api/v1/ia/facturas/procesar
 * @desc    Procesar factura con OCR + Claude
 */
router.post('/facturas/procesar', IAController.procesarFactura.bind(IAController));

/**
 * @route   PUT /api/v1/ia/facturas/:facturaIAId/validar
 * @desc    Validar factura procesada por IA
 */
router.put('/facturas/:facturaIAId/validar', IAController.validarFactura.bind(IAController));

/**
 * @route   GET /api/v1/ia/facturas
 * @desc    Obtener facturas procesadas
 * @query   validada, confianzaMinima
 */
router.get('/facturas', IAController.obtenerFacturasProcesadas.bind(IAController));

/**
 * @route   POST /api/v1/ia/sentimiento
 * @desc    Analizar sentimiento de texto
 */
router.post('/sentimiento', IAController.analizarSentimiento.bind(IAController));

// ========================================
// PREDICCIONES ML
// ========================================

/**
 * @route   POST /api/v1/ia/predicciones/:condominioId/gastos
 * @desc    Predecir gastos mensuales
 * @query   meses (cantidad de meses a proyectar)
 */
router.post('/predicciones/:condominioId/gastos', IAController.predecirGastosMensuales.bind(IAController));

/**
 * @route   POST /api/v1/ia/predicciones/:condominioId/morosidad
 * @desc    Predecir tasa de morosidad
 */
router.post('/predicciones/:condominioId/morosidad', IAController.predecirTasaMorosidad.bind(IAController));

/**
 * @route   GET /api/v1/ia/predicciones/:condominioId/tendencias
 * @desc    Analizar tendencias del condominio
 */
router.get('/predicciones/:condominioId/tendencias', IAController.analizarTendencias.bind(IAController));

/**
 * @route   GET /api/v1/ia/predicciones/:condominioId/insights
 * @desc    Generar insights automáticos
 */
router.get('/predicciones/:condominioId/insights', IAController.generarInsights.bind(IAController));

/**
 * @route   GET /api/v1/ia/predicciones/:condominioId
 * @desc    Obtener historial de predicciones
 * @query   tipo (gastos_mensuales, tasa_morosidad)
 */
router.get('/predicciones/:condominioId', IAController.obtenerPredicciones.bind(IAController));

export default router;
