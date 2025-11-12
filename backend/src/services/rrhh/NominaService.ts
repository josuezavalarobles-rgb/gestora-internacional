// ========================================
// NOMINA SERVICE
// Cálculo de nómina con AFP, ARS e ISR (República Dominicana)
// ========================================

import { PrismaClient, Nomina, Personal } from '@prisma/client';
import { logger } from '../../utils/logger';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

// Tasas de deducción en República Dominicana
const TASA_AFP = 0.0287; // 2.87%
const TASA_ARS = 0.0304; // 3.04%

// Escala de ISR (Impuesto Sobre la Renta) 2024 - República Dominicana
interface TramoISR {
  hasta: number;
  tasa: number;
  baseAnterior: number;
  impuestoAnterior: number;
}

const ESCALA_ISR: TramoISR[] = [
  { hasta: 416220.0, tasa: 0, baseAnterior: 0, impuestoAnterior: 0 }, // Exento
  { hasta: 624329.0, tasa: 0.15, baseAnterior: 416220.0, impuestoAnterior: 0 },
  { hasta: 867123.0, tasa: 0.2, baseAnterior: 624329.0, impuestoAnterior: 31216.35 },
  { hasta: 999999999, tasa: 0.25, baseAnterior: 867123.0, impuestoAnterior: 79775.15 },
];

export interface CrearNominaDTO {
  personalId: string;
  periodo: string; // "2024-12"
  salarioBase: number;
  horasExtras?: number;
  bonos?: number;
  comisiones?: number;
  otrosIngresos?: number;
  otrasDeducciones?: number;
  diasTrabajados?: number; // Default: días del mes
  notas?: string;
}

export interface CalculoNomina {
  salarioBase: number;
  horasExtras: number;
  bonos: number;
  comisiones: number;
  otrosIngresos: number;
  ingresoTotal: number;
  deduccionAFP: number;
  deduccionARS: number;
  deduccionISR: number;
  otrasDeducciones: number;
  totalDeducciones: number;
  salarioNeto: number;
}

export class NominaService {
  private static instance: NominaService;

  private constructor() {}

  public static getInstance(): NominaService {
    if (!NominaService.instance) {
      NominaService.instance = new NominaService();
    }
    return NominaService.instance;
  }

  /**
   * Calcular deducciones de nómina (AFP, ARS, ISR)
   */
  private calcularDeducciones(
    salarioBase: number,
    horasExtras: number = 0,
    bonos: number = 0,
    comisiones: number = 0,
    otrosIngresos: number = 0
  ): {
    deduccionAFP: number;
    deduccionARS: number;
    deduccionISR: number;
  } {
    // Total de ingresos
    const ingresoTotal = salarioBase + horasExtras + bonos + comisiones + otrosIngresos;

    // AFP: 2.87% del salario total
    const deduccionAFP = ingresoTotal * TASA_AFP;

    // ARS: 3.04% del salario total
    const deduccionARS = ingresoTotal * TASA_ARS;

    // ISR: Cálculo anual dividido entre 12
    const salarioAnual = ingresoTotal * 12;
    const isrAnual = this.calcularISR(salarioAnual);
    const deduccionISR = isrAnual / 12;

    return {
      deduccionAFP: Math.round(deduccionAFP * 100) / 100,
      deduccionARS: Math.round(deduccionARS * 100) / 100,
      deduccionISR: Math.round(deduccionISR * 100) / 100,
    };
  }

  /**
   * Calcular ISR según escala progresiva dominicana
   */
  private calcularISR(salarioAnual: number): number {
    if (salarioAnual <= ESCALA_ISR[0].hasta) {
      return 0; // Exento
    }

    // Encontrar el tramo correspondiente
    const tramo = ESCALA_ISR.find((t) => salarioAnual <= t.hasta);

    if (!tramo) {
      return 0;
    }

    // Calcular ISR: impuesto de tramos anteriores + (excedente × tasa del tramo)
    const excedente = salarioAnual - tramo.baseAnterior;
    const isr = tramo.impuestoAnterior + excedente * tramo.tasa;

    return Math.round(isr * 100) / 100;
  }

