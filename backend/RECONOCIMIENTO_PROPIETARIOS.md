# Sistema de Reconocimiento Automático de Propietarios - WhatsApp

## 📋 Descripción General

El sistema de reconocimiento automático de propietarios permite que cuando un propietario escriba al número oficial de WhatsApp del condominio, el sistema **identifique automáticamente** su identidad y unidad correspondiente basándose en su número de teléfono.

---

## 🎯 Objetivo

Cumplir con el requisito:
> "Cuando un propietario escriba al número oficial de WhatsApp del condominio, el sistema reconocerá automáticamente la identidad y la unidad correspondiente."

---

## 🏗️ Arquitectura Implementada

### **1. Servicio de Identificación de Propietarios**

**Archivo:** `src/services/usuarios/PropietarioIdentificationService.ts`

**Responsabilidades:**
- Buscar propietarios en la base de datos por número de teléfono
- Crear nuevos propietarios si no están registrados
- Actualizar información de propietarios existentes
- Obtener casos activos del propietario
- Generar mensajes de bienvenida personalizados

**Métodos principales:**

```typescript
// Identificar propietario por teléfono
identificarPropietario(telefono: string): Promise<PropietarioInfo>

// Crear propietario nuevo desde WhatsApp
crearPropietarioNuevo(telefono: string, nombreCompleto?: string, unidad?: string): Promise<PropietarioInfo>

// Actualizar información del propietario
actualizarPropietario(telefono: string, datos: {...}): Promise<PropietarioInfo>

// Obtener casos activos del propietario
obtenerCasosActivos(telefono: string): Promise<Caso[]>
```

---

### **2. Integración con WhatsAppService**

**Archivo:** `src/services/whatsapp/WhatsAppService.ts`

**Flujo de identificación:**

```
1. Usuario escribe al número de WhatsApp
   ↓
2. WhatsAppService.handleIncomingMessage() recibe el mensaje
   ↓
3. Se extrae el número de teléfono del remitente
   ↓
4. Se crea/obtiene la conversación en MongoDB
   ↓
5. 🎯 IDENTIFICACIÓN AUTOMÁTICA (NUEVO)
   - PropietarioIdentificationService.identificarPropietario(telefono)
   - Busca en PostgreSQL tabla "Usuario" por teléfono
   - Si existe: Obtiene nombre, unidad, condominio
   - Si NO existe: Solicita registro
   ↓
6. Se enriquece el contexto de la conversación con datos del propietario
   ↓
7. Se envía mensaje de bienvenida personalizado
   ↓
8. Si tiene casos activos, se muestran automáticamente
   ↓
9. El mensaje continúa procesándose con IA (con contexto enriquecido)
```

**Código implementado:**

```typescript
// En handleIncomingMessage(), después de obtener/crear conversación:

const propietarioInfo = await this.propietarioService.identificarPropietario(telefono);

if (conversacion.etapa === 'inicial' && !conversacion.contexto.propietarioIdentificado) {
  // Guardar información en contexto
  conversacion.contexto.propietarioIdentificado = propietarioInfo.existe;
  conversacion.contexto.propietarioInfo = propietarioInfo.usuario || null;
  conversacion.contexto.esNuevo = propietarioInfo.esNuevo;

  if (propietarioInfo.existe) {
    // Usuario registrado: Bienvenida personalizada
    await this.sendMessage(telefono, propietarioInfo.mensaje);

    // Mostrar casos activos si los tiene
    const casosActivos = await this.propietarioService.obtenerCasosActivos(telefono);
    if (casosActivos.length > 0) {
      // Enviar lista de casos
    }
  } else {
    // Usuario NO registrado: Solicitar datos
    await this.sendMessage(telefono, propietarioInfo.mensaje);
    conversacion.etapa = 'recopilando_info';
    conversacion.contexto.esperandoRegistro = true;
  }
}

// Continuar procesando con IA (con contexto del propietario)
await this.processMessageWithAI(telefono, messageContent, conversacion, propietarioInfo);
```

---

### **3. Enriquecimiento del Contexto de IA**

**Archivo:** `src/services/ai/AIService.ts`

**Modificaciones:**

1. **System Prompt enriquecido:**
   - Cuando el propietario está identificado, la IA recibe información completa
   - La IA usa el nombre del propietario en las respuestas
   - NO pregunta por datos que ya conoce (nombre, unidad, condominio)

```typescript
private getSystemPrompt(etapa: string, datosRecopilados: any): string {
  let propietarioContext = '';

  if (datosRecopilados?.propietario) {
    propietarioContext = `
