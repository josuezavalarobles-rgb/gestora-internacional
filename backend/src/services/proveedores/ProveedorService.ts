// ========================================
// PROVEEDOR SERVICE
// Gestión de proveedores y evaluaciones
// ========================================

import { PrismaClient, Proveedor, TipoProveedor } from '@prisma/client';
import { logger } from '../../utils/logger';

const prisma = new PrismaClient();

export interface CrearProveedorDTO {
  organizacionId: string;
  nombre: string;
  nombreComercial?: string;
  rnc?: string;
  tipo: TipoProveedor;
  telefono: string;
  email?: string;
  direccion?: string;
  personaContacto?: string;
  telefonoContacto?: string;
  banco?: string;
  numeroCuenta?: string;
  tipoCuenta?: string;
  notas?: string;
}

export interface EvaluarProveedorDTO {
  proveedorId: string;
  gastoId?: string;
  calidad: number; // 1-5
  puntualidad: number; // 1-5
  precioJusto: number; // 1-5
  comunicacion: number; // 1-5
  comentarios?: string;
  evaluadoPor: string;
}

export class ProveedorService {
  private static instance: ProveedorService;

  private constructor() {}

  public static getInstance(): ProveedorService {
    if (!ProveedorService.instance) {
      ProveedorService.instance = new ProveedorService();
    }
    return ProveedorService.instance;
  }

  /**
   * Crear un nuevo proveedor
   */
  async crearProveedor(data: CrearProveedorDTO): Promise<Proveedor> {
    try {
      logger.info(`Creando proveedor: ${data.nombre}`);

      const proveedor = await prisma.proveedor.create({
        data: {
          organizacionId: data.organizacionId,
          nombre: data.nombre,
          nombreComercial: data.nombreComercial,
          rnc: data.rnc,
          tipo: data.tipo,
          telefono: data.telefono,
          email: data.email,
          direccion: data.direccion,
          personaContacto: data.personaContacto,
          telefonoContacto: data.telefonoContacto,
          banco: data.banco,
          numeroCuenta: data.numeroCuenta,
          tipoCuenta: data.tipoCuenta,
          notas: data.notas,
        },
        include: {
          evaluaciones: true,
        },
      });

      logger.info(`✅ Proveedor creado: ${proveedor.id}`);
      return proveedor;
    } catch (error) {
      logger.error('Error al crear proveedor:', error);
      throw error;
    }
  }

  /**
   * Obtener todos los proveedores de una organización
   */
  async obtenerProveedores(
    organizacionId: string,
    filtros?: {
      tipo?: TipoProveedor;
      activo?: boolean;
      buscar?: string;
    }
  ): Promise<Proveedor[]> {
    try {
      const where: any = { organizacionId };

      if (filtros?.tipo) {
        where.tipo = filtros.tipo;
      }

      if (filtros?.activo !== undefined) {
        where.activo = filtros.activo;
      }

      if (filtros?.buscar) {
        where.OR = [
          { nombre: { contains: filtros.buscar, mode: 'insensitive' } },
          { nombreComercial: { contains: filtros.buscar, mode: 'insensitive' } },
          { rnc: { contains: filtros.buscar, mode: 'insensitive' } },
        ];
      }

      const proveedores = await prisma.proveedor.findMany({
        where,
        include: {
          evaluaciones: {
            orderBy: { fechaEvaluacion: 'desc' },
            take: 5,
          },
          _count: {
            select: {
              gastos: true,
              evaluaciones: true,
            },
          },
        },
        orderBy: {
          calificacion: 'desc',
        },
      });

      return proveedores;
    } catch (error) {
      logger.error('Error al obtener proveedores:', error);
      throw error;
    }
  }

  /**
   * Obtener un proveedor por ID
   */
  async obtenerProveedorPorId(proveedorId: string): Promise<Proveedor | null> {
    try {
      const proveedor = await prisma.proveedor.findUnique({
        where: { id: proveedorId },
        include: {
          evaluaciones: {
            orderBy: { fechaEvaluacion: 'desc' },
          },
          gastos: {
            orderBy: { fechaEmision: 'desc' },
            take: 10,
          },
          condominios: {
            include: {
              condominio: true,
            },
          },
        },
      });

      return proveedor;
    } catch (error) {
      logger.error('Error al obtener proveedor:', error);
      throw error;
    }
  }

