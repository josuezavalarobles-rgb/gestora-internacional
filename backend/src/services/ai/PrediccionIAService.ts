// ========================================
// PREDICCION IA SERVICE
// Predicciones ML con Claude AI y análisis predictivo
// ========================================

import { PrismaClient, PrediccionIA } from '@prisma/client';
import { logger } from '../../utils/logger';
import Anthropic from '@anthropic-ai/sdk';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface DatosPrediccion {
  valores: number[];
  fechas: Date[];
}

export interface ResultadoPrediccion {
  valorPredicho: number;
  confianza: number;
  rangoMinimo: number;
  rangoMaximo: number;
  factores: string[];
}

export class PrediccionIAService {
  private static instance: PrediccionIAService;

  private constructor() {}

  public static getInstance(): PrediccionIAService {
    if (!PrediccionIAService.instance) {
      PrediccionIAService.instance = new PrediccionIAService();
    }
    return PrediccionIAService.instance;
  }

  /**
   * Predecir gastos mensuales del condominio
   */
  async predecirGastosMensuales(
    condominioId: string,
    mesesProyeccion: number = 3
  ): Promise<PrediccionIA> {
    try {
      logger.info(`Prediciendo gastos mensuales para ${mesesProyeccion} meses`);

      // Obtener histórico de gastos (últimos 12 meses)
      const hace12Meses = new Date();
      hace12Meses.setMonth(hace12Meses.getMonth() - 12);

      const gastos = await prisma.gasto.findMany({
        where: {
          condominioId,
          fechaEmision: {
            gte: hace12Meses,
          },
        },
        orderBy: {
          fechaEmision: 'asc',
        },
      });

      // Agrupar gastos por mes
      const gastosPorMes = new Map<string, number>();
      gastos.forEach((gasto) => {
        const mes = gasto.fechaEmision.toISOString().substring(0, 7); // YYYY-MM
        const total = Number(gasto.total);
        gastosPorMes.set(mes, (gastosPorMes.get(mes) || 0) + total);
      });

      const valores = Array.from(gastosPorMes.values());
      const fechas = Array.from(gastosPorMes.keys()).map((m) => new Date(m + '-01'));

      // Usar Claude para análisis predictivo
      const resultado = await this.predecirConClaude({
        tipo: 'gastos_mensuales',
        contexto: `Histórico de gastos mensuales de condominio (últimos ${valores.length} meses)`,
        valores,
        fechas,
        mesesProyeccion,
      });

      // Guardar predicción
      const prediccion = await prisma.prediccionIA.create({
        data: {
          condominioId,
          tipo: 'gastos_mensuales',
          datosEntrada: {
            valores,
            fechas: fechas.map((f) => f.toISOString()),
            mesesProyeccion,
          } as any,
          valorPredicho: new Decimal(resultado.valorPredicho),
          confianza: new Decimal(resultado.confianza),
          rangoMinimo: new Decimal(resultado.rangoMinimo),
          rangoMaximo: new Decimal(resultado.rangoMaximo),
          factores: resultado.factores,
          modeloUsado: 'claude-3-5-sonnet',
        },
      });

      logger.info(
        `✅ Predicción creada: Gasto proyectado: RD$${resultado.valorPredicho.toFixed(2)}`
      );
      return prediccion;
    } catch (error) {
      logger.error('Error al predecir gastos mensuales:', error);
      throw error;
    }
  }

  /**
   * Predecir tasa de morosidad
   */
  async predecirTasaMorosidad(
    condominioId: string
  ): Promise<PrediccionIA> {
    try {
      logger.info('Prediciendo tasa de morosidad');

      // Obtener histórico de estados de cuenta (últimos 12 meses)
      const hace12Meses = new Date();
      hace12Meses.setMonth(hace12Meses.getMonth() - 12);

      const estadosCuenta = await prisma.estadoCuenta.findMany({
        where: {
          unidad: {
            condominioId,
          },
          fechaCreacion: {
            gte: hace12Meses,
          },
        },
        include: {
          unidad: true,
        },
      });

      // Calcular tasa de morosidad por mes
      const tasasPorMes = new Map<string, number>();
      const estadosPorMes = new Map<string, typeof estadosCuenta>();

      estadosCuenta.forEach((estado) => {
        const mes = estado.periodo;
        if (!estadosPorMes.has(mes)) {
          estadosPorMes.set(mes, []);
        }
        estadosPorMes.get(mes)!.push(estado);
      });

      estadosPorMes.forEach((estados, mes) => {
        const totalUnidades = estados.length;
        const unidadesMorosas = estados.filter(
          (e) => Number(e.saldoFinal) > 0
        ).length;
        const tasa = (unidadesMorosas / totalUnidades) * 100;
        tasasPorMes.set(mes, tasa);
      });

      const valores = Array.from(tasasPorMes.values());
      const fechas = Array.from(tasasPorMes.keys()).map((m) => new Date(m + '-01'));

      // Predecir con Claude
      const resultado = await this.predecirConClaude({
        tipo: 'tasa_morosidad',
        contexto: `Histórico de tasa de morosidad (últimos ${valores.length} meses)`,
        valores,
        fechas,
        mesesProyeccion: 1,
      });

      // Guardar predicción
      const prediccion = await prisma.prediccionIA.create({
        data: {
          condominioId,
          tipo: 'tasa_morosidad',
          datosEntrada: {
            valores,
            fechas: fechas.map((f) => f.toISOString()),
          } as any,
          valorPredicho: new Decimal(resultado.valorPredicho),
          confianza: new Decimal(resultado.confianza),
          rangoMinimo: new Decimal(resultado.rangoMinimo),
          rangoMaximo: new Decimal(resultado.rangoMaximo),
          factores: resultado.factores,
          modeloUsado: 'claude-3-5-sonnet',
        },
      });

      logger.info(
        `✅ Predicción creada: Tasa de morosidad proyectada: ${resultado.valorPredicho.toFixed(2)}%`
      );
      return prediccion;
    } catch (error) {
      logger.error('Error al predecir tasa de morosidad:', error);
      throw error;
    }
  }

