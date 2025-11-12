// ========================================
// ESTADOS DE CUENTA SERVICE
// Gestión de estados de cuenta por unidad
// ========================================

import { PrismaClient, EstadoCuenta, TransaccionCuenta } from '@prisma/client';
import { logger } from '../../utils/logger';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

export interface CrearEstadoCuentaDTO {
  unidadId: string;
  periodo: string; // "2024-12"
  saldoAnterior?: number;
  notas?: string;
}

export interface RegistrarTransaccionDTO {
  estadoCuentaId: string;
  tipo: 'cargo' | 'abono';
  concepto: string;
  descripcion?: string;
  monto: number;
  fecha: Date;
  gastoId?: string;
  ingresoId?: string;
  referencia?: string;
}

export class EstadosCuentaService {
  private static instance: EstadosCuentaService;

  private constructor() {}

  public static getInstance(): EstadosCuentaService {
    if (!EstadosCuentaService.instance) {
      EstadosCuentaService.instance = new EstadosCuentaService();
    }
    return EstadosCuentaService.instance;
  }

  /**
   * Crear estado de cuenta para una unidad
   */
  async crearEstadoCuenta(data: CrearEstadoCuentaDTO): Promise<EstadoCuenta> {
    try {
      logger.info(`Creando estado de cuenta para unidad ${data.unidadId} - Periodo: ${data.periodo}`);

      // Verificar si ya existe un estado de cuenta para este periodo
      const existe = await prisma.estadoCuenta.findFirst({
        where: {
          unidadId: data.unidadId,
          periodo: data.periodo,
        },
      });

      if (existe) {
        throw new Error(`Ya existe un estado de cuenta para el periodo ${data.periodo}`);
      }

      // Obtener saldo anterior (del periodo anterior)
      let saldoAnterior = new Decimal(data.saldoAnterior || 0);

      if (!data.saldoAnterior) {
        const [anio, mes] = data.periodo.split('-').map(Number);
        const periodoAnterior = mes === 1
          ? `${anio - 1}-12`
          : `${anio}-${String(mes - 1).padStart(2, '0')}`;

        const estadoAnterior = await prisma.estadoCuenta.findFirst({
          where: {
            unidadId: data.unidadId,
            periodo: periodoAnterior,
          },
        });

        if (estadoAnterior) {
          saldoAnterior = estadoAnterior.saldoFinal;
        }
      }

      const estadoCuenta = await prisma.estadoCuenta.create({
        data: {
          unidadId: data.unidadId,
          periodo: data.periodo,
          saldoAnterior,
          totalCargos: new Decimal(0),
          totalAbonos: new Decimal(0),
          saldoFinal: saldoAnterior,
          notas: data.notas,
        },
        include: {
          unidad: {
            include: {
              propietario: true,
              condominio: true,
            },
          },
        },
      });

      logger.info(`✅ Estado de cuenta creado: ${estadoCuenta.id}`);
      return estadoCuenta;
    } catch (error) {
      logger.error('Error al crear estado de cuenta:', error);
      throw error;
    }
  }

  /**
   * Registrar transacción en estado de cuenta
   */
  async registrarTransaccion(data: RegistrarTransaccionDTO): Promise<TransaccionCuenta> {
    try {
      logger.info(`Registrando transacción: ${data.tipo} - ${data.concepto}`);

      // Crear transacción
      const transaccion = await prisma.transaccionCuenta.create({
        data: {
          estadoCuentaId: data.estadoCuentaId,
          tipo: data.tipo,
          concepto: data.concepto,
          descripcion: data.descripcion,
          monto: new Decimal(data.monto),
          fecha: data.fecha,
          gastoId: data.gastoId,
          ingresoId: data.ingresoId,
          referencia: data.referencia,
        },
      });

      // Actualizar estado de cuenta
      await this.actualizarSaldos(data.estadoCuentaId);

      logger.info(`✅ Transacción registrada: ${transaccion.id}`);
      return transaccion;
    } catch (error) {
      logger.error('Error al registrar transacción:', error);
      throw error;
    }
  }