  /**
   * Actualizar proveedor
   */
  async actualizarProveedor(
    proveedorId: string,
    data: Partial<CrearProveedorDTO>
  ): Promise<Proveedor> {
    try {
      logger.info(`Actualizando proveedor: ${proveedorId}`);

      const proveedor = await prisma.proveedor.update({
        where: { id: proveedorId },
        data,
        include: {
          evaluaciones: true,
        },
      });

      logger.info(`✅ Proveedor actualizado: ${proveedor.id}`);
      return proveedor;
    } catch (error) {
      logger.error('Error al actualizar proveedor:', error);
      throw error;
    }
  }

  /**
   * Evaluar un proveedor
   */
  async evaluarProveedor(data: EvaluarProveedorDTO) {
    try {
      logger.info(`Evaluando proveedor: ${data.proveedorId}`);

      // Calcular promedio
      const promedioGeneral =
        (data.calidad + data.puntualidad + data.precioJusto + data.comunicacion) / 4;

      // Crear evaluación
      const evaluacion = await prisma.evaluacionProveedor.create({
        data: {
          proveedorId: data.proveedorId,
          gastoId: data.gastoId,
          calidad: data.calidad,
          puntualidad: data.puntualidad,
          precioJusto: data.precioJusto,
          comunicacion: data.comunicacion,
          promedioGeneral,
          comentarios: data.comentarios,
          evaluadoPor: data.evaluadoPor,
        },
      });

      // Actualizar calificación promedio del proveedor
      await this.actualizarCalificacionProveedor(data.proveedorId);

      logger.info(`✅ Evaluación creada: ${evaluacion.id}`);
      return evaluacion;
    } catch (error) {
      logger.error('Error al evaluar proveedor:', error);
      throw error;
    }
  }

  /**
   * Actualizar calificación promedio del proveedor
   */
  private async actualizarCalificacionProveedor(proveedorId: string): Promise<void> {
    try {
      const evaluaciones = await prisma.evaluacionProveedor.findMany({
        where: { proveedorId },
        select: { promedioGeneral: true },
      });

      if (evaluaciones.length === 0) return;

      const suma = evaluaciones.reduce(
        (acc, ev) => acc + Number(ev.promedioGeneral),
        0
      );
      const promedio = suma / evaluaciones.length;

      await prisma.proveedor.update({
        where: { id: proveedorId },
        data: { calificacion: promedio },
      });

      logger.info(`✅ Calificación actualizada para proveedor ${proveedorId}: ${promedio.toFixed(2)}`);
    } catch (error) {
      logger.error('Error al actualizar calificación:', error);
      throw error;
    }
  }

  /**
   * Asociar proveedor a condominio
   */
  async asociarProveedorACondominio(
    proveedorId: string,
    condominioId: string
  ): Promise<void> {
    try {
      await prisma.condominioProveedor.create({
        data: {
          proveedorId,
          condominioId,
        },
      });

      logger.info(`✅ Proveedor ${proveedorId} asociado a condominio ${condominioId}`);
    } catch (error) {
      logger.error('Error al asociar proveedor a condominio:', error);
      throw error;
    }
  }

  /**
   * Obtener top proveedores por calificación
   */
  async obtenerTopProveedores(
    organizacionId: string,
    limite: number = 10
  ): Promise<Proveedor[]> {
    try {
      const proveedores = await prisma.proveedor.findMany({
        where: {
          organizacionId,
          activo: true,
          calificacion: { not: null },
        },
        orderBy: {
          calificacion: 'desc',
        },
        take: limite,
        include: {
          evaluaciones: {
            orderBy: { fechaEvaluacion: 'desc' },
            take: 3,
          },
          _count: {
            select: {
              gastos: true,
              evaluaciones: true,
            },
          },
        },
      });

      return proveedores;
    } catch (error) {
      logger.error('Error al obtener top proveedores:', error);
      throw error;
    }
  }

  /**
   * Desactivar proveedor
   */
  async desactivarProveedor(proveedorId: string): Promise<void> {
    try {
      await prisma.proveedor.update({
        where: { id: proveedorId },
        data: { activo: false },
      });

      logger.info(`✅ Proveedor desactivado: ${proveedorId}`);
    } catch (error) {
      logger.error('Error al desactivar proveedor:', error);
      throw error;
    }
  }
}