  /**
   * Calcular nómina completa
   */
  calcular(data: {
    salarioBase: number;
    horasExtras?: number;
    bonos?: number;
    comisiones?: number;
    otrosIngresos?: number;
    otrasDeducciones?: number;
  }): CalculoNomina {
    const horasExtras = data.horasExtras || 0;
    const bonos = data.bonos || 0;
    const comisiones = data.comisiones || 0;
    const otrosIngresos = data.otrosIngresos || 0;
    const otrasDeducciones = data.otrasDeducciones || 0;

    const ingresoTotal = data.salarioBase + horasExtras + bonos + comisiones + otrosIngresos;

    const deducciones = this.calcularDeducciones(
      data.salarioBase,
      horasExtras,
      bonos,
      comisiones,
      otrosIngresos
    );

    const totalDeducciones =
      deducciones.deduccionAFP +
      deducciones.deduccionARS +
      deducciones.deduccionISR +
      otrasDeducciones;

    const salarioNeto = ingresoTotal - totalDeducciones;

    return {
      salarioBase: data.salarioBase,
      horasExtras,
      bonos,
      comisiones,
      otrosIngresos,
      ingresoTotal,
      deduccionAFP: deducciones.deduccionAFP,
      deduccionARS: deducciones.deduccionARS,
      deduccionISR: deducciones.deduccionISR,
      otrasDeducciones,
      totalDeducciones,
      salarioNeto,
    };
  }

  /**
   * Crear nómina para un empleado
   */
  async crearNomina(data: CrearNominaDTO): Promise<Nomina> {
    try {
      logger.info(`Creando nómina para empleado ${data.personalId} - Periodo: ${data.periodo}`);

      // Calcular deducciones
      const calculo = this.calcular({
        salarioBase: data.salarioBase,
        horasExtras: data.horasExtras,
        bonos: data.bonos,
        comisiones: data.comisiones,
        otrosIngresos: data.otrosIngresos,
        otrasDeducciones: data.otrasDeducciones,
      });

      // Crear registro de nómina
      const nomina = await prisma.nomina.create({
        data: {
          personalId: data.personalId,
          periodo: data.periodo,
          salarioBase: new Decimal(calculo.salarioBase),
          horasExtras: new Decimal(calculo.horasExtras),
          bonos: new Decimal(calculo.bonos),
          comisiones: new Decimal(calculo.comisiones),
          otrosIngresos: new Decimal(calculo.otrosIngresos),
          ingresoTotal: new Decimal(calculo.ingresoTotal),
          deduccionAFP: new Decimal(calculo.deduccionAFP),
          deduccionARS: new Decimal(calculo.deduccionARS),
          deduccionISR: new Decimal(calculo.deduccionISR),
          otrasDeducciones: new Decimal(calculo.otrasDeducciones),
          totalDeducciones: new Decimal(calculo.totalDeducciones),
          salarioNeto: new Decimal(calculo.salarioNeto),
          diasTrabajados: data.diasTrabajados || this.getDiasDelMes(data.periodo),
          notas: data.notas,
        },
        include: {
          personal: true,
        },
      });

      logger.info(`✅ Nómina creada: ${nomina.id} - Salario neto: RD$${calculo.salarioNeto.toFixed(2)}`);
      return nomina;
    } catch (error) {
      logger.error('Error al crear nómina:', error);
      throw error;
    }
  }

  /**
   * Procesar nómina para todo el personal activo de un condominio
   */
  async procesarNominaCondominio(
    condominioId: string,
    periodo: string
  ): Promise<Nomina[]> {
    try {
      logger.info(`Procesando nómina para condominio ${condominioId} - Periodo: ${periodo}`);

      // Obtener todo el personal activo del condominio
      const personal = await prisma.personal.findMany({
        where: {
          condominioId,
          activo: true,
        },
      });

      if (personal.length === 0) {
        logger.warn(`No hay personal activo en el condominio ${condominioId}`);
        return [];
      }

      // Crear nómina para cada empleado
      const nominas = await Promise.all(
        personal.map((empleado) =>
          this.crearNomina({
            personalId: empleado.id,
            periodo,
            salarioBase: Number(empleado.salario),
          })
        )
      );

      logger.info(`✅ Nómina procesada para ${nominas.length} empleados`);
      return nominas;
    } catch (error) {
      logger.error('Error al procesar nómina de condominio:', error);
      throw error;
    }
  }

  /**
   * Obtener nóminas con filtros
   */
  async obtenerNominas(filtros?: {
    personalId?: string;
    condominioId?: string;
    periodo?: string;
    pagada?: boolean;
  }): Promise<Nomina[]> {
    try {
      const where: any = {};

      if (filtros?.personalId) {
        where.personalId = filtros.personalId;
      }

      if (filtros?.condominioId) {
        where.personal = {
          condominioId: filtros.condominioId,
        };
      }

      if (filtros?.periodo) {
        where.periodo = filtros.periodo;
      }

      if (filtros?.pagada !== undefined) {
        where.pagada = filtros.pagada;
      }

      const nominas = await prisma.nomina.findMany({
        where,
        include: {
          personal: {
            include: {
              condominio: true,
            },
          },
        },
        orderBy: [{ periodo: 'desc' }, { personal: { nombre: 'asc' } }],
      });

      return nominas;
    } catch (error) {
      logger.error('Error al obtener nóminas:', error);
      throw error;
    }
  }

