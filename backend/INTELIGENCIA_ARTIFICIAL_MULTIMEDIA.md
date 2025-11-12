# Sistema de Inteligencia Artificial y Procesamiento Multimedia

## 📋 Descripción General

El sistema de IA de Amico Management permite mantener **conversaciones naturales** con los propietarios a través de WhatsApp, con capacidad completa de procesamiento multimedia: **texto, imágenes, videos, audios y documentos**.

---

## 🎯 Requisitos Cumplidos

### ✅ 1. Conversaciones Naturales con IA
- Bot conversacional powered by **GPT-4** (OpenAI)
- Comprensión de contexto y memoria conversacional
- Personalidad amable, profesional y empática
- Español dominicano natural

### ✅ 2. Procesamiento Multimedia Completo
#### **Texto** 📝
- Procesamiento de mensajes de texto estándar
- Análisis de intención y entidades
- Extracción de información clave

#### **Imágenes** 📷
- Descarga automática de imágenes enviadas
- **Análisis visual con GPT-4 Vision**
- Identificación automática de problemas técnicos
- Descripción del daño o avería

#### **Videos** 🎥
- Descarga y almacenamiento de videos
- Guardado como evidencia del caso
- Extracción de caption/descripción

#### **Audios** 🎙️
- Descarga automática de notas de voz
- **Transcripción con Whisper (OpenAI)**
- Conversión de voz a texto en español
- Procesamiento del texto transcrito por IA

#### **Documentos** 📄
- Descarga y almacenamiento de PDFs, Word, Excel, etc.
- Guardado como evidencia adicional

### ✅ 3. Preguntas Calificatorias
- IA formula preguntas inteligentes para clasificar el problema
- Identifica tipo de avería (garantía vs condominio)
- Determina categoría específica
- Evalúa urgencia automáticamente

### ✅ 4. Generación Automática de Casos
- Una vez recopilada la información completa
- El sistema crea un **caso estructurado** automáticamente
- Incluye toda la evidencia multimedia
- Asignación automática según prioridad

---

## 🏗️ Arquitectura del Sistema

```
Usuario WhatsApp
       ↓
   [Mensaje: texto/imagen/video/audio]
       ↓
WhatsAppService (Baileys)
       ↓
┌──────────────────────────────────────┐
│   PROCESAMIENTO MULTIMEDIA           │
├──────────────────────────────────────┤
│  MultimediaService                   │
│  ├─ Descarga archivo                 │
│  ├─ Guarda en /uploads               │
│  └─ Procesa según tipo:              │
│      • Audio → Whisper (transcribe)  │
│      • Imagen → GPT-4V (analiza)     │
│      • Video/Doc → Guarda            │
└──────────────────────────────────────┘
       ↓
   [Contenido procesado]
       ↓
┌──────────────────────────────────────┐
│   INTELIGENCIA ARTIFICIAL            │
├──────────────────────────────────────┤
│  AIService (GPT-4)                   │
│  ├─ System Prompt (personalidad)     │
│  ├─ Contexto conversacional          │
│  ├─ Información del propietario      │
│  ├─ Datos multimedia procesados      │
│  └─ Genera respuesta inteligente     │
└──────────────────────────────────────┘
       ↓
   [Respuesta + Decisión]
       ↓
┌──────────────────────────────────────┐
│   GENERACIÓN DE CASO                 │
├──────────────────────────────────────┤
│  Si la IA determina que:             │
│  ✓ Tiene tipo de problema            │
│  ✓ Tiene categoría                   │
│  ✓ Tiene descripción                 │
│  ✓ Tiene evidencia multimedia        │
│  → CasoService.crearDesdeWhatsApp()  │
└──────────────────────────────────────┘
       ↓
   [Caso creado con evidencia]
       ↓
   Notificación a propietario
```

---

## 🎙️ Transcripción de Audios con Whisper

### **Servicio:** MultimediaService.transcribeAudio()

### **Proceso:**
1. Usuario envía nota de voz por WhatsApp
2. WhatsApp Service descarga el audio (.ogg)
3. MultimediaService llama a **Whisper API** (OpenAI)
4. Whisper transcribe a texto en español
5. Texto transcrito se envía a la IA como mensaje normal
6. IA responde basándose en el contenido del audio

### **Ejemplo:**

