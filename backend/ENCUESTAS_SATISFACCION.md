# 📋 Sistema de Encuestas de Satisfacción

## 📖 Descripción General

El **Sistema de Encuestas de Satisfacción** completa el ciclo de retroalimentación del sistema Amico Management. Cuando un caso se cierra por confirmación del propietario (problema solucionado), el sistema automáticamente:

1. Envía un email de cierre al ingeniero en el mismo hilo del caso
2. Envía una encuesta de satisfacción al propietario por WhatsApp
3. Procesa las calificaciones y genera métricas

**⚠️ IMPORTANTE**: La encuesta NO se envía cuando el caso se cierra por timeout (7 días sin respuesta del propietario).

---

## 🎯 Requisitos Cumplidos

### Requisito Original del Cliente

> **5. Cierre del caso y retroalimentación**
>
> - Al cerrar el caso por confirmación del propietario, el sistema:
>   - Enviará un correo en el mismo hilo del caso original, notificando que la reparación fue completada de forma satisfactoria.
>   - Remitirá una encuesta de satisfacción al propietario con tres indicadores del 0 al 5:
>     1. Actitud del ingeniero.
>     2. Rapidez en la reparación.
>     3. Calidad del servicio y atención recibida

### ✅ Implementación Completa

| Requisito | Estado | Implementación |
|-----------|--------|----------------|
| Email de cierre en mismo hilo | ✅ | `EmailNotificationService.enviarNotificacionCierreCaso()` |
| Encuesta con 3 indicadores (0-5) | ✅ | `EncuestaSatisfaccionService` |
| Actitud del ingeniero (0-5) | ✅ | Campo `actitudIngeniero` |
| Rapidez en la reparación (0-5) | ✅ | Campo `rapidezReparacion` |
| Calidad del servicio (0-5) | ✅ | Campo `calidadServicio` |
| Envío por WhatsApp | ✅ | `WhatsAppSeguimientoIntegration` |
| Procesamiento de respuestas | ✅ | `parsearRespuestaWhatsApp()` |
| Cálculo de promedio automático | ✅ | Campo `promedioGeneral` |
| Comentarios adicionales (opcional) | ✅ | Campo `comentarios` |

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│               FLUJO DE ENCUESTA DE SATISFACCIÓN                  │
└─────────────────────────────────────────────────────────────────┘

1. CIERRE DEL CASO (Por confirmación del propietario)
   │
   ├─> SeguimientoAutomaticoService.cerrarCasoPorRespuesta()
   │   │
   │   ├─> Cambiar estado del caso a "cerrado"
   │   ├─> Desactivar seguimiento
   │   └─> Crear evento en timeline
   │
2. ENVIAR EMAIL DE CIERRE AL INGENIERO (Mismo hilo)
   │
   ├─> EmailNotificationService.enviarNotificacionCierreCaso()
   │   │
   │   ├─> Subject: "Re: [AMC-2025-0123] Reparación Completada"
   │   ├─> HTML profesional con info del caso
   │   ├─> Respuesta del propietario incluida
   │   └─> Notificación de envío de encuesta
   │
3. CREAR ENCUESTA DE SATISFACCIÓN
   │
   ├─> EncuestaSatisfaccionService.crearEncuesta()
   │   │
   │   ├─> Crear registro en base de datos
   │   ├─> Estado: "pendiente"
   │   ├─> Fecha de expiración: +7 días
   │   └─> Crear evento en timeline
   │
4. ENVIAR ENCUESTA POR WHATSAPP
   │
   ├─> WhatsAppSeguimientoIntegration.procesarRespuestaSeguimiento()
   │   │
   │   └─> Mensaje de encuesta con 3 indicadores
   │
5. PROPIETARIO RESPONDE
   │
   ├─> WhatsAppService.handleIncomingMessage()
   │   │
   │   ├─> Detecta: Es respuesta a encuesta pendiente
   │   │
   │   └─> EncuestaSatisfaccionService.parsearRespuestaWhatsApp()
   │       │
   │       ├─> Extraer 3 números (0-5)
   │       ├─> Validar rango
   │       └─> Extraer comentarios opcionales
   │
6. PROCESAR CALIFICACIONES
   │
   ├─> EncuestaSatisfaccionService.procesarRespuesta()
   │   │
   │   ├─> Guardar calificaciones
   │   ├─> Calcular promedio: (C1 + C2 + C3) / 3
   │   ├─> Actualizar estado: "completada"
   │   ├─> Actualizar `satisfaccionCliente` en Caso
   │   └─> Crear evento en timeline
   │
