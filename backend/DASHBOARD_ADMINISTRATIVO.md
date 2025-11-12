# 📊 DASHBOARD ADMINISTRATIVO
## Amico Management - Documentación Técnica

---

## 📌 ÍNDICE

1. [Visión General](#visión-general)
2. [Requisitos Cumplidos](#requisitos-cumplidos)
3. [Arquitectura del Sistema](#arquitectura-del-sistema)
4. [API Endpoints](#api-endpoints)
5. [Métricas y Estadísticas](#métricas-y-estadísticas)
6. [Historial de Conversaciones](#historial-de-conversaciones)
7. [Exportación de Reportes](#exportación-de-reportes)
8. [Ejemplos de Uso](#ejemplos-de-uso)
9. [Deployment](#deployment)

---

## 1. VISIÓN GENERAL

### 🎯 Objetivo

El Dashboard Administrativo proporciona una vista completa del sistema Amico Management, permitiendo monitorear y analizar:

- ✅ **Casos**: Abiertos, cerrados y totales
- ✅ **Conversaciones**: Historial completo de WhatsApp
- ✅ **Satisfacción**: Score general (0-5) basado en encuestas
- ✅ **Reportes**: Exportables a Excel con métricas de desempeño

---

## 2. REQUISITOS CUMPLIDOS

### Requisito Original del Cliente

> **6. Dashboard administrativo**
>
> El dashboard incluirá, como mínimo, las siguientes funciones:
> - Visualización de todos los casos abiertos, cerrados y totales.
> - Acceso al historial completo de conversaciones entre el bot y los propietarios.
> - Puntaje general (score) del 0 al 5 basado en los resultados de las encuestas.
> - Reportes exportables y métricas de desempeño general.

### ✅ Implementación Completa

| Requisito | Estado | Endpoint/Servicio |
|-----------|--------|-------------------|
| Visualización de casos (abiertos, cerrados, totales) | ✅ | `GET /api/v1/dashboard/casos` |
| Casos por estado | ✅ | `GET /api/v1/dashboard/metricas` |
| Historial completo de conversaciones WhatsApp | ✅ | `GET /api/v1/dashboard/conversaciones` |
| Conversación específica por teléfono | ✅ | `GET /api/v1/dashboard/conversaciones/:telefono` |
| Score general (0-5) de encuestas | ✅ | `GET /api/v1/dashboard/satisfaccion` |
| Reportes exportables (Excel) | ✅ | `GET /api/v1/dashboard/export/reporte-excel` |
| Métricas de desempeño | ✅ | `DashboardService.obtenerMetricasGenerales()` |
| Resumen ejecutivo (Hoy, Este mes, Total) | ✅ | `GET /api/v1/dashboard/resumen` |

---

## 3. ARQUITECTURA DEL SISTEMA

### 📊 Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                    DASHBOARD ADMINISTRATIVO                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────────┐    ┌─────────────┐
│   Database   │    │    Services      │    │     API     │
│              │    │                  │    │             │
│  PostgreSQL  │◄───┤ DashboardService │◄───┤ Controllers │
│   MongoDB    │    │  ExportService   │    │   Routes    │
│              │    │                  │    │             │
└──────────────┘    └──────────────────┘    └─────────────┘
        │                     │                     │
        │                     ▼                     │
        │            ┌──────────────────┐          │
        │            │  Excel/PDF       │          │
        └───────────►│  Generation      │◄─────────┘
                     │  ExcelJS         │
                     └──────────────────┘
```

### 🏗️ Capas del Sistema

#### **Capa 1: Base de Datos**
- **PostgreSQL**: Casos, usuarios, encuestas, seguimientos
- **MongoDB**: Conversaciones y mensajes de WhatsApp

#### **Capa 2: Servicios Core**
- **DashboardService**: Métricas, estadísticas y reportes
- **ExportService**: Exportación a Excel

#### **Capa 3: API**
- **DashboardController**: Controladores de endpoints
- **dashboard.routes.ts**: Rutas de la API

#### **Capa 4: Presentación**
- Archivos Excel descargables
- Respuestas JSON para frontend

---

## 4. API ENDPOINTS

### Base URL

```
http://localhost:3000/api/v1/dashboard
```

### 📋 Lista Completa de Endpoints

#### 1. Métricas Generales

```http
GET /api/v1/dashboard/metricas
```

**Descripción**: Obtiene métricas completas del sistema

**Query Parameters**:
- `fechaInicio` (opcional): Fecha de inicio del período
- `fechaFin` (opcional): Fecha de fin del período
- `condominioId` (opcional): Filtrar por condominio específico

**Respuesta**:

```json
{
  "success": true,
  "data": {
    "casosAbiertos": 45,
    "casosCerrados": 123,
    "casosTotal": 168,
    "casosPorEstado": {
      "nuevo": 12,
      "asignado": 18,
      "en_proceso": 10,
      "en_visita": 3,
      "esperando_repuestos": 2,
      "cerrado": 123
    },
    "scoreGeneral": 4.52,
    "totalEncuestas": 100,
    "encuestasCompletadas": 85,
    "tasaRespuesta": 85.00,
    "tiempoPromedioResolucion": 24.5,
    "tiempoPromedioRespuesta": 15,
    "casosResueltosPrimerContacto": 18,
    "seguimientosActivos": 20,
    "seguimientosCompletados": 103,
    "casosCerradosPorTimeout": 15,
    "casosEnSLA": 150,
    "casosVencidosSLA": 18,
    "porcentajeCumplimientoSLA": 89.29
  }
}
```

---

#### 2. Resumen Ejecutivo

```http
GET /api/v1/dashboard/resumen
```

**Descripción**: Obtiene resumen ejecutivo (hoy, este mes, total histórico)

**Query Parameters**:
- `condominioId` (opcional): Filtrar por condominio específico

**Respuesta**:

```json
{
  "success": true,
  "data": {
    "hoy": {
      "casosAbiertos": 3,
      "casosCerrados": 1,
      "casosTotal": 4,
      "scoreGeneral": 4.75,
      ...
    },
    "esteMes": {
      "casosAbiertos": 25,
      "casosCerrados": 18,
      "casosTotal": 43,
      "scoreGeneral": 4.52,
      ...
    },
    "total": {
      "casosAbiertos": 45,
      "casosCerrados": 123,
      "casosTotal": 168,
      "scoreGeneral": 4.42,
      ...
    }
  }
}
```

**Uso**: Ideal para mostrar tarjetas de resumen en el dashboard principal

---

#### 3. Casos Detallados

```http
GET /api/v1/dashboard/casos
```

**Descripción**: Obtiene lista de casos con todos los detalles

**Query Parameters**:
- `estado` (opcional): Filtrar por estado
- `condominioId` (opcional): Filtrar por condominio
- `tecnicoId` (opcional): Filtrar por ingeniero asignado
- `fechaInicio` (opcional): Fecha de inicio
- `fechaFin` (opcional): Fecha de fin
- `prioridad` (opcional): Filtrar por prioridad
- `pagina` (opcional, default: 1): Número de página
- `limite` (opcional, default: 50): Casos por página

**Respuesta**:

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "numeroCaso": "AMICO-2025-0042",
      "estado": "cerrado",
      "prioridad": "alta",
      "categoria": "Plomería",
      "descripcion": "Fuga de agua en baño principal",
      "unidad": "301",
      "usuario": {
        "id": "uuid",
        "nombreCompleto": "Juan Pérez",
        "telefono": "18095551234"
      },
      "tecnicoAsignado": {
        "id": "uuid",
        "nombreCompleto": "Carlos Martínez",
        "email": "carlos@amico.com"
      },
      "condominio": {
        "id": "uuid",
        "nombre": "Las Palmas"
      },
      "fechaCreacion": "2025-01-15T10:30:00Z",
      "fechaCierre": "2025-01-16T14:20:00Z",
      "tiempoResolucion": 1670,
      "satisfaccionCliente": 4.67,
      "slaVencido": false
    }
  ],
  "pagination": {
    "total": 168,
    "pagina": 1,
    "limite": 50,
    "totalPaginas": 4
  }
}
```

**Uso**: Tabla de casos en el dashboard con paginación

---

#### 4. Historial de Conversaciones

```http
GET /api/v1/dashboard/conversaciones
```

**Descripción**: Obtiene historial completo de conversaciones de WhatsApp

**Query Parameters**:
- `telefono` (opcional): Filtrar por número de teléfono
- `fechaInicio` (opcional): Fecha de inicio
- `fechaFin` (opcional): Fecha de fin
- `pagina` (opcional, default: 1): Número de página
- `limite` (opcional, default: 20): Conversaciones por página

**Respuesta**:

```json
{
  "success": true,
  "data": [
    {
      "id": "mongodb-id",
      "telefono": "18095551234",
      "nombreContacto": "Juan Pérez",
      "ultimoMensaje": "Gracias, el problema fue solucionado",
      "fechaUltimoMensaje": "2025-01-16T14:20:00Z",
      "totalMensajes": 15,
      "mensajes": [
        {
          "id": "msg-id-1",
          "contenido": "Hola, tengo una fuga de agua",
          "tipo": "entrante",
          "timestamp": "2025-01-15T10:30:00Z",
          "leido": true
        },
        {
          "id": "msg-id-2",
          "contenido": "Entendido, voy a crear un caso...",
          "tipo": "saliente",
          "timestamp": "2025-01-15T10:31:00Z",
          "leido": true
        }
      ]
    }
  ],
  "pagination": {
    "total": 85,
    "pagina": 1,
    "limite": 20,
    "totalPaginas": 5
  }
}
```

**Uso**: Vista de historial de conversaciones con búsqueda

---

#### 5. Conversación Específica

```http
GET /api/v1/dashboard/conversaciones/:telefono
```

**Descripción**: Obtiene conversación completa de un teléfono específico

**Path Parameters**:
- `telefono`: Número de teléfono (formato: 18095551234)

**Respuesta**:

```json
{
  "success": true,
  "data": {
    "id": "mongodb-id",
    "telefono": "18095551234",
    "nombreContacto": "Juan Pérez",
    "ultimoMensaje": "Gracias por todo",
    "fechaUltimoMensaje": "2025-01-16T14:20:00Z",
    "totalMensajes": 15,
    "mensajes": [
      // Array completo de mensajes
    ]
  }
}
```

**Uso**: Detalle de conversación individual

---

#### 6. Estadísticas de Satisfacción

```http
GET /api/v1/dashboard/satisfaccion
```

**Descripción**: Obtiene estadísticas detalladas de encuestas de satisfacción

**Query Parameters**:
- `fechaInicio` (opcional): Fecha de inicio del período
- `fechaFin` (opcional): Fecha de fin del período
- `condominioId` (opcional): Filtrar por condominio

**Respuesta**:

```json
{
  "success": true,
  "data": {
    "total": 85,
    "promedios": {
      "actitudIngeniero": 4.72,
      "rapidezReparacion": 4.45,
      "calidadServicio": 4.58,
      "general": 4.58
    },
    "distribucion": {
      "excelente": 68,
      "muyBueno": 12,
      "bueno": 4,
      "regular": 1,
      "malo": 0
    },
    "comentariosDestacados": [
      {
        "comentario": "Excelente servicio, muy profesional",
        "promedio": 5.0,
        "fecha": "2025-01-16T14:20:00Z"
      }
    ]
  }
}
```

**Uso**: Gráficos y métricas de satisfacción del cliente

---

#### 7. Reporte JSON

```http
GET /api/v1/dashboard/reporte
```

**Descripción**: Genera reporte completo en formato JSON

**Query Parameters** (requeridos):
- `fechaInicio`: Fecha de inicio del período
- `fechaFin`: Fecha de fin del período
- `condominioId` (opcional): Filtrar por condominio

**Respuesta**:

```json
{
  "success": true,
  "data": {
    "periodo": {
      "inicio": "2025-01-01T00:00:00Z",
      "fin": "2025-01-31T23:59:59Z"
    },
    "metricas": {
      // Todas las métricas generales
    },
    "casosPorCondominio": [
      {
        "condominio": "Las Palmas",
        "total": 45,
        "abiertos": 12,
        "cerrados": 33,
        "scorePromedio": 4.65
      }
    ],
    "casosPorIngeniero": [
      {
        "ingeniero": "Carlos Martínez",
        "total": 23,
        "resueltos": 20,
        "pendientes": 3,
        "scorePromedio": 4.89,
        "tiempoPromedioResolucion": 18.5
      }
    ],
    "topProblemas": [
      {
        "categoria": "Plomería",
        "total": 42,
        "porcentaje": 35.5
      }
    ]
  }
}
```

**Uso**: Base de datos para dashboard frontend con gráficos

---

#### 8. Exportar Reporte a Excel

```http
GET /api/v1/dashboard/export/reporte-excel
```

**Descripción**: Descarga reporte completo en formato Excel (.xlsx)

**Query Parameters** (requeridos):
- `fechaInicio`: Fecha de inicio del período
- `fechaFin`: Fecha de fin del período
- `condominioId` (opcional): Filtrar por condominio

**Respuesta**: Descarga de archivo Excel

**Contenido del Excel**:
- **Hoja 1**: Resumen General
  - Métricas de casos
  - Casos por estado
  - Satisfacción del cliente
  - Rendimiento
  - SLA

- **Hoja 2**: Casos por Condominio
  - Tabla con todos los condominios
  - Total, abiertos, cerrados, score

- **Hoja 3**: Casos por Ingeniero
  - Tabla con todos los ingenieros
  - Total, resueltos, pendientes, score, tiempo promedio

- **Hoja 4**: Top Problemas
  - Categorías más frecuentes
  - Total de casos y porcentaje

**Ejemplo de uso**:

```bash
curl "http://localhost:3000/api/v1/dashboard/export/reporte-excel?fechaInicio=2025-01-01&fechaFin=2025-01-31" \
  --output reporte_amico.xlsx
```

---

#### 9. Exportar Casos a Excel

```http
GET /api/v1/dashboard/export/casos-excel
```

**Descripción**: Descarga lista de casos en formato Excel (.xlsx)

**Query Parameters** (opcionales):
- `estado`: Filtrar por estado
- `condominioId`: Filtrar por condominio
- `tecnicoId`: Filtrar por ingeniero
- `fechaInicio`: Fecha de inicio
- `fechaFin`: Fecha de fin

**Respuesta**: Descarga de archivo Excel con tabla de casos

**Columnas del Excel**:
1. Número de Caso
2. Estado
3. Prioridad
4. Categoría
5. Descripción
6. Unidad
7. Propietario
8. Teléfono
9. Ingeniero
10. Condominio
11. Fecha Creación
12. Fecha Cierre
13. Tiempo Resolución (minutos)
14. Satisfacción (0-5)
15. SLA Vencido (Sí/No)

**Ejemplo de uso**:

```bash
curl "http://localhost:3000/api/v1/dashboard/export/casos-excel?estado=cerrado&fechaInicio=2025-01-01&fechaFin=2025-01-31" \
  --output casos_cerrados_enero.xlsx
```

---

## 5. MÉTRICAS Y ESTADÍSTICAS

### 📊 DashboardMetrics (Interface)

```typescript
interface DashboardMetrics {
  // ========== CASOS ==========
  casosAbiertos: number;           // Casos en estados no cerrados
  casosCerrados: number;            // Casos en estado "cerrado"
  casosTotal: number;               // Total de casos

  casosPorEstado: {
    nuevo: number;                  // Estado: nuevo
    asignado: number;               // Estado: asignado
    en_proceso: number;             // Estado: en_proceso
    en_visita: number;              // Estado: en_visita
    esperando_repuestos: number;    // Estado: esperando_repuestos
    cerrado: number;                // Estado: cerrado
  };

  // ========== SATISFACCIÓN ==========
  scoreGeneral: number;             // 0-5: Promedio de todas las encuestas
  totalEncuestas: number;           // Total de encuestas enviadas
  encuestasCompletadas: number;     // Encuestas respondidas
  tasaRespuesta: number;            // % de respuesta

  // ========== RENDIMIENTO ==========
  tiempoPromedioResolucion: number; // Horas desde creación hasta cierre
  tiempoPromedioRespuesta: number;  // Minutos para primera respuesta
  casosResueltosPrimerContacto: number; // Casos cerrados sin reabrir

  // ========== SEGUIMIENTO ==========
  seguimientosActivos: number;      // Seguimientos en curso
  seguimientosCompletados: number;  // Seguimientos finalizados
  casosCerradosPorTimeout: number;  // Cerrados por 7 días sin respuesta

  // ========== SLA ==========
  casosEnSLA: number;               // Casos dentro de SLA
  casosVencidosSLA: number;         // Casos con SLA vencido
  porcentajeCumplimientoSLA: number; // % de cumplimiento
}
```

### 📈 Cálculos de Métricas

#### Score General de Satisfacción

```typescript
// Fórmula
scoreGeneral = SUM(promedioGeneral) / COUNT(encuestasCompletadas)

// Ejemplo:
// Encuesta 1: 4.67
// Encuesta 2: 5.00
// Encuesta 3: 4.33
// scoreGeneral = (4.67 + 5.00 + 4.33) / 3 = 4.67
```

#### Tiempo Promedio de Resolución

```typescript
// Fórmula
tiempoPromedioResolucion = AVG(fechaCierre - fechaCreacion) en horas

// Ejemplo:
// Caso 1: 24 horas
// Caso 2: 18 horas
// Caso 3: 30 horas
// tiempoPromedioResolucion = (24 + 18 + 30) / 3 = 24 horas
```

#### Tasa de Respuesta de Encuestas

```typescript
// Fórmula
tasaRespuesta = (encuestasCompletadas / totalEncuestas) * 100

// Ejemplo:
// Total: 100 encuestas enviadas
// Completadas: 85 encuestas
// tasaRespuesta = (85 / 100) * 100 = 85%
```

#### Cumplimiento de SLA

```typescript
// Fórmula
porcentajeCumplimientoSLA = (casosEnSLA / casosTotal) * 100

// Ejemplo:
// Total: 168 casos
// En SLA: 150 casos
// Vencidos: 18 casos
// porcentajeCumplimientoSLA = (150 / 168) * 100 = 89.29%
```

---

## 6. HISTORIAL DE CONVERSACIONES

### 💬 ConversacionWhatsApp (Interface)

```typescript
interface ConversacionWhatsApp {
  id: string;                       // ID de MongoDB
  telefono: string;                 // Número de teléfono
  nombreContacto: string;           // Nombre del propietario
  ultimoMensaje: string;            // Último mensaje enviado/recibido
  fechaUltimoMensaje: Date;         // Timestamp del último mensaje
  totalMensajes: number;            // Cantidad de mensajes en la conversación

  mensajes: {
    id: string;                     // ID del mensaje
    contenido: string;              // Texto del mensaje
    tipo: 'entrante' | 'saliente';  // Dirección del mensaje
    timestamp: Date;                // Fecha y hora del mensaje
    leido: boolean;                 // Si fue leído
  }[];
}
```

### 📱 Fuentes de Datos

- **MongoDB**: Colecciones `conversaciones` y `mensajes`
- **Sincronización**: En tiempo real con WhatsApp via Baileys
- **Persistencia**: Todos los mensajes se guardan indefinidamente

---

## 7. EXPORTACIÓN DE REPORTES

### 📄 Servicio de Exportación

**Ubicación**: `src/services/export/ExportService.ts`

#### Métodos Principales

##### ✅ exportarReporteExcel()

```typescript
public async exportarReporteExcel(
  fechaInicio: Date,
  fechaFin: Date,
  condominioId?: string
): Promise<string>
```

**Genera**: Archivo Excel multi-hoja con reporte completo

**Hojas incluidas**:
1. **Resumen General**: Métricas de casos, satisfacción, rendimiento, SLA
2. **Casos por Condominio**: Tabla con agregados por condominio
3. **Casos por Ingeniero**: Tabla con desempeño de cada ingeniero
4. **Top Problemas**: Categorías más frecuentes

**Estilos aplicados**:
- Headers con fondo azul y texto blanco
- Columnas auto-ajustadas
- Formato de números y porcentajes
- Agrupación lógica de datos

---

##### ✅ exportarCasosExcel()

```typescript
public async exportarCasosExcel(
  filtros?: {
    estado?: string;
    condominioId?: string;
    tecnicoId?: string;
    fechaInicio?: Date;
    fechaFin?: Date;
  }
): Promise<string>
```

**Genera**: Archivo Excel con tabla de casos

**Límite de exportación**: 10,000 casos

**Columnas**:
- Número de Caso
- Estado
- Prioridad
- Categoría
- Descripción (hasta 40 caracteres)
- Unidad
- Propietario
- Teléfono
- Ingeniero
- Condominio
- Fecha Creación
- Fecha Cierre
- Tiempo Resolución (minutos)
- Satisfacción (0-5)
- SLA Vencido (Sí/No)

---

##### ✅ limpiarExportacionesAntiguas()

```typescript
public async limpiarExportacionesAntiguas(): Promise<void>
```

**Función**: Elimina archivos Excel con más de 24 horas

**Frecuencia recomendada**: Diaria (agregar al CronService)

**Directorio**: `exports/` en la raíz del proyecto

---

### 📂 Estructura de Archivos Exportados

```
backend/
└── exports/
    ├── reporte_amico_1737891234567.xlsx
    ├── casos_amico_1737891345678.xlsx
    └── (archivos temporales - limpiados automáticamente)
```

**Nomenclatura**:
- `reporte_amico_{timestamp}.xlsx`: Reportes completos
- `casos_amico_{timestamp}.xlsx`: Exportaciones de casos

**Retention**: 24 horas (luego se eliminan automáticamente)

---

## 8. EJEMPLOS DE USO

### 📊 Ejemplo 1: Dashboard Principal

**Objetivo**: Mostrar tarjetas de resumen en la página principal

```typescript
// Frontend: React/Vue/Angular
async function cargarDashboard() {
  const response = await fetch('/api/v1/dashboard/resumen');
  const { data } = await response.json();

  // Renderizar tarjetas
  renderCard('Casos Hoy', data.hoy.casosTotal);
  renderCard('Score General', data.total.scoreGeneral + '/5');
  renderCard('SLA Cumplimiento', data.total.porcentajeCumplimientoSLA + '%');
  renderCard('Casos Cerrados', data.esteMes.casosCerrados);
}
```

**Resultado**:
```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Casos Hoy: 4    │  │ Score: 4.58/5   │  │ SLA: 89.29%     │
└─────────────────┘  └─────────────────┘  └─────────────────┘
┌─────────────────┐
│ Cerrados: 18    │
└─────────────────┘
```

---

### 📋 Ejemplo 2: Tabla de Casos

**Objetivo**: Mostrar tabla paginada de casos con filtros

```typescript
async function cargarCasos(pagina = 1, filtros = {}) {
  const params = new URLSearchParams({
    pagina: pagina.toString(),
    limite: '50',
    ...filtros,
  });

  const response = await fetch(`/api/v1/dashboard/casos?${params}`);
  const { data, pagination } = await response.json();

  renderTable(data);
  renderPagination(pagination);
}

// Uso con filtros
cargarCasos(1, {
  estado: 'cerrado',
  condominioId: 'uuid-condominio',
  fechaInicio: '2025-01-01',
  fechaFin: '2025-01-31',
});
```

**Resultado**:
```
╔══════════════════╦═════════╦════════════╦═══════════════╗
║ Número de Caso   ║ Estado  ║ Propietario║ Satisfacción  ║
╠══════════════════╬═════════╬════════════╬═══════════════╣
║ AMICO-2025-0042  ║ Cerrado ║ Juan Pérez ║ 4.67/5 ⭐     ║
║ AMICO-2025-0043  ║ Cerrado ║ María López║ 5.00/5 ⭐⭐  ║
╚══════════════════╩═════════╩════════════╩═══════════════╝
                    Página 1 de 4
```

---

### 💬 Ejemplo 3: Historial de Conversaciones

**Objetivo**: Mostrar lista de conversaciones recientes

```typescript
async function cargarConversaciones() {
  const response = await fetch('/api/v1/dashboard/conversaciones?limite=10');
  const { data } = await response.json();

  data.forEach(conv => {
    renderConversacion({
      nombre: conv.nombreContacto,
      ultimoMensaje: conv.ultimoMensaje,
      fecha: conv.fechaUltimoMensaje,
      totalMensajes: conv.totalMensajes,
    });
  });
}

// Ver conversación específica
async function verConversacion(telefono) {
  const response = await fetch(`/api/v1/dashboard/conversaciones/${telefono}`);
  const { data } = await response.json();

  renderChatView(data.mensajes);
}
```

**Resultado**:
```
┌────────────────────────────────────────────────────────┐
│ Juan Pérez (18095551234)                     15 msgs  │
│ "Gracias, el problema fue solucionado"                 │
│ Hace 2 horas                                           │
├────────────────────────────────────────────────────────┤
│ María López (18095556789)                    8 msgs   │
│ "¿Cuándo viene el ingeniero?"                          │
│ Hace 30 minutos                                        │
└────────────────────────────────────────────────────────┘
```

---

### 📊 Ejemplo 4: Exportar Reporte a Excel

**Objetivo**: Descargar reporte del mes en Excel

```typescript
// Frontend
function descargarReporteExcel() {
  const fechaInicio = '2025-01-01';
  const fechaFin = '2025-01-31';

  const url = `/api/v1/dashboard/export/reporte-excel?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;

  // Descargar archivo
  window.location.href = url;
}

// O con fetch para control avanzado
async function descargarReporte() {
  const response = await fetch(
    '/api/v1/dashboard/export/reporte-excel?fechaInicio=2025-01-01&fechaFin=2025-01-31'
  );

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'reporte_amico.xlsx';
  a.click();
}
```

**Resultado**: Se descarga archivo Excel con 4 hojas de datos

---

### 📈 Ejemplo 5: Gráfico de Satisfacción

**Objetivo**: Mostrar distribución de encuestas

```typescript
async function cargarGraficoSatisfaccion() {
  const response = await fetch('/api/v1/dashboard/satisfaccion');
  const { data } = await response.json();

  // Datos para gráfico de pastel
  const chartData = [
    { name: 'Excelente (4.5-5)', value: data.distribucion.excelente },
    { name: 'Muy Bueno (3.5-4.4)', value: data.distribucion.muyBueno },
    { name: 'Bueno (2.5-3.4)', value: data.distribucion.bueno },
    { name: 'Regular (1.5-2.4)', value: data.distribucion.regular },
    { name: 'Malo (0-1.4)', value: data.distribucion.malo },
  ];

  renderPieChart(chartData);

  // Score promedio
  renderScoreCard(data.promedios.general);
}
```

**Resultado**:
```
┌──────────────────────────────────┐
│    Distribución de Satisfacción  │
│                                  │
│        📊 Gráfico de Pastel      │
│                                  │
│  🟢 Excelente: 68 (80%)          │
│  🔵 Muy Bueno: 12 (14%)          │
│  🟡 Bueno: 4 (5%)                │
│  🟠 Regular: 1 (1%)              │
│  🔴 Malo: 0 (0%)                 │
│                                  │
│  Score Promedio: 4.58/5 ⭐⭐    │
└──────────────────────────────────┘
```

---

## 9. DEPLOYMENT

### 🚀 Pasos de Deployment

#### 1. Instalar Dependencias

```bash
cd backend

# ExcelJS para generación de Excel
npm install exceljs

# Asegurarse de que Express está instalado
npm install express
```

#### 2. Crear Directorios

```bash
mkdir -p exports
```

#### 3. Registrar Rutas en App Principal

Agregar a `src/app.ts` o `src/index.ts`:

```typescript
import dashboardRoutes from './routes/dashboard.routes';

// Después de otras rutas
app.use('/api/v1/dashboard', dashboardRoutes);
```

#### 4. Configurar Cron Job para Limpieza

Agregar a `src/services/cron/CronService.ts`:

```typescript
import { ExportService } from '../export/ExportService';

const exportService = ExportService.getInstance();

// En el método iniciar()
this.registrarJob(
  'limpieza-exportaciones',
  '0 2 * * *', // Diario a las 2 AM
  async () => {
    logger.info('🧹 Limpiando archivos de exportación antiguos...');
    await exportService.limpiarExportacionesAntiguas();
  }
);
```

#### 5. Verificar Permisos

```bash
# Dar permisos de escritura al directorio exports
chmod 755 exports/
```

#### 6. Reiniciar Servicio

```bash
# Con PM2
pm2 restart amico-backend

# Con systemd
sudo systemctl restart amico-backend
```

---

### ⚙️ Variables de Entorno

No se requieren variables adicionales. El sistema usa las existentes:

```env
DATABASE_URL="postgresql://..."  # PostgreSQL
MONGODB_URI="mongodb://..."       # MongoDB
```

---

### 📋 Checklist de Deployment

```
✅ ExcelJS instalado
✅ Directorio exports/ creado
✅ Rutas del dashboard registradas
✅ Cron job de limpieza configurado
✅ Permisos de directorio verificados
✅ Servicio reiniciado
✅ Endpoints accesibles
✅ Exportación de Excel funciona
✅ Historial de conversaciones accesible
✅ Métricas calculándose correctamente
```

---

### 🧪 Testing de Endpoints

```bash
# Base URL
BASE_URL="http://localhost:3000/api/v1/dashboard"

# 1. Probar métricas generales
curl "$BASE_URL/metricas"

# 2. Probar resumen ejecutivo
curl "$BASE_URL/resumen"

# 3. Probar lista de casos
curl "$BASE_URL/casos?limite=10"

# 4. Probar conversaciones
curl "$BASE_URL/conversaciones?limite=5"

# 5. Probar conversación específica
curl "$BASE_URL/conversaciones/18095551234"

# 6. Probar satisfacción
curl "$BASE_URL/satisfaccion"

# 7. Probar reporte JSON
curl "$BASE_URL/reporte?fechaInicio=2025-01-01&fechaFin=2025-01-31"

# 8. Descargar reporte Excel
curl "$BASE_URL/export/reporte-excel?fechaInicio=2025-01-01&fechaFin=2025-01-31" \
  --output reporte_test.xlsx

# 9. Descargar casos Excel
curl "$BASE_URL/export/casos-excel?estado=cerrado" \
  --output casos_test.xlsx
```

---

## 10. RESUMEN

### ✅ Sistema Completo

El Dashboard Administrativo está **100% implementado** y cumple con todos los requisitos:

1. ✅ **Visualización de casos**: Abiertos, cerrados, totales, por estado
2. ✅ **Historial de conversaciones**: Completo con mensajes de WhatsApp
3. ✅ **Score general**: 0-5 basado en encuestas de satisfacción
4. ✅ **Reportes exportables**: Excel multi-hoja con métricas
5. ✅ **Métricas de desempeño**: Tiempo de resolución, SLA, rendimiento

### 🎯 Características Destacadas

- **API RESTful completa**: 9 endpoints documentados
- **Paginación**: En casos y conversaciones
- **Filtros avanzados**: Por fecha, condominio, ingeniero, estado
- **Exportación Excel**: Con formato profesional y múltiples hojas
- **Resumen ejecutivo**: Hoy, este mes, total histórico
- **Limpieza automática**: Archivos temporales eliminados diariamente

### 📊 Métricas Disponibles

- **Casos**: Total, abiertos, cerrados, por estado
- **Satisfacción**: Score 0-5, distribución, comentarios
- **Rendimiento**: Tiempo resolución, primera respuesta
- **SLA**: Cumplimiento, casos vencidos
- **Seguimiento**: Activos, completados, timeouts
- **Ingenieros**: Desempeño individual, ranking
- **Condominios**: Casos por condominio, score

### 📞 Soporte

Para más información:
- Ver: `README_SISTEMA_COMPLETO.md`
- Ver: `SEGUIMIENTO_AUTOMATICO.md`
- Ver: `ENCUESTAS_SATISFACCION.md`

---

**Fecha**: Enero 2025
**Versión**: 1.0.0
**Estado**: ✅ COMPLETO Y FUNCIONAL
