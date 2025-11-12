# 🏢 Amico Management - Sistema Completo de Gestión de Condominios

## 📋 Descripción

Amico Management es un sistema integral de gestión de condominios que integra:

- 🤖 **Bot de WhatsApp con IA** - Atención 24/7 a propietarios
- 👤 **Reconocimiento automático** - Identifica propietarios por teléfono
- 📸 **Procesamiento multimedia** - Imágenes, videos, audios (Whisper + GPT-4 Vision)
- 📅 **Asignación automática de ingenieros** - Calendario inteligente con bloques de 1h30min
- 📧 **Notificaciones por email** - HTML profesional con evidencias adjuntas
- 📱 **Notificaciones grupales WhatsApp** - Mantiene a todo el equipo informado
- 🎯 **Panel web administrativo** - Gestión completa de casos, propietarios, ingenieros

---

## 🚀 Características Principales

### ✅ 1. Base de Datos e Identificación de Propietarios

- Carga manual o masiva (CSV/Excel) de propietarios
- Campos: nombre, unidad, teléfono, condominio
- Reconocimiento automático por número de WhatsApp
- No solicita datos ya conocidos

### ✅ 2. Interacción con IA (OpenAI GPT-4)

- Conversaciones naturales en español
- Recibe y procesa: texto, imágenes, videos, audios
- Transcripción de audios con Whisper
- Análisis de imágenes con GPT-4 Vision
- Preguntas calificatorias para identificar problemas
- Generación automática de casos estructurados

### ✅ 3. Asignación Automática de Ingeniería

- **Sin consultar disponibilidad** - calendario único predefinido
- **Bloques de 1h30min** entre 9:00 AM - 6:00 PM
- **Round-robin inteligente** - distribuye carga equitativamente
- **Prioridades**: urgente (hoy), alta (3 días), media (7 días), baja (14 días)
- **Email automático** al ingeniero con detalles y evidencias
- **Notificación grupal** a WhatsApp de administradores e ingenieros
- **Registro en calendario** del sistema

### ✅ 4. Panel Web (React + TypeScript)

- Dashboard con métricas en tiempo real
- Gestión de propietarios con importación masiva
- Gestión de casos con timeline de eventos
- Calendario visual de citas
- Gestión de ingenieros y condominios
- Reportes y estadísticas

---

## 🛠️ Stack Tecnológico

### Backend
- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **Lenguaje:** TypeScript
- **ORM:** Prisma (PostgreSQL)
- **Base de Datos Principal:** PostgreSQL
- **Base de Datos Logs:** MongoDB
- **Cache:** Redis
- **IA:** OpenAI (GPT-4, GPT-4 Vision, Whisper)
- **WhatsApp:** Baileys (WhatsApp Web API)
- **Email:** Nodemailer
- **Autenticación:** JWT

### Frontend
- **Framework:** React 18
- **Lenguaje:** TypeScript
- **Build Tool:** Vite
- **Estilos:** Tailwind CSS
- **Routing:** React Router v6
- **Gestión de Estado:** React Context
- **HTTP Client:** Axios
- **Iconos:** Lucide React

---

## 📦 Instalación

### Requisitos Previos

```bash
# Node.js 20+
node --version  # v20.x.x

# PostgreSQL 14+
psql --version  # PostgreSQL 14.x

# MongoDB 6+
mongod --version  # MongoDB 6.x

# Redis 7+
redis-cli --version  # Redis 7.x
```

### 1. Clonar el Repositorio

```bash
git clone <repository-url>
cd amico
```

### 2. Configurar Backend

```bash
cd backend

# Instalar dependencias
npm install

# Copiar ejemplo de variables de entorno
cp .env.example .env

# Editar .env con tus credenciales
nano .env
```

#### Variables Críticas a Configurar