  /**
   * Actualizar saldos del estado de cuenta
   */
  private async actualizarSaldos(estadoCuentaId: string): Promise<void> {
    try {
      // Calcular totales de cargos y abonos
      const [cargos, abonos] = await Promise.all([
        prisma.transaccionCuenta.aggregate({
          where: {
            estadoCuentaId,
            tipo: 'cargo',
          },
          _sum: {
            monto: true,
          },
        }),
        prisma.transaccionCuenta.aggregate({
          where: {
            estadoCuentaId,
            tipo: 'abono',
          },
          _sum: {
            monto: true,
          },
        }),
      ]);

      const totalCargos = cargos._sum.monto || new Decimal(0);
      const totalAbonos = abonos._sum.monto || new Decimal(0);

      // Obtener saldo anterior
      const estadoCuenta = await prisma.estadoCuenta.findUnique({
        where: { id: estadoCuentaId },
      });

      if (!estadoCuenta) {
        throw new Error('Estado de cuenta no encontrado');
      }

      // Calcular saldo final: saldoAnterior + cargos - abonos
      const saldoFinal = estadoCuenta.saldoAnterior.add(totalCargos).sub(totalAbonos);

      // Actualizar estado de cuenta
      await prisma.estadoCuenta.update({
        where: { id: estadoCuentaId },
        data: {
          totalCargos,
          totalAbonos,
          saldoFinal,
          fechaActualizacion: new Date(),
        },
      });

      logger.info(`Saldos actualizados - Cargos: ${totalCargos}, Abonos: ${totalAbonos}, Saldo: ${saldoFinal}`);
    } catch (error) {
      logger.error('Error al actualizar saldos:', error);
      throw error;
    }
  }

  /**
   * Procesar distribución de gastos del condominio
   * (Genera cargos automáticos en los estados de cuenta de todas las unidades)
   */
  async procesarDistribucionGastos(condominioId: string, periodo: string): Promise<void> {
    try {
      logger.info(`Procesando distribución de gastos - Condominio: ${condominioId}, Periodo: ${periodo}`);

      // Obtener todas las distribuciones del periodo
      const [anio, mes] = periodo.split('-').map(Number);
      const fechaInicio = new Date(anio, mes - 1, 1);
      const fechaFin = new Date(anio, mes, 0, 23, 59, 59);

      const distribuciones = await prisma.distribucionGasto.findMany({
        where: {
          gasto: {
            condominioId,
            fechaEmision: {
              gte: fechaInicio,
              lte: fechaFin,
            },
          },
        },
        include: {
          gasto: {
            include: {
              cuentaContable: true,
            },
          },
          unidad: true,
        },
      });

      // Agrupar por unidad
      const distribucionesPorUnidad = new Map<string, typeof distribuciones>();
      distribuciones.forEach((dist) => {
        const unidadId = dist.unidadId;
        if (!distribucionesPorUnidad.has(unidadId)) {
          distribucionesPorUnidad.set(unidadId, []);
        }
        distribucionesPorUnidad.get(unidadId)!.push(dist);
      });

      // Procesar cada unidad
      for (const [unidadId, dists] of distribucionesPorUnidad.entries()) {
        // Obtener o crear estado de cuenta
        let estadoCuenta = await prisma.estadoCuenta.findFirst({
          where: {
            unidadId,
            periodo,
          },
        });

        if (!estadoCuenta) {
          estadoCuenta = await this.crearEstadoCuenta({
            unidadId,
            periodo,
          });
        }

        // Registrar cada distribución como cargo
        for (const dist of dists) {
          // Verificar si ya existe transacción para este gasto
          const existe = await prisma.transaccionCuenta.findFirst({
            where: {
              estadoCuentaId: estadoCuenta.id,
              gastoId: dist.gastoId,
            },
          });

          if (!existe) {
            await this.registrarTransaccion({
              estadoCuentaId: estadoCuenta.id,
              tipo: 'cargo',
              concepto: dist.gasto.concepto,
              descripcion: `${dist.gasto.cuentaContable.nombre} - Alícuota: ${(Number(dist.porcentaje) * 100).toFixed(4)}%`,
              monto: Number(dist.montoDistribuido),
              fecha: dist.gasto.fechaEmision,
              gastoId: dist.gastoId,
            });
          }
        }
      }

      logger.info(`✅ Distribución de gastos procesada - ${distribucionesPorUnidad.size} unidades`);
    } catch (error) {
      logger.error('Error al procesar distribución de gastos:', error);
      throw error;
    }
  }

