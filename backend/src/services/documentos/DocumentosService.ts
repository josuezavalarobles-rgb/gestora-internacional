// ========================================
// DOCUMENTOS SERVICE
// Gestión de repositorio de documentos
// ========================================

import { PrismaClient, Documento } from '@prisma/client';
import { logger } from '../../utils/logger';
import * as fs from 'fs/promises';
import * as path from 'path';

const prisma = new PrismaClient();

export interface SubirDocumentoDTO {
  condominioId: string;
  categoria: string;
  nombre: string;
  descripcion?: string;
  archivo: string; // Ruta del archivo
  tipoArchivo: string; // MIME type
  tamanoBytes: number;
  unidadId?: string;
  gastoId?: string;
  ingresoId?: string;
  subidoPor: string;
  etiquetas?: string[];
  publico?: boolean;
}

export class DocumentosService {
  private static instance: DocumentosService;
  private readonly uploadPath: string;

  private constructor() {
    this.uploadPath = process.env.UPLOAD_PATH || './uploads/documentos';
  }

  public static getInstance(): DocumentosService {
    if (!DocumentosService.instance) {
      DocumentosService.instance = new DocumentosService();
    }
    return DocumentosService.instance;
  }

  /**
   * Inicializar directorio de documentos
   */
  async inicializarDirectorio(): Promise<void> {
    try {
      await fs.mkdir(this.uploadPath, { recursive: true });
      logger.info(`Directorio de documentos inicializado: ${this.uploadPath}`);
    } catch (error) {
      logger.error('Error al inicializar directorio de documentos:', error);
      throw error;
    }
  }

  /**
   * Subir documento
   */
  async subirDocumento(data: SubirDocumentoDTO): Promise<Documento> {
    try {
      logger.info(`Subiendo documento: ${data.nombre}`);

      // Asegurar que el directorio existe
      await this.inicializarDirectorio();

      const documento = await prisma.documento.create({
        data: {
          condominioId: data.condominioId,
          categoria: data.categoria,
          nombre: data.nombre,
          descripcion: data.descripcion,
          archivo: data.archivo,
          tipoArchivo: data.tipoArchivo,
          tamanoBytes: data.tamanoBytes,
          unidadId: data.unidadId,
          gastoId: data.gastoId,
          ingresoId: data.ingresoId,
          subidoPor: data.subidoPor,
          etiquetas: data.etiquetas,
          publico: data.publico || false,
        },
        include: {
          condominio: true,
          unidad: true,
        },
      });

      logger.info(`✅ Documento subido: ${documento.id}`);
      return documento;
    } catch (error) {
      logger.error('Error al subir documento:', error);
      throw error;
    }
  }

  /**
   * Obtener documentos con filtros
   */
  async obtenerDocumentos(filtros?: {
    condominioId?: string;
    categoria?: string;
    unidadId?: string;
    gastoId?: string;
    ingresoId?: string;
    etiqueta?: string;
    buscar?: string;
    publico?: boolean;
  }): Promise<Documento[]> {
    try {
      const where: any = {};

      if (filtros?.condominioId) {
        where.condominioId = filtros.condominioId;
      }

      if (filtros?.categoria) {
        where.categoria = filtros.categoria;
      }

      if (filtros?.unidadId) {
        where.unidadId = filtros.unidadId;
      }

      if (filtros?.gastoId) {
        where.gastoId = filtros.gastoId;
      }

      if (filtros?.ingresoId) {
        where.ingresoId = filtros.ingresoId;
      }

      if (filtros?.etiqueta) {
        where.etiquetas = {
          has: filtros.etiqueta,
        };
      }

      if (filtros?.publico !== undefined) {
        where.publico = filtros.publico;
      }

      if (filtros?.buscar) {
        where.OR = [
          { nombre: { contains: filtros.buscar, mode: 'insensitive' } },
          { descripcion: { contains: filtros.buscar, mode: 'insensitive' } },
          { categoria: { contains: filtros.buscar, mode: 'insensitive' } },
        ];
      }

      const documentos = await prisma.documento.findMany({
        where,
        include: {
          condominio: true,
          unidad: true,
        },
        orderBy: {
          fechaSubida: 'desc',
        },
      });

      return documentos;
    } catch (error) {
      logger.error('Error al obtener documentos:', error);
      throw error;
    }
  }

