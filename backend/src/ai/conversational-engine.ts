/**
 * ========================================
 * MOTOR CONVERSACIONAL DE IA
 * ========================================
 * Sistema avanzado de conversación usando OpenAI y Langchain
 * con manejo de contexto, memoria y clasificación inteligente
 */

import { ChatOpenAI } from 'langchain/chat_models/openai';
import { BufferMemory } from 'langchain/memory';
import { ConversationChain } from 'langchain/chains';
import { HumanMessage, SystemMessage, AIMessage, BaseMessage } from 'langchain/schema';
import { PromptTemplate } from 'langchain/prompts';
import OpenAI from 'openai';

import { logger } from '../utils/logger';
import { config } from '../config';
import { cacheService } from '../config/redis';

/**
 * Tipos e interfaces
 */
export interface ConversationContext {
  telefono: string;
  nombreUsuario?: string;
  etapa: 'inicial' | 'recopilando_info' | 'procesando' | 'en_seguimiento' | 'finalizada';
  datosRecopilados: {
    tipo?: 'garantia' | 'condominio';
    categoria?: string;
    descripcion?: string;
    urgencia?: boolean;
    unidad?: string;
    fotosRecibidas?: number;
  };
  historialMensajes: BaseMessage[];
  ultimoIntent?: string;
  casoActual?: string;
  metadata?: Record<string, any>;
}

export interface AIResponse {
  respuesta: string;
  intent: string;
  confidence: number;
  requiereHumano: boolean;
  razonEscalamiento?: string;
  datosRecopilados?: any;
  nuevaEtapa?: string;
  crearCaso?: boolean;
  accionSugerida?: string;
  emocionDetectada?: 'neutral' | 'frustrado' | 'urgente' | 'satisfecho' | 'confundido';
}

export interface ProcessMessageOptions {
  mensaje: string;
  contexto: ConversationContext;
  mediaUrl?: string;
  forceIntent?: string;
}

/**
 * Motor conversacional principal
 */
export class ConversationalEngine {
  private static instance: ConversationalEngine;
  private chatModel: ChatOpenAI;
  private openai: OpenAI;
  private conversations: Map<string, ConversationChain>;