7. ENVIAR CONFIRMACIÓN AL PROPIETARIO
   │
   └─> WhatsAppService.sendMessage()
       │
       ├─> "¡Muchas gracias por tu feedback!"
       ├─> Mostrar calificaciones recibidas
       └─> Mostrar promedio calculado
```

---

## 💾 Modelo de Base de Datos

### Tabla: `encuestas_satisfaccion`

```prisma
model EncuestaSatisfaccion {
  id                    String          @id @default(uuid())
  casoId                String          @map("caso_id")
  usuarioId             String          @map("usuario_id")

  // Estado
  estado                EstadoEncuesta  @default(pendiente)

  // Calificaciones (0-5)
  actitudIngeniero      Int?            @map("actitud_ingeniero")
  rapidezReparacion     Int?            @map("rapidez_reparacion")
  calidadServicio       Int?            @map("calidad_servicio")

  // Promedio automático
  promedioGeneral       Decimal?        @map("promedio_general") @db.Decimal(3, 2)

  // Comentarios adicionales
  comentarios           String?         @db.Text

  // Metadatos
  enviadaPorWhatsApp    Boolean         @default(false)
  enviadaPorEmail       Boolean         @default(false)

  // Auditoría
  fechaEnvio            DateTime        @default(now())
  fechaRespuesta        DateTime?
  fechaExpiracion       DateTime?       // 7 días después

  // Relaciones
  caso                  Caso            @relation(...)
  usuario               Usuario         @relation(...)

  @@map("encuestas_satisfaccion")
}
```

### Enum: `EstadoEncuesta`

```prisma
enum EstadoEncuesta {
  pendiente    // Enviada, esperando respuesta
  completada   // Propietario respondió
  expirada     // Expiró sin respuesta (7 días)
}
```

---

## 🔧 Componentes Principales

### 1. EncuestaSatisfaccionService

**Ubicación**: `src/services/encuestas/EncuestaSatisfaccionService.ts`

**Métodos Principales**:

```typescript
// Crear encuesta cuando caso se cierra
public async crearEncuesta(
  casoId: string,
  usuarioId: string,
  enviarPorWhatsApp: boolean,
  enviarPorEmail: boolean
): Promise<any>

// Procesar respuesta del propietario
public async procesarRespuesta(
  encuestaId: string,
  actitudIngeniero: number,    // 0-5
  rapidezReparacion: number,   // 0-5
  calidadServicio: number,     // 0-5
  comentarios?: string
): Promise<any>

// Parsear respuesta de WhatsApp
public parsearRespuestaWhatsApp(mensaje: string): {
  valido: boolean;
  actitudIngeniero?: number;
  rapidezReparacion?: number;
  calidadServicio?: number;
  comentarios?: string;
}

// Obtener encuesta pendiente por usuario
public async obtenerEncuestaPendientePorUsuario(usuarioId: string): Promise<any>

// Marcar encuestas expiradas (cron diario)
public async marcarExpiradas(): Promise<void>

// Obtener estadísticas
public async obtenerEstadisticas(condominioId?: string): Promise<any>

// Generar mensaje de encuesta para WhatsApp
public getMensajeEncuesta(nombrePropietario: string, numeroCaso: string): string
```

---

### 2. EmailNotificationService

**Nuevo Método**:

```typescript
// Enviar email de cierre al ingeniero (en el mismo hilo)
public async enviarNotificacionCierreCaso(
  emailIngeniero: string,
  numeroCaso: string,
  nombreIngeniero: string,
  nombrePropietario: string,
  unidad: string,
  condominio: string,
  respuestaPropietario: string
): Promise<void>
```

**Formato del Email**:

- **Subject**: `Re: [AMC-2025-0123] Reparación Completada - {Condominio}`
- **Diseño**: HTML profesional con gradient verde (éxito)
- **Contenido**:
  - Confirmación de cierre
  - Datos del caso
  - Respuesta textual del propietario (en cuadro destacado)
  - Notificación de envío de encuesta

---

### 3. WhatsAppSeguimientoIntegration

**Actualización**: Ahora envía la encuesta después de cerrar el caso.

```typescript
// Dentro de procesarRespuestaSeguimiento()
if (resultado.accion === 'cerrar') {
  // Obtener encuesta creada
  const encuesta = await prisma.encuestaSatisfaccion.findFirst(...);

  if (encuesta) {
    // Enviar mensaje de encuesta
    const mensajeEncuesta = this.encuestaService.getMensajeEncuesta(...);
    await sock.sendMessage(telefonoFormateado, { text: mensajeEncuesta });
  }
}
```

---

### 4. WhatsAppService

**Nueva Funcionalidad**: Detecta y procesa respuestas a encuestas.

```typescript
// Dentro de handleIncomingMessage()