```bash
# PostgreSQL
DATABASE_URL=postgresql://usuario:password@localhost:5432/amico_db

# MongoDB
MONGODB_URI=mongodb://localhost:27017/amico_logs

# OpenAI (REQUERIDO para IA)
OPENAI_API_KEY=sk-tu-api-key-aqui

# Email (REQUERIDO para notificaciones a ingenieros)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASSWORD=tu-app-password
EMAIL_FROM=noreply@amicomanagement.com

# WhatsApp (REQUERIDO para bot)
WHATSAPP_PHONE_NUMBER=+18095551234
WHATSAPP_GROUP_JID=120363123456789@g.us  # ← Obtener después de conectar
```

### 3. Configurar Base de Datos

```bash
# Generar cliente Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate deploy

# (Opcional) Seed con datos de prueba
npm run seed
```

### 4. Iniciar Backend

```bash
# Desarrollo
npm run dev

# Producción
npm run build
npm start
```

### 5. Configurar Frontend

```bash
cd ../frontend

# Instalar dependencias
npm install

# Copiar ejemplo de variables de entorno
cp .env.example .env

# Editar .env
nano .env
```

```bash
# .env
VITE_API_URL=http://localhost:3000/api/v1
```

### 6. Iniciar Frontend

```bash
# Desarrollo
npm run dev

# Producción
npm run build
npm run preview
```

---

## 🔧 Configuración de WhatsApp

### 1. Conectar WhatsApp

```bash
cd backend
npm run dev
```

El sistema mostrará un **código QR** en la terminal.

### 2. Escanear Código QR

1. Abrir **WhatsApp Business** en tu teléfono
2. Ir a **Configuración → Dispositivos vinculados**
3. Escanear el código QR mostrado en la terminal
4. Esperar mensaje: `✅ WhatsApp conectado exitosamente`

### 3. Crear Grupo de Administradores e Ingenieros

1. Crear un grupo en WhatsApp: **"Amico - Notificaciones"**
2. Agregar al bot al grupo
3. Agregar administradores e ingenieros

### 4. Obtener Group JID

**Opción A: Usar el endpoint del backend**

```bash
# Hacer una petición GET a:
GET http://localhost:3000/api/v1/whatsapp/grupos

# Respuesta:
[
  {
    "jid": "120363123456789@g.us",
    "nombre": "Amico - Notificaciones",
    "participantes": 5
  }
]
```

**Opción B: Verificar logs del backend**

```bash
# Buscar en los logs:
[WhatsApp] Grupo encontrado: Amico - Notificaciones
[WhatsApp] JID: 120363123456789@g.us
```

### 5. Actualizar .env

```bash
WHATSAPP_GROUP_JID=120363123456789@g.us
```

### 6. Reiniciar Backend

```bash
# Ctrl+C para detener
npm run dev
```

---

## 👥 Configuración Inicial

### 1. Crear Usuario Administrador

```bash
# Opción A: Usando seed
npm run seed

# Opción B: Usando endpoint
POST http://localhost:3000/api/v1/auth/register
{
  "nombreCompleto": "Admin Principal",
  "email": "admin@amicomanagement.com",
  "password": "Admin123!",
  "telefono": "+18095551234",
  "tipoUsuario": "admin"
}
```

### 2. Crear Condominio

```bash
POST http://localhost:3000/api/v1/condominios
{
  "nombre": "Condominio Las Palmas",
  "direccion": "Av. Winston Churchill #45",
  "ciudad": "Santo Domingo",
  "pais": "República Dominicana",
  "totalUnidades": 120,
  "slaGarantia": 24,
  "slaCondominio": 72
}
```

### 3. Crear Ingenieros

```bash
POST http://localhost:3000/api/v1/usuarios
{
  "nombreCompleto": "Carlos Martínez",
  "email": "carlos@example.com",
  "telefono": "+18095559876",
  "tipoUsuario": "tecnico",
  "estado": "activo"
}
```

Repetir para cada ingeniero.

### 4. Cargar Propietarios

**Opción A: Manual desde el panel web**

