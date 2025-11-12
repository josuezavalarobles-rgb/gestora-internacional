# Gestora Internacional SRL - Backend

Sistema Integral de Administración de Condominios con Inteligencia Artificial

## 🏢 Descripción

Backend completo para gestión profesional de condominios en República Dominicana con funcionalidades avanzadas de IA, contabilidad automatizada, cumplimiento fiscal (NCF), y predicciones ML.

## ✨ Características Principales

### 🏠 Gestión Multi-Propiedad
- **Organización multi-tenant**: Gestiona múltiples condominios desde una sola instalación
- **Unidades con alícuota**: Sistema de distribución automática de gastos según porcentaje de participación
- **Dependientes y vehículos**: Registro completo de personas y vehículos por unidad
- **Propietarios e inquilinos**: Diferenciación y gestión de ambos tipos

### 💰 Contabilidad Completa
- **Plan de cuentas personalizado**: Estructura contable flexible
- **NCF automático**: Generación de Números de Comprobante Fiscal (B01, B02, B14, B15, B16)
- **ITBIS 18%**: Cálculo automático del impuesto dominicano
- **Gastos e ingresos**: Registro detallado con relación a proveedores
- **Distribución automática**: Gastos distribuidos por alícuota a todas las unidades
- **Estados de cuenta por unidad**: Seguimiento individual de cargos y abonos
- **Control de morosidad**: Identificación automática de unidades con saldo pendiente

### 🤖 Inteligencia Artificial
- **OCR de facturas con Claude**: Extracción automática de datos de facturas escaneadas
- **Análisis de sentimiento**: Evaluación de comentarios y comunicaciones
- **Predicciones ML**: Proyección de gastos mensuales y tasa de morosidad
- **Insights automáticos**: Recomendaciones basadas en datos históricos
- **Chatbot 24/7**: Integración con WhatsApp para atención automatizada

### 👥 Recursos Humanos
- **Gestión de personal**: Registro completo de empleados del condominio
- **Nómina dominicana**: Cálculo automático con:
  - AFP: 2.87%
  - ARS: 3.04%
  - ISR: Escala progresiva 2024
- **Reportes de nómina**: Consolidados mensuales y por empleado

### 🏊 Áreas Comunes
- **15 tipos de áreas**: Piscina, salón de eventos, gimnasio, parque infantil, etc.
- **Reservaciones inteligentes**:
  - Validación de disponibilidad
  - Aprobación automática o manual
  - Gestión de horarios y capacidad
  - Cobro por uso
- **Estadísticas de uso**: Análisis de ocupación y preferencias

### 🚪 Control de Portería
- **Registro de visitas**: Entrada y salida con datos completos
- **Visitantes frecuentes**: Base de datos de personas autorizadas
- **Control vehicular**: Registro de placas y vehículos
- **Alertas de seguridad**: Detección de visitas prolongadas o inusuales
- **Reportes diarios**: Estadísticas de flujo de visitantes

### 📅 Calendario de Eventos
- **Eventos por tipo**: Asambleas, mantenimientos, reuniones, festividades
- **Recordatorios automáticos**: Email, WhatsApp y notificaciones push
- **Eventos recurrentes**: Creación automática de eventos mensuales
- **Participantes y adjuntos**: Gestión completa de asistentes y documentos

### 📁 Repositorio de Documentos
- **Categorización**: 10 categorías predefinidas (actas, contratos, facturas, etc.)
- **Etiquetado**: Sistema de tags para búsqueda rápida
- **Gestión de permisos**: Documentos públicos y privados
- **Estadísticas de uso**: Documentos más descargados
- **Limpieza automática**: Eliminación de documentos antiguos

### 🏪 Gestión de Proveedores
- **Catálogo completo**: Datos de contacto, bancarios y fiscales
- **Evaluación 360°**: Calificación en calidad, puntualidad, precio y comunicación
- **Top proveedores**: Ranking por calificación
- **Historial de servicios**: Relación con gastos y trabajos realizados

## 🛠️ Tecnologías

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Lenguaje**: TypeScript
- **Base de datos**: PostgreSQL (Prisma ORM)
- **Logs**: MongoDB
- **Cache**: Redis
- **IA**: Claude 3.5 Sonnet (Anthropic) + GPT-4 (OpenAI)
- **WhatsApp**: Baileys
- **Documentos**: PDFKit, ExcelJS
- **Procesamiento de imágenes**: Sharp
- **OCR**: Claude Vision

## 📦 Instalación

```bash
# Clonar repositorio
git clone <repo-url>
cd ges-internacional/backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Generar cliente de Prisma
npm run db:generate

# Ejecutar migraciones
npm run db:migrate

# Ejecutar seeds (opcional)
npm run db:seed

# Iniciar en desarrollo
npm run dev
```

## 🗄️ Base de Datos

### PostgreSQL (Datos principales)
```bash
# Estructura:
- 53 modelos
- 28 enums
- 2,083 líneas de schema
```

### MongoDB (Logs y mensajes)
```bash
# Colecciones:
- logs
- mensajes_whatsapp
- eventos_sistema
```

### Redis (Cache y colas)
```bash
# Uso:
- Cache de consultas frecuentes
- Cola de trabajos (procesamiento de facturas, notificaciones)
- Sesiones de usuario
```

## 🔑 Variables de Entorno

```env
# Server
PORT=3000
NODE_ENV=development

# Databases
DATABASE_URL=postgresql://...
MONGODB_URI=mongodb://...
REDIS_URL=redis://...

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# AI APIs
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# WhatsApp
WHATSAPP_SESSION_NAME=gestora-bot
WHATSAPP_BUSINESS_NAME=Gestora Internacional SRL

# Files
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
```

