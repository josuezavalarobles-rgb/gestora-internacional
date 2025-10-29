/**
 * ========================================
 * SERVICIO DE INTELIGENCIA ARTIFICIAL
 * ========================================
 * Motor conversacional con GPT-4 / Claude
 */

import { ChatOpenAI } from 'langchain/chat_models/openai';
import { HumanMessage, SystemMessage, AIMessage } from 'langchain/schema';
import { logger } from '../../utils/logger';
import { config } from '../../config';

interface ProcessMessageInput {
  telefono: string;
  mensaje: string;
  mediaUrl?: string;
  contextoConversacion: any[];
  datosRecopilados: any;
  etapa: string;
}

interface AIResponse {
  respuesta: string;
  intent: string;
  confidence: number;
  requiereHumano: boolean;
  razonEscalamiento?: string;
  datosRecopilados?: any;
  nuevaEtapa?: string;
  crearCaso?: boolean;
}

export class AIService {
  private static instance: AIService;
  private model: ChatOpenAI;

  private constructor() {
    this.model = new ChatOpenAI({
      openAIApiKey: config.openai.apiKey,
      modelName: config.openai.model,
      temperature: config.openai.temperature,
      maxTokens: config.openai.maxTokens,
    });
  }

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  /**
   * Procesar mensaje del usuario
   */
  public async processMessage(input: ProcessMessageInput): Promise<AIResponse> {
    try {
      // Construir contexto de conversación
      const messages = this.buildConversationContext(input);

      // Invocar modelo
      const response = await this.model.call(messages);

      // Parsear respuesta
      return this.parseAIResponse(response.content, input);
    } catch (error) {
      logger.error('❌ Error en AIService.processMessage:', error);

      return {
        respuesta:
          'Disculpa, tuve un problema procesando tu mensaje. ¿Puedes reformularlo o escribir de nuevo?',
        intent: 'error',
        confidence: 0,
        requiereHumano: false,
      };
    }
  }

  /**
   * Construir contexto de conversación para la IA
   */
  private buildConversationContext(input: ProcessMessageInput): any[] {
    const messages = [];

    // System prompt (personalidad del bot)
    messages.push(
      new SystemMessage(this.getSystemPrompt(input.etapa, input.datosRecopilados))
    );

    // Historial de conversación (últimos N mensajes)
    const historial = input.contextoConversacion.slice(0, 10).reverse();

    for (const msg of historial) {
      if (msg.direccion === 'entrante') {
        messages.push(new HumanMessage(msg.contenido));
      } else if (msg.direccion === 'saliente') {
        messages.push(new AIMessage(msg.contenido));
      }
    }

    // Mensaje actual
    messages.push(new HumanMessage(input.mensaje));

    return messages;
  }