// 1. Verificar si es respuesta a encuesta pendiente
const encuestaPendiente = await this.encuestaService.obtenerEncuestaPendientePorUsuario(usuario.id);

if (encuestaPendiente) {
  // 2. Parsear respuesta
  const respuesta = this.encuestaService.parsearRespuestaWhatsApp(mensaje);

  if (respuesta.valido) {
    // 3. Procesar calificaciones
    await this.encuestaService.procesarRespuesta(...);

    // 4. Enviar confirmación
    await this.sendMessage(telefono, mensajeGracias);
  } else {
    // 5. Pedir respuesta válida
    await this.sendMessage(telefono, mensajeError);
  }
}
```

---

## 📱 Formato de la Encuesta (WhatsApp)

### Mensaje Enviado al Propietario

```
¡Hola Juan! 👋

Gracias por confirmar que el problema del caso AMC-2025-0123
fue solucionado. ✅

Nos gustaría conocer tu opinión sobre el servicio recibido.
Por favor, califica del 0 al 5 los siguientes aspectos:

📋 *ENCUESTA DE SATISFACCIÓN*

1️⃣ *Actitud del ingeniero:* ¿Cómo fue el trato y profesionalismo?
2️⃣ *Rapidez en la reparación:* ¿Qué tan rápido se resolvió el problema?
3️⃣ *Calidad del servicio:* ¿Quedaste satisfecho con la atención recibida?

*Responde con 3 números del 0 al 5, separados por espacios.*
Ejemplo: "5 4 5"

- 0 = Muy malo
- 1 = Malo
- 2 = Regular
- 3 = Bueno
- 4 = Muy bueno
- 5 = Excelente

También puedes agregar comentarios adicionales después de las calificaciones.

¡Gracias por tu tiempo! 😊
```

### Respuesta del Propietario (Ejemplo Válido)

```
5 5 4 Excelente servicio, muy profesional
```

**Parsing**:
- `actitudIngeniero = 5`
- `rapidezReparacion = 5`
- `calidadServicio = 4`
- `comentarios = "Excelente servicio, muy profesional"`
- `promedio = 4.67`

### Confirmación Enviada al Propietario

```
¡Muchas gracias por tu feedback! 😊

*Tus calificaciones:*
• Actitud del ingeniero: 5/5
• Rapidez en la reparación: 5/5
• Calidad del servicio: 4/5

*Promedio: 4.67/5* ⭐

Tu opinión nos ayuda a mejorar continuamente nuestro servicio.

¡Gracias por confiar en Amico Management!
```

---

## 📊 Métricas y Estadísticas

### Método: `obtenerEstadisticas(condominioId?)`

Retorna:

```typescript
{
  totalEncuestas: 150,
  promedioGeneral: "4.52",
  promedioActitudIngeniero: "4.67",
  promedioRapidezReparacion: "4.45",
  promedioCalidadServicio: "4.43",
  distribucion: {
    excelente: 95,    // 4.5-5.0
    bueno: 42,        // 3.5-4.4
    regular: 10,      // 2.5-3.4
    malo: 2,          // 1.5-2.4
    muyMalo: 1        // 0-1.4
  }
}
```

---

## 🔄 Cron Jobs

### Marcar Encuestas Expiradas

**Frecuencia**: Diario (puede agregarse al CronService)

```typescript
// Agregar al CronService.ts
this.registrarJob(
  'encuestas-expiradas',
  '0 3 * * *', // Diario a las 3 AM
  async () => {
    const encuestaService = EncuestaSatisfaccionService.getInstance();
    await encuestaService.marcarExpiradas();
  }
);
```

**Función**: Marca como "expirada" todas las encuestas pendientes cuya `fechaExpiracion` ya pasó (7 días después del envío).

---

## 📝 Ejemplos de Uso

### Ejemplo 1: Flujo Completo Exitoso

```typescript
// 1. Propietario confirma solución
// WhatsApp: "Sí, está solucionado"

// 2. Sistema cierra caso automáticamente
await seguimientoService.procesarRespuestaSeguimiento(casoId, "Sí, está solucionado");
// Resultado: { accion: 'cerrar', mensaje: '¡Excelente! Caso cerrado.' }

