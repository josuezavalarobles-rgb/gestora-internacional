# 🔄 Sistema de Seguimiento Automático de Casos

## 📋 Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Requisitos Cumplidos](#requisitos-cumplidos)
3. [Arquitectura del Sistema](#arquitectura-del-sistema)
4. [Flujo Completo](#flujo-completo)
5. [Componentes Principales](#componentes-principales)
6. [Base de Datos](#base-de-datos)
7. [Configuración](#configuración)
8. [Ejemplos de Uso](#ejemplos-de-uso)
9. [Logs y Monitoreo](#logs-y-monitoreo)

---

## 📖 Descripción General

El **Sistema de Seguimiento Automático** es la funcionalidad final del sistema Amico Management que cierra el ciclo completo de gestión de casos. Después de que un ingeniero completa una visita, el sistema automáticamente verifica con el propietario si el problema fue resuelto, y toma acciones basadas en la respuesta.

### ✅ Características Principales

- **Seguimiento Post-Visita**: 4 horas después de completada la visita, el sistema contacta al propietario
- **Detección de Intención**: Analiza respuestas para determinar si el problema fue solucionado
- **Reintentos Inteligentes**: Si no hay respuesta, reintenta diariamente por 7 días
- **Cierre Automático**: Cierra casos automáticamente en dos escenarios:
  - ✅ Propietario confirma solución
  - ⏰ 7 días sin respuesta del propietario
- **Reapertura Automática**: Si el problema persiste, reabre el caso para nueva asignación

---

## 🎯 Requisitos Cumplidos

### Requisito Original del Cliente

> **4. Seguimiento automatizado**
>
> - Cuatro (4) horas después del horario programado para la visita, el sistema escribirá nuevamente al propietario vía WhatsApp para verificar si la avería fue solucionada.
>   - Si no fue solucionada completamente, el proceso se reiniciará automáticamente, generando un nuevo caso dentro del mismo hilo de correo, con la información adicional, la nueva cita y los detalles pendientes por resolver.
>   - Si fue solucionada satisfactoriamente, el caso se cerrará de forma automática.
> - Si el propietario no responde al seguimiento, el sistema continuará escribiendo una vez al día durante siete (7) días consecutivos.
>   - Si tras esos siete días el propietario no responde, el sistema cerrará el caso automáticamente, registrando el motivo como "Cierre por falta de respuesta del propietario" y sin enviar encuesta de satisfacción.

### ✅ Implementación

| Requisito | Estado | Implementación |
|-----------|--------|----------------|
| Seguimiento 4h después | ✅ | `SeguimientoAutomaticoService.iniciarSeguimiento()` |
| Detectar si fue solucionado | ✅ | Análisis de keywords en respuesta |
| Reabrir caso si no solucionado | ✅ | `reabrirCasoPorRespuesta()` |
| Cerrar caso si solucionado | ✅ | `cerrarCasoPorRespuesta()` |
| Reintentos diarios por 7 días | ✅ | `ejecutarReintento()` con límite de 7 |
| Cierre automático tras 7 días | ✅ | `cerrarCasoSinRespuesta()` |
| Envío por WhatsApp | ✅ | `WhatsAppSeguimientoIntegration` |

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO SEGUIMIENTO AUTOMÁTICO                  │
└─────────────────────────────────────────────────────────────────┘

1. TRIGGER: Cita marcada como completada
   │
   ├─> 4 horas después...
   │
   ├─> SeguimientoAutomaticoService.iniciarSeguimiento()
   │   │
   │   └─> Crea registro en SeguimientoCaso (activo=true, intentos=0)
   │
2. CRON JOB (cada hora): CronService
   │
   ├─> SeguimientoAutomaticoService.procesarSeguimientosPendientes()
   │   │
   │   ├─> Busca seguimientos con proximoIntento <= ahora
   │   │
   │   └─> WhatsAppSeguimientoIntegration.enviarSeguimientosPendientes()
   │       │
   │       ├─> Mensaje inicial (intentos=0)
   │       └─> Mensajes de reintento (intentos 1-7)
   │
3. RESPUESTA DEL PROPIETARIO
   │
   ├─> WhatsAppService detecta respuesta
   │
   ├─> WhatsAppSeguimientoIntegration.procesarRespuestaSeguimiento()
   │   │
   │   ├─> Detectar intención:
   │   │   ├─> "solucionado" → cerrarCasoPorRespuesta()
   │   │   └─> "no solucionado" → reabrirCasoPorRespuesta()
   │   │
   │   └─> Desactivar seguimiento (activo=false)
   │
4. SIN RESPUESTA (7 reintentos)
   │
   └─> SeguimientoAutomaticoService.cerrarCasoSinRespuesta()
       │
       ├─> Cambiar estado caso a "cerrado"
       ├─> Motivo: "Cierre por falta de respuesta del propietario"
       └─> NO enviar encuesta de satisfacción
```

---

## 🔧 Componentes Principales

### 1. SeguimientoAutomaticoService

**Ubicación**: `src/services/seguimiento/SeguimientoAutomaticoService.ts`

**Responsabilidades**:
- Crear seguimientos 4 horas después de visitas completadas
- Procesar seguimientos pendientes (llamado por cron)
- Analizar respuestas de propietarios
- Cerrar o reabrir casos según respuesta
- Manejar cierre automático tras 7 días sin respuesta

**Métodos Principales**:

```typescript
// Iniciar seguimiento 4h después de cita completada
public async iniciarSeguimiento(
  casoId: string,
  citaId: string
): Promise<void>

// Procesar todos los seguimientos pendientes (cron)
public async procesarSeguimientosPendientes(): Promise<void>

// Analizar respuesta del propietario
public async procesarRespuestaSeguimiento(
  casoId: string,
  respuesta: string
): Promise<{ accion: 'cerrar' | 'reabrir' | 'ninguna'; mensaje: string }>

// Cerrar caso cuando propietario confirma solución
private async cerrarCasoPorRespuesta(
  casoId: string,
  seguimientoId: string,
  resultado: string,
  respuesta: string
): Promise<void>

// Reabrir caso cuando problema persiste
private async reabrirCasoPorRespuesta(
  casoId: string,
  seguimientoId: string,
  respuesta: string
): Promise<void>

// Cerrar caso tras 7 días sin respuesta
private async cerrarCasoSinRespuesta(
  seguimientoId: string
): Promise<void>

// Ejecutar reintento (día 1-7)
public async ejecutarReintento(
  seguimientoId: string
): Promise<void>
```

**Mensajes Personalizados**:

```typescript
// Mensaje inicial (4h después)
getMensajeSeguimientoInicial(nombre, numeroCaso, unidad): string

// Mensajes de reintento (días 1-7)
getMensajeReintento(nombre, numeroCaso, unidad, intento): string
```

---

### 2. WhatsAppSeguimientoIntegration

**Ubicación**: `src/services/seguimiento/WhatsAppSeguimientoIntegration.ts`

**Responsabilidades**:
- Enviar mensajes de seguimiento por WhatsApp
- Detectar si un mensaje es respuesta a seguimiento
- Procesar respuestas de seguimiento
- Formatear números de teléfono

**Métodos Principales**:

```typescript
// Enviar mensaje inicial de seguimiento
public async enviarSeguimientoInicial(
  sock: WASocket,
  casoId: string,
  citaId: string
): Promise<boolean>

// Enviar reintento (días 1-7)
public async enviarReintento(
  sock: WASocket,
  seguimientoId: string,
  intentoNumero: number
): Promise<boolean>

// Procesar respuesta del propietario
public async procesarRespuestaSeguimiento(
  sock: WASocket,
  telefono: string,
  mensaje: string
): Promise<string | null>

// Verificar si mensaje es respuesta a seguimiento
public async esRespuestaSeguimiento(
  telefono: string
): Promise<boolean>

// Enviar todos los seguimientos pendientes (llamado por cron)
public async enviarSeguimientosPendientes(
  sock: WASocket
): Promise<void>
```

---

### 3. CronService

**Ubicación**: `src/services/cron/CronService.ts`

**Responsabilidades**:
- Gestionar tareas programadas (cron jobs)
- Ejecutar seguimientos automáticos cada hora
- Verificar SLA cada 30 minutos
- Limpiar archivos temporales diariamente

**Configuración de Cron Jobs**:

```typescript
// Seguimiento automático - cada hora
this.registrarJob(
  'seguimiento-automatico',
  '0 * * * *', // Cada hora en punto
  async () => {
    await this.seguimientoService.procesarSeguimientosPendientes();

    if (this.whatsappSock) {
      await this.whatsappIntegration.enviarSeguimientosPendientes(this.whatsappSock);
    }
  }
);

// Verificación de SLA - cada 30 minutos
this.registrarJob('verificacion-sla', '*/30 * * * *', ...);

// Limpieza de archivos - diario a las 2 AM
this.registrarJob('limpieza-archivos', '0 2 * * *', ...);

// Recordatorios de citas - cada 15 minutos
this.registrarJob('recordatorios-citas', '*/15 * * * *', ...);
```

**Métodos**:

```typescript
// Iniciar todos los cron jobs
public iniciar(): void

// Inyectar WhatsApp socket
public setWhatsAppSocket(sock: WASocket): void

// Detener un job específico
public detenerJob(nombre: string): void

// Obtener estado de jobs
public obtenerEstado(): Array<{nombre: string, activo: boolean}>

// Ejecutar manualmente (para pruebas)
public async ejecutarManualmente(nombre: string): Promise<void>
```

---

## 💾 Base de Datos

### Nuevo Modelo: SeguimientoCaso

```prisma
model SeguimientoCaso {
  id                    String              @id @default(uuid())
  casoId                String              @map("caso_id")
  citaId                String?             @map("cita_id")

  // Estado del seguimiento
  activo                Boolean             @default(true)
  intentos              Int                 @default(0) // 0-7
  proximoIntento        DateTime?           @map("proximo_intento")
  ultimoIntento         DateTime?           @map("ultimo_intento")

  // Mensajes
  mensajesTipo          MensajeSeguimiento  @map("mensajes_tipo")
  respuestaPropietario  String?             @map("respuesta_propietario") @db.Text
  fechaRespuesta        DateTime?           @map("fecha_respuesta")
  resultado             String?             // "solucionado", "no_solucionado", "sin_respuesta"

  // Fechas
  fechaInicio           DateTime            @default(now()) @map("fecha_inicio")
  fechaCierre           DateTime?           @map("fecha_cierre")

  // Relaciones
  caso                  Caso                @relation(fields: [casoId], references: [id], onDelete: Cascade)
  cita                  Cita?               @relation(fields: [citaId], references: [id])

  @@index([casoId])
  @@index([activo])
  @@index([proximoIntento])
  @@map("seguimientos_casos")
}
```

### Enum: MensajeSeguimiento

```prisma
enum MensajeSeguimiento {
  inicial    // Mensaje 4h después
  reintento  // Reintentos días 1-7
  cierre     // Cierre automático
}
```

### Modificaciones a Modelos Existentes

**Cita**:
```prisma
model Cita {
  // ... campos existentes ...

  fechaCompletada    DateTime?           @map("fecha_completada")
  seguimientos       SeguimientoCaso[]
}
```

**Caso**:
```prisma
model Caso {
  // ... campos existentes ...

  seguimientos       SeguimientoCaso[]
}
```

**TipoEvento** (Timeline):
```prisma
enum TipoEvento {
  // ... eventos existentes ...

  seguimiento_iniciado
  seguimiento_reintento
  seguimiento_respondido
  caso_cerrado_automatico
  caso_reabierto
}
```

---

## ⚙️ Configuración

### Variables de Entorno

Agregar al `.env`:

```bash
# Seguimiento Automático
SEGUIMIENTO_DELAY_HORAS=4         # Horas después de visita para iniciar
SEGUIMIENTO_MAX_INTENTOS=7        # Máximo de reintentos diarios
SEGUIMIENTO_INTERVALO_HORAS=24    # Horas entre reintentos

# Timezone (importante para cron)
TZ=America/Santo_Domingo
```

### Instalación de Dependencias

```bash
npm install node-cron
npm install date-fns
npm install @types/node-cron --save-dev
```

### Migración de Base de Datos

```bash
# Crear migración
npx prisma migrate dev --name add_seguimiento_automatico

# Aplicar en producción
npx prisma migrate deploy
```

---

## 🚀 Flujo Completo - Ejemplo Real

### Escenario: Caso de Filtración

```
PASO 1: CASO CREADO Y ASIGNADO
════════════════════════════════
📅 Caso: AMC-2025-0045
👤 Propietario: Juan Pérez
🏠 Unidad: 301
📞 Teléfono: 18095551234
🔧 Problema: Filtración en baño
👷 Ingeniero: Carlos Martínez
⏰ Cita: 14 de enero 2025, 2:00 PM - 3:30 PM

──────────────────────────────────────────────────────────

PASO 2: INGENIERO MARCA CITA COMO COMPLETADA
═══════════════════════════════════════════════
✅ Hora completada: 3:15 PM
📝 Notas ingeniero: "Reparada tubería, instalado nuevo sello"

→ Sistema crea SeguimientoCaso:
  - activo: true
  - intentos: 0
  - proximoIntento: 7:15 PM (4 horas después)

──────────────────────────────────────────────────────────

PASO 3: 4 HORAS DESPUÉS (7:15 PM)
══════════════════════════════════
⏰ CronService ejecuta cada hora
→ Detecta seguimiento con proximoIntento = 7:15 PM

📤 WhatsApp → Juan Pérez:
"
¡Hola Juan! 👋

Soy el sistema de Amico Management. El ingeniero Carlos Martínez
visitó tu unidad 301 hoy para atender el caso AMC-2025-0045
(Filtración en baño).

¿El problema fue solucionado satisfactoriamente? ✅

Por favor responde:
- "Sí" o "Solucionado" si todo está bien
- "No" o "Persiste" si aún hay problemas
"

→ Sistema actualiza:
  - intentos: 1
  - ultimoIntento: 7:15 PM
  - proximoIntento: Mañana 7:15 PM

──────────────────────────────────────────────────────────

OPCIÓN A: PROPIETARIO RESPONDE "SOLUCIONADO"
═════════════════════════════════════════════

📱 Juan responde: "Sí, todo bien. Gracias!"

→ WhatsAppService detecta respuesta
→ WhatsAppSeguimientoIntegration.procesarRespuestaSeguimiento()
  - Detecta keywords: "sí", "bien"
  - Acción: cerrar

📤 Respuesta automática:
"
¡Excelente! 😊

Nos alegra que el problema haya sido resuelto.
El caso AMC-2025-0045 ha sido cerrado exitosamente.

Gracias por usar Amico Management.
"

✅ Sistema cierra caso:
  - Estado: cerrado
  - Motivo: "Solucionado - Confirmado por propietario"
  - SeguimientoCaso.activo: false
  - SeguimientoCaso.resultado: "solucionado"
  - SeguimientoCaso.respuestaPropietario: "Sí, todo bien. Gracias!"

──────────────────────────────────────────────────────────

OPCIÓN B: PROPIETARIO RESPONDE "NO SOLUCIONADO"
════════════════════════════════════════════════

📱 Juan responde: "No, sigue goteando"

→ WhatsAppService detecta respuesta
→ WhatsAppSeguimientoIntegration.procesarRespuestaSeguimiento()
  - Detecta keywords: "no", "sigue"
  - Acción: reabrir

📤 Respuesta automática:
"
Entiendo, Juan. 😟

Vamos a generar un nuevo seguimiento para resolver
el problema completamente.

Un ingeniero será asignado nuevamente para revisar
la situación.

Recibirás una notificación con la nueva cita.
"

🔄 Sistema reabre caso:
  - Estado: abierto
  - Motivo: "Reabierto - Problema persiste"
  - SeguimientoCaso.activo: false
  - SeguimientoCaso.resultado: "no_solucionado"
  - Crear evento: caso_reabierto
  - Agregar nota: "Propietario indica: sigue goteando"

→ TRIGGER: Nueva asignación automática de ingeniero

──────────────────────────────────────────────────────────

OPCIÓN C: PROPIETARIO NO RESPONDE
══════════════════════════════════

DÍA 1 (7:15 PM): No hay respuesta
→ Cron envía reintento 1

📤 WhatsApp:
"
¡Hola de nuevo, Juan! 👋

Hace 1 día te escribimos sobre el caso AMC-2025-0045
(Filtración en baño).

¿Puedes confirmarnos si el problema fue resuelto?

Responde:
- "Sí" si está solucionado
- "No" si persiste el problema
"

DÍA 2-6: Continúan reintentos diarios...

DÍA 7 (7:15 PM): Último reintento
→ intentos = 7, sin respuesta

DÍA 8: Cron detecta seguimiento con 7 intentos sin respuesta

⏰ Sistema cierra automáticamente:
  - Estado: cerrado
  - Motivo: "Cierre por falta de respuesta del propietario"
  - SeguimientoCaso.activo: false
  - SeguimientoCaso.resultado: "sin_respuesta"
  - NO enviar encuesta de satisfacción

✅ Caso cerrado automáticamente tras 7 días sin respuesta
```

---

## 📊 Logs y Monitoreo

### Logs del Sistema

El sistema genera logs detallados en cada etapa:

```typescript
// Inicio de seguimiento
logger.info(`✅ Seguimiento iniciado para caso ${caso.numeroCaso} - Próximo intento: ${proximoIntento}`);

// Envío de mensaje
logger.info(`📤 Mensaje de seguimiento inicial enviado a ${usuario.nombreCompleto} (${caso.numeroCaso})`);

// Reintento
logger.info(`🔄 Reintento ${intentoNumero}/7 enviado para caso ${caso.numeroCaso}`);

// Respuesta procesada
logger.info(`✅ Respuesta procesada - Acción: ${resultado.accion} (${caso.numeroCaso})`);

// Cierre automático
logger.info(`⏰ Caso ${caso.numeroCaso} cerrado automáticamente por falta de respuesta (7 días)`);

// Reapertura
logger.info(`🔄 Caso ${caso.numeroCaso} reabierto - Problema persiste según propietario`);
```

### Métricas Recomendadas

Agregar estas métricas al dashboard:

```typescript
// Métricas de seguimiento
- Total de seguimientos activos
- Seguimientos con respuesta vs sin respuesta
- Tasa de solución confirmada (%)
- Tasa de reapertura (%)
- Casos cerrados por timeout (7 días)
- Promedio de días hasta respuesta
- Promedio de reintentos antes de respuesta
```

---

## 🧪 Pruebas

### Prueba Manual - Seguimiento Exitoso

```typescript
// 1. Crear caso y cita
const caso = await casoService.crear({...});
const cita = await citaService.crear({...});

// 2. Marcar cita como completada
await citaService.marcarCompletada(cita.id);

// 3. Esperar 4 horas (o ajustar SEGUIMIENTO_DELAY_HORAS=0.1 para testing)

// 4. Verificar mensaje enviado en WhatsApp

// 5. Simular respuesta del propietario
await whatsappService.simulateIncomingMessage(
  telefono,
  'Sí, está solucionado'
);

// 6. Verificar caso cerrado
const casoActualizado = await casoService.obtenerPorId(caso.id);
expect(casoActualizado.estado).toBe('cerrado');
```

### Prueba Manual - Reapertura

```typescript
// ... pasos 1-4 iguales ...

// 5. Simular respuesta "no solucionado"
await whatsappService.simulateIncomingMessage(
  telefono,
  'No, el problema persiste'
);

// 6. Verificar caso reabierto
const casoActualizado = await casoService.obtenerPorId(caso.id);
expect(casoActualizado.estado).toBe('abierto');
```

### Prueba Manual - Cierre Automático (7 días)

```typescript
// Para acelerar testing, ajustar:
// SEGUIMIENTO_MAX_INTENTOS=2
// SEGUIMIENTO_INTERVALO_HORAS=0.1

// 1-4. Igual que arriba

// 5. NO responder

// 6. Esperar SEGUIMIENTO_INTERVALO_HORAS * SEGUIMIENTO_MAX_INTENTOS

// 7. Verificar caso cerrado automáticamente
const casoActualizado = await casoService.obtenerPorId(caso.id);
expect(casoActualizado.estado).toBe('cerrado');
expect(casoActualizado.motivoCierre).toBe(
  'Cierre por falta de respuesta del propietario'
);
```

---

## 🔍 Keywords de Detección

### Palabras Clave para "SOLUCIONADO"

```typescript
const solucionadoKeywords = [
  'solucionado',
  'resuelto',
  'arreglado',
  'listo',
  'ok',
  'bien',
  'perfecto',
  'excelente',
  'gracias',
  'todo bien',
  'ya está',
  'funciona',
];
```

### Palabras Clave para "NO SOLUCIONADO"

```typescript
const noSolucionadoKeywords = [
  'no',
  'no solucionado',
  'persiste',
  'sigue',
  'problema',
  'aún',
  'todavía',
  'continúa',
  'igual',
  'peor',
  'no funciona',
];
```

---

## 📝 Notas de Implementación

### Consideraciones Importantes

1. **Timezone**: Configurar correctamente `TZ=America/Santo_Domingo` para que los cron jobs se ejecuten en el horario correcto

2. **Delay de 4 horas**: El seguimiento inicia 4 horas después de `fechaCompletada`, NO después de la hora programada de la cita

3. **Detección de Respuesta**: Si el propietario envía un mensaje mientras hay seguimiento activo, automáticamente se considera respuesta al seguimiento (no espera nuevo mensaje de seguimiento)

4. **Límite de 7 días**: Son 7 *intentos* (incluyendo el mensaje inicial), no 7 días calendarios exactos

5. **Thread de Email**: Al reabrir caso, se mantiene el mismo thread de email (mismo `numeroCaso`)

6. **Encuesta de Satisfacción**: NO se envía si el caso se cierra por timeout (7 días sin respuesta)

---

## 🚀 Deployment

### Checklist Pre-Deploy

- [ ] Variables de entorno configuradas en `.env`
- [ ] Migración de base de datos ejecutada
- [ ] Timezone configurado correctamente
- [ ] node-cron instalado
- [ ] CronService inicializado en `jobs/index.ts`
- [ ] WhatsApp socket inyectado en CronService
- [ ] Logs monitoreados

### Comandos de Deploy

```bash
# 1. Instalar dependencias
npm install

# 2. Generar Prisma Client
npx prisma generate

# 3. Ejecutar migraciones
npx prisma migrate deploy

# 4. Iniciar aplicación
npm run start
```

---

## 🎉 Conclusión

El sistema de **Seguimiento Automático** completa el ciclo de vida de casos en Amico Management:

1. ✅ **Recepción** → Propietario reporta por WhatsApp
2. ✅ **Clasificación** → IA analiza y crea caso
3. ✅ **Asignación** → Ingeniero asignado automáticamente
4. ✅ **Notificación** → Email + WhatsApp grupal
5. ✅ **Ejecución** → Ingeniero completa visita
6. ✅ **Seguimiento** → Sistema verifica solución (4h después)
7. ✅ **Cierre** → Automático según respuesta o timeout

**Todo 100% automatizado sin intervención humana.**

---

## 📞 Soporte

Para más información:
- Ver: `RESUMEN_EJECUTIVO.md`
- Ver: `README_SISTEMA_COMPLETO.md`
- Ver: `ASIGNACION_INGENIERIA.md`
- Ver: `RECONOCIMIENTO_PROPIETARIOS.md`
