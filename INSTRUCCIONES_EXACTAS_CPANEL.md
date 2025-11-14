# 📍 Instrucciones EXACTAS - Dónde Subir Cada Archivo en cPanel

## 🎯 Tu Situación Actual

Veo en tu screenshot que estás en:
```
/home3/kbjebqmy/public_html/
```

Veo que ya tienes `amico-app/` funcionando. Ahora vamos a crear `gestora-internacional/`

---

## 📁 PARTE 1: CREAR CARPETAS EN CPANEL

### Paso 1A: Crear carpeta del FRONTEND

**Ubicación:** `public_html/` (donde ya estás)

**Acción en cPanel File Manager:**

1. Estás en `/home3/kbjebqmy/public_html/` ✅
2. Click en botón **"+ Folder"** (arriba a la izquierda)
3. Nombre de carpeta: `gestora-internacional`
4. Click **"Create New Folder"**

**Resultado:**
```
/home3/kbjebqmy/public_html/gestora-internacional/
```

✅ Esta carpeta contendrá el FRONTEND (React compilado)

---

### Paso 1B: Crear carpeta del BACKEND

**Ubicación:** Fuera de `public_html/` (por seguridad)

**Acción en cPanel File Manager:**

1. Click en **"Up One Level"** (o click en `/home3/kbjebqmy/` en el árbol izquierdo)
2. Ahora estás en `/home3/kbjebqmy/`
3. Click en botón **"+ Folder"**
4. Nombre de carpeta: `gestora-backend`
5. Click **"Create New Folder"**

**Resultado:**
```
/home3/kbjebqmy/gestora-backend/
```

✅ Esta carpeta contendrá el BACKEND (Node.js)

---

## 📦 PARTE 2: ESTRUCTURA FINAL

Así quedará tu servidor:

```
/home3/kbjebqmy/                           ← Raíz de tu cuenta
│
├── public_html/                           ← Carpeta WEB (accesible desde internet)
│   ├── .well-known/
│   ├── amico-app/                         ← Tu app existente ✅
│   ├── amico-app-RESAPALDO/
│   ├── cgi-bin/
│   ├── cotizaciones/
│   ├── gestora-internacional/             ← NUEVA - Frontend de Gestora ⭐
│   │   ├── index.html                     ← Subirás aquí frontend/dist/*
│   │   ├── assets/
│   │   │   ├── index-abc123.js
│   │   │   └── index-xyz789.css
│   │   └── .htaccess                      ← Crear manualmente
│   ├── plugins/
│   └── .htaccess
│
├── gestora-backend/                       ← NUEVA - Backend de Gestora ⭐
│   ├── dist/                              ← Subirás aquí backend/dist/*
│   │   ├── index.js
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   ├── node_modules/                      ← Instalar por SSH
│   ├── prisma/                            ← Subirás aquí backend/prisma/*
│   │   ├── schema.prisma
│   │   ├── seed.ts
│   │   └── migrations/
│   ├── uploads/                           ← Crear carpeta vacía
│   │   └── temp/
│   ├── .env                               ← Subirás .env.production y renombrar
│   ├── package.json                       ← Subir desde backend/
│   └── package-lock.json                  ← Subir desde backend/
│
├── .cpanel/
├── .cphorde/
├── etc/
└── logs/
```

---

## 📋 PARTE 3: QUÉ SUBIR Y DÓNDE (DETALLADO)

### A. BACKEND - Archivos a Subir

#### 📂 Carpeta `dist/` completa

**ORIGEN en tu PC:**
```
c:\Users\josue\mis-sitios-bluehost\public_html\ges-internacional\backend\dist\
```

**DESTINO en cPanel:**
```
/home3/kbjebqmy/gestora-backend/dist/
```

**Cómo subirlo:**
1. En cPanel File Manager, ir a `/home3/kbjebqmy/gestora-backend/`
2. Click en **"Upload"**
3. Seleccionar TODA la carpeta `dist/` completa
4. O usar FileZilla y arrastrar la carpeta `dist/`