========================================
INFORMACIÓN DEL PROPIETARIO (IDENTIFICADO AUTOMÁTICAMENTE)
========================================
Nombre: ${datosRecopilados.propietario.nombre}
Unidad: ${datosRecopilados.propietario.unidad}
Condominio: ${datosRecopilados.propietario.condominio}
Teléfono: ${datosRecopilados.propietario.telefono}

IMPORTANTE:
- YA CONOCES al usuario, dirígete a él por su nombre de pila
- NO le preguntes su nombre ni unidad, YA LOS TIENES
- Personaliza tus respuestas usando su nombre
- Al crear un caso, usa automáticamente su información
`;
  }

  return basePrompt + '\n\n' + propietarioContext + '\n\n' + etapaContext;
}
```

2. **Datos recopilados enriquecidos:**

```typescript
const datosRecopiladosEnriquecidos = {
  ...conversacion.contexto.datosRecopilados,
  propietario: propietarioInfo.existe ? {
    id: propietarioInfo.usuario?.id,
    nombre: propietarioInfo.usuario?.nombreCompleto,
    unidad: propietarioInfo.usuario?.unidad,
    condominio: propietarioInfo.usuario?.condominio?.nombre,
    condominioId: propietarioInfo.usuario?.condominioId,
    telefono: propietarioInfo.usuario?.telefono,
  } : null,
};
```

---

### **4. Modelo de Conversación Actualizado**

**Archivo:** `src/models/mongodb/Conversacion.ts`

**Nuevos campos en el contexto:**

```typescript
contexto: {
  // ... campos existentes

  // Identificación de propietario (NUEVO)
  propietarioIdentificado?: boolean;
  propietarioInfo?: any;
  esNuevo?: boolean;
  esperandoRegistro?: boolean;
}
```

---

## 📱 Flujo de Usuario - Ejemplos

### **Caso 1: Propietario Registrado (Primera vez que escribe)**

```
Usuario: Hola
  ↓
Sistema identifica: Juan Pérez, Unidad 301, Condominio Las Palmas
  ↓
Bot responde:
¡Hola Juan! 👋

Te identificamos automáticamente:
🏠 Unidad 301
🏢 Condominio Las Palmas

¿En qué puedo ayudarte hoy?

Puedes:
1️⃣ Reportar un problema
2️⃣ Ver el estado de tus casos
3️⃣ Solicitar información
4️⃣ Hablar con un agente
```

### **Caso 2: Propietario Registrado con Casos Activos**

```
Usuario: Hola
  ↓
Sistema identifica: María López, Unidad 205
  ↓
Bot responde:
¡Hola María! 👋

Te identificamos automáticamente:
🏠 Unidad 205
🏢 Condominio Las Palmas

📋 Casos activos:
1. AMC-2025-0015 - en_proceso
2. AMC-2025-0012 - esperando_repuestos

¿En qué puedo ayudarte hoy?
```

### **Caso 3: Usuario NO Registrado**

```
Usuario: Hola
  ↓
Sistema NO encuentra el número en la base de datos
  ↓
Bot responde:
¡Hola! 👋 Bienvenido al sistema de gestión de condominios Amico Management.

No encontramos tu número registrado en nuestra base de datos.

Para poder ayudarte, necesitamos que nos proporciones:
1️⃣ Tu nombre completo
2️⃣ Tu número de unidad/apartamento
3️⃣ El nombre de tu condominio (si aplica)

Ejemplo: "Mi nombre es Juan Pérez, unidad 301, Condominio Las Palmas"
```

### **Caso 4: Conversación Posterior (Ya Identificado)**

```
Usuario: Tengo una filtración en el baño
  ↓
IA recibe contexto completo del propietario
  ↓
Bot responde:
"Entiendo Juan, vamos a reportar esa filtración en el baño de tu unidad 301.
¿Puedes enviarme una foto del problema? Eso ayudará al técnico 📸"
```

---

## 🗄️ Base de Datos

### **PostgreSQL (Prisma)**

**Tabla: Usuario**
- `id` (UUID)
- `telefono` (String, UNIQUE, INDEX) ← Clave para identificación
- `nombreCompleto` (String)
- `unidad` (String)
- `condominioId` (UUID, FK)
- `tipoUsuario` (Enum: propietario, tecnico, admin)
- `estado` (Enum: activo, pendiente, inactivo)

**Relación:**
```
Usuario ──┐
          ├─→ Condominio (nombre, dirección, ciudad)
          └─→ Caso[] (casos del usuario)
```

### **MongoDB**

