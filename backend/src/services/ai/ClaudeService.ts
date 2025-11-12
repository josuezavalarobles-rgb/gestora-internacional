/**
 * ========================================
 * SERVICIO DE IA - CLAUDE (ANTHROPIC)
 * ========================================
 * Integración con Claude AI de Anthropic como alternativa a OpenAI
 * Incluye análisis de sentimientos avanzado y predicciones ML
 */

import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../../utils/logger';
import { config } from '../../config';

export interface ClaudeResponse {
  texto: string;
  confianza: number;
  sentimiento?: 'positivo' | 'neutral' | 'negativo';
  emocion?: string;
  urgencia?: 'baja' | 'media' | 'alta' | 'urgente';
  prediccionResolucion?: number; // horas estimadas
}

export interface SentimientoAnalisis {
  sentimiento: 'positivo' | 'neutral' | 'negativo';
  confianza: number;
  emocion: string;
  tono: string;
  urgenciaDetectada: boolean;
  palabrasClave: string[];
}

export class ClaudeService {
  private static instance: ClaudeService;
  private claude: Anthropic | null = null;
  private enabled: boolean = false;

  private constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY || config.anthropic?.apiKey;

    if (apiKey) {
      this.claude = new Anthropic({
        apiKey,
      });
      this.enabled = true;
      logger.info('✅ Claude AI inicializado');
    } else {
      logger.warn('⚠️ Claude AI no configurado (falta ANTHROPIC_API_KEY)');
    }
  }

  public static getInstance(): ClaudeService {
    if (!ClaudeService.instance) {
      ClaudeService.instance = new ClaudeService();
    }
    return ClaudeService.instance;
  }

  public isEnabled(): boolean {
    return this.enabled && this.claude !== null;
  }

  /**
   * Procesar mensaje con Claude
   */
  public async processMessage(
    mensaje: string,
    contexto?: string[]
  ): Promise<ClaudeResponse> {
    if (!this.isEnabled()) {
      throw new Error('Claude AI no está habilitado');
    }

    try {
      logger.info('🤖 Procesando mensaje con Claude...');

      // Construir contexto conversacional
      const contextMessages = contexto?.map(msg => msg).join('\n') || '';

      const systemPrompt = `Eres un asistente de IA para Amico Management, sistema de gestión de condominios en República Dominicana.

Tu trabajo es:
1. Entender problemas reportados por propietarios
2. Clasificar la urgencia del caso
3. Analizar el sentimiento del usuario
4. Proporcionar respuestas útiles y empáticas
5. Estimar tiempo de resolución

Responde en español dominicano de forma natural y amigable.
${contextMessages ? `\nContexto previo:\n${contextMessages}` : ''}`;

      const response = await this.claude!.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: mensaje,
          },
        ],
      });

      const texto = response.content[0].type === 'text' ? response.content[0].text : '';

      // Analizar sentimiento en paralelo
      const sentimiento = await this.analizarSentimiento(mensaje);

      // Predecir tiempo de resolución
      const prediccionResolucion = await this.predecirTiempoResolucion(mensaje);

      return {
        texto,
        confianza: 0.85,
        sentimiento: sentimiento.sentimiento,
        emocion: sentimiento.emocion,
        urgencia: sentimiento.urgenciaDetectada ? 'urgente' : 'media',
        prediccionResolucion,
      };
    } catch (error: any) {
      logger.error('❌ Error procesando mensaje con Claude:', error);
      throw error;
    }
  }

  /**
   * Análisis de sentimiento avanzado
   */
  public async analizarSentimiento(texto: string): Promise<SentimientoAnalisis> {
    if (!this.isEnabled()) {
      throw new Error('Claude AI no está habilitado');
    }

    try {
      logger.info('😊 Analizando sentimiento con Claude...');

      const response = await this.claude!.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        system: `Eres un experto en análisis de sentimientos. Analiza el texto y responde SOLO en formato JSON con esta estructura exacta:
{
  "sentimiento": "positivo|neutral|negativo",
  "confianza": 0.0-1.0,
  "emocion": "feliz|frustrado|enojado|preocupado|neutral|ansioso|satisfecho",
  "tono": "formal|informal|urgente|calmado|agresivo|amable",
  "urgenciaDetectada": true|false,
  "palabrasClave": ["palabra1", "palabra2"]
}`,
        messages: [
          {
            role: 'user',
            content: `Analiza el sentimiento de este texto:\n\n"${texto}"`,
          },
        ],
      });

      const respuestaTexto = response.content[0].type === 'text' ? response.content[0].text : '{}';

      // Extraer JSON de la respuesta
      const jsonMatch = respuestaTexto.match(/\{[\s\S]*\}/);
      const analisis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

      if (!analisis) {
        // Fallback analysis
        return {
          sentimiento: 'neutral',
          confianza: 0.5,
          emocion: 'neutral',
          tono: 'formal',
          urgenciaDetectada: false,
          palabrasClave: [],
        };
      }

      logger.info(`✅ Sentimiento: ${analisis.sentimiento} (${analisis.emocion})`);

      return analisis;
    } catch (error: any) {
      logger.error('❌ Error analizando sentimiento:', error);

      // Fallback: análisis básico
      return {
        sentimiento: texto.includes('urgente') || texto.includes('emergencia') ? 'negativo' : 'neutral',
        confianza: 0.5,
        emocion: 'neutral',
        tono: 'formal',
        urgenciaDetectada: texto.toLowerCase().includes('urgente') || texto.toLowerCase().includes('emergencia'),
        palabrasClave: [],
      };
    }
  }

  /**
   * Predicción de tiempo de resolución usando ML
   */
  public async predecirTiempoResolucion(descripcionProblema: string): Promise<number> {
    if (!this.isEnabled()) {
      return 24; // Default: 24 horas
    }

    try {
      logger.info('⏱️ Prediciendo tiempo de resolución con Claude...');

      const response = await this.claude!.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 200,
        system: `Eres un experto en gestión de mantenimiento de condominios.
Basándote en la descripción del problema, estima el tiempo de resolución en horas.
Considera:
- Filtraciones: 24-48 horas
- Problemas eléctricos: 12-24 horas
- Plomería: 12-36 horas
- Aire acondicionado: 24-48 horas
- Pintura: 48-72 horas
- Urgencias: 4-8 horas

Responde SOLO con el número de horas estimadas (sin texto adicional).`,
        messages: [
          {
            role: 'user',
            content: `Estima tiempo de resolución para: "${descripcionProblema}"`,
          },
        ],
      });

      const respuestaTexto = response.content[0].type === 'text' ? response.content[0].text : '24';
      const horas = parseInt(respuestaTexto.match(/\d+/)?.[0] || '24');

      logger.info(`✅ Tiempo estimado: ${horas} horas`);

      return horas;
    } catch (error: any) {
      logger.error('❌ Error prediciendo tiempo:', error);
      return 24; // Default
    }
  }

  /**
   * Clasificar categoría del problema
   */
  public async clasificarProblema(descripcion: string): Promise<{
    categoria: string;
    tipo: 'garantia' | 'condominio';
    prioridad: 'baja' | 'media' | 'alta' | 'urgente';
    confianza: number;
  }> {
    if (!this.isEnabled()) {
      return {
        categoria: 'general',
        tipo: 'condominio',
        prioridad: 'media',
        confianza: 0.5,
      };
    }

    try {
      logger.info('🏷️ Clasificando problema con Claude...');

      const response = await this.claude!.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 300,
        system: `Clasifica problemas de condominio. Responde SOLO en JSON:
{
  "categoria": "filtracion|electrico|plomeria|climatizacion|pintura|cerrajeria|vidrios|estructural|limpieza|general",
  "tipo": "garantia|condominio",
  "prioridad": "baja|media|alta|urgente",
  "confianza": 0.0-1.0
}

Garantía: Problemas dentro de apartamentos privados
Condominio: Áreas comunes o exteriores`,
        messages: [
          {
            role: 'user',
            content: `Clasifica: "${descripcion}"`,
          },
        ],
      });

      const respuestaTexto = response.content[0].type === 'text' ? response.content[0].text : '{}';
      const jsonMatch = respuestaTexto.match(/\{[\s\S]*\}/);
      const clasificacion = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

      if (!clasificacion) {
        return {
          categoria: 'general',
          tipo: 'condominio',
          prioridad: 'media',
          confianza: 0.5,
        };
      }

      logger.info(`✅ Clasificación: ${clasificacion.categoria} - ${clasificacion.tipo}`);

      return clasificacion;
    } catch (error: any) {
      logger.error('❌ Error clasificando problema:', error);
      return {
        categoria: 'general',
        tipo: 'condominio',
        prioridad: 'media',
        confianza: 0.5,
      };
    }
  }

  /**
   * Generar resumen de conversación
   */
  public async generarResumen(mensajes: string[]): Promise<string> {
    if (!this.isEnabled()) {
      return 'Resumen no disponible';
    }

    try {
      logger.info('📝 Generando resumen con Claude...');

      const conversacion = mensajes.join('\n---\n');

      const response = await this.claude!.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        system: 'Eres un asistente que genera resúmenes concisos de conversaciones. Resume los puntos clave en máximo 3 párrafos.',
        messages: [
          {
            role: 'user',
            content: `Resume esta conversación:\n\n${conversacion}`,
          },
        ],
      });

      const resumen = response.content[0].type === 'text' ? response.content[0].text : '';

      logger.info('✅ Resumen generado');

      return resumen;
    } catch (error: any) {
      logger.error('❌ Error generando resumen:', error);
      return 'Error generando resumen';
    }
  }
}
