// ========================================
// FACTURA IA SERVICE
// OCR + Claude AI para procesamiento de facturas
// ========================================

import { PrismaClient, FacturaIAProcesada } from '@prisma/client';
import { logger } from '../../utils/logger';
import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface DatosFacturaExtraidos {
  numeroFactura?: string;
  ncf?: string;
  fecha?: string;
  proveedor?: {
    nombre?: string;
    rnc?: string;
    telefono?: string;
    direccion?: string;
  };
  items: Array<{
    descripcion: string;
    cantidad?: number;
    precioUnitario?: number;
    subtotal?: number;
  }>;
  subtotal?: number;
  itbis?: number;
  total: number;
  formaPago?: string;
  notas?: string;
}

export class FacturaIAService {
  private static instance: FacturaIAService;

  private constructor() {}

  public static getInstance(): FacturaIAService {
    if (!FacturaIAService.instance) {
      FacturaIAService.instance = new FacturaIAService();
    }
    return FacturaIAService.instance;
  }

  /**
   * Procesar factura con Claude AI (imagen o PDF)
   */
  async procesarFactura(
    gastoId: string,
    rutaArchivo: string
  ): Promise<FacturaIAProcesada> {
    try {
      logger.info(`Procesando factura con IA: ${rutaArchivo}`);

      // Leer archivo y convertir a base64
      const archivoBuffer = await fs.readFile(rutaArchivo);
      const base64 = archivoBuffer.toString('base64');
      const extension = path.extname(rutaArchivo).toLowerCase();

      // Determinar tipo de archivo
      let mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' | 'application/pdf';
      switch (extension) {
        case '.jpg':
        case '.jpeg':
          mediaType = 'image/jpeg';
          break;
        case '.png':
          mediaType = 'image/png';
          break;
        case '.gif':
          mediaType = 'image/gif';
          break;
        case '.webp':
          mediaType = 'image/webp';
          break;
        case '.pdf':
          mediaType = 'application/pdf';
          break;
        default:
          throw new Error(`Tipo de archivo no soportado: ${extension}`);
      }

      // Llamar a Claude con visión
      const response = await anthropic.messages.create({
        model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: base64,
                },
              },
              {
                type: 'text',
                text: `Analiza esta factura o comprobante fiscal dominicano y extrae la siguiente información en formato JSON:

{
  "numeroFactura": "número de factura",
  "ncf": "NCF (Número de Comprobante Fiscal) si existe - formato B01/B02/B14/B15/B16 + 8 dígitos",
  "fecha": "fecha en formato YYYY-MM-DD",
  "proveedor": {
    "nombre": "nombre del proveedor o empresa",
    "rnc": "RNC del proveedor si está disponible",
    "telefono": "teléfono si está disponible",
    "direccion": "dirección si está disponible"
  },
  "items": [
    {
      "descripcion": "descripción del producto o servicio",
      "cantidad": número,
      "precioUnitario": número,
      "subtotal": número
    }
  ],
  "subtotal": número antes de ITBIS,
  "itbis": número del ITBIS (18% en República Dominicana),
  "total": número total,
  "formaPago": "efectivo/transferencia/cheque/tarjeta",
  "notas": "cualquier nota relevante"
}

IMPORTANTE:
- El NCF debe tener formato B01/B02/B14/B15/B16 seguido de 8 dígitos
- ITBIS en República Dominicana es 18%
- Verifica que subtotal + ITBIS = total
- Si algún dato no está visible, usa null
- Devuelve SOLO el JSON, sin texto adicional`,
              },
            ],
          },
        ],
      });

      // Extraer texto de la respuesta
      const textoCompleto = response.content
        .filter((block) => block.type === 'text')
        .map((block) => (block as any).text)
        .join('\n');

      logger.info('Respuesta de Claude recibida');

      // Intentar parsear JSON de la respuesta
      let datosEstructurados: DatosFacturaExtraidos | null = null;
      let confianza = 0;

      try {
        // Buscar JSON en la respuesta (puede venir con markdown code blocks)
        const jsonMatch = textoCompleto.match(/```json\n?([\s\S]*?)\n?```/) ||
                         textoCompleto.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
          const jsonString = jsonMatch[1] || jsonMatch[0];
          datosEstructurados = JSON.parse(jsonString);

          // Calcular confianza basada en campos extraídos
          confianza = this.calcularConfianza(datosEstructurados);
        }
      } catch (error) {
        logger.warn('No se pudo parsear JSON de respuesta de Claude:', error);
      }

      // Guardar resultado en base de datos
      const facturaProcesada = await prisma.facturaIAProcesada.create({
        data: {
          gastoId,
          textoExtraido: textoCompleto,
          datosEstructurados: datosEstructurados as any,
          confianza: confianza ? new Decimal(confianza) : null,
          validada: false,
        },
      });

      logger.info(`✅ Factura procesada con IA: ${facturaProcesada.id} - Confianza: ${confianza.toFixed(2)}`);
      return facturaProcesada;
    } catch (error) {
      logger.error('Error al procesar factura con IA:', error);
      throw error;
    }
  }

  /**
   * Calcular nivel de confianza (0-1) basado en datos extraídos
   */
  private calcularConfianza(datos: DatosFacturaExtraidos): number {
    let puntos = 0;
    let maxPuntos = 0;

    // Número de factura (10 puntos)
    maxPuntos += 10;
    if (datos.numeroFactura) puntos += 10;

    // NCF (15 puntos - muy importante en RD)
    maxPuntos += 15;
    if (datos.ncf && this.validarFormatoNCF(datos.ncf)) puntos += 15;
    else if (datos.ncf) puntos += 5; // Parcial si existe pero formato incorrecto

    // Fecha (10 puntos)
    maxPuntos += 10;
    if (datos.fecha && this.validarFecha(datos.fecha)) puntos += 10;

    // Proveedor (15 puntos)
    maxPuntos += 15;
    if (datos.proveedor?.nombre) puntos += 10;
    if (datos.proveedor?.rnc) puntos += 5;

    // Items (20 puntos)
    maxPuntos += 20;
    if (datos.items && datos.items.length > 0) {
      puntos += 10;
      // Verificar que items tengan datos completos
      const itemsCompletos = datos.items.filter(
        (item) => item.descripcion && item.cantidad && item.precioUnitario
      );
      if (itemsCompletos.length === datos.items.length) puntos += 10;
    }

    // Montos (30 puntos - lo más importante)
    maxPuntos += 30;
    if (datos.total) puntos += 10;
    if (datos.subtotal) puntos += 10;
    if (datos.itbis !== undefined) puntos += 5;

    // Verificar cálculo correcto: subtotal + ITBIS = total (tolerancia de 0.01)
    if (datos.subtotal && datos.itbis !== undefined && datos.total) {
      const totalCalculado = datos.subtotal + datos.itbis;
      if (Math.abs(totalCalculado - datos.total) < 0.01) puntos += 5;
    }

    return puntos / maxPuntos;
  }

  /**
   * Validar formato NCF dominicano
   */
  private validarFormatoNCF(ncf: string): boolean {
    const regex = /^(B01|B02|B14|B15|B16)\d{8}$/;
    return regex.test(ncf);
  }

  /**
   * Validar formato de fecha
   */
  private validarFecha(fecha: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(fecha)) return false;

    const date = new Date(fecha);
    return !isNaN(date.getTime());
  }

  /**
   * Validar datos extraídos manualmente
   */
  async validarFactura(
    facturaIAId: string,
    validadoPor: string,
    datosCorregidos?: Partial<DatosFacturaExtraidos>
  ): Promise<FacturaIAProcesada> {
    try {
      logger.info(`Validando factura IA: ${facturaIAId}`);

      const actualizacion: any = {
        validada: true,
        validadoPor,
        fechaValidacion: new Date(),
      };

      // Si se proporcionan correcciones, actualizar datos
      if (datosCorregidos) {
        const facturaActual = await prisma.facturaIAProcesada.findUnique({
          where: { id: facturaIAId },
        });

        if (facturaActual?.datosEstructurados) {
          actualizacion.datosEstructurados = {
            ...(facturaActual.datosEstructurados as any),
            ...datosCorregidos,
          };
        }
      }

      const factura = await prisma.facturaIAProcesada.update({
        where: { id: facturaIAId },
        data: actualizacion,
      });

      logger.info(`✅ Factura validada: ${facturaIAId}`);
      return factura;
    } catch (error) {
      logger.error('Error al validar factura:', error);
      throw error;
    }
  }

  /**
   * Obtener facturas procesadas con filtros
   */
  async obtenerFacturasProcesadas(filtros?: {
    validada?: boolean;
    confianzaMinima?: number;
  }): Promise<FacturaIAProcesada[]> {
    try {
      const where: any = {};

      if (filtros?.validada !== undefined) {
        where.validada = filtros.validada;
      }

      if (filtros?.confianzaMinima !== undefined) {
        where.confianza = {
          gte: new Decimal(filtros.confianzaMinima),
        };
      }

      const facturas = await prisma.facturaIAProcesada.findMany({
        where,
        include: {
          gasto: {
            include: {
              proveedor: true,
              condominio: true,
            },
          },
        },
        orderBy: {
          fechaProcesamiento: 'desc',
        },
      });

      return facturas;
    } catch (error) {
      logger.error('Error al obtener facturas procesadas:', error);
      throw error;
    }
  }

  /**
   * Análisis de sentimiento de notas/comentarios en factura
   */
  async analizarSentimientoNotas(texto: string): Promise<{
    sentimiento: 'positivo' | 'neutral' | 'negativo';
    confianza: number;
    resumen: string;
  }> {
    try {
      const response = await anthropic.messages.create({
        model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: `Analiza el sentimiento del siguiente texto de una factura o nota y devuelve JSON:

Texto: "${texto}"

Formato de respuesta:
{
  "sentimiento": "positivo/neutral/negativo",
  "confianza": 0.0 a 1.0,
  "resumen": "breve explicación del sentimiento detectado"
}

Devuelve SOLO el JSON.`,
          },
        ],
      });

      const textoRespuesta = response.content
        .filter((block) => block.type === 'text')
        .map((block) => (block as any).text)
        .join('\n');

      // Parsear respuesta
      const jsonMatch = textoRespuesta.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const resultado = JSON.parse(jsonMatch[0]);
        return resultado;
      }

      return {
        sentimiento: 'neutral',
        confianza: 0,
        resumen: 'No se pudo analizar el sentimiento',
      };
    } catch (error) {
      logger.error('Error al analizar sentimiento:', error);
      throw error;
    }
  }
}