**Contenido (ejemplo):**
- `dist/index.js`
- `dist/config/`
- `dist/controllers/`
- `dist/middleware/`
- `dist/routes/`
- `dist/services/`
- `dist/utils/`
- `dist/database/`

---

#### 📂 Carpeta `prisma/` completa

**ORIGEN en tu PC:**
```
c:\Users\josue\mis-sitios-bluehost\public_html\ges-internacional\backend\prisma\
```

**DESTINO en cPanel:**
```
/home3/kbjebqmy/gestora-backend/prisma/
```

**Contenido:**
- `prisma/schema.prisma`
- `prisma/seed.ts`
- `prisma/migrations/` (carpeta completa con todas las migraciones)

---

#### 📂 Carpeta `uploads/` (vacía)

**ORIGEN en tu PC:**
```
c:\Users\josue\mis-sitios-bluehost\public_html\ges-internacional\backend\uploads\
```

**DESTINO en cPanel:**
```
/home3/kbjebqmy/gestora-backend/uploads/
```

**Estructura:**
```
uploads/
└── temp/
    └── .gitkeep
```

---

#### 📄 Archivo `.env.production`

**ORIGEN en tu PC:**
```
c:\Users\josue\mis-sitios-bluehost\public_html\ges-internacional\backend\.env.production
```

**DESTINO en cPanel:**
```
/home3/kbjebqmy/gestora-backend/.env.production
```

⚠️ **IMPORTANTE:** Después de subirlo, RENOMBRAR a `.env` (sin .production)

---

#### 📄 Archivo `package.json`

**ORIGEN en tu PC:**
```
c:\Users\josue\mis-sitios-bluehost\public_html\ges-internacional\backend\package.json
```

**DESTINO en cPanel:**
```
/home3/kbjebqmy/gestora-backend/package.json
```

---

#### 📄 Archivo `package-lock.json`

**ORIGEN en tu PC:**
```
c:\Users\josue\mis-sitios-bluehost\public_html\ges-internacional\backend\package-lock.json
```

**DESTINO en cPanel:**
```
/home3/kbjebqmy/gestora-backend/package-lock.json
```

---

### B. FRONTEND - Archivos a Subir

#### ⚠️ IMPORTANTE: Solo el CONTENIDO de `frontend/dist/`

**ORIGEN en tu PC:**
```
c:\Users\josue\mis-sitios-bluehost\public_html\ges-internacional\frontend\dist\
```

Contenido de esta carpeta:
- `index.html`
- `assets/` (carpeta)
- `vite.svg`
- otros archivos estáticos

**DESTINO en cPanel:**
```
/home3/kbjebqmy/public_html/gestora-internacional/
```

**⚠️ CLAVE:** NO subir la carpeta `dist/` en sí, solo su CONTENIDO

**CORRECTO** ✅:
```
/home3/kbjebqmy/public_html/gestora-internacional/
├── index.html                    ← Archivo directo
├── assets/                       ← Carpeta
└── vite.svg                      ← Archivo directo
```

**INCORRECTO** ❌:
```
/home3/kbjebqmy/public_html/gestora-internacional/
└── dist/                         ← ¡NO! La carpeta dist no debe estar aquí
    ├── index.html
    └── assets/
```

**Cómo subirlo correctamente:**

**Opción A - FileZilla (RECOMENDADO):**
1. Conectar FileZilla
2. En lado izquierdo: Entrar a `frontend/dist/`
3. Seleccionar TODO el contenido (Ctrl+A)
4. En lado derecho: Ir a `/home3/kbjebqmy/public_html/gestora-internacional/`
5. Arrastrar los archivos seleccionados

**Opción B - cPanel File Manager:**
1. En cPanel, ir a `/home3/kbjebqmy/public_html/gestora-internacional/`
2. Click en **"Upload"**
3. Subir cada archivo individualmente de `frontend/dist/`
4. Subir la carpeta `assets/` completa

---

#### 📄 Crear archivo `.htaccess` manualmente

**DESTINO en cPanel:**
```
/home3/kbjebqmy/public_html/gestora-internacional/.htaccess
```

