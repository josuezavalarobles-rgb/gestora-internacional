# 🚀 Pasos Rápidos: Subir Gestora Internacional con FileZilla

## ⚡ Guía Visual Rápida

---

## PASO 1: Preparar Archivos Localmente (5 minutos)

### Opción A: Script Automático (RECOMENDADO)

```bash
# Hacer doble clic en este archivo:
PREPARAR_SUBIDA.bat
```

✅ Esto compilará todo automáticamente

### Opción B: Manual

```bash
# Backend
cd backend
npm install
npm run db:generate
npm run build

# Frontend
cd frontend
npm install
npm run build
```

---

## PASO 2: Abrir FileZilla (1 minuto)

### Configurar Conexión Nueva

1. **Abrir FileZilla**
2. Click en **"Archivo"** → **"Gestor de sitios"**
3. Click en **"Nuevo sitio"**
4. Nombre: `Gestora Internacional - Bluehost`

### Datos de Conexión

```
┌─────────────────────────────────────────┐
│ Protocolo:   SFTP                       │
│ Servidor:    tudominio.com              │
│ Puerto:      22                         │
│ Usuario:     tu-usuario-bluehost        │
│ Contraseña:  tu-contraseña-bluehost     │
└─────────────────────────────────────────┘
```

5. Click en **"Conectar"**

✅ **Confirmación**: Verás carpetas como `public_html`, `logs`, `tmp`, etc.

---

## PASO 3: Crear Estructura de Carpetas (2 minutos)

### En Bluehost (lado derecho de FileZilla):

```
📁 /home/tuusuario/
  ├── 📁 gestora-backend/        ← CREAR ESTA CARPETA
  └── 📁 public_html/
      └── 📁 gestora-internacional/    ← CREAR ESTA CARPETA
```

**Cómo crear:**
1. Click derecho en el lado derecho (Bluehost)
2. Seleccionar **"Crear directorio"**
3. Nombre: `gestora-backend`
4. Repetir para `public_html/gestora-internacional`

---

## PASO 4: Subir BACKEND (10-15 minutos)

### Archivos a Subir

```
📂 ORIGEN (izquierda):
c:\Users\josue\mis-sitios-bluehost\public_html\ges-internacional\backend\

📂 DESTINO (derecha):
/home/tuusuario/gestora-backend/
```

### Lista de Archivos/Carpetas:

| Archivo/Carpeta | ¿Subir? | Notas |
|----------------|---------|-------|
| `dist/` | ✅ SÍ | Código compilado |
| `node_modules/` | ✅ SÍ | Dependencias (tarda) |
| `prisma/` | ✅ SÍ | Schema y migraciones |
| `uploads/` | ✅ SÍ | Carpeta vacía |
| `.env.production` | ✅ SÍ | Renombrar a `.env` |
| `package.json` | ✅ SÍ | |
| `package-lock.json` | ✅ SÍ | |
| `src/` | ❌ NO | Solo desarrollo |
| `.git/` | ❌ NO | Solo desarrollo |
| `*.ts` | ❌ NO | Solo desarrollo |

### ⚡ TRUCO: Subir node_modules rápido

Si `node_modules` tarda mucho:

1. **NO subir** `node_modules`
2. Luego por SSH ejecutar:
   ```bash
   cd ~/gestora-backend
   npm install --production
   ```

### Cómo Subir:

1. **Seleccionar carpetas** en lado izquierdo
2. **Arrastrar** al lado derecho
3. **Esperar** (puede tardar 10-15 minutos)

✅ **Confirmación**: En el lado derecho verás `gestora-backend/dist/`, `gestora-backend/node_modules/`, etc.

---

## PASO 5: Subir FRONTEND (2-3 minutos)

### Archivos a Subir

```
📂 ORIGEN (izquierda):
c:\Users\josue\mis-sitios-bluehost\public_html\ges-internacional\frontend\dist\

📂 DESTINO (derecha):
/home/tuusuario/public_html/gestora-internacional/
```

### ⚠️ IMPORTANTE: Solo el CONTENIDO de dist/

**Correcto** ✅:
```
/home/tuusuario/public_html/gestora-internacional/
  ├── index.html
  ├── assets/
  └── vite.svg
```

**Incorrecto** ❌:
```
/home/tuusuario/public_html/gestora-internacional/
  └── dist/
      ├── index.html
      └── assets/
```

### Cómo Subir:

1. **Entrar** a `frontend/dist/` en lado izquierdo
2. **Seleccionar TODO** (Ctrl+A)
3. **Arrastrar** a `public_html/gestora-internacional/` en lado derecho
4. **Esperar** (2-3 minutos)

✅ **Confirmación**: En `public_html/gestora-internacional/` verás `index.html`, `assets/`, etc.

---

## PASO 6: Configurar Backend por SSH (5 minutos)

### A. Conectar por SSH

**Windows (PowerShell):**
```powershell
ssh tuusuario@tudominio.com
```

**Ingresar contraseña**

### B. Renombrar .env

```bash
cd ~/gestora-backend
mv .env.production .env
```

