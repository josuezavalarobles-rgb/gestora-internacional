/**
 * ========================================
 * SERVICIO DE GENERACIÓN DE REPORTES PDF
 * ========================================
 * Genera reportes profesionales en formato PDF
 * - Reporte de casos
 * - Reporte de dashboard
 * - Reporte de técnicos
 * - Estadísticas generales
 */

import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { logger } from '../../utils/logger';

export interface PDFReportOptions {
  titulo: string;
  subtitulo?: string;
  fecha?: Date;
  datos: any[];
  columnas?: string[];
  incluirGraficos?: boolean;
  pie?: string;
}

export class PDFReportService {
  private static instance: PDFReportService;
  private reportsPath: string;

  private constructor() {
    this.reportsPath = path.join(process.cwd(), 'uploads', 'reports');
    this.ensureReportsDirectory();
  }

  public static getInstance(): PDFReportService {
    if (!PDFReportService.instance) {
      PDFReportService.instance = new PDFReportService();
    }
    return PDFReportService.instance;
  }

  /**
   * Asegurar que existe el directorio de reportes
   */
  private async ensureReportsDirectory(): Promise<void> {
    try {
      if (!fs.existsSync(this.reportsPath)) {
        fs.mkdirSync(this.reportsPath, { recursive: true });
      }
    } catch (error) {
      logger.error('❌ Error creando directorio de reportes:', error);
    }
  }

  /**
   * Generar reporte de casos en PDF
   */
  public async generarReporteCasos(casos: any[]): Promise<string> {
    try {
      logger.info('📄 Generando reporte de casos en PDF...');

      const fileName = `reporte-casos-${Date.now()}.pdf`;
      const filePath = path.join(this.reportsPath, fileName);

      const doc = new PDFDocument({
        size: 'LETTER',
        margin: 50,
        bufferPages: true,
      });

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Header
      this.agregarHeader(doc, 'REPORTE DE CASOS', 'Amico Management System');

      // Fecha
      doc
        .fontSize(10)
        .text(`Fecha de generación: ${new Date().toLocaleDateString('es-DO')}`, { align: 'right' })
        .moveDown();

      // Resumen
      doc
        .fontSize(14)
        .fillColor('#2563eb')
        .text('Resumen General', { underline: true })
        .fillColor('black')
        .fontSize(10)
        .moveDown(0.5);

      const totalCasos = casos.length;
      const casosAbiertos = casos.filter(c => ['nuevo', 'asignado', 'en_proceso'].includes(c.estado)).length;
      const casosCerrados = casos.filter(c => c.estado === 'cerrado').length;

      doc
        .text(`Total de casos: ${totalCasos}`)
        .text(`Casos abiertos: ${casosAbiertos}`)
        .text(`Casos cerrados: ${casosCerrados}`)
        .moveDown();

      // Tabla de casos
      doc
        .fontSize(14)
        .fillColor('#2563eb')
        .text('Listado de Casos', { underline: true })
        .fillColor('black')
        .moveDown(0.5);

      casos.forEach((caso, index) => {
        if (doc.y > 700) {
          doc.addPage();
          this.agregarHeader(doc, 'REPORTE DE CASOS (cont.)', 'Amico Management System');
        }

        doc
          .fontSize(11)
          .fillColor('#1e40af')
          .text(`${index + 1}. ${caso.codigoUnico || caso.numeroCaso}`, { continued: true })
          .fillColor('black')
          .text(` - ${caso.estado}`)
          .fontSize(9)
          .text(`   Cliente: ${caso.nombreCliente || caso.propietario?.nombreCompleto || 'N/A'}`)
          .text(`   Problema: ${caso.descripcionProblema?.substring(0, 80) || 'N/A'}...`)
          .text(`   Prioridad: ${caso.prioridad || 'N/A'} | Categoría: ${caso.categoria || 'N/A'}`)
          .text(`   Técnico: ${caso.tecnicoAsignado?.nombreCompleto || 'Sin asignar'}`)
          .moveDown(0.5);
      });

      // Footer
      this.agregarFooter(doc);

      doc.end();

      await new Promise((resolve) => stream.on('finish', resolve));

      logger.info(`✅ Reporte PDF generado: ${filePath}`);

      return filePath;
    } catch (error: any) {
      logger.error('❌ Error generando reporte PDF:', error);
      throw error;
    }
  }