  private constructor() {
    // Inicializar modelo de chat con Langchain
    this.chatModel = new ChatOpenAI({
      openAIApiKey: config.openai.apiKey,
      modelName: config.openai.model,
      temperature: config.openai.temperature,
      maxTokens: config.openai.maxTokens,
    });

    // Cliente OpenAI directo para funciones avanzadas
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey,
    });

    // Mapa de conversaciones activas
    this.conversations = new Map();
  }

  /**
   * Singleton
   */
  public static getInstance(): ConversationalEngine {
    if (!ConversationalEngine.instance) {
      ConversationalEngine.instance = new ConversationalEngine();
    }
    return ConversationalEngine.instance;
  }

  /**
   * Procesar mensaje del usuario con contexto completo
   */
  public async processMessage(options: ProcessMessageOptions): Promise<AIResponse> {
    try {
      const { mensaje, contexto, mediaUrl } = options;

      logger.info(`🤖 Procesando mensaje de ${contexto.telefono}: "${mensaje}"`);

      // 1. Detectar urgencia primero
      const esUrgente = this.detectarUrgencia(mensaje);

      // 2. Detectar emoción del usuario
      const emocion = await this.detectarEmocion(mensaje);

      // 3. Construir mensajes para el modelo
      const messages = this.buildMessages(contexto, mensaje);

      // 4. Invocar modelo de IA
      const response = await this.chatModel.call(messages);

      // 5. Parsear respuesta
      const content = typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content);
      const aiResponse = this.parseResponse(content, contexto);

      // 6. Agregar detección de urgencia y emoción
      if (esUrgente && !aiResponse.requiereHumano) {
        aiResponse.requiereHumano = true;
        aiResponse.razonEscalamiento = 'Situación urgente detectada';
        aiResponse.emocionDetectada = 'urgente';
      } else {
        aiResponse.emocionDetectada = emocion;
      }

      // 7. Guardar en cache (TTL 30 minutos)
      await this.guardarContextoEnCache(contexto.telefono, {
        ...contexto,
        ultimoIntent: aiResponse.intent,
      });

      logger.info(
        `✅ Respuesta generada - Intent: ${aiResponse.intent}, Confianza: ${aiResponse.confidence}`
      );

      return aiResponse;
    } catch (error) {
      logger.error('❌ Error en ConversationalEngine.processMessage:', error);

      return {
        respuesta:
          'Disculpa, tuve un problema procesando tu mensaje. ¿Puedes reformularlo o escribir de nuevo?',
        intent: 'error',
        confidence: 0,
        requiereHumano: false,
        emocionDetectada: 'neutral',
      };
    }
  }

  /**
   * Construir mensajes para el modelo
   */
  private buildMessages(contexto: ConversationContext, mensaje: string): BaseMessage[] {
    const messages: BaseMessage[] = [];

    // System prompt
    messages.push(new SystemMessage(this.getSystemPrompt(contexto)));

    // Historial de conversación (últimos 10 mensajes)
    const historial = contexto.historialMensajes.slice(-10);
    messages.push(...historial);

    // Mensaje actual
    messages.push(new HumanMessage(mensaje));

    return messages;
  }

  /**
   * System prompt dinámico según etapa de conversación
   */
  private getSystemPrompt(contexto: ConversationContext): string {
    const basePrompt = `
Eres un asistente virtual inteligente de Amico Management, empresa dominicana que administra condominios.

PERSONALIDAD:
- Profesional pero cálido y empático
- Hablas en español dominicano natural (tuteo: "¿Cómo estás?", "¿En qué te ayudo?")
- Eres eficiente y resolutivo
- Usas emojis con moderación (máximo 2 por mensaje)
- Te anticipas a las necesidades del usuario

TU MISIÓN:
Ayudar a residentes a reportar problemas técnicos de manera conversacional y eficiente.

INFORMACIÓN A RECOPILAR:
1. Tipo de problema:
   - Garantía: Defectos de construcción (filtraciones, grietas, estructurales)
   - Condominio: Mantenimiento general (áreas comunes, limpieza, servicios)

2. Categoría:
   - Filtraciones/Humedad
   - Problemas eléctricos
   - Plomería
   - Puertas/Ventanas
   - Pisos/Paredes/Techo
   - Aires acondicionados
   - Áreas comunes
   - Seguridad
   - Otro

3. Descripción clara del problema
4. Urgencia/Severidad
5. Fotos/Videos (si es posible)
6. Unidad del residente

REGLAS DE ORO:
- NO uses lenguaje de formulario. Sé conversacional y natural
- Detecta información implícita (ej: "tengo filtración" → automáticamente sabes que es categoría Filtraciones)
- Confirma solo información importante
- Si el usuario se frustra o usa palabras como "urgente", "emergencia", "supervisor" → ESCALA A HUMANO
- Mantén contexto de la conversación completa

RESPONDE SIEMPRE EN FORMATO JSON:
{
  "respuesta": "tu respuesta conversacional aquí",
  "intent": "saludo | reportar_problema | solicitar_estado | urgente | consulta | confirmar_cita | otro",
  "confidence": 0.0-1.0,
  "requiere_humano": false,
  "razon_escalamiento": "solo si requiere_humano es true",
  "datos_recopilados": {
    "tipo": "garantia o condominio (si detectaste)",
    "categoria": "la categoría (si detectaste)",
    "descripcion": "resumen del problema",
    "urgencia": true/false,
    "unidad": "número de unidad si lo mencionó"
  },
  "nueva_etapa": "inicial | recopilando_info | procesando | finalizada",
  "crear_caso": false,
  "accion_sugerida": "programar_visita | solicitar_fotos | escalar | ninguna"
}`;

    // Contexto específico de la etapa actual
    let etapaContext = '';

    switch (contexto.etapa) {
      case 'inicial':
        etapaContext = `
ETAPA: INICIAL
- Primera interacción con el usuario
- Saluda amablemente si corresponde
- Pregunta cómo puedes ayudar de forma natural
- Detecta si quiere reportar un problema o consultar estado`;
        break;

      case 'recopilando_info':
        etapaContext = `
ETAPA: RECOPILANDO INFORMACIÓN
- Ya sabes que quiere reportar un problema
- Datos ya recopilados: ${JSON.stringify(contexto.datosRecopilados)}
- Identifica qué información falta y pregunta SOLO por eso
- NO repitas preguntas ya respondidas
- Si tienes tipo, categoría y descripción completa → marca crear_caso: true`;
        break;

      case 'procesando':
        etapaContext = `
ETAPA: PROCESANDO
- El caso está siendo creado
- Confirma al usuario que recibiste su reporte
- Explica próximos pasos
- Marca nueva_etapa: "finalizada"`;
        break;

      case 'en_seguimiento':
        etapaContext = `
ETAPA: SEGUIMIENTO
- El usuario tiene un caso activo: ${contexto.casoActual || 'Desconocido'}
- Puede estar preguntando por el estado
- Provee información de seguimiento si la tienes
- Sé empático y proactivo`;
        break;

      case 'finalizada':
        etapaContext = `
ETAPA: FINALIZADA
- El reporte fue completado
- Ofrece ayuda adicional
- Pregunta si necesita algo más`;
        break;
    }

    // Agregar información del usuario si está disponible
    const userContext = contexto.nombreUsuario
      ? `\n\nNOMBRE DEL USUARIO: ${contexto.nombreUsuario}\n`
      : '';

    return basePrompt + '\n\n' + etapaContext + userContext;
  }

  /**
   * Parsear respuesta del modelo
   */
  private parseResponse(content: string, contexto: ConversationContext): AIResponse {
    try {
      // Intentar extraer JSON de la respuesta
      const jsonMatch = content.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        return {
          respuesta: parsed.respuesta || content,
          intent: parsed.intent || 'desconocido',
          confidence: parsed.confidence || 0.7,
          requiereHumano: parsed.requiere_humano || false,
          razonEscalamiento: parsed.razon_escalamiento,
          datosRecopilados: parsed.datos_recopilados,
          nuevaEtapa: parsed.nueva_etapa,
          crearCaso: parsed.crear_caso || false,
          accionSugerida: parsed.accion_sugerida,
        };
      }

      // Si no hay JSON válido, usar contenido como respuesta
      return {
        respuesta: content,
        intent: 'desconocido',
        confidence: 0.5,
        requiereHumano: false,
      };
    } catch (error) {
      logger.error('❌ Error parseando respuesta IA:', error);

      return {
        respuesta: content,
        intent: 'error',
        confidence: 0.3,
        requiereHumano: false,
      };
    }
  }

  /**
   * Detectar urgencia en el mensaje
   */
  private detectarUrgencia(mensaje: string): boolean {
    const palabrasUrgentes = [
      'urgente',
      'emergencia',
      'grave',
      'peligro',
      'inundación',
      'inundacion',
      'incendio',
      'riesgo',
      'crítico',
      'critico',
      'ya',
      'ahora mismo',
      'rápido',
      'rapido',
    ];

    const mensajeLower = mensaje.toLowerCase();
    return palabrasUrgentes.some((palabra) => mensajeLower.includes(palabra));
  }

  /**
   * Detectar emoción del usuario usando GPT
   */
  private async detectarEmocion(
    mensaje: string
  ): Promise<'neutral' | 'frustrado' | 'urgente' | 'satisfecho' | 'confundido'> {
    try {
      const prompt = `Analiza la siguiente mensaje y determina la emoción del usuario. Responde SOLO con una palabra: neutral, frustrado, urgente, satisfecho, o confundido.

Mensaje: "${mensaje}"

Emoción:`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 10,
        temperature: 0.3,
      });

      const emocion = response.choices[0]?.message?.content?.trim().toLowerCase();

      if (
        emocion === 'neutral' ||
        emocion === 'frustrado' ||
        emocion === 'urgente' ||
        emocion === 'satisfecho' ||
        emocion === 'confundido'
      ) {
        return emocion;
      }

      return 'neutral';
    } catch (error) {
      logger.error('❌ Error detectando emoción:', error);
      return 'neutral';
    }
  }

  /**
   * Clasificar tipo de problema usando keywords
   */
  public clasificarTipoProblema(descripcion: string): 'garantia' | 'condominio' | 'desconocido' {
    const palabrasGarantia = [
      'filtración',
      'filtracion',
      'grieta',
      'humedad',
      'defecto',
      'construcción',
      'construccion',
      'pared agrietada',
      'techo',
      'estructura',
      'rajadura',
      'fisura',
    ];

    const palabrasCondominio = [
      'área común',
      'area comun',
      'piscina',
      'gimnasio',
      'limpieza',
      'portón',
      'porton',
      'vigilancia',
      'basura',
      'ascensor',
      'elevador',
      'parqueo',
      'estacionamiento',
    ];

    const descLower = descripcion.toLowerCase();

    if (palabrasGarantia.some((p) => descLower.includes(p))) {
      return 'garantia';
    }

    if (palabrasCondominio.some((p) => descLower.includes(p))) {
      return 'condominio';
    }

    return 'desconocido';
  }

  /**
   * Generar resumen de conversación
   */
  public async generarResumenConversacion(mensajes: string[]): Promise<string> {
    try {
      const conversacion = mensajes.join('\n');

      const prompt = `Resume la siguiente conversación de WhatsApp en máximo 3 oraciones. Enfócate en el problema reportado:

${conversacion}

Resumen:`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
        temperature: 0.5,
      });

      return response.choices[0]?.message?.content?.trim() || 'Sin resumen disponible';
    } catch (error) {
      logger.error('❌ Error generando resumen:', error);
      return 'Error al generar resumen';
    }
  }

  /**
   * Extraer información estructurada de texto libre
   */
  public async extraerInformacionEstructurada(texto: string): Promise<{
    tipo?: 'garantia' | 'condominio';
    categoria?: string;
    descripcion?: string;
    urgencia?: boolean;
    unidad?: string;
  }> {
    try {
      const prompt = `Extrae información estructurada del siguiente reporte de problema. Responde SOLO en formato JSON:

Texto: "${texto}"

Formato de respuesta:
{
  "tipo": "garantia o condominio (si es claro)",
  "categoria": "filtraciones, electrico, plomeria, etc",
  "descripcion": "descripción concisa del problema",
  "urgencia": true/false,
  "unidad": "número de unidad si se menciona"
}

JSON:`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content?.trim() || '{}';
      const jsonMatch = content.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return {};
    } catch (error) {
      logger.error('❌ Error extrayendo información:', error);
      return {};
    }
  }

  /**
   * Guardar contexto en Redis cache
   */
  private async guardarContextoEnCache(
    telefono: string,
    contexto: ConversationContext
  ): Promise<void> {
    try {
      await cacheService.set(`conversation:${telefono}`, contexto, 1800); // 30 minutos
    } catch (error) {
      logger.error('❌ Error guardando contexto en cache:', error);
    }
  }

  /**
   * Obtener contexto desde cache
   */
  public async obtenerContextoDeCache(telefono: string): Promise<ConversationContext | null> {
    try {
      return await cacheService.get<ConversationContext>(`conversation:${telefono}`);
    } catch (error) {
      logger.error('❌ Error obteniendo contexto de cache:', error);
      return null;
    }
  }

  /**
   * Limpiar conversación del cache
   */
  public async limpiarConversacion(telefono: string): Promise<void> {
    try {
      await cacheService.del(`conversation:${telefono}`);
      this.conversations.delete(telefono);
    } catch (error) {
      logger.error('❌ Error limpiando conversación:', error);
    }
  }
}

// Exportar instancia única
export const conversationalEngine = ConversationalEngine.getInstance();

export default ConversationalEngine;