**Cómo crearlo:**
1. En cPanel File Manager, ir a `/home3/kbjebqmy/public_html/gestora-internacional/`
2. Click en **"+ File"**
3. Nombre: `.htaccess`
4. Click derecho en el archivo → **"Edit"**
5. Copiar este contenido:

```apache
RewriteEngine On

# Proxy API al backend
RewriteCond %{REQUEST_URI} ^/api/(.*)$
RewriteRule ^api/(.*)$ http://localhost:3001/api/$1 [P,L]

# SPA routing - redirigir todo a index.html
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.html [L]

# CORS Headers
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization"
</IfModule>

# Compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/css text/javascript application/javascript application/json
</IfModule>

# Cache
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

6. Click **"Save Changes"**

---

## 🚀 PARTE 4: ORDEN DE EJECUCIÓN PASO A PASO

### FASE 1: Preparar localmente (EN TU PC)

```bash
# 1. Ejecutar el script de preparación
PREPARAR_SUBIDA.bat
```

Esto compila:
- Backend: `backend/dist/`
- Frontend: `frontend/dist/`

---

### FASE 2: Crear carpetas en cPanel

**En cPanel File Manager:**

1. Ir a `/home3/kbjebqmy/public_html/`
2. Crear carpeta: `gestora-internacional`

3. Ir a `/home3/kbjebqmy/`
4. Crear carpeta: `gestora-backend`

---

### FASE 3: Subir Backend (FileZilla o cPanel Upload)

**Conectar FileZilla:**
```
Host: box5358.bluehost.com
Username: kbjebqmy
Port: 22
Protocol: SFTP
```

**Subir archivos:**

1. **dist/**
   - Origen: `c:\...\backend\dist\`
   - Destino: `/home3/kbjebqmy/gestora-backend/dist/`

2. **prisma/**
   - Origen: `c:\...\backend\prisma\`
   - Destino: `/home3/kbjebqmy/gestora-backend/prisma/`

3. **uploads/**
   - Origen: `c:\...\backend\uploads\`
   - Destino: `/home3/kbjebqmy/gestora-backend/uploads/`

4. **.env.production**
   - Origen: `c:\...\backend\.env.production`
   - Destino: `/home3/kbjebqmy/gestora-backend/.env.production`

5. **package.json**
   - Origen: `c:\...\backend\package.json`
   - Destino: `/home3/kbjebqmy/gestora-backend/package.json`

6. **package-lock.json**
   - Origen: `c:\...\backend\package-lock.json`
   - Destino: `/home3/kbjebqmy/gestora-backend/package-lock.json`

---

### FASE 4: Subir Frontend (FileZilla o cPanel Upload)

**Subir CONTENIDO de dist/ (NO la carpeta dist/):**

1. En FileZilla:
   - Lado izquierdo: Entrar a `frontend/dist/`
   - Seleccionar TODO (Ctrl+A)
   - Lado derecho: Ir a `/home3/kbjebqmy/public_html/gestora-internacional/`
   - Arrastrar archivos

**Archivos a subir:**
- `index.html` → `/home3/kbjebqmy/public_html/gestora-internacional/index.html`
- `assets/` → `/home3/kbjebqmy/public_html/gestora-internacional/assets/`
- `vite.svg` → `/home3/kbjebqmy/public_html/gestora-internacional/vite.svg`

---

### FASE 5: Configurar por SSH

**1. Conectar por SSH:**

```bash
ssh kbjebqmy@box5358.bluehost.com
# Ingresar contraseña
```

**2. Ir a la carpeta del backend:**

```bash
cd ~/gestora-backend
pwd  # Verificar: /home3/kbjebqmy/gestora-backend
ls   # Verificar que están los archivos
```

**3. Renombrar .env:**

```bash
mv .env.production .env
```

**4. Editar .env con credenciales reales:**

```bash
nano .env
```

Cambiar estas líneas:
```env
PORT=3001
DATABASE_URL=postgresql://gestora_user:TU_PASSWORD@localhost:5432/gestora_db
JWT_SECRET=cambiar-esto-super-seguro-123
JWT_REFRESH_SECRET=cambiar-esto-refresh-456
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
CORS_ORIGIN=https://box5358.bluehost.com
```

Guardar: `Ctrl+X` → `Y` → `Enter`

**5. Instalar dependencias:**

```bash
npm install --production
```

**6. Generar Prisma:**

```bash
npx prisma generate
```

**7. Ejecutar migraciones:**

```bash
npx prisma migrate deploy
```

**8. Cargar datos de prueba:**

```bash
npm run db:seed
```

**9. Iniciar con PM2:**

```bash
pm2 start dist/index.js --name gestora-backend
pm2 save
pm2 startup
```

**10. Verificar estado:**

```bash
pm2 status
# Debería mostrar "gestora-backend" en "online"
```

**11. Probar health check:**

```bash
curl http://localhost:3001/health
```

Debería responder:
```json
{"status":"ok","timestamp":"..."}
```

---

### FASE 6: Crear .htaccess en Frontend

**En cPanel File Manager:**

1. Ir a `/home3/kbjebqmy/public_html/gestora-internacional/`
2. Click **"+ File"**
3. Nombre: `.htaccess`
4. Click derecho → **"Edit"**
5. Copiar contenido de arriba (PARTE 3, sección Frontend)
6. Guardar

---

### FASE 7: Verificar Funcionamiento

**1. Abrir en navegador:**

```
https://box5358.bluehost.com/gestora-internacional/
```

O si tienes dominio personalizado:
```
https://tudominio.com/gestora-internacional/
```

**2. Probar login:**

```
Email: admin@gestorainternacional.com
Password: admin123
```

**3. Verificar DevTools (F12):**
- Console: No debe haber errores
- Network: Las peticiones a `/api/v1/` deben responder 200

---

## ✅ CHECKLIST FINAL

Marca cada uno cuando esté completo:

### Estructura de Carpetas
- [ ] Existe `/home3/kbjebqmy/gestora-backend/`
- [ ] Existe `/home3/kbjebqmy/public_html/gestora-internacional/`

### Backend Subido
- [ ] `/home3/kbjebqmy/gestora-backend/dist/` existe y tiene archivos
- [ ] `/home3/kbjebqmy/gestora-backend/prisma/` existe
- [ ] `/home3/kbjebqmy/gestora-backend/uploads/` existe
- [ ] `/home3/kbjebqmy/gestora-backend/.env` existe (renombrado)
- [ ] `/home3/kbjebqmy/gestora-backend/package.json` existe
- [ ] `/home3/kbjebqmy/gestora-backend/package-lock.json` existe

### Frontend Subido
- [ ] `/home3/kbjebqmy/public_html/gestora-internacional/index.html` existe
- [ ] `/home3/kbjebqmy/public_html/gestora-internacional/assets/` existe
- [ ] `/home3/kbjebqmy/public_html/gestora-internacional/.htaccess` existe

### Configuración SSH
- [ ] `.env` editado con credenciales reales
- [ ] `npm install` ejecutado sin errores
- [ ] `npx prisma generate` ejecutado sin errores
- [ ] `npx prisma migrate deploy` ejecutado sin errores
- [ ] `npm run db:seed` ejecutado (opcional)
- [ ] `pm2 start` ejecutado
- [ ] `pm2 status` muestra "gestora-backend" online

### Verificación
- [ ] Navegador carga la página
- [ ] Login funciona
- [ ] No hay errores en consola
- [ ] API responde correctamente

---

## 🎯 URLs Finales

Una vez completado:

**Frontend:**
```
https://box5358.bluehost.com/gestora-internacional/
```

**API:**
```
https://box5358.bluehost.com/api/v1/
```

**Health Check:**
```
https://box5358.bluehost.com/api/v1/health
```

---

## 📞 Comandos Útiles SSH

```bash
# Ver estado PM2
pm2 status

# Ver logs
pm2 logs gestora-backend

# Reiniciar backend
pm2 restart gestora-backend

# Detener backend
pm2 stop gestora-backend

# Ver procesos
pm2 list

# Cargar seed nuevamente
cd ~/gestora-backend
npm run db:seed
```

---

**¿Todo claro?** Si tienes dudas sobre algún paso específico, pregúntame antes de empezar.