  /**
   * Predecir con Claude AI (análisis de series temporales)
   */
  private async predecirConClaude(params: {
    tipo: string;
    contexto: string;
    valores: number[];
    fechas: Date[];
    mesesProyeccion: number;
  }): Promise<ResultadoPrediccion> {
    try {
      // Preparar datos para Claude
      const datosFormateados = params.valores
        .map((valor, i) => {
          const fecha = params.fechas[i].toISOString().substring(0, 7);
          return `${fecha}: ${valor.toFixed(2)}`;
        })
        .join('\n');

      const response = await anthropic.messages.create({
        model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: `Eres un analista financiero experto en predicción de series temporales.

${params.contexto}

Datos históricos:
${datosFormateados}

Basándote en estos datos:
1. Predice el valor para los próximos ${params.mesesProyeccion} mes(es)
2. Analiza tendencias, estacionalidad y patrones
3. Identifica factores que influyen en los valores
4. Calcula rango de confianza (mínimo y máximo)

Devuelve tu análisis en formato JSON:
{
  "valorPredicho": número (valor promedio esperado),
  "confianza": número entre 0 y 1 (nivel de confianza),
  "rangoMinimo": número (escenario pesimista),
  "rangoMaximo": número (escenario optimista),
  "factores": ["factor 1", "factor 2", ...],
  "tendencia": "creciente/decreciente/estable",
  "estacionalidad": "si/no",
  "recomendaciones": ["recomendación 1", "recomendación 2", ...]
}

Devuelve SOLO el JSON, sin texto adicional.`,
          },
        ],
      });

      const textoRespuesta = response.content
        .filter((block) => block.type === 'text')
        .map((block) => (block as any).text)
        .join('\n');