  /**
   * Obtener documento por ID
   */
  async obtenerDocumentoPorId(documentoId: string): Promise<Documento | null> {
    try {
      const documento = await prisma.documento.findUnique({
        where: { id: documentoId },
        include: {
          condominio: true,
          unidad: true,
        },
      });

      return documento;
    } catch (error) {
      logger.error('Error al obtener documento:', error);
      throw error;
    }
  }

  /**
   * Actualizar documento
   */
  async actualizarDocumento(
    documentoId: string,
    data: {
      nombre?: string;
      descripcion?: string;
      categoria?: string;
      etiquetas?: string[];
      publico?: boolean;
    }
  ): Promise<Documento> {
    try {
      const documento = await prisma.documento.update({
        where: { id: documentoId },
        data,
      });

      logger.info(`✅ Documento actualizado: ${documentoId}`);
      return documento;
    } catch (error) {
      logger.error('Error al actualizar documento:', error);
      throw error;
    }
  }

  /**
   * Eliminar documento
   */
  async eliminarDocumento(documentoId: string): Promise<void> {
    try {
      // Obtener documento para eliminar archivo físico
      const documento = await prisma.documento.findUnique({
        where: { id: documentoId },
      });

      if (!documento) {
        throw new Error('Documento no encontrado');
      }

      // Eliminar archivo físico
      try {
        await fs.unlink(documento.archivo);
        logger.info(`Archivo físico eliminado: ${documento.archivo}`);
      } catch (error) {
        logger.warn(`No se pudo eliminar archivo físico: ${error}`);
      }

      // Eliminar registro de base de datos
      await prisma.documento.delete({
        where: { id: documentoId },
      });

      logger.info(`✅ Documento eliminado: ${documentoId}`);
    } catch (error) {
      logger.error('Error al eliminar documento:', error);
      throw error;
    }
  }

  /**
   * Obtener categorías de documentos de un condominio
   */
  async obtenerCategorias(condominioId: string): Promise<string[]> {
    try {
      const documentos = await prisma.documento.findMany({
        where: { condominioId },
        select: { categoria: true },
        distinct: ['categoria'],
      });

      return documentos.map((d) => d.categoria).filter(Boolean);
    } catch (error) {
      logger.error('Error al obtener categorías:', error);
      throw error;
    }
  }

  /**
   * Obtener etiquetas usadas en un condominio
   */
  async obtenerEtiquetas(condominioId: string): Promise<string[]> {
    try {
      const documentos = await prisma.documento.findMany({
        where: { condominioId },
        select: { etiquetas: true },
      });

      const todasEtiquetas = new Set<string>();
      documentos.forEach((doc) => {
        if (doc.etiquetas) {
          doc.etiquetas.forEach((etiqueta) => todasEtiquetas.add(etiqueta));
        }
      });

      return Array.from(todasEtiquetas).sort();
    } catch (error) {
      logger.error('Error al obtener etiquetas:', error);
      throw error;
    }
  }