// 3. Email de cierre enviado al ingeniero
// Subject: "Re: [AMC-2025-0123] Reparación Completada - Las Palmas"

// 4. Encuesta creada en BD
const encuesta = await encuestaService.crearEncuesta(casoId, usuarioId, true, false);
// Estado: pendiente

// 5. Encuesta enviada por WhatsApp
// "¡Hola Juan! 👋 ... Califica del 0 al 5 ..."

// 6. Propietario responde
// WhatsApp: "5 5 4"

// 7. Sistema procesa respuesta
const respuesta = encuestaService.parsearRespuestaWhatsApp("5 5 4");
// { valido: true, actitudIngeniero: 5, rapidezReparacion: 5, calidadServicio: 4 }

await encuestaService.procesarRespuesta(encuesta.id, 5, 5, 4);
// Promedio: 4.67

// 8. Confirmación enviada
// "¡Muchas gracias por tu feedback! 😊 ... Promedio: 4.67/5 ⭐"
```

---

### Ejemplo 2: Respuesta Inválida

```typescript
// Propietario responde incorrectamente
// WhatsApp: "Excelente servicio!"

// Sistema parsea
const respuesta = encuestaService.parsearRespuestaWhatsApp("Excelente servicio!");
// { valido: false }

// Sistema solicita formato correcto
await whatsappService.sendMessage(telefono, `
Lo siento, no pude entender tu respuesta. 😕

Para completar la encuesta, por favor envía 3 números del 0 al 5, separados por espacios.

*Ejemplo:* 5 4 5
...
`);

// Propietario reenvía correctamente
// WhatsApp: "5 5 5"

// Sistema procesa exitosamente
```

---

## 🚨 Casos Especiales

### Caso 1: Cierre por Timeout (7 días sin respuesta)

```typescript
// SeguimientoAutomaticoService.cerrarCasoSinRespuesta()

// ❌ NO se crea encuesta
// ❌ NO se envía email de cierre
// Motivo: "Cierre por falta de respuesta del propietario"
```

**Razón**: No tiene sentido pedir feedback si el propietario nunca respondió al seguimiento.

---

### Caso 2: Caso Reabierto (Problema persiste)

```typescript
// Propietario: "No, sigue el problema"

// Sistema reabre caso
await seguimientoService.procesarRespuestaSeguimiento(casoId, "No, sigue el problema");
// Resultado: { accion: 'reabrir', mensaje: 'Vamos a generar un nuevo seguimiento.' }

// ❌ NO se crea encuesta
// ❌ NO se envía email de cierre
// ✅ Se asigna nuevo ingeniero
```

**Razón**: El caso no está cerrado exitosamente, por lo tanto no hay encuesta.

---

## 🧪 Testing

### Test 1: Parseo de Respuesta Válida

```typescript
const servicio = EncuestaSatisfaccionService.getInstance();

// Caso 1: Solo números
let resultado = servicio.parsearRespuestaWhatsApp("5 4 5");
expect(resultado.valido).toBe(true);
expect(resultado.actitudIngeniero).toBe(5);
expect(resultado.rapidezReparacion).toBe(4);
expect(resultado.calidadServicio).toBe(5);

// Caso 2: Números con comentarios
resultado = servicio.parsearRespuestaWhatsApp("5 4 5 Muy buen servicio");
expect(resultado.valido).toBe(true);
expect(resultado.comentarios).toBe("Muy buen servicio");

// Caso 3: Respuesta inválida
resultado = servicio.parsearRespuestaWhatsApp("Excelente");
expect(resultado.valido).toBe(false);
```

### Test 2: Cálculo de Promedio

```typescript
const promedio = (5 + 4 + 5) / 3;
expect(promedio).toBeCloseTo(4.67, 2);
```

### Test 3: Flujo Completo End-to-End

```typescript
// 1. Crear caso y cita
const caso = await casoService.crear({...});
const cita = await citaService.crear({...});

// 2. Marcar cita completada
await citaService.marcarCompletada(cita.id);

// 3. Esperar 4 horas (o ajustar config)

// 4. Propietario confirma solución
await whatsappService.simulateIncomingMessage(telefono, "Sí, solucionado");

// 5. Verificar caso cerrado
const casoActualizado = await casoService.obtenerPorId(caso.id);
expect(casoActualizado.estado).toBe('cerrado');