      // Parsear respuesta
      const jsonMatch = textoRespuesta.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No se pudo parsear respuesta de Claude');
      }

      const resultado = JSON.parse(jsonMatch[0]);

      return {
        valorPredicho: resultado.valorPredicho,
        confianza: resultado.confianza,
        rangoMinimo: resultado.rangoMinimo,
        rangoMaximo: resultado.rangoMaximo,
        factores: resultado.factores || [],
      };
    } catch (error) {
      logger.error('Error en predicción con Claude:', error);
      // Fallback a regresión lineal simple
      return this.regressionLinealSimple(params.valores);
    }
  }

  /**
   * Regresión lineal simple (fallback)
   */
  private regressionLinealSimple(valores: number[]): ResultadoPrediccion {
    const n = valores.length;

    // Calcular promedio
    const promedio = valores.reduce((sum, val) => sum + val, 0) / n;

    // Calcular tendencia (pendiente)
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;

    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += valores[i];
      sumXY += i * valores[i];
      sumX2 += i * i;
    }

    const pendiente = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercepto = (sumY - pendiente * sumX) / n;

    // Predecir siguiente valor
    const valorPredicho = pendiente * n + intercepto;

    // Calcular desviación estándar
    const varianza =
      valores.reduce((sum, val) => sum + Math.pow(val - promedio, 2), 0) / n;
    const desviacionEstandar = Math.sqrt(varianza);

    return {
      valorPredicho: Math.max(0, valorPredicho),
      confianza: 0.65, // Confianza moderada para regresión simple
      rangoMinimo: Math.max(0, valorPredicho - desviacionEstandar * 1.5),
      rangoMaximo: valorPredicho + desviacionEstandar * 1.5,
      factores: ['Tendencia histórica', 'Regresión lineal'],
    };
  }

  /**
   * Obtener predicciones anteriores
   */
  async obtenerPredicciones(
    condominioId: string,
    tipo?: string
  ): Promise<PrediccionIA[]> {
    try {
      const where: any = { condominioId };

      if (tipo) {
        where.tipo = tipo;
      }

      const predicciones = await prisma.prediccionIA.findMany({
        where,
        orderBy: {
          fechaPrediccion: 'desc',
        },
        take: 10,
      });

      return predicciones;
    } catch (error) {
      logger.error('Error al obtener predicciones:', error);
      throw error;
    }
  }

  /**
   * Análisis de tendencias con IA
   */
  async analizarTendencias(
    condominioId: string
  ): Promise<{
    gastosProyectados: number;
    tasaMorosidadProyectada: number;
    alertas: string[];
    recomendaciones: string[];
  }> {
    try {
      logger.info('Analizando tendencias con IA');

      // Ejecutar predicciones en paralelo
      const [prediccionGastos, prediccionMorosidad] = await Promise.all([
        this.predecirGastosMensuales(condominioId, 1),
        this.predecirTasaMorosidad(condominioId),
      ]);

      const alertas: string[] = [];
      const recomendaciones: string[] = [];

      // Analizar gastos
      const gastosProyectados = Number(prediccionGastos.valorPredicho);
      const confianzaGastos = Number(prediccionGastos.confianza);

      if (confianzaGastos < 0.6) {
        alertas.push(
          'Baja confianza en predicción de gastos. Se recomienda revisar datos históricos.'
        );
      }

      // Analizar morosidad
      const tasaMorosidadProyectada = Number(prediccionMorosidad.valorPredicho);

      if (tasaMorosidadProyectada > 30) {
        alertas.push(
          `Tasa de morosidad proyectada alta: ${tasaMorosidadProyectada.toFixed(1)}%`
        );
        recomendaciones.push(
          'Implementar plan de cobranza más agresivo',
          'Enviar recordatorios de pago automatizados',
          'Considerar facilidades de pago'
        );
      }

      if (tasaMorosidadProyectada > 20 && tasaMorosidadProyectada <= 30) {
        alertas.push('Tasa de morosidad en nivel de atención');
        recomendaciones.push(
          'Monitorear de cerca la recaudación',
          'Contactar propietarios morosos'
        );
      }

      // Recomendaciones generales
      if (gastosProyectados > 0) {
        const rangoMaximo = Number(prediccionGastos.rangoMaximo);
        const buffer = rangoMaximo - gastosProyectados;

        recomendaciones.push(
          `Presupuestar entre RD$${gastosProyectados.toFixed(2)} y RD$${rangoMaximo.toFixed(2)}`,
          `Mantener reserva de emergencia de al menos RD$${buffer.toFixed(2)}`
        );
      }

      return {
        gastosProyectados,
        tasaMorosidadProyectada,
        alertas,
        recomendaciones,
      };
    } catch (error) {
      logger.error('Error al analizar tendencias:', error);
      throw error;
    }
  }

  /**
   * Generar insights con IA
   */
  async generarInsights(condominioId: string): Promise<string[]> {
    try {
      logger.info('Generando insights con IA');

      // Obtener datos del condominio
      const [gastos, ingresos, estadosCuenta] = await Promise.all([
        prisma.gasto.findMany({
          where: { condominioId },
          orderBy: { fechaEmision: 'desc' },
          take: 50,
        }),
        prisma.ingreso.findMany({
          where: { condominioId },
          orderBy: { fechaIngreso: 'desc' },
          take: 50,
        }),
        prisma.estadoCuenta.findMany({
          where: {
            unidad: { condominioId },
          },
          orderBy: { periodo: 'desc' },
          take: 50,
        }),
      ]);

      // Preparar resumen para Claude
      const totalGastos = gastos.reduce((sum, g) => sum + Number(g.total), 0);
      const totalIngresos = ingresos.reduce((sum, i) => sum + Number(i.monto), 0);
      const saldoPendiente = estadosCuenta.reduce(
        (sum, e) => sum + Number(e.saldoFinal),
        0
      );

      const response = await anthropic.messages.create({
        model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `Eres un consultor financiero experto en gestión de condominios.

Analiza estos datos y genera 5 insights clave:

- Total de gastos recientes: RD$${totalGastos.toFixed(2)}
- Total de ingresos recientes: RD$${totalIngresos.toFixed(2)}
- Saldo pendiente de cobro: RD$${saldoPendiente.toFixed(2)}
- Cantidad de gastos: ${gastos.length}
- Cantidad de ingresos: ${ingresos.length}

Devuelve un array JSON con 5 insights accionables:
["insight 1", "insight 2", "insight 3", "insight 4", "insight 5"]

Enfócate en tendencias, riesgos y oportunidades de mejora.
Devuelve SOLO el array JSON.`,
          },
        ],
      });

      const textoRespuesta = response.content
        .filter((block) => block.type === 'text')
        .map((block) => (block as any).text)
        .join('\n');

      const jsonMatch = textoRespuesta.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return [
        'Revisar histórico de gastos para identificar patrones',
        'Monitorear tasa de recaudación mensual',
        'Evaluar proveedores y buscar mejores precios',
      ];
    } catch (error) {
      logger.error('Error al generar insights:', error);
      return [];
    }
  }
}
