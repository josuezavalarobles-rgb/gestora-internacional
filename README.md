# 🏢 AMICO MANAGEMENT - Sistema de Gestión de Condominios

Sistema integral de digitalización para administración de condominios con enfoque en reclamaciones técnicas vía WhatsApp + IA.

## 🚀 Características Principales

### Módulo de Reclamaciones Técnicas (MVP)
- ✅ Bot conversacional inteligente vía WhatsApp
- ✅ Clasificación automática de casos (Garantía vs Condominio)
- ✅ Asignación inteligente de técnicos
- ✅ Seguimiento en tiempo real con notificaciones
- ✅ Panel de administración web completo
- ✅ Timeline visual de cada caso
- ✅ Manejo de multimedia (fotos/videos)
- ✅ Sistema de métricas y KPIs

## 📁 Estructura del Proyecto

```
amico/
├── backend/                    # Servidor Node.js + Express
│   ├── src/
│   │   ├── config/            # Configuraciones
│   │   ├── controllers/       # Controladores
│   │   ├── models/            # Modelos de BD
│   │   ├── services/          # Lógica de negocio
│   │   ├── middleware/        # Middlewares
│   │   ├── routes/            # Rutas API
│   │   ├── utils/             # Utilidades
│   │   ├── whatsapp/          # Integración WhatsApp
│   │   ├── ai/                # Motor IA
│   │   └── sockets/           # WebSockets
│   ├── uploads/               # Archivos multimedia
│   └── logs/                  # Logs del sistema
│
├── frontend/                   # Panel Admin React
│   ├── src/
│   │   ├── components/        # Componentes React
│   │   ├── pages/             # Páginas
│   │   ├── hooks/             # Custom hooks
│   │   ├── services/          # API calls
│   │   ├── store/             # Estado global
│   │   ├── utils/             # Utilidades
│   │   └── types/             # TypeScript types
│   └── public/
│
├── database/                   # Scripts de BD
│   ├── postgres/              # Schema PostgreSQL
│   ├── mongodb/               # Schema MongoDB
│   └── seeds/                 # Datos de prueba
│
├── shared/                     # Código compartido
│   └── types/                 # Types TypeScript
│
└── docs/                       # Documentación
```

## 🛠️ Stack Tecnológico

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express + TypeScript
- **Base de datos**: PostgreSQL 15+ (casos, usuarios)
- **Logs/Chat**: MongoDB 7+ (mensajes, logs)
- **Cache/Colas**: Redis + Bull
- **ORM**: Prisma (PostgreSQL) + Mongoose (MongoDB)
- **Validación**: Zod
- **Auth**: JWT + bcrypt

### WhatsApp Integration
- **Librería**: Baileys (WhatsApp Web API)
- **QR Auth**: Sistema de autenticación por QR

### IA Conversacional
- **Modelo**: OpenAI GPT-4-turbo
- **Orquestación**: Langchain
- **Vector Store**: Memoria de conversaciones

### Frontend
- **Framework**: React 18 + TypeScript
- **Build**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui + Radix UI
- **Estado**: Zustand + React Query
- **WebSockets**: Socket.io Client
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts

## 🔧 Instalación

### Prerrequisitos
- Node.js 20+
- PostgreSQL 15+
- MongoDB 7+
- Redis 7+
- npm/yarn/pnpm

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Configurar variables de entorno
npm run db:migrate
npm run dev
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## 📚 Variables de Entorno

### Backend (.env)
```env
# Server
PORT=3000
NODE_ENV=development

# PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/amico_db

# MongoDB
MONGODB_URI=mongodb://localhost:27017/amico_logs

# Redis
REDIS_URL=redis://localhost:6379

# OpenAI
OPENAI_API_KEY=sk-...

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# WhatsApp
WHATSAPP_SESSION_NAME=amico-bot

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=http://localhost:3000
```

## 🚀 Comandos

### Backend
```bash
npm run dev           # Desarrollo
npm run build         # Build producción
npm run start         # Iniciar producción
npm run db:migrate    # Migrar BD
npm run db:seed       # Datos de prueba
npm run test          # Tests
```

### Frontend
```bash
npm run dev           # Desarrollo
npm run build         # Build producción
npm run preview       # Preview build
npm run lint          # Linter
```

## 📖 API Documentation

La documentación de la API estará disponible en:
- Desarrollo: http://localhost:3000/api-docs
- Producción: https://amico.tudominio.com/api-docs

## 🔐 Seguridad

- Autenticación JWT
- Validación de inputs (Zod)
- Rate limiting
- CORS configurado
- Sanitización de datos
- Encriptación de passwords (bcrypt)

## 📊 Módulos del Sistema

### 1. Gestión de Usuarios
- Registro y validación
- Roles y permisos
- Múltiples condominios

### 2. Reclamaciones Técnicas
- Bot conversacional IA
- Clasificación automática
- Asignación de técnicos
- Timeline de eventos
- Multimedia

### 3. Panel de Administración
- Dashboard con KPIs
- Gestión de casos
- Asignación manual/automática
- Chat en tiempo real
- Reportes

### 4. Notificaciones
- WhatsApp automáticas
- Recordatorios programados
- Alertas de escalamiento
- Notificaciones en tiempo real

## 🎯 Roadmap

### Fase 1 - MVP (12 semanas) ✅
- [x] Módulo de reclamaciones técnicas
- [x] Bot WhatsApp + IA
- [x] Panel de administración
- [x] Sistema de notificaciones

### Fase 2 - Expansión (8 semanas)
- [ ] Módulo de estado de cuenta
- [ ] Reserva de amenidades
- [ ] Votaciones electrónicas
- [ ] App móvil

### Fase 3 - Avanzado (12 semanas)
- [ ] Portal del propietario
- [ ] Integración contable
- [ ] Reportes financieros
- [ ] BI y Analytics

## 👥 Equipo

- **Product Owner**: [Nombre]
- **Tech Lead**: [Nombre]
- **Backend Dev**: [Nombre]
- **Frontend Dev**: [Nombre]
- **QA**: [Nombre]

## 📄 Licencia

Propietary - Amico Management © 2024

## 📞 Contacto

- Email: soporte@amicomanagement.com
- WhatsApp: +1 809-XXX-XXXX
- Web: https://amicomanagement.com