### C. Editar .env con credenciales reales

```bash
nano .env
```

**Cambiar:**
```env
DATABASE_URL=postgresql://gestora_user:TU_PASSWORD@localhost:5432/gestora_db
JWT_SECRET=tu-secret-super-seguro-cambiar-123
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
CORS_ORIGIN=https://tudominio.com
```

**Guardar:** `Ctrl+X` → `Y` → `Enter`

### D. Generar Prisma y Migrar

```bash
npx prisma generate
npx prisma migrate deploy
```

### E. Cargar Datos de Prueba (Opcional)

```bash
npm run db:seed
```

### F. Iniciar con PM2

```bash
pm2 start dist/index.js --name gestora-backend
pm2 save
pm2 startup
```

✅ **Confirmación**:
```bash
pm2 status
# Debería mostrar "gestora-backend" en estado "online"
```

### G. Verificar Health Check

```bash
curl http://localhost:3001/health
```

**Respuesta esperada:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## PASO 7: Crear .htaccess (2 minutos)

### Por FileZilla:

1. Click derecho en `public_html/gestora-internacional/`
2. Seleccionar **"Crear archivo"**
3. Nombre: `.htaccess`

### Editar .htaccess:

Click derecho → **"Ver/Editar"**

```apache
RewriteEngine On

# Proxy API al backend
RewriteCond %{REQUEST_URI} ^/api/(.*)$
RewriteRule ^api/(.*)$ http://localhost:3001/api/$1 [P,L]

# SPA routing
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.html [L]

# CORS
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization"
</IfModule>

# Compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/css text/javascript application/javascript application/json
</IfModule>
```

**Guardar:** `Ctrl+S` → Click **"Sí"** para subir

---

## PASO 8: Verificar Funcionamiento (2 minutos)

### A. Abrir en Navegador

```
https://tudominio.com/gestora-internacional/
```

✅ **Debería cargar**: Página de login

### B. Probar Login

**Credenciales de prueba:**
```
Email: admin@gestorainternacional.com
Password: admin123
```

✅ **Debería**: Iniciar sesión y redirigir al dashboard

### C. Abrir DevTools (F12)

**Console:** No debería mostrar errores
**Network:** Las peticiones a `/api/v1/` deberían responder 200

---

## 🎯 Checklist Final

Antes de cerrar FileZilla, verifica:

### Backend ✅
- [ ] Carpeta `gestora-backend/` existe en `/home/tuusuario/`
- [ ] Contiene: `dist/`, `node_modules/`, `prisma/`, `.env`
- [ ] PM2 muestra `gestora-backend` en estado `online`
- [ ] `curl http://localhost:3001/health` responde OK

### Frontend ✅
- [ ] Carpeta `gestora-internacional/` existe en `public_html/`
- [ ] Contiene: `index.html`, `assets/`, `.htaccess`
- [ ] Navegador carga la página sin errores
- [ ] Login funciona correctamente

### Base de Datos ✅
- [ ] PostgreSQL `gestora_db` creada en cPanel
- [ ] Migraciones ejecutadas (`prisma migrate deploy`)
- [ ] Datos de prueba cargados (`npm run db:seed`)

---

## ⚠️ Problemas Comunes

### Problema: Página muestra "404 Not Found"

**Causa**: Frontend no está en la carpeta correcta

**Solución:**
1. Verificar que `index.html` esté en `public_html/gestora-internacional/`
2. NO debe estar en `public_html/gestora-internacional/dist/`

---

### Problema: API responde "502 Bad Gateway"

**Causa**: Backend no está corriendo

**Solución:**
```bash
ssh tuusuario@tudominio.com
cd ~/gestora-backend
pm2 restart gestora-backend
pm2 logs gestora-backend
```

---

### Problema: CORS errors en consola

**Causa**: `.htaccess` no tiene headers CORS

**Solución:**
1. Verificar que `.htaccess` existe en `public_html/gestora-internacional/`
2. Verificar que contiene las líneas de CORS

---

### Problema: Login no funciona

**Causa 1**: Backend no conecta con base de datos

**Verificar:**
```bash
pm2 logs gestora-backend --err
```

**Causa 2**: No se cargaron los datos de prueba

**Solución:**
```bash
cd ~/gestora-backend
npm run db:seed
```

---

## 📞 Soporte

**Bluehost:**
- Chat: https://my.bluehost.com/
- Tel: 1-888-401-4678

**Logs del backend:**
```bash
ssh tuusuario@tudominio.com
pm2 logs gestora-backend
```

---

## 🎉 ¡Listo!

Tu sistema Gestora Internacional está funcionando en:

```
🌐 https://tudominio.com/gestora-internacional/

👤 Usuario: admin@gestorainternacional.com
🔑 Contraseña: admin123
```

---

**Tiempo total estimado:** 30-40 minutos

**Archivos de referencia:**
- `GUIA_SUBIR_BLUEHOST.md` - Guía completa detallada
- `SISTEMA_DATOS_PRUEBA.md` - Documentación de datos de prueba
- `PREPARAR_SUBIDA.bat` - Script de preparación automático