## 🚀 Scripts

```bash
npm run dev          # Desarrollo con hot reload
npm run build        # Compilar TypeScript
npm run start        # Producción (requiere build)
npm run start:prod   # Producción optimizada

npm run db:generate  # Generar cliente Prisma
npm run db:migrate   # Ejecutar migraciones
npm run db:push      # Push directo a DB (dev)
npm run db:studio    # Abrir Prisma Studio

npm run lint         # Linter
npm run format       # Formatear código
npm run test         # Tests
```

## 📚 Servicios Principales

### 1. ContabilidadService
```typescript
// Gestión de NCF, gastos, ingresos
const contabilidad = ContabilidadService.getInstance();

// Crear gasto con NCF automático
await contabilidad.crearGasto({
  condominioId,
  tipoNCF: 'B01',
  concepto: 'Mantenimiento piscina',
  subtotal: 10000,
  distribuirUnidades: true // Distribuye automáticamente
});

// Obtener balance
const balance = await contabilidad.obtenerBalanceSaldos(
  condominioId,
  fechaDesde,
  fechaHasta
);
```

### 2. FacturaIAService
```typescript
// Procesamiento de facturas con IA
const facturaIA = FacturaIAService.getInstance();

// Procesar factura escaneada
const resultado = await facturaIA.procesarFactura(
  gastoId,
  '/uploads/factura.jpg'
);

// Datos extraídos automáticamente:
// - Número de factura
// - NCF
// - Proveedor (nombre, RNC)
// - Items y precios
// - Subtotal, ITBIS, total
```

### 3. NominaService
```typescript
// Cálculo de nómina dominicana
const nomina = NominaService.getInstance();

// Procesar nómina del mes
await nomina.procesarNominaCondominio(
  condominioId,
  '2024-12'
);

// Cálculos automáticos:
// - AFP: 2.87%
// - ARS: 3.04%
// - ISR: Según escala progresiva
```

### 4. PrediccionIAService
```typescript
// Predicciones con ML
const prediccionIA = PrediccionIAService.getInstance();

// Predecir gastos mensuales
const prediccion = await prediccionIA.predecirGastosMensuales(
  condominioId,
  3 // próximos 3 meses
);

// Analizar tendencias
const analisis = await prediccionIA.analizarTendencias(condominioId);
console.log(analisis.gastosProyectados);
console.log(analisis.alertas);
console.log(analisis.recomendaciones);
```

### 5. EstadosCuentaService
```typescript
// Estados de cuenta por unidad
const estadosCuenta = EstadosCuentaService.getInstance();

// Procesar distribución mensual
await estadosCuenta.procesarDistribucionGastos(
  condominioId,
  '2024-12'
);

// Obtener morosos
const morosos = await estadosCuenta.obtenerUnidadesMorosas(
  condominioId
);
```

## 🏗️ Arquitectura

```
backend/
├── src/
│   ├── services/          # Lógica de negocio (11 servicios)
│   │   ├── ai/           # IA y predicciones
│   │   ├── areas/        # Áreas comunes
│   │   ├── calendario/   # Eventos
│   │   ├── contabilidad/ # NCF, gastos, estados de cuenta
│   │   ├── documentos/   # Repositorio
│   │   ├── proveedores/  # Gestión de proveedores
│   │   ├── rrhh/         # Nómina
│   │   ├── seguridad/    # Visitas
│   │   └── unidades/     # Unidades y dependientes
│   ├── controllers/      # Controladores HTTP
│   ├── routes/           # Rutas API
│   ├── middleware/       # Middlewares
│   ├── utils/            # Utilidades
│   └── index.ts          # Entry point
├── prisma/
│   └── schema.prisma     # Schema de BD (2,083 líneas)
├── uploads/              # Archivos subidos
└── package.json
```

## 📊 Modelos de Datos Principales

- **Organizacion**: Multi-tenant principal
- **Condominio**: Edificios/conjuntos
- **Unidad**: Apartamentos/casas (con alícuota)
- **Usuario**: Propietarios, técnicos, administradores
- **Proveedor**: Catálogo de proveedores
- **Gasto**: Gastos con NCF
- **Ingreso**: Ingresos y pagos
- **EstadoCuenta**: Estados por unidad
- **Nomina**: Nómina de personal
- **AreaComun**: Áreas reservables
- **Visita**: Control de portería
- **FacturaIAProcesada**: Facturas procesadas con IA
- **PrediccionIA**: Predicciones ML

## 🔐 Seguridad

- JWT para autenticación
- Bcrypt para passwords
- Helmet.js para headers HTTP
- Rate limiting
- CORS configurado
- Validación con Zod
- Sanitización de inputs

## 📈 Rendimiento

- Cache Redis para consultas frecuentes
- Índices optimizados en PostgreSQL
- Lazy loading de relaciones
- Paginación en listados
- Compresión de respuestas
- CDN para archivos estáticos

## 🚢 Despliegue

### Railway (Recomendado)
```bash
# 1. Crear cuenta en Railway
# 2. Conectar repositorio
# 3. Configurar variables de entorno
# 4. Deploy automático
```

### Docker
```bash
docker-compose up -d
```

### Manual
```bash
npm run build
npm run start:prod
```

## 📝 Licencia

UNLICENSED - Uso privado de Gestora Internacional SRL

## 👨‍💻 Autor

Gestora Internacional SRL
República Dominicana

---

**Nota**: Este sistema cumple con las regulaciones fiscales dominicanas (DGII) incluyendo:
- Generación de NCF según normativa
- Cálculo correcto de ITBIS (18%)
- Retenciones de AFP, ARS e ISR conforme a ley
- Formato de reportes fiscales requeridos
