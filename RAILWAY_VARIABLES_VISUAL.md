# 🎯 RAILWAY - CONFIGURAR VARIABLES PASO A PASO

## ✅ **LO QUE TIENES:**
- Código en GitHub ✅
- API Key de OpenAI ✅
- Railway proyecto creado ✅

## ❌ **EL PROBLEMA:**
Faltan: `DATABASE_URL` y `MONGODB_URI`

---

## 🔧 **SOLUCIÓN - MÉTODO FÁCIL (Raw Editor):**

### **PASO 1: Abrir Raw Editor**

1. En Railway, haz clic en tu servicio **backend**
2. Ve a pestaña **"Variables"**
3. Arriba a la derecha verás un botón que dice **"Raw Editor"**
4. Haz clic en **"Raw Editor"**

---

### **PASO 2: Pegar TODAS las Variables**

Verás un editor de texto. **BORRA TODO** y pega esto:

```env
NODE_ENV=production
JWT_SECRET=amico-production-secret-2024-super-seguro
JWT_REFRESH_SECRET=amico-refresh-secret-2024
CORS_ORIGIN=*
BOT_ENABLED=false
API_VERSION=v1

OPENAI_API_KEY=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
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_MAX_TOKENS=1000
OPENAI_TEMPERATURE=0.7

WHATSAPP_SESSION_NAME=amico-production
WHATSAPP_BUSINESS_NAME=Amico Management

SLA_GARANTIA_HORAS=24
SLA_CONDOMINIO_HORAS=72
SLA_URGENTE_HORAS=4

TZ=America/Santo_Domingo
LOG_LEVEL=info
LOG_FORMAT=json

NOTIFICATIONS_ENABLED=true
FEATURE_AI_CLASSIFICATION=true
FEATURE_AUTO_ASSIGNMENT=true
```

Click **"Update Variables"**

---

### **PASO 3: Agregar Referencias de Bases de Datos**

Ahora sal del Raw Editor y agrega las referencias a las BD:

#### **A. DATABASE_URL:**

1. Click **"New Variable"**
2. **Variable Name**: `DATABASE_URL`
3. En el campo "Value", verás un ícono **🔗** (link/referencia)
4. Haz clic en ese ícono 🔗
5. Selecciona el servicio **"Postgres"**
6. Selecciona la variable **"DATABASE_URL"**
7. Click **"Add"**

Verás que ahora dice:
```
DATABASE_URL = ${{Postgres.DATABASE_URL}}
```

#### **B. MONGODB_URI:**

1. Click **"New Variable"**
2. **Variable Name**: `MONGODB_URI`
3. Haz clic en el ícono 🔗 (referencia)
4. Selecciona el servicio **"MongoDB"**
5. Selecciona la variable **"MONGO_URL"** (o como se llame)
6. Click **"Add"**

Verás:
```
MONGODB_URI = ${{MongoDB.MONGO_URL}}
```

#### **C. REDIS_URL (Opcional pero recomendado):**

1. Click **"New Variable"**
2. **Variable Name**: `REDIS_URL`
3. Haz clic en el ícono 🔗
4. Selecciona **"Redis"**
5. Selecciona **"REDIS_URL"**
6. Click **"Add"**

---

## ✅ **VERIFICAR QUE TENGAS TODAS:**

En la pestaña Variables deberías ver aproximadamente **20-25 variables** en total, incluyendo:

**Variables manuales:**
- NODE_ENV
- JWT_SECRET
- OPENAI_API_KEY
- CORS_ORIGIN
- BOT_ENABLED
- etc.

**Variables de referencias (con ${{...}}):**
- DATABASE_URL = ${{Postgres.DATABASE_URL}}
- MONGODB_URI = ${{MongoDB.MONGO_URL}}
- REDIS_URL = ${{Redis.REDIS_URL}}

---

## 🔄 **PASO 4: REDEPLOY**

1. Ve a pestaña **"Deployments"**
2. Click el botón morado que dice **"Deploy"** o **"Redeploy"**
3. Verás los logs en tiempo real

**Espera 5-10 minutos**

---

## ✅ **LO QUE DEBERÍAS VER EN LOS LOGS:**

```
[INFO] Conectando a bases de datos...
[INFO] ✅ PostgreSQL conectado correctamente
[INFO] ✅ MongoDB conectado correctamente
[INFO] ✅ Redis conectado correctamente
[INFO] ✅ Servidor iniciado correctamente
[INFO] 🚀 API disponible en: http://localhost:3000
```

---

## 🎉 **CUANDO TERMINE:**

1. Ve a **Settings** → **Networking**
2. Click **"Generate Domain"**
3. Te dará una URL como: `https://amico-backend-production.up.railway.app`
4. Prueba: `https://tu-url/health`

Debe responder:
```json
{"status":"ok","environment":"production"}
```

---

## 📞 **SI HAY ERROR:**

Copia el error completo de los logs y pégamelo. Lo arreglamos al instante.

---

## 💡 **TIP:**

Si no encuentras el ícono 🔗 de referencia, busca un menú dropdown o botón que diga:
- "Service Reference"
- "Add Reference"
- "Link to Database"

**¿Ya agregaste las variables?** Avísame cuando hagas el redeploy. 🚀
