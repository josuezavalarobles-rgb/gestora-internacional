/**
 * EXCEL IMPORT SERVICE - STUB
 * TEMPORARILY DISABLED - Implementation needs to be fixed
 */

import { logger } from '../../utils/logger';

export interface ImportResult {
  success: boolean;
  totalRows: number;
  importedRows: number;
  failedRows: number;
  errors: Array<{ row: number; error: string }>;
  data?: any[];
}

export class ExcelImportService {
  private static instance: ExcelImportService;

  private constructor() {}

  public static getInstance(): ExcelImportService {
    if (!ExcelImportService.instance) {
      ExcelImportService.instance = new ExcelImportService();
    }
    return ExcelImportService.instance;
  }

  async importarDesdeExcel(filePath: string, tipo: string): Promise<ImportResult> {
    logger.warn('ExcelImportService.importarDesdeExcel - NOT IMPLEMENTED');
    return {
      success: false,
      totalRows: 0,
      importedRows: 0,
      failedRows: 0,
      errors: [{ row: 0, error: 'Not implemented' }],
    };
  }

  async validarArchivo(filePath: string): Promise<boolean> {
    logger.warn('ExcelImportService.validarArchivo - NOT IMPLEMENTED');
    return false;
  }

  async importarPropietarios(filePath: string): Promise<ImportResult> {
    logger.warn('ExcelImportService.importarPropietarios - NOT IMPLEMENTED');
    return {
      success: false,
      totalRows: 0,
      importedRows: 0,
      failedRows: 0,
      errors: [{ row: 0, error: 'Not implemented' }],
    };
  }

  async importarTecnicos(filePath: string): Promise<ImportResult> {
    logger.warn('ExcelImportService.importarTecnicos - NOT IMPLEMENTED');
    return {
      success: false,
      totalRows: 0,
      importedRows: 0,
      failedRows: 0,
      errors: [{ row: 0, error: 'Not implemented' }],
    };
  }

  async importarCasos(filePath: string): Promise<ImportResult> {
    logger.warn('ExcelImportService.importarCasos - NOT IMPLEMENTED');
    return {
      success: false,
      totalRows: 0,
      importedRows: 0,
      failedRows: 0,
      errors: [{ row: 0, error: 'Not implemented' }],
    };
  }
}

/* ORIGINAL IMPLEMENTATION COMMENTED OUT - NEEDS FIX */