  /**
   * Marcar nómina como pagada
   */
  async marcarNominaPagada(nominaId: string, fechaPago: Date): Promise<Nomina> {
    try {
      const nomina = await prisma.nomina.update({
        where: { id: nominaId },
        data: {
          pagada: true,
          fechaPago,
        },
        include: {
          personal: true,
        },
      });

      logger.info(`✅ Nómina marcada como pagada: ${nominaId}`);
      return nomina;
    } catch (error) {
      logger.error('Error al marcar nómina como pagada:', error);
      throw error;
    }
  }

  /**
   * Generar reporte de nómina del periodo
   */
  async generarReporteNomina(
    condominioId: string,
    periodo: string
  ): Promise<{
    periodo: string;
    totalEmpleados: number;
    totalSalariosBrutos: number;
    totalAFP: number;
    totalARS: number;
    totalISR: number;
    totalDeducciones: number;
    totalSalariosNetos: number;
    empleados: Array<{
      nombre: string;
      puesto: string;
      salarioBase: number;
      salarioNeto: number;
    }>;
  }> {
    try {
      const nominas = await this.obtenerNominas({
        condominioId,
        periodo,
      });

      const empleados = nominas.map((nomina) => ({
        nombre: nomina.personal.nombre,
        puesto: nomina.personal.puesto,
        salarioBase: Number(nomina.salarioBase),
        salarioNeto: Number(nomina.salarioNeto),
      }));

      const totalSalariosBrutos = nominas.reduce(
        (sum, n) => sum + Number(n.ingresoTotal),
        0
      );
      const totalAFP = nominas.reduce((sum, n) => sum + Number(n.deduccionAFP), 0);
      const totalARS = nominas.reduce((sum, n) => sum + Number(n.deduccionARS), 0);
      const totalISR = nominas.reduce((sum, n) => sum + Number(n.deduccionISR), 0);
      const totalDeducciones = nominas.reduce(
        (sum, n) => sum + Number(n.totalDeducciones),
        0
      );
      const totalSalariosNetos = nominas.reduce(
        (sum, n) => sum + Number(n.salarioNeto),
        0
      );

      return {
        periodo,
        totalEmpleados: nominas.length,
        totalSalariosBrutos,
        totalAFP,
        totalARS,
        totalISR,
        totalDeducciones,
        totalSalariosNetos,
        empleados,
      };
    } catch (error) {
      logger.error('Error al generar reporte de nómina:', error);
      throw error;
    }
  }

  /**
   * Obtener días del mes a partir del periodo
   */
  private getDiasDelMes(periodo: string): number {
    const [year, month] = periodo.split('-').map(Number);
    return new Date(year, month, 0).getDate();
  }

  /**
   * Crear o actualizar datos de personal
   */
  async crearPersonal(data: {
    organizacionId: string;
    condominioId: string;
    nombre: string;
    cedula: string;
    puesto: string;
    salario: number;
    fechaIngreso: Date;
    telefono?: string;
    email?: string;
    direccion?: string;
    numeroAfp?: string;
    numeroArs?: string;
  }): Promise<Personal> {
    try {
      logger.info(`Creando personal: ${data.nombre}`);

      const personal = await prisma.personal.create({
        data: {
          organizacionId: data.organizacionId,
          condominioId: data.condominioId,
          nombre: data.nombre,
          cedula: data.cedula,
          puesto: data.puesto,
          salario: new Decimal(data.salario),
          fechaIngreso: data.fechaIngreso,
          telefono: data.telefono,
          email: data.email,
          direccion: data.direccion,
          numeroAfp: data.numeroAfp,
          numeroArs: data.numeroArs,
        },
      });

      logger.info(`✅ Personal creado: ${personal.id}`);
      return personal;
    } catch (error) {
      logger.error('Error al crear personal:', error);
      throw error;
    }
  }

  /**
   * Obtener personal activo
   */
  async obtenerPersonal(filtros?: {
    condominioId?: string;
    activo?: boolean;
  }): Promise<Personal[]> {
    try {
      const where: any = {};

      if (filtros?.condominioId) {
        where.condominioId = filtros.condominioId;
      }

      if (filtros?.activo !== undefined) {
        where.activo = filtros.activo;
      }

      const personal = await prisma.personal.findMany({
        where,
        include: {
          condominio: true,
          nominas: {
            orderBy: { periodo: 'desc' },
            take: 3,
          },
        },
        orderBy: {
          nombre: 'asc',
        },
      });

      return personal;
    } catch (error) {
      logger.error('Error al obtener personal:', error);
      throw error;
    }
  }
}
