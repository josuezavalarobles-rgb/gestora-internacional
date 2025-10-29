# 🚀 SUBIR AMICO MANAGEMENT A PRODUCCIÓN

## 📋 **RESUMEN:**
Tu sistema está funcionando localmente. Ahora lo subiremos a internet para que esté disponible 24/7.

---

## 🎯 **OPCIONES DE HOSTING:**

### ⭐ **OPCIÓN 1: RAILWAY.APP (Recomendado - Más Fácil)**

**Por qué Railway**:
- ✅ Setup en 20 minutos
- ✅ $5/mes para empezar
- ✅ PostgreSQL, MongoDB, Redis incluidos
- ✅ Deploy automático con Git
- ✅ SSL gratis
- ✅ No requiere conocimientos de DevOps

**Costo mensual**: ~$15-25/mes (todo incluido)

---

### 💪 **OPCIÓN 2: DIGITALOCEAN VPS**

**Por qué DigitalOcean**:
- ✅ $6/mes (más barato)
- ✅ Control total del servidor
- ✅ Sin límites de recursos

**Desventajas**:
- ⚠️ Requiere configuración manual
- ⚠️ Necesitas saber SSH y Linux básico
- ⚠️ Setup: 2-3 horas

**Costo mensual**: ~$6-12/mes + trabajo manual

---

### 🏠 **OPCIÓN 3: TU BLUEHOST (NO Recomendado)**

**Por qué NO**:
- ❌ Bluehost shared NO soporta Node.js
- ❌ Necesitarías upgrade a VPS ($20/mes)
- ❌ Más caro que Railway
- ❌ Menos features

---

## ✅ **MI RECOMENDACIÓN: RAILWAY.APP**

Es la opción perfecta para ti porque:
1. No necesitas ser experto en servidores
2. Todo está incluido (BD, hosting, SSL)
3. Deploy en 20 minutos
4. Precio razonable

---

## 📝 **PLAN DE DEPLOYMENT CON RAILWAY:**

### **PASO 1: Preparar el código** (10 minutos)

```bash
# 1. Ir a la carpeta del proyecto
cd c:\Users\josue\mis-sitios-bluehost\public_html\amico

# 2. Inicializar Git
git init

# 3. Agregar archivos
git add .

# 4. Commit inicial
git commit -m "Sistema Amico Management - Primera versión"
```

---

### **PASO 2: Subir a GitHub** (10 minutos)

1. **Ir a GitHub**: https://github.com
2. **Login** o crear cuenta (gratis)
3. **New Repository**:
   - Name: `amico-management`
   - Description: `Sistema de Gestión de Condominios`
   - Private (recomendado)
   - NO inicializar con README
4. **Crear repositorio**

5. **Conectar y subir**:
```bash
# Conectar con GitHub
git remote add origin https://github.com/TU-USUARIO/amico-management.git

# Subir código
git branch -M main
git push -u origin main
```

---

### **PASO 3: Crear cuenta en Railway** (5 minutos)

1. **Ir a**: https://railway.app
2. **Login with GitHub**
3. **Autorizar** Railway

---

### **PASO 4: Deploy Backend** (5 minutos)

En Railway:

1. **New Project** → **Deploy from GitHub**
2. **Seleccionar**: `amico-management` repo
3. **Configure**:
   - Root Directory: `backend`
   - Build Command: `npm run build`
   - Start Command: `npm start`

4. **Add Services**:
   - Click **New** → **Database** → **PostgreSQL**
   - Click **New** → **Database** → **MongoDB**
   - Click **New** → **Database** → **Redis**

---

### **PASO 5: Variables de Entorno** (5 minutos)

En Railway → Tu servicio backend → **Variables**:

```env
NODE_ENV=production
PORT=3000

# Railway auto-provee estas (las verás en cada servicio):
DATABASE_URL=${{Postgres.DATABASE_URL}}
MONGODB_URI=${{MongoDB.MONGO_URL}}
REDIS_URL=${{Redis.REDIS_URL}}

# Agregar manualmente:
JWT_SECRET=tu-clave-super-secreta-produccion-cambiar
OPENAI_API_KEY=sk-tu-api-key-de-openai
CORS_ORIGIN=https://amico.up.railway.app
BOT_ENABLED=true

# WhatsApp (por ahora dejar deshabilitado)
WHATSAPP_SESSION_NAME=amico-production
```

---

### **PASO 6: Deploy Frontend** (5 minutos)

En Railway:

1. **New Service** → **GitHub Repo**
2. **Same repo**: `amico-management`
3. **Configure**:
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Start Command: `npm run preview`

4. **Variables**:
```env
VITE_API_URL=https://tu-backend.up.railway.app/api/v1
```

---

### **PASO 7: Migrar Base de Datos** (5 minutos)

Railway ejecutará las migraciones automáticamente, pero verifica:

```bash
# En la terminal de Railway (dentro del servicio backend)
npx prisma migrate deploy
npx tsx src/database/seeds/seed.ts
```

---

## 🌐 **RESULTADO FINAL:**

Tendrás 2 URLs:

```
https://amico-backend.up.railway.app    → Backend API
https://amico-frontend.up.railway.app   → Panel Web
```

**Con SSL gratis y funcionando 24/7** ✅

---

## 💰 **COSTOS MENSUALES:**

Railway pricing:
- **Starter**: $5/mes
- **PostgreSQL**: $5/mes
- **MongoDB**: Gratis (hasta 512MB)
- **Redis**: Gratis (hasta 100MB)
- **OpenAI API**: $20-50/mes (según uso)

**Total estimado**: $30-60/mes

**Alternativa más barata**: Desactivar OpenAI temporalmente ($10/mes total)

---

## 🔧 **ALTERNATIVA: BLUEHOST**

Si quieres aprovechar tu Bluehost actual:

### **Frontend estático** en Bluehost:
```bash
# Build del frontend
cd frontend
npm run build

# Subir la carpeta dist/ a tu Bluehost vía FTP
# En: public_html/amico
```

### **Backend** en Railway:
- Solo el backend en Railway ($10/mes)
- Frontend servido desde Bluehost (gratis, ya lo pagas)

**Total**: $10-15/mes

---

## 📞 **SIGUIENTE PASO INMEDIATO:**

### **¿Tienes cuenta en GitHub?**

**SÍ** → Procedemos a subir el código ahora
**NO** → Creamos cuenta primero (2 minutos)

---

## 🎯 **RESUMEN DE LO QUE HAREMOS:**

```
1. Git init                      (1 comando)
2. Git commit                    (1 comando)
3. Crear repo GitHub             (clic clic)
4. Git push                      (1 comando)
5. Railway login                 (clic)
6. Deploy backend                (clic clic)
7. Agregar bases de datos        (clic clic clic)
8. Variables de entorno          (copy paste)
9. Deploy frontend               (clic clic)
10. ¡Sistema en vivo! 🎉        (20 min total)
```

---

## ⚡ **¿EMPEZAMOS A SUBIR A PRODUCCIÓN?**

Opción A: **Railway** (fácil, 20 min)
Opción B: **DigitalOcean** (más trabajo, 2-3 horas)
Opción C: **Hybrid** (Frontend en Bluehost + Backend en Railway)

**¿Cuál prefieres?**

Recomiendo **Railway** para tener todo funcionando rápido. 🚀