```
Usuario: [Envía audio de 30 segundos]
Audio: "Hola, tengo un problema en mi apartamento 301.
        Hay una filtración grande en el baño que está
        mojando toda la pared. Por favor ayúdenme urgente."

↓ [Whisper transcribe]

Texto: "Hola, tengo un problema en mi apartamento 301.
        Hay una filtración grande en el baño que está
        mojando toda la pared. Por favor ayúdenme urgente."

↓ [IA procesa]

Bot responde: "Entiendo Juan, veo que tienes una filtración
               urgente en el baño de tu unidad 301. ¿Puedes
               enviarme una foto del daño? Eso ayudará al
               técnico a prepararse mejor. 📸"
```

### **Características:**
- ✅ Idioma: **Español** (configurado)
- ✅ Formato: OGG, MP3, M4A, WAV
- ✅ Duración: Hasta 25 MB por archivo
- ✅ Calidad: Alta precisión con Whisper-1
- ✅ Costo: ~$0.006 USD por minuto

---

## 📷 Análisis de Imágenes con GPT-4 Vision

### **Servicio:** MultimediaService.analyzeImage()

### **Proceso:**
1. Usuario envía foto del problema
2. WhatsApp Service descarga la imagen
3. Imagen se convierte a Base64
4. Se envía a **GPT-4 Vision** con prompt específico
5. GPT-4V describe el problema visible
6. Descripción se integra al contexto de IA

### **Ejemplo:**

```
Usuario: [Envía foto de mancha de humedad en techo]

↓ [GPT-4 Vision analiza]

Análisis: "Se observa una mancha de humedad oscura en el
          techo, aproximadamente 30cm de diámetro, con
          señales de goteo activo y pintura desprendida.
          Indica filtración de agua del piso superior."

↓ [IA procesa]

Bot responde: "Veo la filtración en tu techo. Es evidente
               que hay agua viniendo del piso de arriba.
               Esto es un problema de garantía. ¿Hace cuánto
               tiempo comenzó este problema?"
```

### **Características:**
- ✅ Modelo: **GPT-4 Vision Preview**
- ✅ Detección: Filtraciones, grietas, daños eléctricos, etc.
- ✅ Contexto: Análisis específico para condominios
- ✅ Idioma: Español dominicano
- ✅ Detalle: Configurable (low/high/auto)

---

## 🤖 Flujo Completo de Conversación con IA

### **Escenario 1: Reporte con Audio + Imagen**

```
1️⃣ Usuario escribe: "Hola"
   Bot: "¡Hola Juan! 👋 Te identificamos automáticamente.
         🏠 Unidad 301 | 🏢 Condominio Las Palmas
         ¿En qué puedo ayudarte hoy?"

2️⃣ Usuario: [Envía audio de 20 seg]
   Audio transcrito: "Tengo un problema eléctrico en mi
                     apartamento, los breakers se botan"

   Bot: "Entiendo Juan, problema eléctrico con los breakers.
         ¿En qué área específica de tu apartamento sucede?
         ¿Cocina, baño, habitaciones?"

3️⃣ Usuario: "En la cocina"
   Bot: "Ok, problema eléctrico en la cocina. ¿Puedes enviarme
         una foto del panel eléctrico o el área afectada? 📸"

4️⃣ Usuario: [Envía foto del panel eléctrico]
   Imagen analizada: "Panel eléctrico con breaker principal
                     en posición intermedia (fallado), señales
                     de recalentamiento en cables"

   Bot: "Perfecto, ya tengo toda la información. Veo que es
         un problema en el breaker principal con sobrecalentamiento.

         🔧 He creado tu caso: AMC-2025-0032
         📋 Categoría: Problemas eléctricos
         ⚠️ Prioridad: Alta (por seguridad)

         Un técnico electricista revisará tu caso y te contactará
         en las próximas 4 horas. ¿Hay algo más en lo que pueda ayudarte?"

5️⃣ Sistema: [Caso creado automáticamente]
   - Tipo: Condominio
   - Categoría: problemas_electricos
   - Descripción: "Breakers se botan en cocina, panel muestra
                  recalentamiento"
   - Evidencia: Audio transcrito + Foto analizada
   - Prioridad: Alta
   - Usuario: Juan Pérez, Unidad 301
```

---

## 🧠 Prompts y Personalidad del Bot

### **System Prompt Base**

