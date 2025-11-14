# Guía Completa: Subir Gestora Internacional a Bluehost

## 📋 Índice
1. [Preparar Archivos Localmente](#1-preparar-archivos-localmente)
2. [Configurar FileZilla](#2-configurar-filezilla)
3. [Estructura de Carpetas en Bluehost](#3-estructura-de-carpetas-en-bluehost)
4. [Subir Archivos](#4-subir-archivos)
5. [Configurar Backend](#5-configurar-backend)
6. [Configurar Frontend](#6-configurar-frontend)
7. [Verificar Funcionamiento](#7-verificar-funcionamiento)

---

## 1. Preparar Archivos Localmente

### A. Backend - Compilar TypeScript

```bash
cd c:\Users\josue\mis-sitios-bluehost\public_html\ges-internacional\backend

# Instalar dependencias (si no están instaladas)
npm install

# Generar cliente de Prisma
npm run db:generate

# Compilar TypeScript a JavaScript
npm run build
```

Esto creará la carpeta `dist/` con el código compilado.

### B. Frontend - Compilar para Producción

```bash
cd c:\Users\josue\mis-sitios-bluehost\public_html\ges-internacional\frontend

# Instalar dependencias (si no están instaladas)
npm install

# Compilar para producción
npm run build
```

Esto creará la carpeta `dist/` con los archivos estáticos.

### C. Verificar Variables de Entorno

**Backend - Crear .env de producción:**

```bash
cd c:\Users\josue\mis-sitios-bluehost\public_html\ges-internacional\backend
```

Crear archivo `.env.production`:

```env
# Server
PORT=3001
NODE_ENV=production
API_VERSION=v1

# Database - PostgreSQL (de Bluehost)
DATABASE_URL=postgresql://usuario:password@localhost:5432/gestora_db

# JWT
JWT_SECRET=tu-secret-key-super-seguro-cambiar-en-produccion-123
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=tu-refresh-secret-super-seguro-456
JWT_REFRESH_EXPIRES_IN=30d

# OpenAI
OPENAI_API_KEY=sk-...

# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
ANTHROPIC_MAX_TOKENS=1024

# WhatsApp
WHATSAPP_SESSION_NAME=gestora-bot-session
WHATSAPP_PHONE_NUMBER=+18095551234
WHATSAPP_BUSINESS_NAME=Gestora Internacional SRL
WHATSAPP_AUTO_READ=true
WHATSAPP_AUTO_MARK_READ=true

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/jpg,video/mp4,video/quicktime,application/pdf
MAX_FILES_PER_CASE=10

# CORS (URL de tu dominio)
CORS_ORIGIN=https://tudominio.com
CORS_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Bot
BOT_ENABLED=true
BOT_RESPONSE_DELAY=1000
BOT_MAX_CONTEXT_MESSAGES=10
BOT_ESCALATE_KEYWORDS=urgente,emergencia,supervisor,humano

# Notifications
NOTIFICATIONS_ENABLED=true
NOTIFICATION_BATCH_SIZE=50
NOTIFICATION_RETRY_ATTEMPTS=3

# SLA
SLA_GARANTIA_HORAS=24
SLA_CONDOMINIO_HORAS=72
SLA_URGENTE_HORAS=4

# Timezone
TZ=America/Santo_Domingo

# Feature Flags
FEATURE_AI_CLASSIFICATION=true
FEATURE_AUTO_ASSIGNMENT=true
FEATURE_IMAGE_ANALYSIS=true
FEATURE_VOICE_MESSAGES=false
```

**Frontend - Verificar .env:**

```env
VITE_API_URL=https://tudominio.com/api/v1
VITE_WS_URL=wss://tudominio.com
```

---

## 2. Configurar FileZilla

### Credenciales de Bluehost

1. Abrir FileZilla
2. Ir a `Archivo` > `Gestor de sitios`
3. Crear nuevo sitio: "Gestora Internacional - Bluehost"

**Configuración:**
```
Protocolo: SFTP
Servidor: tudominio.com (o IP de Bluehost)
Puerto: 22
Usuario: tu-usuario-bluehost
Contraseña: tu-contraseña-bluehost
```

4. Click en "Conectar"

---

## 3. Estructura de Carpetas en Bluehost

En Bluehost, debes crear esta estructura:

```
/home/tuusuario/
├── public_html/                          # Raíz web
│   ├── gestora-internacional/            # Carpeta del proyecto
│   │   ├── frontend/                     # Frontend compilado
│   │   │   ├── index.html
│   │   │   ├── assets/
│   │   │   └── ...
│   │   └── api/                          # Backend (symlink o proxy)
│   └── .htaccess                         # Redirecciones
└── gestora-backend/                      # Backend fuera de public_html (seguridad)
    ├── dist/                             # Código compilado
    ├── node_modules/                     # Dependencias
    ├── prisma/                           # Prisma schema y migraciones
    ├── uploads/                          # Archivos subidos
    ├── .env                              # Variables de entorno
    └── package.json
```

---

## 4. Subir Archivos

### A. Subir Backend

**Carpetas/archivos a subir** (lado izquierdo en FileZilla):
```
c:\Users\josue\mis-sitios-bluehost\public_html\ges-internacional\backend\
```

**Destino en Bluehost** (lado derecho en FileZilla):
```
/home/tuusuario/gestora-backend/
```

**Qué subir:**
- ✅ `dist/` (código compilado)
- ✅ `node_modules/` (dependencias)
- ✅ `prisma/` (schema y migraciones)
- ✅ `uploads/` (crear vacía)
- ✅ `.env.production` → renombrar a `.env`
- ✅ `package.json`
- ✅ `package-lock.json`
- ❌ **NO subir**: `src/`, `.git/`, `*.ts` (archivos TypeScript)

### B. Subir Frontend

**Carpetas/archivos a subir** (solo la carpeta dist compilada):
```
c:\Users\josue\mis-sitios-bluehost\public_html\ges-internacional\frontend\dist\
```

**Destino en Bluehost**:
```
/home/tuusuario/public_html/gestora-internacional/
```

**Qué subir:**
- ✅ Todo el contenido de `frontend/dist/`
- ✅ `index.html`
- ✅ `assets/`
- ✅ `vite.svg` u otros archivos estáticos

---

## 5. Configurar Backend

### A. Conectarse por SSH a Bluehost

```bash
ssh tuusuario@tudominio.com
```

### B. Ir a la carpeta del backend

```bash
cd ~/gestora-backend
```

### C. Instalar dependencias (si no subiste node_modules)

```bash
npm install --production
```

### D. Generar cliente de Prisma

```bash
npx prisma generate
```

### E. Ejecutar migraciones de base de datos

```bash
npx prisma migrate deploy
```

### F. Cargar datos de prueba (opcional)

```bash
npm run db:seed
```

### G. Iniciar el backend con PM2

**Instalar PM2 (si no está instalado):**
```bash
npm install -g pm2
```

**Iniciar la aplicación:**
```bash
pm2 start dist/index.js --name gestora-backend
```

**Configurar para que inicie automáticamente:**
```bash
pm2 startup
pm2 save
```

**Ver logs:**
```bash
pm2 logs gestora-backend
```

**Reiniciar:**
```bash
pm2 restart gestora-backend
```

**Detener:**
```bash
pm2 stop gestora-backend
```

### H. Verificar que el backend está corriendo

```bash
curl http://localhost:3001/health
```

Deberías ver:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "environment": "production"
}
```

---

## 6. Configurar Frontend

### A. Crear/Editar .htaccess en public_html/gestora-internacional/

```apache
# Habilitar rewrite
RewriteEngine On

# Redirigir peticiones API al backend
RewriteCond %{REQUEST_URI} ^/api/(.*)$
RewriteRule ^api/(.*)$ http://localhost:3001/api/$1 [P,L]

# Redirigir todo lo demás a index.html (para SPA)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.html [L]

# Habilitar CORS
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization"
</IfModule>

# Habilitar compresión
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Cache para archivos estáticos
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType text/javascript "access plus 1 month"
</IfModule>
```

### B. Verificar permisos de archivos

```bash
cd ~/public_html/gestora-internacional
chmod 644 index.html
chmod 755 assets/
find assets/ -type f -exec chmod 644 {} \;
```

---

## 7. Verificar Funcionamiento

### A. Probar el Backend Directamente

```bash
curl https://tudominio.com/api/v1/health
```

### B. Probar el Frontend

Abrir navegador:
```
https://tudominio.com/gestora-internacional/
```

### C. Probar Login

```bash
curl -X POST https://tudominio.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@gestorainternacional.com",
    "password": "admin123"
  }'
```

Deberías recibir un token JWT.

### D. Probar Endpoints Admin

```bash
# Obtener estadísticas
curl -X GET https://tudominio.com/api/v1/admin/estadisticas \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

---

## 8. Configuración de Base de Datos PostgreSQL en Bluehost

### A. Crear Base de Datos

1. Ingresar a cPanel de Bluehost
2. Ir a "PostgreSQL Databases"
3. Crear nueva base de datos: `gestora_db`
4. Crear usuario: `gestora_user`
5. Asignar permisos ALL a `gestora_user` en `gestora_db`

### B. Obtener Credenciales

```
Host: localhost (o IP del servidor)
Puerto: 5432
Base de datos: gestora_db
Usuario: gestora_user
Contraseña: [la que creaste]
```

### C. Actualizar DATABASE_URL en .env

```env
DATABASE_URL=postgresql://gestora_user:tu_password@localhost:5432/gestora_db
```

---

## 9. Comandos Útiles de Mantenimiento

### Ver logs del backend
```bash
pm2 logs gestora-backend
pm2 logs gestora-backend --lines 100
```

### Reiniciar backend después de cambios
```bash
pm2 restart gestora-backend
```

### Ver estado de procesos PM2
```bash
pm2 status
```

### Ver uso de recursos
```bash
pm2 monit
```

### Limpiar datos demo
```bash
curl -X DELETE https://tudominio.com/api/v1/admin/limpiar-datos-demo \
  -H "Authorization: Bearer TU_TOKEN"
```

### Cargar seed nuevamente
```bash
cd ~/gestora-backend
npm run db:seed
```

---

## 10. Checklist Final

Antes de declarar el sistema en producción:

### Backend
- [ ] Archivos `dist/` subidos correctamente
- [ ] `node_modules/` instalados
- [ ] `.env` configurado con credenciales de producción
- [ ] Base de datos PostgreSQL creada
- [ ] Migraciones ejecutadas (`prisma migrate deploy`)
- [ ] PM2 corriendo el backend
- [ ] Health check responde correctamente
- [ ] Logs no muestran errores

### Frontend
- [ ] Archivos `dist/` subidos a `public_html/gestora-internacional/`
- [ ] `.htaccess` configurado correctamente
- [ ] Variables de entorno apuntan a la URL correcta
- [ ] Página carga en el navegador
- [ ] Login funciona correctamente
- [ ] Assets (imágenes, CSS, JS) cargan correctamente

### Base de Datos
- [ ] PostgreSQL creado en cPanel
- [ ] Usuario con permisos correctos
- [ ] `DATABASE_URL` configurado en `.env`
- [ ] Migraciones aplicadas sin errores
- [ ] Datos de prueba cargados (opcional)

### Seguridad
- [ ] JWT_SECRET cambiado de valor por defecto
- [ ] CORS_ORIGIN configurado con tu dominio real
- [ ] `.env` tiene permisos 600 (`chmod 600 .env`)
- [ ] Backend fuera de `public_html/`
- [ ] OpenAI y Anthropic API keys configuradas

### Performance
- [ ] Compresión GZIP habilitada
- [ ] Cache de archivos estáticos configurado
- [ ] PM2 configurado para reinicio automático
- [ ] Logs rotativos configurados

---

## 11. Troubleshooting

### Problema: Backend no inicia

**Verificar:**
```bash
pm2 logs gestora-backend --err
cd ~/gestora-backend
node dist/index.js  # Ejecutar directamente para ver errores
```

### Problema: Error de conexión a PostgreSQL

**Verificar:**
```bash
psql -U gestora_user -d gestora_db -h localhost
# Ingresa password y verifica que te conectas
```

### Problema: Frontend muestra página en blanco

**Verificar:**
- Abrir DevTools del navegador (F12)
- Ver errores en Console
- Verificar que `VITE_API_URL` apunta a la URL correcta
- Verificar que `.htaccess` existe

### Problema: API responde 502 Bad Gateway

**Causa**: Backend no está corriendo

**Solución:**
```bash
pm2 restart gestora-backend
pm2 logs gestora-backend
```

### Problema: CORS errors en el navegador

**Verificar:**
- `.htaccess` tiene headers CORS correctos
- `CORS_ORIGIN` en `.env` coincide con tu dominio
- Backend está corriendo en el puerto correcto

---

## 12. Estructura Final en Bluehost

```
/home/tuusuario/
│
├── gestora-backend/                      # Backend (fuera de public_html)
│   ├── dist/                             # Código compilado
│   │   ├── index.js
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   ├── node_modules/                     # Dependencias
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.ts
│   │   └── migrations/
│   ├── uploads/
│   │   └── temp/
│   ├── .env                              # Variables de entorno
│   ├── package.json
│   └── package-lock.json
│
└── public_html/                          # Carpeta web pública
    └── gestora-internacional/            # Frontend
        ├── index.html
        ├── assets/
        │   ├── index-abc123.js
        │   ├── index-xyz789.css
        │   └── logo-def456.svg
        └── .htaccess                     # Configuración Apache
```

---

## 13. Comandos Rápidos de Referencia

### FileZilla
```
Conectar: Ctrl+S (Gestor de sitios)
Subir: Arrastrar archivos de izquierda a derecha
Permisos: Click derecho > Permisos de archivo
```

### SSH
```bash
# Conectar
ssh tuusuario@tudominio.com

# Ir al backend
cd ~/gestora-backend

# Ver logs
pm2 logs gestora-backend

# Reiniciar
pm2 restart gestora-backend

# Estado
pm2 status
```

### NPM
```bash
# Instalar dependencias
npm install --production

# Generar Prisma
npx prisma generate

# Migraciones
npx prisma migrate deploy

# Seed
npm run db:seed
```

---

## 14. Contactos de Soporte

**Bluehost:**
- Chat: https://my.bluehost.com/
- Teléfono: 1-888-401-4678

**Documentación Prisma:**
- https://www.prisma.io/docs/

**PM2:**
- https://pm2.keymetrics.io/docs/

---

**Última actualización**: 2024-01-15
**Sistema**: Gestora Internacional SRL v1.0
**Autor**: Claude Code + Josué Zavala

---

**NOTA IMPORTANTE**: Guarda esta guía en un lugar seguro. La necesitarás cada vez que actualices el sistema.
