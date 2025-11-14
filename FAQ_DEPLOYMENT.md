# ❓ PREGUNTAS FRECUENTES - DEPLOYMENT BLUEHOST

## 📋 ÍNDICE
1. [Preparación y Compilación](#preparación)
2. [FileZilla y Subida de Archivos](#filezilla)
3. [Configuración del Servidor](#configuración)
4. [Base de Datos](#base-de-datos)
5. [Node.js y PM2](#nodejs)
6. [Problemas Comunes](#problemas)

---

## 🔧 PREPARACIÓN

### ❓ ¿Necesito subir TODO el proyecto?

**NO.** Solo necesitas:

**Backend:**
- ✅ `dist/` (código compilado)
- ✅ `prisma/` (esquema DB)
- ✅ `package.json` y `package-lock.json`
- ✅ `.env` (configuración)
- ❌ `src/` (código fuente TypeScript - NO)
- ❌ `node_modules/` (reinstalar en servidor - NO por FileZilla)
- ❌ archivos `.md` (documentación - NO)

**Frontend:**
- ✅ TODO el contenido de `frontend/dist/`
- ❌ `frontend/src/` (NO)
- ❌ `frontend/node_modules/` (NO)

---

### ❓ ¿Cómo compilo el proyecto?

```bash
# Backend
cd c:\Users\josue\mis-sitios-bluehost\public_html\amico\backend
npm run build

# Frontend
cd c:\Users\josue\mis-sitios-bluehost\public_html\amico\frontend
npm run build
```

O simplemente ejecuta:
```batch
PREPARAR_DEPLOYMENT.bat
```

---

### ❓ ¿Qué hace `npm run build`?

- **Backend:** Convierte TypeScript (.ts) a JavaScript (.js) para Node.js
- **Frontend:** Optimiza React para producción (minifica, combina archivos)

---

## 📁 FILEZILLA

### ❓ ¿Qué es FileZilla y para qué sirve?

FileZilla es un cliente FTP gratuito que te permite transferir archivos entre tu computadora y el servidor de Bluehost.

**Descargar:** https://filezilla-project.org/download.php?type=client

---

### ❓ ¿Cómo me conecto a Bluehost con FileZilla?

```
Host: ftp.tudominio.com (o la IP de Bluehost)
Usuario: tu-usuario-cPanel
Contraseña: tu-password-cPanel
Puerto: 21 (FTP) o 22 (SFTP - más seguro)
```

**Obtener credenciales:**
1. Accede a cPanel de Bluehost
2. Ve a "FTP Accounts"
3. Usa la cuenta principal o crea una nueva

---

### ❓ ¿Dónde subo el backend?

**En el servidor:**
```
/home/tu-usuario/amico-backend/
```

**NO en:**
```
/public_html/  ← Este es para frontend solamente
```

**Razón:** Por seguridad, el backend no debe ser accesible desde el navegador.

---

### ❓ ¿Dónde subo el frontend?

**En el servidor:**
```
/home/tu-usuario/public_html/amico/
```

**Esto lo hace accesible en:**
```
https://tudominio.com/amico/
```

---

### ❓ ¿Por qué tarda tanto subir node_modules/?

`node_modules/` tiene miles de archivos pequeños. **NO lo subas.**

**Alternativa:**
1. Sube solo `package.json` y `package-lock.json`
2. Conéctate por SSH
3. Ejecuta: `npm install --production`

Esto instala las dependencias directamente en el servidor (mucho más rápido).

---

### ❓ ¿Cómo creo carpetas en FileZilla?

**Panel derecho (servidor):**
1. Navega a la ubicación deseada
2. Click derecho → "Create directory"
3. Escribe el nombre: `amico-backend`
4. Presiona Enter

---

## ⚙️ CONFIGURACIÓN

### ❓ ¿Qué es SSH y cómo me conecto?

SSH (Secure Shell) te permite ejecutar comandos en el servidor.

**Conectar:**
```bash
ssh tu-usuario@tudominio.com
```

**Desde Windows:**
- PowerShell (Windows 10+)
- PuTTY (descarga de https://putty.org/)
- Git Bash

**Habilitar SSH en Bluehost:**
1. cPanel → "SSH Access"
2. "Manage SSH Keys"
3. Genera o importa tu clave

---

### ❓ ¿Qué es el archivo .env?

Es el archivo de configuración con variables de entorno (credenciales, API keys, etc).

**IMPORTANTE:**
- ✅ Edítalo ANTES de subir, o
- ✅ Edítalo en el servidor después de subir

**Nunca compartas este archivo:** Contiene información sensible.

---

### ❓ ¿Cómo edito .env en el servidor?

**Opción 1: Via SSH (recomendado)**
```bash
cd ~/amico-backend
nano .env
```

Edita, luego:
- `Ctrl+X` para salir
- `Y` para guardar
- `Enter` para confirmar

**Opción 2: Via cPanel File Manager**
1. cPanel → "File Manager"
2. Navega a `amico-backend/`
3. Click derecho en `.env` → "Edit"
4. Modifica y guarda

**Opción 3: Via FileZilla**
1. Navega a `amico-backend/`
2. Click derecho en `.env` → "View/Edit"
3. Edita en tu editor local
4. Guarda, FileZilla sube automáticamente

---

### ❓ ¿Qué valores debo cambiar en .env?

**IMPRESCINDIBLES:**

```bash
# PostgreSQL (de cPanel → PostgreSQL Databases)
DATABASE_URL=postgresql://usuario:password@localhost:5432/amico_db

# MongoDB (de MongoDB Atlas - gratis)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/amico_logs

# Tu dominio
CORS_ORIGIN=https://tudominio.com

# API key de OpenAI
OPENAI_API_KEY=sk-tu-api-key-real
```

**RECOMENDADOS (seguridad):**

```bash
# Genera secretos seguros en: https://randomkeygen.com/
JWT_SECRET=tu-secreto-super-seguro-256-caracteres
JWT_REFRESH_SECRET=otro-secreto-diferente-512-caracteres
```

---

## 💾 BASE DE DATOS

### ❓ ¿Bluehost tiene PostgreSQL?

**SÍ**, pero debes habilitarlo:

1. cPanel → "PostgreSQL Databases"
2. Crea base de datos: `amico_db`
3. Crea usuario: `amico_user` con contraseña segura
4. Asigna usuario a base de datos con **TODOS LOS PRIVILEGIOS**

---

### ❓ ¿Bluehost tiene MongoDB?

**NO directamente**, pero tienes opciones:

**Opción 1: MongoDB Atlas (GRATIS - Recomendado)**
1. Ve a https://www.mongodb.com/cloud/atlas
2. Crea cuenta gratuita
3. Crea cluster gratuito (512 MB)
4. Whitelist IP de Bluehost
5. Obtén URL de conexión

**Opción 2: Modificar código para usar solo PostgreSQL**
(No recomendado - requiere refactorización)

---

### ❓ ¿Cómo obtengo la URL de MongoDB Atlas?

1. **Crea cluster** en Atlas
2. **Cluster → Connect**
3. **"Connect your application"**
4. **Copia la URL:**
   ```
   mongodb+srv://usuario:<password>@cluster.mongodb.net/amico_logs
   ```
5. **Reemplaza `<password>`** con tu contraseña real
6. **Whitelist IP:**
   - Database Access → Network Access
   - Add IP Address
   - Agrega IP pública de Bluehost (o 0.0.0.0/0 para permitir todas)

---

### ❓ ¿Qué es Prisma y para qué sirve?

Prisma es un ORM (Object-Relational Mapping) que:
- Define el esquema de base de datos
- Genera migraciones
- Provee un cliente para consultas type-safe

---

### ❓ ¿Cómo ejecuto las migraciones?

```bash
cd ~/amico-backend

# Generar cliente de Prisma
npx prisma generate

# Aplicar migraciones
npx prisma migrate deploy
```

Esto crea todas las tablas necesarias en PostgreSQL.

---

### ❓ ¿Qué hago si las migraciones fallan?

**Error común:** Base de datos no existe

**Solución:**
1. Verifica que creaste la base de datos en cPanel
2. Verifica `DATABASE_URL` en `.env`
3. Prueba conexión:
   ```bash
   psql -U amico_user -d amico_db -h localhost
   ```

---

## 🚀 NODE.JS Y PM2

### ❓ ¿Qué versión de Node.js necesito?

**Mínimo:** Node.js 18.x

**Verificar en servidor:**
```bash
node --version
```

**Si es menor a 18:**
Contacta soporte de Bluehost para actualizar, o usa NVM:

```bash
# Instalar NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Instalar Node 18
nvm install 18
nvm use 18
```

---

### ❓ ¿Qué es PM2?

PM2 es un administrador de procesos para Node.js que:
- Mantiene tu aplicación corriendo 24/7
- Reinicia automáticamente si se cae
- Administra logs
- Permite monitoreo

**Alternativa sin PM2:**
- `screen` o `tmux` (mantienen sesión activa)
- `forever` (similar a PM2)

---

### ❓ ¿Cómo instalo PM2?

```bash
npm install -g pm2
```

**Si no tienes permisos:**
```bash
# Instalar localmente en el proyecto
cd ~/amico-backend
npm install pm2

# Usar con npx
npx pm2 start dist/index.js
```

---

### ❓ ¿Cómo inicio el backend con PM2?

```bash
cd ~/amico-backend

# Iniciar
pm2 start dist/index.js --name amico-backend

# Guardar configuración
pm2 save

# Auto-inicio en reinicio del servidor
pm2 startup
```

---

### ❓ ¿Cómo veo los logs?

```bash
# Logs en tiempo real
pm2 logs amico-backend

# Últimas 100 líneas
pm2 logs amico-backend --lines 100

# Solo errores
pm2 logs amico-backend --err

# Limpiar logs
pm2 flush
```

---

### ❓ ¿Cómo reinicio el backend?

```bash
# Reiniciar
pm2 restart amico-backend

# Detener
pm2 stop amico-backend

# Iniciar de nuevo
pm2 start amico-backend

# Ver estado
pm2 status
```

---

## 🆘 PROBLEMAS COMUNES

### ❓ Error: "Cannot find module 'express'"

**Causa:** Dependencias no instaladas

**Solución:**
```bash
cd ~/amico-backend
npm install --production
```

---

### ❓ Error: "Port 3000 is already in use"

**Causa:** Otro proceso usa el puerto 3000

**Solución 1: Cambiar puerto**
Edita `.env`:
```bash
PORT=3001
```

**Solución 2: Matar proceso en puerto 3000**
```bash
# Ver qué está usando el puerto
lsof -i :3000

# Matar proceso (reemplaza PID)
kill -9 PID
```

---

### ❓ Error: "P1001: Can't reach database server"

**Causa:** PostgreSQL no está corriendo o credenciales incorrectas

**Solución:**
1. Verifica que PostgreSQL está activo:
   ```bash
   systemctl status postgresql
   ```
2. Verifica `DATABASE_URL` en `.env`
3. Prueba conexión manual:
   ```bash
   psql -U amico_user -d amico_db -h localhost
   ```

---

### ❓ Frontend carga pero API no responde

**Causa:** Backend no está corriendo o CORS mal configurado

**Solución:**
1. Verifica backend:
   ```bash
   pm2 status
   ```
2. Verifica logs:
   ```bash
   pm2 logs amico-backend
   ```
3. Verifica CORS en `.env`:
   ```bash
   CORS_ORIGIN=https://tudominio.com
   ```

---

### ❓ WhatsApp no conecta

**Causa:** Sesión expirada o puerto bloqueado

**Solución:**
1. Elimina sesión antigua:
   ```bash
   rm -rf ~/amico-backend/auth_info_baileys/*
   ```
2. Genera nuevo QR:
   ```bash
   cd ~/amico-backend
   node wa-qr.js
   ```
3. Escanea con WhatsApp Business

---

### ❓ ¿Cómo accedo al dashboard?

**URL:**
```
https://tudominio.com/amico/dashboard
```

**Requiere login:**
- Usuario: admin o el que hayas creado
- Password: el que configuraste

---

### ❓ ¿Cómo creo un usuario admin?

**Opción 1: Via Prisma Studio**
```bash
cd ~/amico-backend
npx prisma studio
```

Abre interfaz web en puerto 5555, crea usuario manualmente.

**Opción 2: Via seed script**
```bash
node seed-railway.js
```

Crea usuarios de prueba automáticamente.

---

### ❓ ¿Puedo usar otro puerto en lugar de 3000?

**SÍ.** Edita `.env`:
```bash
PORT=8080  # O cualquier puerto disponible
```

Reinicia:
```bash
pm2 restart amico-backend
```

---

### ❓ ¿Necesito configurar SSL/HTTPS?

**Para el frontend:** Bluehost maneja SSL automáticamente si tienes dominio.

**Para el backend (API):** Usa proxy reverso (Apache/Nginx) para redirigir `https://tudominio.com/api` al puerto 3000.

**Alternativa:** Deja backend en HTTP interno (solo accesible desde el servidor), y usa proxy.

---

### ❓ Error: "npm command not found"

**Causa:** Node.js no instalado o no en PATH

**Solución:**
1. Contacta soporte de Bluehost
2. O instala NVM:
   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 18
   ```

---

### ❓ ¿Cómo hago backup de la base de datos?

**PostgreSQL:**
```bash
pg_dump -U amico_user amico_db > backup-$(date +%Y%m%d).sql
```

**MongoDB Atlas:**
- Dashboard → Cluster → "..." → "Metrics" → "Backups"
- O usa `mongodump`

---

### ❓ ¿Puedo ver el proyecto funcionando antes de subirlo?

**SÍ.** Prueba localmente:

```bash
# Backend
cd backend
npm run dev

# Frontend (en otra terminal)
cd frontend
npm run dev
```

Accede a `http://localhost:5173`

---

### ❓ ¿Cuánto espacio ocupa el proyecto?

**Aproximado:**
- Backend dist/: ~10-20 MB
- Backend node_modules/: ~200-300 MB
- Frontend dist/: ~2-5 MB
- Base de datos: ~50-100 MB (depende de datos)

**Total:** ~500 MB aproximadamente

---

### ❓ ¿Necesito Redis?

**Opcional.** Redis se usa para:
- Cache de consultas frecuentes
- Gestión de colas de trabajos

**Sin Redis:** El sistema funciona, pero más lento.

**Con Redis:** Mejor rendimiento.

**En Bluehost:** Probablemente no tienen Redis. Usa alternativa:
- Comenta las líneas de Redis en código
- O usa servicio externo (Redis Labs - gratis hasta 30 MB)

---

## 📞 CONTACTO Y SOPORTE

### ❓ ¿A quién contacto si tengo problemas?

**Problemas de Bluehost:**
- Soporte técnico de Bluehost
- Chat en vivo 24/7
- Teléfono: en tu panel de Bluehost

**Problemas del código:**
- Revisa logs: `pm2 logs amico-backend`
- Consulta documentación en archivos `.md`
- GitHub Issues (si es open source)

---

## 📚 RECURSOS ADICIONALES

- [GUIA_DEPLOYMENT_BLUEHOST.md](GUIA_DEPLOYMENT_BLUEHOST.md) - Guía completa
- [DEPLOYMENT_RAPIDO.md](DEPLOYMENT_RAPIDO.md) - Guía rápida 3 pasos
- [FILEZILLA_VISUAL.md](FILEZILLA_VISUAL.md) - Guía visual FileZilla
- [DASHBOARD_ADMINISTRATIVO.md](backend/DASHBOARD_ADMINISTRATIVO.md) - Doc del dashboard

---

**¿Otra pregunta?** Consulta la documentación completa o contacta soporte.

**Última actualización:** 12 de noviembre, 2024