  /**
   * Registrar pago de propietario
   */
  async registrarPago(
    unidadId: string,
    periodo: string,
    monto: number,
    metodoPago: string,
    referencia?: string,
    notas?: string
  ): Promise<TransaccionCuenta> {
    try {
      logger.info(`Registrando pago de unidad ${unidadId} - Monto: ${monto}`);

      // Obtener estado de cuenta
      let estadoCuenta = await prisma.estadoCuenta.findFirst({
        where: {
          unidadId,
          periodo,
        },
      });

      if (!estadoCuenta) {
        estadoCuenta = await this.crearEstadoCuenta({
          unidadId,
          periodo,
        });
      }

      // Registrar abono
      const transaccion = await this.registrarTransaccion({
        estadoCuentaId: estadoCuenta.id,
        tipo: 'abono',
        concepto: `Pago - ${metodoPago}`,
        descripcion: notas,
        monto,
        fecha: new Date(),
        referencia,
      });

      logger.info(`✅ Pago registrado: ${transaccion.id}`);
      return transaccion;
    } catch (error) {
      logger.error('Error al registrar pago:', error);
      throw error;
    }
  }

  /**
   * Obtener estado de cuenta de una unidad
   */
  async obtenerEstadoCuenta(
    unidadId: string,
    periodo: string
  ): Promise<EstadoCuenta | null> {
    try {
      const estadoCuenta = await prisma.estadoCuenta.findFirst({
        where: {
          unidadId,
          periodo,
        },
        include: {
          unidad: {
            include: {
              propietario: true,
              condominio: true,
            },
          },
          transacciones: {
            orderBy: {
              fecha: 'asc',
            },
            include: {
              gasto: true,
              ingreso: true,
            },
          },
        },
      });

      return estadoCuenta;
    } catch (error) {
      logger.error('Error al obtener estado de cuenta:', error);
      throw error;
    }
  }

  /**
   * Obtener historial de estados de cuenta de una unidad
   */
  async obtenerHistorialEstadosCuenta(unidadId: string): Promise<EstadoCuenta[]> {
    try {
      const estados = await prisma.estadoCuenta.findMany({
        where: {
          unidadId,
        },
        include: {
          unidad: true,
          _count: {
            select: {
              transacciones: true,
            },
          },
        },
        orderBy: {
          periodo: 'desc',
        },
      });

      return estados;
    } catch (error) {
      logger.error('Error al obtener historial de estados de cuenta:', error);
      throw error;
    }
  }

  /**
   * Obtener unidades morosas (con saldo pendiente)
   */
  async obtenerUnidadesMorosas(
    condominioId: string,
    periodo?: string
  ): Promise<
    Array<{
      unidadId: string;
      unidadNumero: string;
      propietario: string;
      saldoPendiente: number;
      periodos: string[];
    }>
  > {
    try {
      const where: any = {
        unidad: {
          condominioId,
        },
        saldoFinal: {
          gt: 0,
        },
      };

      if (periodo) {
        where.periodo = {
          lte: periodo,
        };
      }

      const estadosCuenta = await prisma.estadoCuenta.findMany({
        where,
        include: {
          unidad: {
            include: {
              propietario: true,
            },
          },
        },
        orderBy: [
          { unidad: { numero: 'asc' } },
          { periodo: 'desc' },
        ],
      });

      // Agrupar por unidad
      const morosasPorUnidad = new Map<
        string,
        {
          unidadId: string;
          unidadNumero: string;
          propietario: string;
          saldoPendiente: number;
          periodos: string[];
        }
      >();

      estadosCuenta.forEach((estado) => {
        const unidadId = estado.unidadId;

        if (!morosasPorUnidad.has(unidadId)) {
          morosasPorUnidad.set(unidadId, {
            unidadId,
            unidadNumero: estado.unidad.numero,
            propietario: estado.unidad.propietario?.nombreCompleto || 'Sin propietario',
            saldoPendiente: 0,
            periodos: [],
          });
        }

        const morosa = morosasPorUnidad.get(unidadId)!;
        morosa.saldoPendiente += Number(estado.saldoFinal);
        morosa.periodos.push(estado.periodo);
      });

      return Array.from(morosasPorUnidad.values()).sort(
        (a, b) => b.saldoPendiente - a.saldoPendiente
      );
    } catch (error) {
      logger.error('Error al obtener unidades morosas:', error);
      throw error;
    }
  }

