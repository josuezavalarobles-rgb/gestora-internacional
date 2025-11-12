/**
 * ========================================
 * SERVICIO DE EXPORTACIÓN DE REPORTES
 * ========================================
 * Genera archivos Excel y PDF con métricas del dashboard
 */

import * as ExcelJS from 'exceljs';
import { logger } from '../../utils/logger';
import { DashboardService, ReporteExportable } from '../dashboard/DashboardService';
import * as path from 'path';
import * as fs from 'fs';

const dashboardService = DashboardService.getInstance();

export class ExportService {
  private static instance: ExportService;

  private constructor() {}

  public static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService();
    }
    return ExportService.instance;
  }

  /**
   * Exportar reporte a Excel
   */
  public async exportarReporteExcel(
    fechaInicio: Date,
    fechaFin: Date,
    condominioId?: string
  ): Promise<string> {
    try {
      logger.info(`📊 Generando reporte Excel del ${fechaInicio} al ${fechaFin}`);

      // Obtener datos del reporte
      const reporte = await dashboardService.generarReporteExportable(
        fechaInicio,
        fechaFin,
        condominioId
      );

      // Crear workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Amico Management';
      workbook.created = new Date();

      // ========================================
      // HOJA 1: RESUMEN GENERAL
      // ========================================
      const hojaResumen = workbook.addWorksheet('Resumen General', {
        views: [{ state: 'frozen', ySplit: 1 }],
      });

      // Header
      hojaResumen.mergeCells('A1:D1');
      hojaResumen.getCell('A1').value = 'REPORTE DE MÉTRICAS - AMICO MANAGEMENT';
      hojaResumen.getCell('A1').font = { bold: true, size: 16 };
      hojaResumen.getCell('A1').alignment = { horizontal: 'center' };

      hojaResumen.getCell('A2').value = 'Período:';
      hojaResumen.getCell('B2').value = `${fechaInicio.toLocaleDateString()} - ${fechaFin.toLocaleDateString()}`;

      // Métricas de casos
      hojaResumen.addRow([]);
      hojaResumen.addRow(['CASOS']);
      hojaResumen.getCell('A4').font = { bold: true, size: 14 };

      hojaResumen.addRow(['Total de casos', reporte.metricas.casosTotal]);
      hojaResumen.addRow(['Casos abiertos', reporte.metricas.casosAbiertos]);
      hojaResumen.addRow(['Casos cerrados', reporte.metricas.casosCerrados]);

      // Casos por estado
      hojaResumen.addRow([]);
      hojaResumen.addRow(['CASOS POR ESTADO']);
      hojaResumen.getCell('A9').font = { bold: true };

      hojaResumen.addRow(['Nuevos', reporte.metricas.casosPorEstado.nuevo]);
      hojaResumen.addRow(['Asignados', reporte.metricas.casosPorEstado.asignado]);
      hojaResumen.addRow(['En proceso', reporte.metricas.casosPorEstado.en_proceso]);
      hojaResumen.addRow(['En visita', reporte.metricas.casosPorEstado.en_visita]);
      hojaResumen.addRow(['Esperando repuestos', reporte.metricas.casosPorEstado.esperando_repuestos]);
      hojaResumen.addRow(['Cerrados', reporte.metricas.casosPorEstado.cerrado]);

      // Satisfacción
      hojaResumen.addRow([]);
      hojaResumen.addRow(['SATISFACCIÓN DEL CLIENTE']);
      hojaResumen.getCell('A16').font = { bold: true, size: 14 };

      hojaResumen.addRow(['Score general', reporte.metricas.scoreGeneral + '/5']);
      hojaResumen.addRow(['Total encuestas enviadas', reporte.metricas.totalEncuestas]);
      hojaResumen.addRow(['Encuestas completadas', reporte.metricas.encuestasCompletadas]);
      hojaResumen.addRow(['Tasa de respuesta', reporte.metricas.tasaRespuesta + '%']);

      // Rendimiento
      hojaResumen.addRow([]);
      hojaResumen.addRow(['RENDIMIENTO']);
      hojaResumen.getCell('A22').font = { bold: true, size: 14 };

      hojaResumen.addRow([
        'Tiempo promedio de resolución',
        reporte.metricas.tiempoPromedioResolucion + ' horas',
      ]);
      hojaResumen.addRow([
        'Tiempo promedio de respuesta',
        reporte.metricas.tiempoPromedioRespuesta + ' minutos',
      ]);
      hojaResumen.addRow([
        'Casos resueltos primer contacto',
        reporte.metricas.casosResueltosPrimerContacto,
      ]);

      // SLA
      hojaResumen.addRow([]);
      hojaResumen.addRow(['SLA (Acuerdo de Nivel de Servicio)']);
      hojaResumen.getCell('A27').font = { bold: true, size: 14 };

      hojaResumen.addRow(['Casos en SLA', reporte.metricas.casosEnSLA]);
      hojaResumen.addRow(['Casos vencidos SLA', reporte.metricas.casosVencidosSLA]);
      hojaResumen.addRow([
        'Cumplimiento SLA',
        reporte.metricas.porcentajeCumplimientoSLA + '%',
      ]);

      // Aplicar estilos
      hojaResumen.getColumn(1).width = 30;
      hojaResumen.getColumn(2).width = 20;

      // ========================================
      // HOJA 2: CASOS POR CONDOMINIO
      // ========================================
      const hojaCondominios = workbook.addWorksheet('Casos por Condominio');

      hojaCondominios.columns = [
        { header: 'Condominio', key: 'condominio', width: 30 },
        { header: 'Total Casos', key: 'total', width: 15 },
        { header: 'Abiertos', key: 'abiertos', width: 15 },
        { header: 'Cerrados', key: 'cerrados', width: 15 },
        { header: 'Score Promedio', key: 'scorePromedio', width: 20 },
      ];

      // Aplicar estilo al header
      hojaCondominios.getRow(1).font = { bold: true };
      hojaCondominios.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
      };
      hojaCondominios.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

      // Agregar datos
      reporte.casosPorCondominio.forEach((item) => {
        hojaCondominios.addRow({
          condominio: item.condominio,
          total: item.total,
          abiertos: item.abiertos,
          cerrados: item.cerrados,
          scorePromedio: item.scorePromedio + '/5',
        });
      });

      // ========================================
      // HOJA 3: CASOS POR INGENIERO
      // ========================================
      const hojaIngenieros = workbook.addWorksheet('Casos por Ingeniero');

      hojaIngenieros.columns = [
        { header: 'Ingeniero', key: 'ingeniero', width: 30 },
        { header: 'Total Casos', key: 'total', width: 15 },
        { header: 'Resueltos', key: 'resueltos', width: 15 },
        { header: 'Pendientes', key: 'pendientes', width: 15 },
        { header: 'Score Promedio', key: 'scorePromedio', width: 20 },
        { header: 'Tiempo Promedio (hrs)', key: 'tiempoPromedio', width: 25 },
      ];

      // Aplicar estilo al header
      hojaIngenieros.getRow(1).font = { bold: true };
      hojaIngenieros.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF70AD47' },
      };
      hojaIngenieros.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

      // Agregar datos
      reporte.casosPorIngeniero.forEach((item) => {
        hojaIngenieros.addRow({
          ingeniero: item.ingeniero,
          total: item.total,
          resueltos: item.resueltos,
          pendientes: item.pendientes,
          scorePromedio: item.scorePromedio + '/5',
          tiempoPromedio: item.tiempoPromedioResolucion,
        });
      });

      // ========================================
      // HOJA 4: TOP PROBLEMAS
      // ========================================
      const hojaProblemas = workbook.addWorksheet('Top Problemas');

      hojaProblemas.columns = [
        { header: 'Categoría', key: 'categoria', width: 30 },
        { header: 'Total Casos', key: 'total', width: 15 },
        { header: 'Porcentaje', key: 'porcentaje', width: 15 },
      ];

      // Aplicar estilo al header
      hojaProblemas.getRow(1).font = { bold: true };
      hojaProblemas.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFC000' },
      };
      hojaProblemas.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

      // Agregar datos
      reporte.topProblemas.forEach((item) => {
        hojaProblemas.addRow({
          categoria: item.categoria,
          total: item.total,
          porcentaje: item.porcentaje + '%',
        });
      });

      // ========================================
      // GUARDAR ARCHIVO
      // ========================================
      const timestamp = new Date().getTime();
      const filename = `reporte_amico_${timestamp}.xlsx`;
      const filepath = path.join(process.cwd(), 'exports', filename);

      // Crear directorio si no existe
      const exportsDir = path.join(process.cwd(), 'exports');
      if (!fs.existsSync(exportsDir)) {
        fs.mkdirSync(exportsDir, { recursive: true });
      }

      await workbook.xlsx.writeFile(filepath);

      logger.info(`✅ Reporte Excel generado: ${filename}`);

      return filepath;
    } catch (error) {
      logger.error('❌ Error exportando reporte a Excel:', error);
      throw error;
    }
  }

  /**
   * Exportar casos a Excel
   */
  public async exportarCasosExcel(
    filtros?: {
      estado?: string;
      condominioId?: string;
      tecnicoId?: string;
      fechaInicio?: Date;
      fechaFin?: Date;
    }
  ): Promise<string> {
    try {
      logger.info('📊 Generando exportación de casos a Excel');

      // Obtener todos los casos (sin paginación para exportación)
      const { casos } = await dashboardService.obtenerCasosDetallados(filtros, {
        pagina: 1,
        limite: 10000, // Máximo para exportación
      });

      // Crear workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Amico Management';
      workbook.created = new Date();

      const hoja = workbook.addWorksheet('Casos');

      // Definir columnas
      hoja.columns = [
        { header: 'Número de Caso', key: 'numeroCaso', width: 20 },
        { header: 'Estado', key: 'estado', width: 15 },
        { header: 'Prioridad', key: 'prioridad', width: 12 },
        { header: 'Categoría', key: 'categoria', width: 20 },
        { header: 'Descripción', key: 'descripcion', width: 40 },
        { header: 'Unidad', key: 'unidad', width: 12 },
        { header: 'Propietario', key: 'propietario', width: 25 },
        { header: 'Teléfono', key: 'telefono', width: 15 },
        { header: 'Ingeniero', key: 'ingeniero', width: 25 },
        { header: 'Condominio', key: 'condominio', width: 25 },
        { header: 'Fecha Creación', key: 'fechaCreacion', width: 20 },
        { header: 'Fecha Cierre', key: 'fechaCierre', width: 20 },
        { header: 'Tiempo Resolución (min)', key: 'tiempoResolucion', width: 25 },
        { header: 'Satisfacción', key: 'satisfaccion', width: 15 },
        { header: 'SLA Vencido', key: 'slaVencido', width: 12 },
      ];

      // Aplicar estilo al header
      hoja.getRow(1).font = { bold: true };
      hoja.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
      };
      hoja.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

      // Agregar datos
      casos.forEach((caso) => {
        hoja.addRow({
          numeroCaso: caso.numeroCaso,
          estado: caso.estado,
          prioridad: caso.prioridad,
          categoria: caso.categoria,
          descripcion: caso.descripcion,
          unidad: caso.unidad,
          propietario: caso.usuario.nombreCompleto,
          telefono: caso.usuario.telefono,
          ingeniero: caso.tecnicoAsignado?.nombreCompleto || 'Sin asignar',
          condominio: caso.condominio.nombre,
          fechaCreacion: caso.fechaCreacion.toLocaleString(),
          fechaCierre: caso.fechaCierre?.toLocaleString() || '',
          tiempoResolucion: caso.tiempoResolucion || '',
          satisfaccion: caso.satisfaccionCliente ? caso.satisfaccionCliente + '/5' : '',
          slaVencido: caso.slaVencido ? 'Sí' : 'No',
        });
      });

      // Guardar archivo
      const timestamp = new Date().getTime();
      const filename = `casos_amico_${timestamp}.xlsx`;
      const filepath = path.join(process.cwd(), 'exports', filename);

      // Crear directorio si no existe
      const exportsDir = path.join(process.cwd(), 'exports');
      if (!fs.existsSync(exportsDir)) {
        fs.mkdirSync(exportsDir, { recursive: true });
      }

      await workbook.xlsx.writeFile(filepath);

      logger.info(`✅ Exportación de casos generada: ${filename}`);

      return filepath;
    } catch (error) {
      logger.error('❌ Error exportando casos a Excel:', error);
      throw error;
    }
  }

  /**
   * Limpiar archivos de exportación antiguos (más de 24 horas)
   */
  public async limpiarExportacionesAntiguas(): Promise<void> {
    try {
      const exportsDir = path.join(process.cwd(), 'exports');

      if (!fs.existsSync(exportsDir)) {
        return;
      }

      const files = fs.readdirSync(exportsDir);
      const ahora = Date.now();
      const unDia = 24 * 60 * 60 * 1000; // 24 horas en milisegundos

      let eliminados = 0;

      files.forEach((file) => {
        const filepath = path.join(exportsDir, file);
        const stats = fs.statSync(filepath);

        if (ahora - stats.mtimeMs > unDia) {
          fs.unlinkSync(filepath);
          eliminados++;
        }
      });

      if (eliminados > 0) {
        logger.info(`🗑️  ${eliminados} archivos de exportación antiguos eliminados`);
      }
    } catch (error) {
      logger.error('❌ Error limpiando exportaciones antiguas:', error);
    }
  }
}
