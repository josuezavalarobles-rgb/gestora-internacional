/**
 * DOCUMENTOS SERVICE - STUB
 * TEMPORARILY DISABLED - Implementation needs to be fixed
 */

import { logger } from '../../utils/logger';

export interface SubirDocumentoDTO {
  condominioId: string;
  categoria: string;
  nombre: string;
  descripcion?: string;
  archivo: string;
  tipoArchivo: string;
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

  private constructor() {}

  public static getInstance(): DocumentosService {
    if (!DocumentosService.instance) {
      DocumentosService.instance = new DocumentosService();
    }
    return DocumentosService.instance;
  }

  async listarDocumentos(filtros?: any): Promise<any[]> {
    logger.warn('DocumentosService.listarDocumentos - NOT IMPLEMENTED');
    return [];
  }

  async obtenerDocumento(documentoId: string): Promise<any> {
    logger.warn('DocumentosService.obtenerDocumento - NOT IMPLEMENTED');
    throw new Error('Not implemented');
  }

  async subirDocumento(data: SubirDocumentoDTO): Promise<any> {
    logger.warn('DocumentosService.subirDocumento - NOT IMPLEMENTED');
    throw new Error('Not implemented');
  }

  async eliminarDocumento(documentoId: string): Promise<void> {
    logger.warn('DocumentosService.eliminarDocumento - NOT IMPLEMENTED');
    throw new Error('Not implemented');
  }

  async buscarDocumentos(query: string): Promise<any[]> {
    logger.warn('DocumentosService.buscarDocumentos - NOT IMPLEMENTED');
    return [];
  }

  async obtenerDocumentos(filtros: any): Promise<any[]> {
    logger.warn('DocumentosService.obtenerDocumentos - NOT IMPLEMENTED');
    return [];
  }

  async obtenerDocumentoPorId(documentoId: string, usuarioId: string, tipoUsuario: string): Promise<any> {
    logger.warn('DocumentosService.obtenerDocumentoPorId - NOT IMPLEMENTED');
    throw new Error('Not implemented');
  }

  async actualizarDocumento(documentoId: string, data: any): Promise<any> {
    logger.warn('DocumentosService.actualizarDocumento - NOT IMPLEMENTED');
    throw new Error('Not implemented');
  }

  async obtenerUrlDescarga(documentoId: string, usuarioId: string, tipoUsuario: string): Promise<{ url: string; nombreArchivo: string }> {
    logger.warn('DocumentosService.obtenerUrlDescarga - NOT IMPLEMENTED');
    throw new Error('Not implemented');
  }

  async obtenerCarpetas(condominioId: string): Promise<any[]> {
    logger.warn('DocumentosService.obtenerCarpetas - NOT IMPLEMENTED');
    return [];
  }

  async crearCarpeta(data: any): Promise<any> {
    logger.warn('DocumentosService.crearCarpeta - NOT IMPLEMENTED');
    throw new Error('Not implemented');
  }

  async compartirDocumento(documentoId: string, unidadesConAcceso: string[], esPublico: boolean): Promise<any> {
    logger.warn('DocumentosService.compartirDocumento - NOT IMPLEMENTED');
    throw new Error('Not implemented');
  }
}

/* ORIGINAL IMPLEMENTATION COMMENTED OUT - NEEDS FIX */
