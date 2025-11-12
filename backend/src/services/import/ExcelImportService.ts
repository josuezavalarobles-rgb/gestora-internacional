/**
 * ========================================
 * SERVICIO DE IMPORTACIÓN DESDE EXCEL
 * ========================================
 * Permite importar datos masivos desde archivos Excel
 * - Importar propietarios
 * - Importar casos
 * - Importar técnicos
 * - Validación de datos
 */

import ExcelJS from 'exceljs';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../../utils/logger';
import { prisma } from '../../database/prisma';

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

  /**
   * Importar propietarios desde Excel
   */
  public async importarPropietarios(filePath: string): Promise<ImportResult> {
    try {
      logger.info('📥 Importando propietarios desde Excel...');

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);

      const worksheet = workbook.getWorksheet(1);
      if (!worksheet) {
        throw new Error('No se encontró la hoja de cálculo');
      }

      const result: ImportResult = {
        success: true,
        totalRows: 0,
        importedRows: 0,
        failedRows: 0,
        errors: [],
        data: [],
      };

      // Obtener headers (primera fila)
      const headers: string[] = [];
      worksheet.getRow(1).eachCell((cell) => {
        headers.push(cell.text.toLowerCase().trim());
      });

      // Validar headers requeridos
      const requiredHeaders = ['nombre', 'unidad', 'telefono', 'condominio'];
      const missingHeaders = requiredHeaders.filter(h => !headers.some(header => header.includes(h)));

      if (missingHeaders.length > 0) {
        throw new Error(`Faltan columnas requeridas: ${missingHeaders.join(', ')}`);
      }

      // Procesar filas (desde la 2 en adelante)
      const rows: any[] = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Saltar header

        const rowData: any = {};
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber - 1];
          rowData[header] = cell.text;
        });

        rows.push({ rowNumber, data: rowData });
      });

      result.totalRows = rows.length;

      // Importar cada fila
      for (const { rowNumber, data } of rows) {
        try {
          // Buscar o crear condominio
          let condominio = await prisma.condominio.findFirst({
            where: { nombre: { contains: data.condominio || data.edificio, mode: 'insensitive' } },
          });

          if (!condominio) {
            condominio = await prisma.condominio.create({
              data: {
                nombre: data.condominio || data.edificio,
                direccion: '',
                estado: 'activo',
              },
            });
          }

          // Crear propietario
          const propietario = await prisma.usuario.create({
            data: {
              nombreCompleto: data.nombre || data['nombre completo'],
              email: data.email || `propietario${Date.now()}@temp.com`,
              telefono: data.telefono || data.celular,
              password: 'temp123', // Password temporal
              unidad: data.unidad || data.apartamento,
              tipoUsuario: 'propietario',
              condominioId: condominio.id,
              estado: 'activo',
            },
          });

          result.importedRows++;
          result.data?.push(propietario);

          logger.info(`✅ Importado: ${propietario.nombreCompleto} - ${propietario.unidad}`);
        } catch (error: any) {
          result.failedRows++;
          result.errors.push({
            row: rowNumber,
            error: error.message,
          });
          logger.error(`❌ Error en fila ${rowNumber}:`, error.message);
        }
      }

      logger.info(`✅ Importación completada: ${result.importedRows}/${result.totalRows} exitosas`);

      return result;
    } catch (error: any) {
      logger.error('❌ Error importando propietarios:', error);
      return {
        success: false,
        totalRows: 0,
        importedRows: 0,
        failedRows: 0,
        errors: [{ row: 0, error: error.message }],
      };
    }
  }

  /**
   * Importar técnicos desde Excel
   */
  public async importarTecnicos(filePath: string): Promise<ImportResult> {
    try {
      logger.info('📥 Importando técnicos desde Excel...');

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);

      const worksheet = workbook.getWorksheet(1);
      if (!worksheet) {
        throw new Error('No se encontró la hoja de cálculo');
      }

      const result: ImportResult = {
        success: true,
        totalRows: 0,
        importedRows: 0,
        failedRows: 0,
        errors: [],
        data: [],
      };

      // Obtener headers
      const headers: string[] = [];
      worksheet.getRow(1).eachCell((cell) => {
        headers.push(cell.text.toLowerCase().trim());
      });

      // Procesar filas
      const rows: any[] = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;

        const rowData: any = {};
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber - 1];
          rowData[header] = cell.text;
        });

        rows.push({ rowNumber, data: rowData });
      });

      result.totalRows = rows.length;

      for (const { rowNumber, data } of rows) {
        try {
          const tecnico = await prisma.usuario.create({
            data: {
              nombreCompleto: data.nombre || data['nombre completo'],
              email: data.email,
              telefono: data.telefono || data.celular,
              password: 'temp123',
              tipoUsuario: 'tecnico',
              especialidad: data.especialidad || 'general',
              estado: 'activo',
            },
          });

          result.importedRows++;
          result.data?.push(tecnico);

          logger.info(`✅ Técnico importado: ${tecnico.nombreCompleto}`);
        } catch (error: any) {
          result.failedRows++;
          result.errors.push({
            row: rowNumber,
            error: error.message,
          });
        }
      }

      logger.info(`✅ Importación técnicos: ${result.importedRows}/${result.totalRows}`);

      return result;
    } catch (error: any) {
      logger.error('❌ Error importando técnicos:', error);
      return {
        success: false,
        totalRows: 0,
        importedRows: 0,
        failedRows: 0,
        errors: [{ row: 0, error: error.message }],
      };
    }
  }

  /**
   * Importar casos desde Excel
   */
  public async importarCasos(filePath: string): Promise<ImportResult> {
    try {
      logger.info('📥 Importando casos desde Excel...');

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);

      const worksheet = workbook.getWorksheet(1);
      if (!worksheet) {
        throw new Error('No se encontró la hoja de cálculo');
      }

      const result: ImportResult = {
        success: true,
        totalRows: 0,
        importedRows: 0,
        failedRows: 0,
        errors: [],
        data: [],
      };

      const headers: string[] = [];
      worksheet.getRow(1).eachCell((cell) => {
        headers.push(cell.text.toLowerCase().trim());
      });

      const rows: any[] = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;

        const rowData: any = {};
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber - 1];
          rowData[header] = cell.text;
        });

        rows.push({ rowNumber, data: rowData });
      });

      result.totalRows = rows.length;

      for (const { rowNumber, data } of rows) {
        try {
          // Buscar propietario por teléfono o nombre
          let propietario = await prisma.usuario.findFirst({
            where: {
              OR: [
                { telefono: data.telefono },
                { nombreCompleto: { contains: data.cliente || data.propietario, mode: 'insensitive' } },
              ],
              tipoUsuario: 'propietario',
            },
          });

          if (!propietario) {
            // Crear propietario temporal
            propietario = await prisma.usuario.create({
              data: {
                nombreCompleto: data.cliente || data.propietario || 'Cliente Temporal',
                telefono: data.telefono || '',
                email: `temp${Date.now()}@amico.com`,
                password: 'temp123',
                tipoUsuario: 'propietario',
                estado: 'pendiente',
              },
            });
          }

          // Generar código único del caso
          const year = new Date().getFullYear();
          const ultimoCaso = await prisma.caso.findFirst({
            where: { codigoUnico: { startsWith: `AMC-${year}` } },
            orderBy: { createdAt: 'desc' },
          });

          let numeroSecuencial = 1;
          if (ultimoCaso?.codigoUnico) {
            const match = ultimoCaso.codigoUnico.match(/AMC-\d{4}-(\d+)/);
            if (match) {
              numeroSecuencial = parseInt(match[1]) + 1;
            }
          }

          const codigoUnico = `AMC-${year}-${numeroSecuencial.toString().padStart(4, '0')}`;

          // Crear caso
          const caso = await prisma.caso.create({
            data: {
              codigoUnico,
              propietarioId: propietario.id,
              descripcionProblema: data.problema || data.descripcion || data['descripción problema'],
              tipoCaso: data.tipo?.toLowerCase().includes('garantia') ? 'garantia' : 'condominio',
              categoria: this.mapearCategoria(data.categoria || data.tipo),
              prioridad: this.mapearPrioridad(data.prioridad || 'media'),
              estado: data.estado?.toLowerCase() || 'nuevo',
            },
          });

          result.importedRows++;
          result.data?.push(caso);

          logger.info(`✅ Caso importado: ${caso.codigoUnico}`);
        } catch (error: any) {
          result.failedRows++;
          result.errors.push({
            row: rowNumber,
            error: error.message,
          });
        }
      }

      logger.info(`✅ Importación casos: ${result.importedRows}/${result.totalRows}`);

      return result;
    } catch (error: any) {
      logger.error('❌ Error importando casos:', error);
      return {
        success: false,
        totalRows: 0,
        importedRows: 0,
        failedRows: 0,
        errors: [{ row: 0, error: error.message }],
      };
    }
  }

  /**
   * Mapear categoría desde texto
   */
  private mapearCategoria(categoria: string): string {
    const map: any = {
      filtracion: 'filtracion',
      filtración: 'filtracion',
      electrico: 'electrico',
      eléctrico: 'electrico',
      electricidad: 'electrico',
      plomeria: 'plomeria',
      plomería: 'plomeria',
      agua: 'plomeria',
      'aire acondicionado': 'climatizacion',
      climatizacion: 'climatizacion',
      pintura: 'pintura',
      cerrajeria: 'cerrajeria',
      cerradura: 'cerrajeria',
      vidrio: 'vidrios',
      vidrios: 'vidrios',
      estructural: 'estructural',
      limpieza: 'limpieza',
    };

    const categoriaLower = categoria?.toLowerCase() || '';
    for (const [key, value] of Object.entries(map)) {
      if (categoriaLower.includes(key)) {
        return value as string;
      }
    }

    return 'general';
  }

  /**
   * Mapear prioridad desde texto
   */
  private mapearPrioridad(prioridad: string): 'baja' | 'media' | 'alta' | 'urgente' {
    const prioridadLower = prioridad?.toLowerCase() || '';

    if (prioridadLower.includes('urgente') || prioridadLower.includes('emergencia')) {
      return 'urgente';
    }
    if (prioridadLower.includes('alta')) {
      return 'alta';
    }
    if (prioridadLower.includes('baja')) {
      return 'baja';
    }

    return 'media';
  }

  /**
   * Validar archivo Excel antes de importar
   */
  public async validarArchivoExcel(filePath: string, tipo: 'propietarios' | 'tecnicos' | 'casos'): Promise<{
    valido: boolean;
    errores: string[];
  }> {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);

      const worksheet = workbook.getWorksheet(1);
      if (!worksheet) {
        return { valido: false, errores: ['No se encontró la hoja de cálculo'] };
      }

      const errores: string[] = [];

      // Validar headers según tipo
      const headersRequeridos: Record<string, string[]> = {
        propietarios: ['nombre', 'unidad', 'telefono', 'condominio'],
        tecnicos: ['nombre', 'email', 'telefono'],
        casos: ['cliente', 'problema', 'telefono'],
      };

      const headers: string[] = [];
      worksheet.getRow(1).eachCell((cell) => {
        headers.push(cell.text.toLowerCase().trim());
      });

      const requeridos = headersRequeridos[tipo];
      const faltantes = requeridos.filter(h => !headers.some(header => header.includes(h)));

      if (faltantes.length > 0) {
        errores.push(`Faltan columnas: ${faltantes.join(', ')}`);
      }

      // Validar que hay datos
      if (worksheet.rowCount <= 1) {
        errores.push('El archivo no contiene datos');
      }

      return {
        valido: errores.length === 0,
        errores,
      };
    } catch (error: any) {
      return {
        valido: false,
        errores: [error.message],
      };
    }
  }
}