```
Eres un asistente virtual de Amico Management, empresa
dominicana que administra condominios.

PERSONALIDAD:
- Amable, profesional y empático
- Hablas en español dominicano (tuteo natural)
- Eres eficiente pero cálido
- Usas emojis con moderación
- Te anticipas a las necesidades del usuario

CAPACIDADES MULTIMEDIA:
✅ RECIBES y ANALIZAS imágenes, videos, audios y documentos
✅ Los audios son TRANSCRITOS automáticamente
✅ Las imágenes son ANALIZADAS automáticamente
✅ Videos y documentos quedan guardados como evidencia

INFORMACIÓN A RECOPILAR:
1. Tipo de problema (garantía vs condominio)
2. Categoría específica
3. Descripción clara del problema
4. Evidencia multimedia
5. Urgencia/severidad

REGLAS:
- NO hagas preguntas de formulario
- Sé conversacional y natural
- Detecta información implícita
- Si recibes multimedia, agradece y úsalo
- Escala a humano si es urgente o complejo
```

### **Contexto Enriquecido**

La IA recibe automáticamente:
- ✅ Información del propietario (nombre, unidad, condominio)
- ✅ Historial de conversación (últimos 10 mensajes)
- ✅ Casos activos del propietario
- ✅ Datos recopilados hasta el momento
- ✅ Transcripciones de audios
- ✅ Análisis de imágenes
- ✅ Etapa actual de la conversación

---

## 📊 Estructuras de Datos

### **Mensaje en MongoDB**

```javascript
{
  whatsappMessageId: "ABCD1234...",
  telefono: "18095551234",
  direccion: "entrante",
  tipo: "audio", // texto, imagen, video, audio, documento
  contenido: "Tengo un problema con los breakers...", // Transcripción
  mediaUrl: "/uploads/audios/abc-123-def.ogg",
  transcripcion: "Tengo un problema...", // Si es audio
  analisisImagen: "Panel eléctrico con...", // Si es imagen
  enviadoPor: "humano",
  procesadoPorIA: true,
  contextoIA: {
    intent: "reportar_problema",
    confidence: 0.95,
    requiereHumano: false
  },
  estadoEntrega: "leido",
  fechaEnvio: "2025-01-11T10:30:00Z"
}
```

### **Conversación en MongoDB**

```javascript
{
  telefono: "18095551234",
  estado: "activa",
  etapa: "recopilando_info",

  contexto: {
    propietarioIdentificado: true,
    propietarioInfo: {
      nombre: "Juan Pérez",
      unidad: "301",
      condominio: "Las Palmas"
    },
    datosRecopilados: {
      tipo: "condominio",
      categoria: "problemas_electricos",
      descripcion: "Breakers se botan en cocina",
      urgencia: true,
      fotosRecibidas: 1,
      audiosRecibidos: 1
    },
    ultimoIntent: "reportar_problema",
    historialIntents: ["saludo", "reportar_problema", "proveer_detalles"]
  },

  casosActivos: ["caso-uuid-1"],
  totalMensajes: 7,
  mensajesBot: 3,
  mensajesHumano: 4
}
```

---

## 🔧 Configuración

### **Variables de Entorno**

```env
# OpenAI (requerido para IA y multimedia)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_TEMPERATURE=0.7
OPENAI_MAX_TOKENS=1000

# Feature Flags
FEATURE_AI_CLASSIFICATION=true       # Clasificación automática con IA
FEATURE_IMAGE_ANALYSIS=true          # Análisis de imágenes con GPT-4V
FEATURE_VOICE_MESSAGES=true          # Transcripción de audios con Whisper
FEATURE_AUTO_ASSIGNMENT=true         # Asignación automática de técnicos

# WhatsApp
WHATSAPP_AUTO_READ=true
WHATSAPP_AUTO_MARK_READ=true

# Bot
BOT_ENABLED=true
BOT_RESPONSE_DELAY=1500              # Delay para simular escritura humana
BOT_MAX_CONTEXT_MESSAGES=10          # Mensajes de contexto para IA

# Uploads
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760               # 10 MB
ALLOWED_FILE_TYPES=image/jpeg,image/png,video/mp4,audio/ogg,application/pdf
MAX_FILES_PER_CASE=10
```

---

## 📈 Métricas y Logs

### **Logs de Procesamiento**