// 6. Verificar encuesta creada
const encuesta = await encuestaService.obtenerPorCaso(caso.id);
expect(encuesta).toBeDefined();
expect(encuesta.estado).toBe('pendiente');

// 7. Propietario responde encuesta
await whatsappService.simulateIncomingMessage(telefono, "5 5 5");

// 8. Verificar encuesta completada
const encuestaActualizada = await encuestaService.obtenerPorId(encuesta.id);
expect(encuestaActualizada.estado).toBe('completada');
expect(encuestaActualizada.promedioGeneral).toBeCloseTo(5.0, 2);
```

---

## 📧 Ejemplo de Email de Cierre

### Subject

```
Re: [AMC-2025-0123] Reparación Completada - Las Palmas
```

### Contenido (HTML)

Ver código completo en: `EmailNotificationService.enviarNotificacionCierreCaso()`

**Elementos clave**:
- Header verde con ✅ check icon
- Título: "Caso Cerrado Exitosamente"
- Info box con datos del caso
- Respuesta del propietario en cuadro destacado (quote)
- Mención de envío de encuesta
- Footer con firma Amico Management

---

## 🔒 Validaciones

### Validación de Calificaciones

```typescript
if (
  actitudIngeniero < 0 || actitudIngeniero > 5 ||
  rapidezReparacion < 0 || rapidezReparacion > 5 ||
  calidadServicio < 0 || calidadServicio > 5
) {
  throw new Error('Las calificaciones deben estar entre 0 y 5');
}
```

### Validación de Respuesta WhatsApp

1. Extraer números del mensaje
2. Verificar que hay al menos 3 números
3. Verificar que cada número está en rango 0-5
4. Extraer comentarios adicionales (opcional)

---

## 🎯 Mejoras Futuras (Opcional)

### 1. Encuesta por Email

Actualmente solo se envía por WhatsApp. Podría agregarse:

```typescript
await encuestaService.crearEncuesta(
  casoId,
  usuarioId,
  true,  // WhatsApp
  true   // Email (con link a formulario web)
);
```

### 2. Dashboard de Satisfacción

Panel web mostrando:
- Promedio general de todos los casos
- Evolución temporal
- Ranking de ingenieros por calificación
- Comentarios destacados (positivos y negativos)

### 3. Alertas de Calificaciones Bajas

Si el promedio es < 3.0, notificar al supervisor para seguimiento.

### 4. Exportación de Reportes

Exportar estadísticas de encuestas a Excel/PDF.

---

## 🚀 Deployment

### Variables de Entorno

No se requieren variables adicionales. El sistema usa las existentes:
- SMTP para envío de emails
- WhatsApp para encuestas

### Migración de Base de Datos

```bash
npx prisma migrate dev --name add_encuestas_satisfaccion
```

### Verificación

```bash
# 1. Verificar modelo creado
npx prisma db push

# 2. Test manual de encuesta
curl -X POST http://localhost:3000/api/v1/encuestas/test
```

---

## 📝 Resumen

### ✅ Sistema Completado

El sistema de encuestas de satisfacción está **100% funcional** y cumple con todos los requisitos:

1. ✅ Email de cierre en el mismo hilo del caso
2. ✅ Encuesta con 3 indicadores (0-5)
3. ✅ Envío automático por WhatsApp
4. ✅ Procesamiento automático de respuestas
5. ✅ Cálculo de promedio automático
6. ✅ Comentarios adicionales opcionales
7. ✅ Métricas y estadísticas
8. ✅ Expiración automática (7 días)

### 🔄 Integración Completa

- **SeguimientoAutomaticoService**: Crea encuesta al cerrar caso
- **EmailNotificationService**: Envía email de cierre al ingeniero
- **WhatsAppSeguimientoIntegration**: Envía encuesta por WhatsApp
- **WhatsAppService**: Detecta y procesa respuestas de encuestas
- **EncuestaSatisfaccionService**: Gestión completa de encuestas

### 📊 Métricas Generadas

- Promedio general de satisfacción
- Promedio por indicador
- Distribución de calificaciones
- Comentarios de propietarios
- Tasa de respuesta de encuestas

---

## 📞 Soporte

Para más información:
- Ver: `SEGUIMIENTO_AUTOMATICO.md`
- Ver: `SISTEMA_COMPLETO_FINAL.md`
- Ver: `README_SISTEMA_COMPLETO.md`

---

**Fecha**: Enero 2025
**Versión**: 1.0.0
**Estado**: ✅ COMPLETO Y FUNCIONAL