  /**
   * Incrementar contador de descargas
   */
  async registrarDescarga(documentoId: string): Promise<void> {
    try {
      await prisma.documento.update({
        where: { id: documentoId },
        data: {
          descargas: {
            increment: 1,
          },
        },
      });

      logger.info(`Descarga registrada para documento: ${documentoId}`);
    } catch (error) {
      logger.error('Error al registrar descarga:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de documentos
   */
  async obtenerEstadisticas(condominioId: string): Promise<{
    totalDocumentos: number;
    tamanoTotalMB: number;
    documentosPorCategoria: Record<string, number>;
    documentosMasDescargados: Array<{
      nombre: string;
      categoria: string;
      descargas: number;
    }>;
    documentosRecientes: Documento[];
  }> {
    try {
      const documentos = await prisma.documento.findMany({
        where: { condominioId },
      });

      const totalDocumentos = documentos.length;
      const tamanoTotalBytes = documentos.reduce(
        (sum, doc) => sum + doc.tamanoBytes,
        0
      );
      const tamanoTotalMB = tamanoTotalBytes / (1024 * 1024);

      // Documentos por categoría
      const documentosPorCategoria: Record<string, number> = {};
      documentos.forEach((doc) => {
        const categoria = doc.categoria || 'Sin categoría';
        documentosPorCategoria[categoria] =
          (documentosPorCategoria[categoria] || 0) + 1;
      });

      // Documentos más descargados
      const documentosMasDescargados = documentos
        .sort((a, b) => b.descargas - a.descargas)
        .slice(0, 10)
        .map((doc) => ({
          nombre: doc.nombre,
          categoria: doc.categoria,
          descargas: doc.descargas,
        }));

      // Documentos recientes
      const documentosRecientes = await this.obtenerDocumentos({
        condominioId,
      });

      return {
        totalDocumentos,
        tamanoTotalMB,
        documentosPorCategoria,
        documentosMasDescargados,
        documentosRecientes: documentosRecientes.slice(0, 5),
      };
    } catch (error) {
      logger.error('Error al obtener estadísticas:', error);
      throw error;
    }
  }

  /**
   * Limpiar documentos antiguos
   */
  async limpiarDocumentosAntiguos(
    condominioId: string,
    diasAntiguedad: number
  ): Promise<number> {
    try {
      logger.info(
        `Limpiando documentos con más de ${diasAntiguedad} días en condominio ${condominioId}`
      );

      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - diasAntiguedad);

      const documentosAntiguos = await prisma.documento.findMany({
        where: {
          condominioId,
          fechaSubida: {
            lt: fechaLimite,
          },
          publico: false, // Solo documentos no públicos
        },
      });

      let eliminados = 0;
      for (const doc of documentosAntiguos) {
        try {
          await this.eliminarDocumento(doc.id);
          eliminados++;
        } catch (error) {
          logger.error(`Error al eliminar documento ${doc.id}:`, error);
        }
      }

      logger.info(`✅ ${eliminados} documentos antiguos eliminados`);
      return eliminados;
    } catch (error) {
      logger.error('Error al limpiar documentos antiguos:', error);
      throw error;
    }
  }

  /**
   * Generar estructura de carpetas recomendada
   */
  getCategoriasPredefinidas(): Array<{
    nombre: string;
    descripcion: string;
    etiquetasSugeridas: string[];
  }> {
    return [
      {
        nombre: 'Actas de Asamblea',
        descripcion: 'Actas de asambleas generales y extraordinarias',
        etiquetasSugeridas: ['asamblea', 'acta', 'reunion'],
      },
      {
        nombre: 'Contratos',
        descripcion: 'Contratos con proveedores y servicios',
        etiquetasSugeridas: ['contrato', 'proveedor', 'servicio'],
      },
      {
        nombre: 'Facturas',
        descripcion: 'Facturas de gastos y compras',
        etiquetasSugeridas: ['factura', 'compra', 'ncf'],
      },
      {
        nombre: 'Recibos de Pago',
        descripcion: 'Comprobantes de pago de propietarios',
        etiquetasSugeridas: ['recibo', 'pago', 'ingreso'],
      },
      {
        nombre: 'Nóminas',
        descripcion: 'Documentos de nómina del personal',
        etiquetasSugeridas: ['nomina', 'personal', 'salario'],
      },
      {
        nombre: 'Estados de Cuenta',
        descripcion: 'Estados de cuenta mensuales de unidades',
        etiquetasSugeridas: ['estado-cuenta', 'mensual', 'unidad'],
      },
      {
        nombre: 'Reglamentos',
        descripcion: 'Reglamentos internos y documentos legales',
        etiquetasSugeridas: ['reglamento', 'legal', 'normas'],
      },
      {
        nombre: 'Reportes',
        descripcion: 'Reportes financieros y operativos',
        etiquetasSugeridas: ['reporte', 'financiero', 'mensual'],
      },
      {
        nombre: 'Documentos Legales',
        descripcion: 'Escrituras, planos, permisos',
        etiquetasSugeridas: ['legal', 'escritura', 'permiso'],
      },
      {
        nombre: 'Otros',
        descripcion: 'Documentos varios',
        etiquetasSugeridas: ['varios', 'otros'],
      },
    ];
  }
}