```
[WhatsApp] 📥 Mensaje recibido de 18095551234: [Audio]
[Multimedia] 🎙️ Procesando audio...
[Multimedia] ✅ Audio guardado: /uploads/audios/abc-123.ogg
[Multimedia] 🎙️ Transcribiendo audio con Whisper...
[Multimedia] ✅ Audio transcrito correctamente
[Multimedia] 📝 Transcripción: "Tengo un problema con..."
[PropietarioService] ✅ Propietario identificado: Juan Pérez - Unidad: 301
[AI] 🤖 Procesando mensaje con contexto completo
[AI] ✅ Respuesta generada - Intent: reportar_problema (95%)
[WhatsApp] 📤 Mensaje enviado a 18095551234
[CasoService] 🔧 Creando caso desde WhatsApp...
[CasoService] ✅ Caso AMC-2025-0032 creado exitosamente
```

---

## 🎯 Casos de Uso

### **Caso 1: Propietario reporta con audio**
```
Usuario: [Audio] "Hola, tengo una filtración en el baño"
Bot: Identifica automáticamente → Transcribe → Clasifica → Pregunta detalles
Usuario: [Imagen del problema]
Bot: Analiza imagen → Completa información → Crea caso
```

### **Caso 2: Propietario reporta con solo imágenes**
```
Usuario: "Tengo un problema"
Usuario: [Envía 3 fotos del daño]
Bot: Analiza imágenes → Identifica problema → Confirma → Crea caso
```

### **Caso 3: Combinación de todo**
```
Usuario: [Audio describiendo problema]
Usuario: [Video mostrando la avería]
Usuario: [Foto adicional]
Bot: Procesa todo → Contexto completo → Caso robusto
```

---

## 🚀 Ventajas del Sistema

### **Para Propietarios:**
✅ **Comunicación natural** - Hablan como lo harían con una persona
✅ **Flexibilidad** - Texto, voz, fotos, videos
✅ **Rapidez** - Envían audio en lugar de escribir
✅ **Evidencia visual** - Fotos/videos documentan el problema
✅ **Sin formularios** - No llenan campos

### **Para Administración:**
✅ **Automatización completa** - Menos intervención manual
✅ **Evidencia documentada** - Todas las fotos/audios guardados
✅ **Clasificación precisa** - IA identifica categorías correctamente
✅ **Escalabilidad** - Maneja múltiples conversaciones simultáneas
✅ **Trazabilidad** - Historial completo de comunicación

### **Para Técnicos:**
✅ **Casos completos** - Toda la información y evidencia
✅ **Preparación previa** - Saben qué herramientas llevar
✅ **Contexto visual** - Ven el problema antes de llegar
✅ **Eficiencia** - Menos visitas de diagnóstico

---

## 📝 Limitaciones y Consideraciones

### **Costos de API (OpenAI)**
- GPT-4 Turbo: ~$0.01 USD por 1,000 tokens
- Whisper: ~$0.006 USD por minuto de audio
- GPT-4 Vision: ~$0.01-0.03 USD por imagen

### **Tiempos de Procesamiento**
- Transcripción de audio: 2-5 segundos
- Análisis de imagen: 3-7 segundos
- Respuesta de IA: 1-3 segundos

### **Límites Técnicos**
- Audio máximo: 25 MB (~1 hora)
- Imagen máxima: 20 MB
- Video máximo: Depende del servidor

---

## 🔒 Seguridad y Privacidad

✅ Archivos multimedia almacenados localmente
✅ URLs de archivos no expuestas públicamente
✅ Transcripciones y análisis guardados en MongoDB
✅ API keys de OpenAI en variables de entorno
✅ Limpieza automática de archivos antiguos (opcional)

---

## 👨‍💻 Próximos Pasos Sugeridos

1. **Respuestas de voz**: Bot puede responder con audio generado (TTS)
2. **Análisis de video**: Extraer frames clave y analizarlos
3. **OCR de documentos**: Leer texto de facturas, contratos, etc.
4. **Resúmenes automáticos**: IA resume conversaciones largas
5. **Análisis de sentimiento**: Detectar frustración del cliente
6. **Multi-idioma**: Soporte para inglés, francés, etc.

---

## 📚 Referencias

- **OpenAI Whisper API**: https://platform.openai.com/docs/guides/speech-to-text
- **GPT-4 Vision API**: https://platform.openai.com/docs/guides/vision
- **Baileys WhatsApp**: https://github.com/WhiskeySockets/Baileys
- **LangChain**: https://js.langchain.com/docs/

---

## 👨‍💻 Autor

Sistema implementado para **Amico Management**
Fecha: Enero 2025
Versión: 1.0.0
