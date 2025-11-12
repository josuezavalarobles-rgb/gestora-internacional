// ========================================
// IA CONTROLLER
// Facturas IA y Predicciones ML
// ========================================

import { Request, Response } from 'express';
import { FacturaIAService, PrediccionIAService } from '../services';
import { logger } from '../utils/logger';

const facturaIAService = FacturaIAService.getInstance();
const prediccionIAService = PrediccionIAService.getInstance();

export class IAController {
  // ========================================
  // FACTURAS IA
  // ========================================

  async procesarFactura(req: Request, res: Response): Promise<void> {
    try {
      const { gastoId, rutaArchivo } = req.body;

      const resultado = await facturaIAService.procesarFactura(gastoId, rutaArchivo);

      res.status(201).json(resultado);
    } catch (error) {
      logger.error('Error en IAController.procesarFactura:', error);
      res.status(500).json({ error: 'Error al procesar factura con IA' });
    }
  }

  async validarFactura(req: Request, res: Response): Promise<void> {
    try {
      const { facturaIAId } = req.params;
      const { validadoPor, datosCorregidos } = req.body;

      const factura = await facturaIAService.validarFactura(
        facturaIAId,
        validadoPor,
        datosCorregidos
      );

      res.json(factura);
    } catch (error) {
      logger.error('Error en IAController.validarFactura:', error);
      res.status(500).json({ error: 'Error al validar factura' });
    }
  }

  async obtenerFacturasProcesadas(req: Request, res: Response): Promise<void> {
    try {
      const { validada, confianzaMinima } = req.query;

      const facturas = await facturaIAService.obtenerFacturasProcesadas({
        validada: validada ? validada === 'true' : undefined,
        confianzaMinima: confianzaMinima ? parseFloat(confianzaMinima as string) : undefined,
      });

      res.json(facturas);
    } catch (error) {
      logger.error('Error en IAController.obtenerFacturasProcesadas:', error);
      res.status(500).json({ error: 'Error al obtener facturas procesadas' });
    }
  }

  async analizarSentimiento(req: Request, res: Response): Promise<void> {
    try {
      const { texto } = req.body;

      const resultado = await facturaIAService.analizarSentimientoNotas(texto);

      res.json(resultado);
    } catch (error) {
      logger.error('Error en IAController.analizarSentimiento:', error);
      res.status(500).json({ error: 'Error al analizar sentimiento' });
    }
  }

  // ========================================
  // PREDICCIONES ML
  // ========================================

  async predecirGastosMensuales(req: Request, res: Response): Promise<void> {
    try {
      const { condominioId } = req.params;
      const mesesProyeccion = parseInt(req.query.meses as string) || 3;

      const prediccion = await prediccionIAService.predecirGastosMensuales(
        condominioId,
        mesesProyeccion
      );

      res.json(prediccion);
    } catch (error) {
      logger.error('Error en IAController.predecirGastosMensuales:', error);
      res.status(500).json({ error: 'Error al predecir gastos mensuales' });
    }
  }

  async predecirTasaMorosidad(req: Request, res: Response): Promise<void> {
    try {
      const { condominioId } = req.params;

      const prediccion = await prediccionIAService.predecirTasaMorosidad(condominioId);

      res.json(prediccion);
    } catch (error) {
      logger.error('Error en IAController.predecirTasaMorosidad:', error);
      res.status(500).json({ error: 'Error al predecir tasa de morosidad' });
    }
  }

  async analizarTendencias(req: Request, res: Response): Promise<void> {
    try {
      const { condominioId } = req.params;

      const analisis = await prediccionIAService.analizarTendencias(condominioId);

      res.json(analisis);
    } catch (error) {
      logger.error('Error en IAController.analizarTendencias:', error);
      res.status(500).json({ error: 'Error al analizar tendencias' });
    }
  }

  async generarInsights(req: Request, res: Response): Promise<void> {
    try {
      const { condominioId } = req.params;

      const insights = await prediccionIAService.generarInsights(condominioId);

      res.json({ insights });
    } catch (error) {
      logger.error('Error en IAController.generarInsights:', error);
      res.status(500).json({ error: 'Error al generar insights' });
    }
  }

  async obtenerPredicciones(req: Request, res: Response): Promise<void> {
    try {
      const { condominioId } = req.params;
      const { tipo } = req.query;

      const predicciones = await prediccionIAService.obtenerPredicciones(
        condominioId,
        tipo as string
      );

      res.json(predicciones);
    } catch (error) {
      logger.error('Error en IAController.obtenerPredicciones:', error);
      res.status(500).json({ error: 'Error al obtener predicciones' });
    }
  }
}

export default new IAController();