  /**
   * Generar reporte de recaudación del periodo
   */
  async generarReporteRecaudacion(
    condominioId: string,
    periodo: string
  ): Promise<{
    periodo: string;
    totalUnidades: number;
    totalCargos: number;
    totalRecaudado: number;
    totalPendiente: number;
    porcentajeRecaudacion: number;
    unidadesAlDia: number;
    unidadesMorosas: number;
  }> {
    try {
      const estadosCuenta = await prisma.estadoCuenta.findMany({
        where: {
          unidad: {
            condominioId,
          },
          periodo,
        },
        include: {
          unidad: true,
        },
      });

      const totalUnidades = estadosCuenta.length;
      const totalCargos = estadosCuenta.reduce(
        (sum, e) => sum + Number(e.totalCargos),
        0
      );
      const totalRecaudado = estadosCuenta.reduce(
        (sum, e) => sum + Number(e.totalAbonos),
        0
      );
      const totalPendiente = estadosCuenta.reduce(
        (sum, e) => sum + Number(e.saldoFinal),
        0
      );
      const porcentajeRecaudacion =
        totalCargos > 0 ? (totalRecaudado / totalCargos) * 100 : 0;
      const unidadesAlDia = estadosCuenta.filter(
        (e) => Number(e.saldoFinal) <= 0
      ).length;
      const unidadesMorosas = estadosCuenta.filter(
        (e) => Number(e.saldoFinal) > 0
      ).length;

      return {
        periodo,
        totalUnidades,
        totalCargos,
        totalRecaudado,
        totalPendiente,
        porcentajeRecaudacion,
        unidadesAlDia,
        unidadesMorosas,
      };
    } catch (error) {
      logger.error('Error al generar reporte de recaudación:', error);
      throw error;
    }
  }

  /**
   * Enviar recordatorio de pago a unidades morosas
   */
  async generarRecordatoriosPago(
    condominioId: string,
    periodo: string
  ): Promise<
    Array<{
      unidadId: string;
      unidadNumero: string;
      propietario: string;
      telefono?: string;
      email?: string;
      saldoPendiente: number;
      mensaje: string;
    }>
  > {
    try {
      const morosas = await this.obtenerUnidadesMorosas(condominioId, periodo);

      const recordatorios = morosas.map((morosa) => {
        const unidad = morosa;

        return {
          unidadId: unidad.unidadId,
          unidadNumero: unidad.unidadNumero,
          propietario: unidad.propietario,
          telefono: undefined, // Se puede obtener de la unidad
          email: undefined, // Se puede obtener de la unidad
          saldoPendiente: unidad.saldoPendiente,
          mensaje: `Estimado(a) ${unidad.propietario}, le recordamos que tiene un saldo pendiente de RD$${unidad.saldoPendiente.toFixed(2)} correspondiente al(los) periodo(s): ${unidad.periodos.join(', ')}. Por favor, regularice su situación.`,
        };
      });

      return recordatorios;
    } catch (error) {
      logger.error('Error al generar recordatorios de pago:', error);
      throw error;
    }
  }
}