1. Ir a [http://localhost:5173/propietarios](http://localhost:5173/propietarios)
2. Hacer clic en **"+ Agregar Propietario"**
3. Llenar formulario y guardar

**Opción B: Importación masiva (CSV/Excel)**

1. Descargar plantilla desde el panel web
2. Llenar Excel con datos:
   - Nombre Completo
   - Unidad
   - Teléfono (formato: +18095551234)
   - Condominio
3. Subir archivo en el panel web

Ejemplo CSV:

```csv
nombre,unidad,telefono,condominio
Juan Pérez,301,+18095551234,Condominio Las Palmas
María López,205,+18095555678,Condominio Las Palmas
```

---

## 🧪 Pruebas

### 1. Probar Reconocimiento de Propietario

```
1. Desde un teléfono registrado, enviar:
   "Hola"

2. Bot debe responder:
   "¡Hola Juan! 👋
   Te identificamos automáticamente:
   🏠 Unidad 301
   🏢 Condominio Las Palmas
   ¿En qué puedo ayudarte hoy?"
```

### 2. Probar Creación de Caso

```
1. Propietario envía:
   "Tengo una filtración en el baño"

2. Bot recopila información:
   - Tipo (garantía/condominio)
   - Descripción completa
   - Evidencias (pide foto)

3. Propietario envía foto de la filtración

4. Bot procesa y crea caso:
   - Asigna fecha y hora automáticamente
   - Asigna ingeniero
   - Envía email al ingeniero
   - Notifica al grupo de WhatsApp
   - Responde al propietario:

   "✅ Caso AMC-2025-0123 creado exitosamente

   📅 Visita programada:
   Fecha: Martes, 14 de enero 2025
   Hora: 10:30 AM - 12:00 PM

   👷 Ingeniero asignado: Carlos Martínez"
```

### 3. Verificar Email

- Revisar inbox del ingeniero
- Debe recibir email con formato HTML
- Debe incluir foto adjunta

### 4. Verificar Grupo WhatsApp

- Verificar que llegó notificación al grupo
- Debe mostrar:
  - Número de caso
  - Unidad
  - Descripción
  - Fecha y hora
  - Ingeniero asignado

---

## 📱 Uso del Sistema

### Para Propietarios (WhatsApp)

```
1. Enviar mensaje al número oficial de WhatsApp
2. Sistema los identifica automáticamente
3. Describir el problema
4. Enviar fotos/videos/audios si es necesario
5. Recibir confirmación con fecha y hora de visita
```

### Para Administradores (Panel Web)

```
1. Ir a http://localhost:5173
2. Login con credenciales de admin
3. Dashboard:
   - Ver casos activos
   - Ver métricas en tiempo real
   - Gestionar propietarios
   - Gestionar ingenieros
   - Ver calendario de citas
4. Casos:
   - Filtrar por estado, prioridad, etc.
   - Ver detalles completos con timeline
   - Reasignar manualmente si es necesario
   - Actualizar estado
   - Agregar notas
```

### Para Ingenieros (Email + WhatsApp)

```
1. Recibir email con detalles del caso
2. Ver notificación en grupo de WhatsApp
3. Revisar evidencias adjuntas
4. Confirmar asistencia (responder email o mensaje)
5. Realizar visita en fecha/hora asignada
6. Actualizar estado del caso desde el panel web (opcional)
```

---

## 📊 Flujo Completo del Sistema

```mermaid
graph TD
    A[Propietario envía mensaje por WhatsApp] --> B{¿Está registrado?}
    B -->|Sí| C[Bot saluda con nombre y unidad]
    B -->|No| D[Bot solicita registro]
    C --> E[Propietario describe problema]
    D --> E
    E --> F[IA recopila información]
    F --> G{¿Envió evidencias?}
    G -->|Sí| H[Procesa con Whisper/Vision]
    G -->|No| I[Continúa con descripción]
    H --> I
    I --> J[Crea caso en base de datos]
    J --> K[Asigna fecha, hora e ingeniero automáticamente]
    K --> L[Envía email al ingeniero]
    K --> M[Notifica al grupo de WhatsApp]
    K --> N[Responde al propietario con confirmación]
    L --> O[Ingeniero revisa email y confirma]
    M --> O
    O --> P[Ingeniero realiza visita]
    P --> Q[Actualiza estado del caso]
    Q --> R[Notifica al propietario por WhatsApp]
```

---

## 🗂️ Estructura de Archivos

```
amico/
├── backend/
│   ├── src/
│   │   ├── config/              # Configuración centralizada
│   │   ├── controllers/         # Controladores REST
│   │   ├── middleware/          # Middlewares (auth, error, etc.)
│   │   ├── models/
│   │   │   ├── mongodb/         # Modelos MongoDB (conversaciones, mensajes)
│   │   │   └── postgres/        # Prisma schema
│   │   ├── routes/              # Rutas API
│   │   ├── services/
│   │   │   ├── ai/              # AIService (GPT-4)
│   │   │   ├── calendario/      # CalendarioAsignacionService
│   │   │   ├── casos/           # CasoService (orquestador)
│   │   │   ├── email/           # EmailNotificationService
│   │   │   ├── multimedia/      # MultimediaService (Whisper + Vision)
│   │   │   ├── usuarios/        # PropietarioIdentificationService
│   │   │   └── whatsapp/        # WhatsAppService + WhatsAppGroupNotificationService
│   │   ├── utils/               # Utilidades (logger, validators, etc.)
│   │   └── app.ts               # Express app
│   ├── prisma/
│   │   ├── schema.prisma        # Esquema de base de datos
│   │   └── migrations/          # Migraciones
│   ├── uploads/                 # Evidencias multimedia
│   ├── .env                     # Variables de entorno (NO COMMITEAR)
│   ├── .env.example             # Ejemplo de variables
│   ├── package.json
│   ├── RECONOCIMIENTO_PROPIETARIOS.md
│   ├── INTELIGENCIA_ARTIFICIAL_MULTIMEDIA.md
│   ├── ASIGNACION_INGENIERIA.md
│   └── README_SISTEMA_COMPLETO.md
│
└── frontend/
    ├── src/
    │   ├── components/          # Componentes reutilizables
    │   ├── pages/               # Páginas (Dashboard, Propietarios, Casos, etc.)
    │   ├── services/            # API clients
    │   ├── contexts/            # React contexts (Auth, Theme)
    │   ├── hooks/               # Custom hooks
    │   ├── utils/               # Utilidades frontend
    │   └── App.tsx              # App principal
    ├── public/
    ├── .env                     # Variables de entorno (NO COMMITEAR)
    ├── .env.example             # Ejemplo de variables
    ├── package.json
    ├── tailwind.config.js
    └── vite.config.ts
```

---

## 📖 Documentación Adicional

- **[RECONOCIMIENTO_PROPIETARIOS.md](./RECONOCIMIENTO_PROPIETARIOS.md)** - Sistema de identificación automática
- **[INTELIGENCIA_ARTIFICIAL_MULTIMEDIA.md](./INTELIGENCIA_ARTIFICIAL_MULTIMEDIA.md)** - IA con Whisper + GPT-4 Vision
- **[ASIGNACION_INGENIERIA.md](./ASIGNACION_INGENIERIA.md)** - Sistema de asignación automática completo

---

## 🔐 Seguridad

### Mejores Prácticas Implementadas

- ✅ **JWT con refresh tokens** para autenticación
- ✅ **Bcrypt** para hash de contraseñas
- ✅ **Rate limiting** para prevenir ataques
- ✅ **CORS configurado** correctamente
- ✅ **Validación de inputs** en todos los endpoints
- ✅ **Sanitización de datos** antes de guardar
- ✅ **Logs detallados** sin exponer información sensible
- ✅ **Variables de entorno** para credenciales

### Variables Sensibles (NUNCA COMMITEAR)

```bash
# .gitignore ya incluye:
.env
.env.local
.env.production
node_modules/
uploads/
auth_info_baileys/  # Sesión de WhatsApp
```

---

## 🐛 Troubleshooting

### Backend no inicia

```bash
# Verificar que servicios estén corriendo
# PostgreSQL
pg_isready

# MongoDB
mongosh --eval "db.adminCommand('ping')"

# Redis
redis-cli ping
```

### WhatsApp no conecta

```bash
# Eliminar sesión anterior
rm -rf auth_info_baileys/

# Reiniciar backend
npm run dev

# Escanear nuevo código QR
```

### Email no se envía

```bash
# Verificar credenciales SMTP
# Si usas Gmail, necesitas "App Password":
# 1. Ir a Google Account → Security
# 2. 2-Step Verification → App Passwords
# 3. Generar password para "Mail"
# 4. Usar ese password en SMTP_PASSWORD
```

### Notificación grupal no llega

```bash
# Verificar que bot esté en el grupo
# Verificar WHATSAPP_GROUP_JID correcto
# El formato debe ser: 120363123456789@g.us
```

### IA no responde

```bash
# Verificar OPENAI_API_KEY válida
# Verificar créditos de OpenAI
# Verificar límites de rate (RPM/TPM)
```

---

## 🚀 Despliegue a Producción

### Checklist Pre-Deployment

- [ ] Variables de entorno configuradas en servidor
- [ ] Base de datos PostgreSQL creada y migrada
- [ ] MongoDB configurado
- [ ] Redis configurado
- [ ] Dominio apuntando al servidor
- [ ] Certificado SSL configurado (HTTPS)
- [ ] WhatsApp conectado en servidor
- [ ] Email SMTP funcionando
- [ ] Grupo de WhatsApp creado y configurado
- [ ] Ingenieros dados de alta en el sistema
- [ ] Propietarios cargados
- [ ] Pruebas completas realizadas

### Servicios Recomendados

```
Backend:
- VPS: DigitalOcean, Linode, AWS EC2
- Serverless: Vercel, Railway, Render

Base de Datos:
- PostgreSQL: Supabase, Neon, Railway
- MongoDB: MongoDB Atlas
- Redis: Upstash, Redis Cloud

Email:
- SMTP: SendGrid, Mailgun, AWS SES, Gmail Business
```

### Ejemplo con PM2

```bash
# Instalar PM2
npm install -g pm2

# Iniciar backend
cd backend
pm2 start npm --name "amico-backend" -- start

# Iniciar frontend (si no usas Nginx)
cd ../frontend
pm2 start npm --name "amico-frontend" -- run preview

# Guardar configuración
pm2 save

# Auto-inicio en reboot
pm2 startup
```

---

## 📈 Monitoreo y Logs

### Logs del Sistema

```bash
# Ver logs en tiempo real
tail -f logs/app.log

# Ver solo errores
tail -f logs/error.log

# Ver logs de PM2
pm2 logs amico-backend
```

### Métricas Importantes

```
- Total de casos creados por día
- Tiempo promedio de asignación
- Distribución de carga entre ingenieros
- Tasa de éxito de emails (%)
- Tasa de éxito de notificaciones WhatsApp (%)
- SLA compliance por prioridad
- Tiempo promedio de resolución
```

---

## 🤝 Soporte

Para soporte técnico o consultas:

- 📧 Email: soporte@amicomanagement.com
- 📱 WhatsApp: +1-809-555-1234
- 🌐 Web: https://amicomanagement.com
- 📚 Docs: https://docs.amicomanagement.com

---

## 📝 Licencia

Propietario de **Amico Management**. Todos los derechos reservados.

---

## 🎯 Versión

**Versión:** 1.0.0
**Fecha:** Enero 2025
**Última Actualización:** 2025-01-11

---

## ✅ Sistema Completo y Funcional

Este sistema cumple con **TODOS** los requisitos del cliente:

✅ Base de datos de propietarios con carga manual y masiva
✅ Reconocimiento automático por teléfono en WhatsApp
✅ IA con procesamiento multimedia (texto, imágenes, videos, audios)
✅ Transcripción de audios con Whisper
✅ Análisis de imágenes con GPT-4 Vision
✅ Asignación automática de ingenieros con calendario de bloques de 1h30min
✅ Envío de email al ingeniero con detalles y evidencias
✅ Notificación al grupo de WhatsApp en tiempo real
✅ Panel web administrativo completo
✅ Sistema escalable y confiable

**El sistema está listo para producción y venta al cliente. 🚀**
