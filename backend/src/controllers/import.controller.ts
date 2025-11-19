/**
 * ========================================
 * IMPORT CONTROLLER
 * Importación masiva de datos desde Excel
 * ========================================
 */

import { Request, Response } from 'express';
import { ExcelImportService } from '../services/import/ExcelImportService';
import { logger } from '../utils/logger';
import fs from 'fs/promises';

const importService = ExcelImportService.getInstance();

/**
 * Importar propietarios desde Excel
 * POST /api/v1/import/propietarios
 */
export const importarPropietarios = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se ha proporcionado ningún archivo',
      });
    }

    logger.info(`📥 Importando propietarios desde: ${req.file.path}`);

    const resultado = await importService.importarPropietarios(req.file.path);

    // Eliminar archivo temporal después de procesarlo
    try {
      await fs.unlink(req.file.path);
    } catch (error) {
      logger.warn('⚠️  No se pudo eliminar archivo temporal:', error);
    }

    res.status(200).json({
      success: true,
      message: `Importación completada: ${resultado.importedRows} de ${resultado.totalRows} registros`,
      data: resultado,
    });
  } catch (error) {
    logger.error('❌ Error al importar propietarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al importar propietarios',
      error: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
};

/**
 * Importar proveedores desde Excel
 * POST /api/v1/import/proveedores
 * NOTA: Método no implementado en ExcelImportService
 */
export const importarProveedores = async (req: Request, res: Response) => {
  try {
    // TODO: Implementar importarProveedores en ExcelImportService
    res.status(501).json({
      success: false,
      message: 'Importación de proveedores no implementada todavía',
    });
  } catch (error) {
    logger.error('❌ Error al importar proveedores:', error);
    res.status(500).json({
      success: false,
      message: 'Error al importar proveedores',
      error: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
};

/**
 * Importar técnicos desde Excel
 * POST /api/v1/import/tecnicos
 */
export const importarTecnicos = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se ha proporcionado ningún archivo',
      });
    }

    logger.info(`📥 Importando técnicos desde: ${req.file.path}`);

    const resultado = await importService.importarTecnicos(req.file.path);

    // Eliminar archivo temporal
    try {
      await fs.unlink(req.file.path);
    } catch (error) {
      logger.warn('⚠️  No se pudo eliminar archivo temporal:', error);
    }

    res.status(200).json({
      success: true,
      message: `Importación completada: ${resultado.importedRows} de ${resultado.totalRows} registros`,
      data: resultado,
    });
  } catch (error) {
    logger.error('❌ Error al importar técnicos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al importar técnicos',
      error: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
};

/**
 * Importar casos desde Excel
 * POST /api/v1/import/casos
 */
export const importarCasos = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se ha proporcionado ningún archivo',
      });
    }

    logger.info(`📥 Importando casos desde: ${req.file.path}`);

    const resultado = await importService.importarCasos(req.file.path);

    // Eliminar archivo temporal
    try {
      await fs.unlink(req.file.path);
    } catch (error) {
      logger.warn('⚠️  No se pudo eliminar archivo temporal:', error);
    }

    res.status(200).json({
      success: true,
      message: `Importación completada: ${resultado.importedRows} de ${resultado.totalRows} registros`,
      data: resultado,
    });
  } catch (error) {
    logger.error('❌ Error al importar casos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al importar casos',
      error: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
};

/**
 * Descargar plantilla de Excel para importación
 * GET /api/v1/import/plantilla/:tipo
 * NOTA: Método no implementado en ExcelImportService
 */
export const descargarPlantilla = async (req: Request, res: Response) => {
  try {
    // TODO: Implementar generarPlantilla en ExcelImportService
    res.status(501).json({
      success: false,
      message: 'Generación de plantillas no implementada todavía',
    });
  } catch (error) {
    logger.error('❌ Error al generar plantilla:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar plantilla',
      error: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
};