  /**
   * System Prompt - Personalidad y comportamiento del bot
   */
  private getSystemPrompt(etapa: string, datosRecopilados: any): string {
    const basePrompt = `
Eres un asistente virtual de Amico Management, empresa dominicana que administra condominios.

PERSONALIDAD:
- Amable, profesional y empático
- Hablas en español dominicano (tuteo natural: "¿Cómo estás?", "¿En qué te ayudo?")
- Eres eficiente pero cálido
- Usas emojis con moderación (máximo 2 por mensaje)
- Te anticipas a las necesidades del usuario

TU FUNCIÓN PRINCIPAL:
Ayudar a residentes a reportar averías y problemas técnicos de manera conversacional.

INFORMACIÓN QUE DEBES RECOPILAR (sutilmente):
1. Tipo de problema (garantía vs condominio)
   - Garantía: Defectos de construcción (filtraciones, grietas, etc.)
   - Condominio: Mantenimiento general (áreas comunes, limpieza, etc.)

2. Categoría específica:
   - Filtraciones/Humedad
   - Problemas eléctricos
   - Plomería
   - Puertas/Ventanas
   - Pisos/Paredes/Techo
   - Aires acondicionados
   - Áreas comunes
   - Seguridad
   - Otro

3. Descripción del problema (clara y específica)
4. Fotos o videos (si es posible)
5. Urgencia/severidad

REGLAS DE CONVERSACIÓN:
- Si el usuario dice "hola", "buenos días", etc., responde amablemente y pregunta cómo ayudar
- NO hagas preguntas de formulario. Sé conversacional
- Detecta información implícita. Si dice "tengo una filtración", clasifica automáticamente
- Confirma información importante antes de proceder
- Mantén el contexto de la conversación
- Si el usuario se frustra o usa palabras como "urgente", "emergencia", "supervisor", escala a humano

EJEMPLOS DE RESPUESTAS NATURALES:
❌ "Por favor ingrese la categoría del problema"
✅ "¿Qué tipo de problema tienes? ¿Es algo eléctrico, de plomería, o tal vez una filtración?"

❌ "Adjunte evidencia fotográfica"
✅ "Si puedes, envíame una foto del problema. Eso ayudará mucho a resolverlo más rápido 📸"

❌ "Su caso ha sido registrado con ID #12345"
✅ "Perfecto, ya registré tu reporte 📋 Un técnico revisará tu caso pronto y te contactaremos"

DETECCIÓN DE URGENCIA:
Si detectas palabras como: "urgente", "emergencia", "grave", "inundación", "peligro":
- Marca como urgente automáticamente
- Escala a humano INMEDIATAMENTE
- Responde: "Entiendo que es urgente. Un supervisor revisará tu caso de inmediato"

CUÁNDO ESCALAR A HUMANO:
- Usuario frustrado o insatisfecho
- Problema muy complejo
- Solicita hablar con humano/supervisor
- Situación de emergencia
- No entiendes el problema después de 2 intentos

RESPONDE SIEMPRE EN ESTE FORMATO JSON:
{
  "respuesta": "tu respuesta conversacional aquí",
  "intent": "saludo | reportar_problema | solicitar_estado | urgente | otro",
  "confidence": 0.0-1.0,
  "requiere_humano": false,
  "razon_escalamiento": "solo si requiere_humano es true",
  "datos_recopilados": {
    "tipo": "garantia o condominio (si detectaste)",
    "categoria": "la categoría (si detectaste)",
    "descripcion": "resumen del problema (si lo entendiste)",
    "urgencia": true/false,
    "fotos_recibidas": 0
  },
  "nueva_etapa": "inicial | recopilando_info | procesando | finalizada",
  "crear_caso": false (true solo si tienes TODA la info necesaria)
}`;

    // Agregar contexto según la etapa
    let etapaContext = '';

    switch (etapa) {
      case 'inicial':
        etapaContext = `
ETAPA ACTUAL: INICIAL
- Es el primer contacto del usuario
- Saluda amablemente si corresponde
- Pregunta cómo puedes ayudar
- Detecta si quiere reportar un problema`;
        break;

      case 'recopilando_info':
        etapaContext = `
ETAPA ACTUAL: RECOPILANDO INFORMACIÓN
- Ya sabes que quiere reportar un problema
- Datos ya recopilados: ${JSON.stringify(datosRecopilados)}
- Identifica qué falta y pregunta SOLO por eso
- NO repitas preguntas ya respondidas
- Si tienes tipo, categoría y descripción → marca crear_caso: true`;
        break;

      case 'procesando':
        etapaContext = `
ETAPA ACTUAL: PROCESANDO
- El caso ya fue creado
- Confirma al usuario que su reporte fue recibido
- Explica los próximos pasos
- Marca nueva_etapa: "finalizada"`;
        break;

      case 'en_seguimiento':
        etapaContext = `
ETAPA ACTUAL: SEGUIMIENTO
- El usuario tiene un caso activo
- Puede estar preguntando por el estado
- Provee información de seguimiento si la tienes`;
        break;
    }

    return basePrompt + '\n\n' + etapaContext;
  }

  /**
   * Parsear respuesta de la IA
   */
  private parseAIResponse(content: string, input: ProcessMessageInput): AIResponse {
    try {
      // Intentar parsear como JSON
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
        };
      }

      // Si no es JSON, usar el contenido como respuesta directa
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
   * Clasificar tipo de problema (backup si la IA no lo detecta)
   */
  public clasificarTipoProblema(descripcion: string): 'garantia' | 'condominio' | 'desconocido' {
    const palabrasGarantia = [
      'filtración',
      'grieta',
      'humedad',
      'defecto',
      'construcción',
      'pared agrietada',
      'techo',
      'estructura',
    ];

    const palabrasCondominio = [
      'área común',
      'piscina',
      'gimnasio',
      'limpieza',
      'portón',
      'vigilancia',
      'basura',
      'ascensor',
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
   * Detectar urgencia en el mensaje
   */
  public detectarUrgencia(mensaje: string): boolean {
    const palabrasUrgentes = [
      'urgente',
      'emergencia',
      'grave',
      'peligro',
      'inundación',
      'incendio',
      'riesgo',
      'critico',
    ];

    const mensajeLower = mensaje.toLowerCase();

    return palabrasUrgentes.some((p) => mensajeLower.includes(p));
  }
}