  /**
   * Generar reporte de dashboard en PDF
   */
  public async generarReporteDashboard(metricas: any): Promise<string> {
    try {
      logger.info('📊 Generando reporte de dashboard en PDF...');

      const fileName = `reporte-dashboard-${Date.now()}.pdf`;
      const filePath = path.join(this.reportsPath, fileName);

      const doc = new PDFDocument({
        size: 'LETTER',
        margin: 50,
      });

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Header
      this.agregarHeader(doc, 'REPORTE DE DASHBOARD', 'Métricas Generales del Sistema');

      // Fecha
      doc
        .fontSize(10)
        .text(`Fecha: ${new Date().toLocaleDateString('es-DO')}`, { align: 'right' })
        .moveDown();

      // Métricas de Casos
      doc
        .fontSize(14)
        .fillColor('#2563eb')
        .text('Métricas de Casos', { underline: true })
        .fillColor('black')
        .fontSize(10)
        .moveDown(0.5);

      if (metricas.casos) {
        doc
          .text(`Total de casos: ${metricas.casos.total || 0}`)
          .text(`Casos abiertos: ${metricas.casos.abiertos || 0}`)
          .text(`Casos cerrados: ${metricas.casos.cerrados || 0}`)
          .text(`Casos urgentes: ${metricas.casos.urgentes || 0}`)
          .moveDown();
      }

      // Métricas de Satisfacción
      doc
        .fontSize(14)
        .fillColor('#2563eb')
        .text('Satisfacción del Cliente', { underline: true })
        .fillColor('black')
        .fontSize(10)
        .moveDown(0.5);

      if (metricas.satisfaccion) {
        const score = metricas.satisfaccion.scorePromedio || 0;
        const estrellas = '★'.repeat(Math.round(score));

        doc
          .text(`Score promedio: ${score.toFixed(2)} ${estrellas}`)
          .text(`Tasa de respuesta: ${metricas.satisfaccion.tasaRespuesta || 0}%`)
          .text(`Encuestas completadas: ${metricas.satisfaccion.totalEncuestas || 0}`)
          .moveDown();
      }

      // Métricas de Rendimiento
      doc
        .fontSize(14)
        .fillColor('#2563eb')
        .text('Rendimiento Operativo', { underline: true })
        .fillColor('black')
        .fontSize(10)
        .moveDown(0.5);

      if (metricas.rendimiento) {
        doc
          .text(`Tiempo promedio de resolución: ${metricas.rendimiento.tiempoPromedioResolucion || 0}h`)
          .text(`Tiempo de respuesta: ${metricas.rendimiento.tiempoRespuesta || 0}h`)
          .text(`Casos en primer contacto: ${metricas.rendimiento.casosPrimerContacto || 0}%`)
          .moveDown();
      }

      // SLA
      doc
        .fontSize(14)
        .fillColor('#2563eb')
        .text('Cumplimiento de SLA', { underline: true })
        .fillColor('black')
        .fontSize(10)
        .moveDown(0.5);

      if (metricas.sla) {
        doc
          .text(`Casos en SLA: ${metricas.sla.casosEnSLA || 0}`)
          .text(`Casos vencidos: ${metricas.sla.casosVencidos || 0}`)
          .text(`Porcentaje de cumplimiento: ${metricas.sla.porcentajeCumplimiento || 0}%`)
          .moveDown();
      }

      // Top Problemas
      if (metricas.topProblemas && metricas.topProblemas.length > 0) {
        doc
          .fontSize(14)
          .fillColor('#2563eb')
          .text('Problemas Más Frecuentes', { underline: true })
          .fillColor('black')
          .fontSize(10)
          .moveDown(0.5);

        metricas.topProblemas.slice(0, 5).forEach((problema: any, index: number) => {
          doc.text(`${index + 1}. ${problema.categoria}: ${problema.cantidad} casos (${problema.porcentaje}%)`);
        });
      }

      // Footer
      this.agregarFooter(doc);

      doc.end();

      await new Promise((resolve) => stream.on('finish', resolve));

      logger.info(`✅ Reporte dashboard PDF generado: ${filePath}`);

      return filePath;
    } catch (error: any) {
      logger.error('❌ Error generando reporte dashboard:', error);
      throw error;
    }
  }