**Colección: conversaciones**
```json
{
  "telefono": "18095551234",
  "estado": "activa",
  "etapa": "inicial",
  "contexto": {
    "propietarioIdentificado": true,
    "propietarioInfo": {
      "id": "uuid-...",
      "nombreCompleto": "Juan Pérez",
      "unidad": "301",
      "condominioId": "uuid-...",
      "condominio": {
        "nombre": "Condominio Las Palmas"
      }
    },
    "esNuevo": false,
    "datosRecopilados": {
      // ... datos del reporte
    }
  },
  "casosActivos": ["caso-uuid-1", "caso-uuid-2"]
}
```

---

## 🧪 Pruebas

### **Escenarios de Prueba**

1. **✅ Propietario existente escribe por primera vez**
   - Debe identificarse automáticamente
   - Debe mostrar nombre, unidad, condominio
   - Debe mostrar casos activos si los tiene

2. **✅ Propietario existente escribe después de ser identificado**
   - No debe volver a enviar mensaje de bienvenida
   - IA debe usar su nombre en las respuestas
   - IA no debe preguntar por datos que ya tiene

3. **✅ Usuario NO registrado escribe**
   - Debe solicitar registro
   - Debe pedir nombre, unidad, condominio
   - Debe crear usuario con tipo "propietario"

4. **✅ Propietario reporta problema**
   - IA debe tener contexto completo (nombre, unidad, condominio)
   - Al crear caso, debe usar automáticamente la información del propietario
   - No debe solicitar datos redundantes

---

## 🔧 Configuración

### **Variables de Entorno**

```env
# WhatsApp
WHATSAPP_ENABLED=true
WHATSAPP_AUTO_READ=true
WHATSAPP_AUTO_MARK_READ=true

# Bot
BOT_ENABLED=true
BOT_RESPONSE_DELAY=1500
BOT_MAX_CONTEXT_MESSAGES=10
```

### **Activar el Sistema**

1. **Iniciar el backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Conectar WhatsApp:**
   - El sistema mostrará un código QR en la terminal
   - Escanear con WhatsApp Business
   - Una vez conectado, el bot estará activo

3. **Probar identificación:**
   - Agregar propietarios desde el panel web (`/propietarios`)
   - Escribir al número de WhatsApp desde el teléfono registrado
   - Verificar que el bot identifica automáticamente

---

## 📊 Métricas y Logs

### **Logs de Identificación**

```
[WhatsApp] 📥 Mensaje recibido de 18095551234: Hola
[PropietarioService] 🔍 Buscando propietario con teléfono: 18095551234
[PropietarioService] ✅ Propietario identificado: Juan Pérez - Unidad: 301
[WhatsApp] ✅ Propietario identificado automáticamente: Juan Pérez
[WhatsApp] 📤 Enviando mensaje: ¡Hola Juan! 👋...
```

---

## 🚀 Ventajas del Sistema

1. **✅ Experiencia de usuario mejorada**
   - No hay que repetir información
   - Reconocimiento instantáneo
   - Conversación personalizada

2. **✅ Reducción de errores**
   - No hay errores de tipeo en nombre/unidad
   - Datos validados desde la base de datos
   - Condominio asignado automáticamente

3. **✅ Eficiencia operativa**
   - Menos preguntas del bot
   - Casos creados más rápido
   - Menos intervención manual

4. **✅ Trazabilidad completa**
   - Todas las conversaciones están ligadas a un usuario
   - Historial completo de casos por propietario
   - Métricas precisas

---

## 🔒 Seguridad

- El número de teléfono es la clave única de identificación
- Los números se limpian (se remueven espacios, guiones, paréntesis)
- Solo usuarios con tipo "propietario" son identificados automáticamente
- La información sensible no se expone en los logs

---

## 📝 Notas Importantes

1. **El reconocimiento solo ocurre la primera vez** que un propietario escribe en una conversación nueva
2. **Si el número NO está registrado**, el bot solicita los datos y puede crear el usuario automáticamente
3. **La información del propietario se mantiene en el contexto** de toda la conversación
4. **La IA usa los datos del propietario** para personalizar respuestas y no solicitar datos redundantes
5. **Al crear un caso**, se usa automáticamente la información del propietario identificado

---

## 🎯 Próximos Pasos Sugeridos

1. **Validación de propietarios**: Implementar flujo de aprobación de nuevos registros por WhatsApp
2. **Múltiples unidades**: Permitir que un propietario tenga múltiples unidades
3. **Notificaciones proactivas**: Enviar recordatorios de mantenimiento usando la identificación
4. **Dashboard de métricas**: Mostrar estadísticas de propietarios identificados vs no registrados
5. **Actualización de datos**: Permitir que propietarios actualicen su información por WhatsApp

---

## 👨‍💻 Autor

Sistema implementado para **Amico Management**
Fecha: Enero 2025
Versión: 1.0.0
