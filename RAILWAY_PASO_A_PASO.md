# 🚂 RAILWAY - PASO A PASO EXACTO

## ✅ **PREPARACIÓN COMPLETADA:**
- ✅ Código en GitHub: https://github.com/josuezavalarobles-rgb/amico-management
- ✅ Railway.json configurado correctamente
- ✅ Package.json con tsx para producción

---

## 🎯 **AHORA HAZ ESTO EN RAILWAY:**

### **PASO 1: Crear Proyecto** (2 min)

1. Abre: **https://railway.app/dashboard**
2. Click **"New Project"** (botón morado)
3. Selecciona **"Deploy from GitHub repo"**
4. Busca y selecciona: **`amico-management`**
5. Railway empezará a deployar automáticamente

⏱️ **Espera 1-2 minutos** mientras Railway clona el repo.

---

### **PASO 2: Configurar Root Directory** (1 min)

Cuando termine de clonar:

1. Click en el servicio que se creó (dirá "amico-management")
2. Ve a pestaña **"Settings"**
3. Scroll hasta **"Service"** → **"Root Directory"**
4. Escribe: `backend`
5. **NO TOQUES** "Build Command" ni "Start Command" (están en railway.json)

---

### **PASO 3: Agregar PostgreSQL** (1 min)

En la pantalla del proyecto (NO dentro del servicio):

1. Click **"New"** (botón morado arriba a la derecha)
2. **"Database"**
3. **"Add PostgreSQL"**
4. Espera 30 segundos a que se cree

Verás un nuevo bloque morado que dice "Postgres"

---

### **PASO 4: Agregar MongoDB** (1 min)

1. Click **"New"** otra vez
2. **"Database"**
3. **"Add MongoDB"**
4. Espera 30 segundos

Verás otro bloque que dice "MongoDB"

---

### **PASO 5: Agregar Redis** (1 min)

1. Click **"New"** otra vez
2. **"Database"**
3. **"Add Redis"**
4. Espera 30 segundos

Ahora tienes 4 bloques:
- Tu servicio backend
- Postgres
- MongoDB
- Redis

---

### **PASO 6: Variables de Entorno** (2 min)

1. Click en tu servicio **backend** (el primer bloque)
2. Ve a pestaña **"Variables"**
3. Click **"+ New Variable"**

Agrega estas variables UNA POR UNA:

```
Variable: NODE_ENV
Value: production
```

```
Variable: JWT_SECRET
Value: amico-super-secret-production-2024-cambiar-esto
```

```
Variable: CORS_ORIGIN
Value: *
```

```
Variable: BOT_ENABLED
Value: false
```

4. Las bases de datos se conectan automáticamente (Railway agrega las variables DATABASE_URL, MONGODB_URI, etc.)

---

### **PASO 7: Deploy** (5-10 min)

1. Ve a pestaña **"Deployments"**
2. Click **"Deploy"** (botón morado arriba)
3. **Espera** mientras hace el build y deploy

Verás logs en tiempo real:
```
Installing dependencies...
Running prisma generate...
Running prisma migrate deploy...
Starting server...
✅ Deploy successful
```

---

### **PASO 8: Obtener URL** (30 seg)

Cuando el deploy termine:

1. Ve a pestaña **"Settings"**
2. Busca **"Networking"** → **"Public Networking"**
3. Click **"Generate Domain"**
4. Te dará una URL como: `https://amico-backend-production.up.railway.app`

---

### **PASO 9: Probar** (1 min)

Abre en el navegador:
```
https://TU-URL-AQUI.up.railway.app/health
```

Debe responder:
```json
{"status":"ok", "timestamp":"...", "environment":"production"}
```

✅ **Si ves esto, el backend está funcionando en producción!**

---

## 🎨 **DESPUÉS: Deploy del Frontend**

Una vez el backend funcione, haremos lo mismo para el frontend (5 min más).

---

## ⏱️ **TIEMPO TOTAL:**

- Paso 1-2: 3 min
- Paso 3-5: 3 min
- Paso 6: 2 min
- Paso 7: 5-10 min (automático)
- Paso 8-9: 1 min

**Total: 15-20 minutos**

---

## 📞 **AVÍSAME:**

**¿En qué paso estás?**

- "Estoy creando el proyecto" → Te espero
- "Ya hice el deploy" → Dame la URL para probar
- "Tengo un error" → Dime cuál y lo arreglamos

🚀 **¡Vamos a poner tu sistema en internet!**