  /**
   * Generar reporte de técnicos en PDF
   */
  public async generarReporteTecnicos(tecnicos: any[]): Promise<string> {
    try {
      logger.info('👷 Generando reporte de técnicos en PDF...');

      const fileName = `reporte-tecnicos-${Date.now()}.pdf`;
      const filePath = path.join(this.reportsPath, fileName);

      const doc = new PDFDocument({
        size: 'LETTER',
        margin: 50,
      });

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Header
      this.agregarHeader(doc, 'REPORTE DE TÉCNICOS', 'Personal Técnico del Sistema');

      // Fecha
      doc
        .fontSize(10)
        .text(`Fecha: ${new Date().toLocaleDateString('es-DO')}`, { align: 'right' })
        .moveDown();

      // Resumen
      doc
        .fontSize(14)
        .fillColor('#2563eb')
        .text('Resumen', { underline: true })
        .fillColor('black')
        .fontSize(10)
        .moveDown(0.5);

      const totalTecnicos = tecnicos.length;
      const tecnicosActivos = tecnicos.filter(t => t.estado === 'activo').length;
      const tecnicosDisponibles = tecnicos.filter(t => t.disponible).length;

      doc
        .text(`Total de técnicos: ${totalTecnicos}`)
        .text(`Técnicos activos: ${tecnicosActivos}`)
        .text(`Técnicos disponibles: ${tecnicosDisponibles}`)
        .moveDown();

      // Listado
      doc
        .fontSize(14)
        .fillColor('#2563eb')
        .text('Listado de Técnicos', { underline: true })
        .fillColor('black')
        .moveDown(0.5);

      tecnicos.forEach((tec, index) => {
        if (doc.y > 700) {
          doc.addPage();
          this.agregarHeader(doc, 'REPORTE DE TÉCNICOS (cont.)', 'Personal Técnico del Sistema');
        }

        doc
          .fontSize(11)
          .fillColor('#1e40af')
          .text(`${index + 1}. ${tec.nombreCompleto}`)
          .fillColor('black')
          .fontSize(9)
          .text(`   Email: ${tec.email}`)
          .text(`   Teléfono: ${tec.telefono}`)
          .text(`   Especialidad: ${tec.especialidad || 'General'}`)
          .text(`   Casos activos: ${tec._count?.casosAsignados || tec.casosActivos || 0}`)
          .text(`   Casos completados: ${tec._count?.casosCompletados || tec.casosCompletados || 0}`)
          .text(`   Estado: ${tec.estado} | Disponibilidad: ${tec.disponible ? 'Disponible' : 'Ocupado'}`)
          .moveDown(0.5);
      });

      // Footer
      this.agregarFooter(doc);

      doc.end();

      await new Promise((resolve) => stream.on('finish', resolve));

      logger.info(`✅ Reporte técnicos PDF generado: ${filePath}`);

      return filePath;
    } catch (error: any) {
      logger.error('❌ Error generando reporte técnicos:', error);
      throw error;
    }
  }

  /**
   * Agregar header al PDF
   */
  private agregarHeader(doc: PDFKit.PDFDocument, titulo: string, subtitulo: string): void {
    doc
      .fontSize(20)
      .fillColor('#1e40af')
      .text(titulo, { align: 'center' })
      .fontSize(12)
      .fillColor('#64748b')
      .text(subtitulo, { align: 'center' })
      .fillColor('black')
      .moveDown(2);

    // Línea separadora
    doc
      .moveTo(50, doc.y)
      .lineTo(550, doc.y)
      .stroke()
      .moveDown();
  }

  /**
   * Agregar footer al PDF
   */
  private agregarFooter(doc: PDFKit.PDFDocument): void {
    const pageCount = (doc as any).bufferedPageRange().count;

    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);

      doc
        .fontSize(8)
        .fillColor('#94a3b8')
        .text(
          `Página ${i + 1} de ${pageCount} | Generado por Amico Management System | ${new Date().toLocaleString('es-DO')}`,
          50,
          750,
          { align: 'center' }
        );
    }
  }

  /**
   * Limpiar reportes antiguos (opcional)
   */
  public async cleanOldReports(daysOld: number = 7): Promise<void> {
    try {
      const files = fs.readdirSync(this.reportsPath);
      const now = Date.now();
      const maxAge = daysOld * 24 * 60 * 60 * 1000;

      for (const file of files) {
        const filePath = path.join(this.reportsPath, file);
        const stats = fs.statSync(filePath);

        if (now - stats.mtimeMs > maxAge) {
          fs.unlinkSync(filePath);
          logger.info(`🗑️ Reporte antiguo eliminado: ${file}`);
        }
      }

      logger.info('✅ Limpieza de reportes completada');
    } catch (error) {
      logger.error('❌ Error limpiando reportes:', error);
    }
  }
}
