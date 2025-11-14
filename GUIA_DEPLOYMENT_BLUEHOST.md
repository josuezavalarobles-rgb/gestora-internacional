# 🚀 GUÍA COMPLETA: DEPLOYMENT AMICO MANAGEMENT EN BLUEHOST

## 📋 ÍNDICE
1. [Preparación Local](#preparación-local)
2. [Estructura de Carpetas en Bluehost](#estructura-bluehost)
3. [Configuración de Base de Datos](#base-de-datos)
4. [Subida de Archivos por FileZilla](#filezilla)
5. [Configuración de Variables de Entorno](#variables)
6. [Inicialización del Sistema](#inicialización)
7. [Verificación y Pruebas](#verificación)

---

## 📦 1. PREPARACIÓN LOCAL

### A. Compilar el Backend

```bash
cd c:\Users\josue\mis-sitios-bluehost\public_html\amico\backend

# Instalar dependencias (si no están instaladas)
npm install

# Compilar TypeScript a JavaScript
npm run build
```

Esto creará la carpeta `dist/` con todo el código compilado.

### B. Compilar el Frontend

```bash
cd c:\Users\josue\mis-sitios-bluehost\public_html\amico\frontend

# Instalar dependencias (si no están instaladas)
npm install

# Compilar para producción
npm run build
```

Esto creará la carpeta `dist/` con los archivos estáticos optimizados.

### C. Verificar Archivos Compilados

Deberías tener:
- ✅ `backend/dist/` - Código JavaScript compilado
- ✅ `backend/node_modules/` - Dependencias
- ✅ `backend/package.json` - Configuración de dependencias
- ✅ `backend/.env` - Variables de entorno (editarás esto)
- ✅ `backend/prisma/` - Esquema de base de datos
- ✅ `frontend/dist/` - HTML, CSS, JS optimizado

---

## 🗂️ 2. ESTRUCTURA DE CARPETAS EN BLUEHOST

En Bluehost, debes organizar los archivos así:

```
/home/tu-usuario/
├── public_html/                    ← Carpeta raíz de tu dominio
│   └── amico/                      ← Frontend (archivos estáticos)
│       ├── index.html
│       ├── assets/
│       └── (todos los archivos de frontend/dist/)
│
└── amico-backend/                  ← Backend (fuera de public_html por seguridad)
    ├── dist/                       ← Código compilado
    ├── node_modules/               ← Dependencias
    ├── prisma/                     ← Esquema de base de datos
    ├── uploads/                    ← Archivos subidos
    ├── exports/                    ← Reportes Excel
    ├── logs/                       ← Logs del sistema
    ├── auth_info_baileys/          ← Sesión de WhatsApp
    ├── package.json
    ├── package-lock.json
    ├── .env                        ← Variables de entorno
    └── (otros archivos necesarios)
```

**IMPORTANTE:**
- ✅ **Frontend** → `public_html/amico/` (accesible por navegador)
- ✅ **Backend** → `/home/tu-usuario/amico-backend/` (NO accesible por navegador)

---

## 💾 3. CONFIGURACIÓN DE BASE DE DATOS

### A. Crear Base de Datos PostgreSQL en Bluehost

1. **Accede a cPanel de Bluehost**
2. Busca **"PostgreSQL Databases"**
3. Crea una nueva base de datos:
   - **Nombre:** `amico_db`
   - **Usuario:** `amico_user`
   - **Contraseña:** (genera una segura y guárdala)
4. Asigna el usuario a la base de datos con **TODOS LOS PRIVILEGIOS**
5. **Anota estos datos:**
   ```
   Host: localhost
   Puerto: 5432
   Base de datos: amico_db
   Usuario: amico_user
   Contraseña: [tu-contraseña-segura]
   ```

### B. Crear Base de Datos MongoDB (si Bluehost lo soporta)

Si Bluehost no tiene MongoDB, tienes 2 opciones:

**Opción 1: MongoDB Atlas (Recomendado - GRATIS)**
1. Ve a https://www.mongodb.com/cloud/atlas
2. Crea cuenta gratuita
3. Crea cluster gratuito
4. Obtén la URL de conexión:
   ```
   mongodb+srv://usuario:password@cluster.mongodb.net/amico_logs
   ```

**Opción 2: Sin MongoDB (Usar solo PostgreSQL)**
- Modifica el código para usar solo PostgreSQL (no recomendado)

---

## 📤 4. SUBIDA DE ARCHIVOS POR FILEZILLA

### A. Conectar FileZilla a Bluehost

1. **Abre FileZilla**
2. **Configuración de conexión:**
   - **Host:** `ftp.tudominio.com` o la IP de Bluehost
   - **Usuario:** Tu usuario cPanel
   - **Contraseña:** Tu contraseña cPanel
   - **Puerto:** 21 (o 22 si usas SFTP)
   - **Protocolo:** FTP o SFTP

3. **Conecta**

### B. Subir Frontend

**En FileZilla:**

1. **Panel Local (izquierda):**
   - Navega a: `c:\Users\josue\mis-sitios-bluehost\public_html\amico\frontend\dist\`

2. **Panel Remoto (derecha):**
   - Navega a: `/public_html/amico/`

3. **Selecciona TODOS los archivos dentro de `dist/`:**
   - `index.html`
   - carpeta `assets/`
   - todos los demás archivos

4. **Arrastra o click derecho → "Upload"**

5. **Espera a que termine la subida**

**Resultado:** Tu frontend estará en `https://tudominio.com/amico/`

### C. Subir Backend

**IMPORTANTE: El backend va FUERA de public_html**

1. **Panel Local (izquierda):**
   - Navega a: `c:\Users\josue\mis-sitios-bluehost\public_html\amico\backend\`

2. **Panel Remoto (derecha):**
   - Navega a: `/home/tu-usuario/` (RAÍZ, NO public_html)
   - Crea carpeta: `amico-backend/`
   - Entra a: `/home/tu-usuario/amico-backend/`

3. **Sube estas carpetas/archivos:**

   **✅ IMPRESCINDIBLES:**
   ```
   ✓ dist/                  (código compilado)
   ✓ node_modules/          (dependencias - puede tardar mucho)
   ✓ prisma/                (esquema de base de datos)
   ✓ package.json
   ✓ package-lock.json
   ✓ .env                   (editarás este archivo después)
   ```

   **✅ NECESARIOS (crea las carpetas vacías):**
   ```
   ✓ uploads/               (para archivos subidos)
   ✓ exports/               (para reportes Excel)
   ✓ logs/                  (para logs del sistema)
   ✓ auth_info_baileys/     (para sesión WhatsApp)
   ```

   **❌ NO NECESARIOS (no subir):**
   ```
   ✗ src/                   (código fuente TypeScript)
   ✗ node_modules/          (mejor reinstalar en servidor)
   ✗ .git/
   ✗ archivos .md (documentación)
   ```

4. **Espera a que termine (puede tardar 30-60 minutos por node_modules)**

**💡 TIP: Reinstalar node_modules en el servidor es más rápido**

En lugar de subir `node_modules/`, conéctate por SSH y ejecuta:
```bash
cd ~/amico-backend
npm install --production
```

---

## ⚙️ 5. CONFIGURACIÓN DE VARIABLES DE ENTORNO

### A. Editar .env en el Servidor

**Opción 1: Via FileZilla**
1. Navega a `/home/tu-usuario/amico-backend/`
2. Click derecho en `.env` → "View/Edit"
3. Edita con las configuraciones de producción

**Opción 2: Via cPanel File Manager**
1. Accede a cPanel
2. Ve a "File Manager"
3. Navega a `amico-backend/`
4. Edita `.env`

### B. Configuración de Producción (.env)

```bash
# ==============================================
# AMICO MANAGEMENT - PRODUCCIÓN BLUEHOST
# ==============================================

# Server Configuration
PORT=3000
NODE_ENV=production
API_VERSION=v1

# Database - PostgreSQL (DATOS DE BLUEHOST)
DATABASE_URL=postgresql://amico_user:TU_PASSWORD_AQUI@localhost:5432/amico_db?schema=public

# Database - MongoDB (MONGODB ATLAS)
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/amico_logs?retryWrites=true&w=majority
MONGODB_DB_NAME=amico_logs

# Redis (si Bluehost tiene Redis, sino comentar)
# REDIS_URL=redis://localhost:6379
# REDIS_PASSWORD=
# REDIS_DB=0

# JWT Authentication (GENERA SECRETOS SEGUROS)
JWT_SECRET=tu-secreto-super-seguro-produccion-cambiar-123456
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=tu-refresh-secret-produccion-cambiar-789
JWT_REFRESH_EXPIRES_IN=30d

# OpenAI API (TU API KEY REAL)
OPENAI_API_KEY=sk-tu-api-key-real-de-openai-aqui
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_MAX_TOKENS=1000
OPENAI_TEMPERATURE=0.7

# WhatsApp Configuration
WHATSAPP_SESSION_NAME=amico-bot-production
WHATSAPP_PHONE_NUMBER=+18091234567
WHATSAPP_BUSINESS_NAME=Amico Management
WHATSAPP_AUTO_READ=true
WHATSAPP_AUTO_MARK_READ=true
WHATSAPP_GROUP_JID=120363123456789@g.us

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/jpg,video/mp4,video/quicktime,application/pdf
MAX_FILES_PER_CASE=10

# CORS (CAMBIA A TU DOMINIO REAL)
CORS_ORIGIN=https://tudominio.com
CORS_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Bot Configuration
BOT_ENABLED=true
BOT_RESPONSE_DELAY=1000
BOT_MAX_CONTEXT_MESSAGES=10
BOT_ESCALATE_KEYWORDS=urgente,emergencia,supervisor,humano

# Notifications
NOTIFICATIONS_ENABLED=true
NOTIFICATION_BATCH_SIZE=50
NOTIFICATION_RETRY_ATTEMPTS=3

# SLA Times (en horas)
SLA_GARANTIA_HORAS=24
SLA_CONDOMINIO_HORAS=72
SLA_URGENTE_HORAS=4

# Timezone
TZ=America/Santo_Domingo

# Email (SMTP de Bluehost o Gmail)
SMTP_HOST=mail.tudominio.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@tudominio.com
SMTP_PASSWORD=tu-password-email
EMAIL_FROM=noreply@tudominio.com

# Feature Flags
FEATURE_AI_CLASSIFICATION=true
FEATURE_AUTO_ASSIGNMENT=true
FEATURE_IMAGE_ANALYSIS=true
FEATURE_VOICE_MESSAGES=true
```

**⚠️ IMPORTANTE:**
- Cambia TODOS los valores de ejemplo por los reales
- Genera JWT_SECRET seguros (usa: https://randomkeygen.com/)
- Usa tu API key real de OpenAI
- Configura tu dominio en CORS_ORIGIN

---

## 🔧 6. INICIALIZACIÓN DEL SISTEMA

### A. Conectar por SSH a Bluehost

1. **Habilita SSH en cPanel:**
   - cPanel → "SSH Access" → "Manage SSH Keys"
   - Genera o importa tu clave SSH

2. **Conecta desde tu computadora:**
   ```bash
   ssh tu-usuario@tudominio.com
   ```

### B. Instalar Dependencias (si no las subiste)

```bash
cd ~/amico-backend

# Instalar solo dependencias de producción
npm install --production
```

### C. Ejecutar Migraciones de Prisma

```bash
cd ~/amico-backend

# Generar cliente de Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate deploy

# (Opcional) Poblar base de datos con datos iniciales
node seed-railway.js
```

### D. Iniciar el Backend

**Opción 1: Con PM2 (Recomendado - mantiene el proceso corriendo)**

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar aplicación
cd ~/amico-backend
pm2 start dist/index.js --name amico-backend

# Guardar proceso para que inicie automáticamente
pm2 save
pm2 startup

# Ver logs
pm2 logs amico-backend

# Ver estado
pm2 status
```

**Opción 2: Con Node directamente (se detiene al cerrar SSH)**

```bash
cd ~/amico-backend
node dist/index.js
```

**Opción 3: Con screen (alternativa a PM2)**

```bash
# Instalar screen si no está
# (pide al soporte de Bluehost si no tienes permisos)

# Crear sesión
screen -S amico

# Iniciar backend
cd ~/amico-backend
node dist/index.js

# Desconectar sesión (Ctrl+A, luego D)
# Reconectar: screen -r amico
```

---

## ✅ 7. VERIFICACIÓN Y PRUEBAS

### A. Verificar que el Backend está corriendo

1. **Via SSH:**
   ```bash
   pm2 status
   # Debe mostrar "amico-backend" en estado "online"

   pm2 logs amico-backend --lines 50
   # Debe mostrar logs sin errores
   ```

2. **Via navegador:**
   ```
   https://tudominio.com:3000/health
   ```

   Debería responder:
   ```json
   {
     "status": "ok",
     "timestamp": "2024-11-12T...",
     "uptime": 123.45,
     "environment": "production"
   }
   ```

### B. Verificar Frontend

```
https://tudominio.com/amico/
```

Debería cargar la interfaz de Amico Management.

### C. Probar Login

1. Accede al frontend
2. Usa las credenciales de prueba o crea un usuario admin

### D. Verificar Base de Datos

```bash
cd ~/amico-backend

# Ver tablas creadas
npx prisma studio
# Abre interfaz web para ver/editar datos
```

### E. Conectar WhatsApp

1. **Obtén el código QR:**
   ```bash
   cd ~/amico-backend
   node wa-qr.js
   ```

2. **Escanea el QR con WhatsApp Business**

3. **Verifica conexión:**
   - Envía mensaje de prueba al número
   - Revisa logs: `pm2 logs amico-backend`

---

## 🔒 CONFIGURACIÓN DE NGINX/APACHE (Proxy Reverso)

Para que el backend en puerto 3000 sea accesible via `https://tudominio.com/api`:

### Apache (.htaccess en public_html)

Crea archivo `public_html/.htaccess`:

```apache
# Proxy para API Backend
<IfModule mod_proxy.c>
  ProxyPreserveHost On
  ProxyPass /api http://localhost:3000/api
  ProxyPassReverse /api http://localhost:3000/api
</IfModule>

# CORS Headers
Header set Access-Control-Allow-Origin "https://tudominio.com"
Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header set Access-Control-Allow-Headers "Content-Type, Authorization"
```

**IMPORTANTE:** Si Bluehost no permite mod_proxy, contacta soporte técnico.

---

## 📊 MONITOREO Y MANTENIMIENTO

### Comandos Útiles PM2

```bash
# Ver estado
pm2 status

# Ver logs en tiempo real
pm2 logs amico-backend

# Reiniciar aplicación
pm2 restart amico-backend

# Detener aplicación
pm2 stop amico-backend

# Ver uso de recursos
pm2 monit

# Ver logs antiguos
pm2 logs amico-backend --lines 1000

# Limpiar logs
pm2 flush
```

### Backup de Base de Datos

```bash
# PostgreSQL
pg_dump -U amico_user amico_db > backup-$(date +%Y%m%d).sql

# Restaurar
psql -U amico_user amico_db < backup-20241112.sql
```

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### Backend no inicia

1. **Verifica logs:**
   ```bash
   pm2 logs amico-backend --lines 100
   ```

2. **Verifica .env:**
   - DATABASE_URL correcto
   - MONGODB_URI correcto
   - No hay espacios extras

3. **Verifica permisos:**
   ```bash
   chmod -R 755 ~/amico-backend
   ```

### Base de datos no conecta

1. **PostgreSQL:**
   ```bash
   psql -U amico_user -d amico_db -h localhost
   # Debería conectar sin error
   ```

2. **MongoDB Atlas:**
   - Verifica IP whitelist en Atlas
   - Agrega IP de Bluehost a la whitelist

### Frontend muestra error de API

1. **Verifica URL del API en frontend:**
   - Edita `frontend/.env` (antes de compilar)
   ```bash
   VITE_API_URL=https://tudominio.com/api/v1
   ```

2. **Recompila frontend:**
   ```bash
   cd frontend
   npm run build
   # Sube nuevamente los archivos de dist/
   ```

---

## 📝 CHECKLIST FINAL

Antes de considerar el deployment completo:

- [ ] ✅ Backend compilado (`npm run build`)
- [ ] ✅ Frontend compilado (`npm run build`)
- [ ] ✅ PostgreSQL creada y configurada
- [ ] ✅ MongoDB Atlas configurado (o alternativa)
- [ ] ✅ Archivos subidos por FileZilla
- [ ] ✅ `.env` configurado con valores de producción
- [ ] ✅ `npm install` ejecutado en servidor
- [ ] ✅ Migraciones de Prisma ejecutadas
- [ ] ✅ Backend iniciado con PM2
- [ ] ✅ `/health` endpoint responde
- [ ] ✅ Frontend carga correctamente
- [ ] ✅ Login funciona
- [ ] ✅ WhatsApp conectado
- [ ] ✅ Proxy reverso configurado
- [ ] ✅ HTTPS configurado (SSL)
- [ ] ✅ Backup inicial creado

---

## 🎉 ¡SISTEMA EN PRODUCCIÓN!

Una vez completados todos los pasos, tu sistema Amico Management estará 100% funcional en Bluehost.

**URLs de Acceso:**
- Frontend: `https://tudominio.com/amico/`
- API: `https://tudominio.com/api/v1/`
- Health: `https://tudominio.com/api/v1/health`

**Soporte:**
- Documentación completa en la carpeta del proyecto
- Dashboard administrativo: `https://tudominio.com/amico/dashboard`

---

**Última actualización:** 12 de noviembre, 2024
**Versión del sistema:** Amico Management v1.0
