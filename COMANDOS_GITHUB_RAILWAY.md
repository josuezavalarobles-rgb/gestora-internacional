# ⚡ COMANDOS PARA SUBIR A GITHUB Y RAILWAY

## 📝 **PASO 1: Subir a GitHub**

Una vez que tengas la URL de tu repositorio GitHub, ejecuta:

```bash
# 1. Ir al proyecto
cd c:\Users\josue\mis-sitios-bluehost\public_html\amico

# 2. Conectar con GitHub (REEMPLAZA con TU URL)
git remote add origin https://github.com/TU-USUARIO/amico-management.git

# 3. Verificar conexión
git remote -v

# 4. Subir código
git push -u origin main
```

Si te pide autenticación:
- Usuario: Tu usuario de GitHub
- Password: Tu **Personal Access Token** (no tu password normal)

**¿No tienes Token?**
1. GitHub → Settings → Developer Settings → Personal Access Tokens → Tokens (classic)
2. Generate new token
3. Scope: `repo` (marcar)
4. Copiar token y usarlo como password

---

## 🚂 **PASO 2: Deploy en Railway**

### **A. Crear Proyecto:**

1. Ve a: https://railway.app/dashboard
2. Click **"New Project"**
3. **"Deploy from GitHub repo"**
4. Selecciona: `amico-management`

### **B. Configurar Backend:**

Railway detectará Node.js automáticamente.

**Settings del servicio**:
- Root Directory: `backend`
- Build Command: `npm install && npx prisma generate && npm run build`
- Start Command: `npm start`

### **C. Agregar Bases de Datos:**

En el mismo proyecto:

1. **New** → **Database** → **PostgreSQL** → Add
2. **New** → **Database** → **MongoDB** → Add
3. **New** → **Database** → **Redis** → Add

Railway las conectará automáticamente al backend.

### **D. Variables de Entorno del Backend:**

Click en backend → **Variables** → Agregar:

```env
NODE_ENV=production
PORT=3000

# Railway conecta automáticamente las BD con estas referencias:
DATABASE_URL=${{Postgres.DATABASE_URL}}
MONGODB_URI=${{MongoDB.MONGO_URL}}
REDIS_URL=${{Redis.REDIS_URL}}

# Agregar manualmente:
JWT_SECRET=amico-production-2024-super-secret-key-123456
JWT_REFRESH_SECRET=amico-refresh-production-key-987654

OPENAI_API_KEY=sk-tu-api-key-aqui

BOT_ENABLED=false
WHATSAPP_SESSION_NAME=amico-production

CORS_ORIGIN=*

API_VERSION=v1
LOG_LEVEL=info
LOG_FORMAT=json

SLA_GARANTIA_HORAS=24
SLA_CONDOMINIO_HORAS=72
SLA_URGENTE_HORAS=4

TZ=America/Santo_Domingo
```

### **E. Deploy Frontend:**

1. **New Service** → **GitHub Repo** → `amico-management`
2. **Settings**:
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Start Command: (dejar vacío)

3. **Variables**:
```env
# IMPORTANTE: Reemplazar con la URL REAL de tu backend
VITE_API_URL=https://amico-backend-production.up.railway.app/api/v1
VITE_WS_URL=https://amico-backend-production.up.railway.app
```

### **F. Migrar Base de Datos:**

En Railway → Backend → **Terminal**:

```bash
npx prisma migrate deploy
npx tsx src/database/seeds/seed.ts
```

---

## ✅ **VERIFICACIÓN:**

1. **Backend**: https://tu-backend.up.railway.app/health
   - Debe responder: `{"status":"ok"}`

2. **Frontend**: https://tu-frontend.up.railway.app
   - Debe mostrar el dashboard

3. **API**: https://tu-backend.up.railway.app/api/v1/casos
   - Debe mostrar los 7 casos

---

## 🎯 **ORDEN DE EJECUCIÓN:**

```
1. Crear repo en GitHub (Web)               ✅
2. git remote add origin [URL]              (Comando)
3. git push -u origin main                  (Comando)
4. Railway → New Project                    (Web)
5. Deploy from GitHub                       (Web)
6. Agregar PostgreSQL, MongoDB, Redis       (Web)
7. Configurar variables de entorno          (Web)
8. Deploy frontend                          (Web)
9. Ejecutar migraciones                     (Railway Terminal)
10. ¡Listo! Sistema en vivo 🎉
```

---

## 💡 **TIPS:**

- Railway toma ~5 minutos en hacer el primer deploy
- Verás logs en tiempo real
- Si algo falla, Railway te muestra el error
- Puedes redeployar cuantas veces quieras

---

## 📞 **¿TIENES LA URL DE GITHUB?**

Pégala aquí y ejecuto los comandos para subir el código.

Ejemplo:
```
https://github.com/josueamico/amico-management.git
```

**Dame tu URL y continuamos!** 🚀
