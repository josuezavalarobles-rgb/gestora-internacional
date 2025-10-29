# 🔧 CONFIGURAR VARIABLES EN RAILWAY - EXACTO

## ❌ **ERROR QUE ESTÁS VIENDO:**
```
Error: Faltan variables de entorno requeridas:
DATABASE_URL, MONGODB_URI, OPENAI_API_KEY
```

---

## ✅ **SOLUCIÓN - PASO A PASO:**

### **PASO 1: Ir a Variables**

1. En Railway, haz clic en tu servicio **backend** (el cuadro principal)
2. Haz clic en la pestaña **"Variables"** (arriba)

---

### **PASO 2: Agregar Variables OBLIGATORIAS**

Haz clic en **"New Variable"** y agrega CADA UNA de estas:

#### **Variable 1: NODE_ENV**
```
Name: NODE_ENV
Value: production
```
Click "Add"

#### **Variable 2: JWT_SECRET**
```
Name: JWT_SECRET
Value: amico-secret-super-seguro-2024-produccion
```
Click "Add"

#### **Variable 3: CORS_ORIGIN**
```
Name: CORS_ORIGIN
Value: *
```
Click "Add"

#### **Variable 4: BOT_ENABLED**
```
Name: BOT_ENABLED
Value: false
```
Click "Add"

---

### **PASO 3: Conectar PostgreSQL**

Ahora viene lo IMPORTANTE - conectar las bases de datos:

1. Click **"New Variable"**
2. En lugar de escribir, busca el botón **"Add Reference"** o **"Variable Reference"**
3. Selecciona tu servicio de **Postgres**
4. Selecciona la variable **"DATABASE_URL"**
5. En el campo "Name" escribe: `DATABASE_URL`
6. Click "Add"

Esto conectará automáticamente PostgreSQL.

---

### **PASO 4: Conectar MongoDB**

1. Click **"New Variable"** otra vez
2. **"Add Reference"**
3. Selecciona tu servicio de **MongoDB**
4. Selecciona la variable **"MONGO_URL"** (o similar)
5. En el campo "Name" escribe: `MONGODB_URI`
6. Click "Add"

---

### **PASO 5: Conectar Redis**

1. Click **"New Variable"**
2. **"Add Reference"**
3. Selecciona tu servicio de **Redis**
4. Selecciona **"REDIS_URL"**
5. En el campo "Name" escribe: `REDIS_URL`
6. Click "Add"

---

### **PASO 6: OPENAI_API_KEY (IMPORTANTE)**

Esta es opcional pero recomendada:

#### **SI TIENES OpenAI API Key:**
```
Name: OPENAI_API_KEY
Value: sk-proj-tu-api-key-completa-aqui
```

#### **SI NO TIENES (temporal):**
```
Name: OPENAI_API_KEY
Value: sk-dummy-key-temporal
```

El bot no funcionará con IA, pero el resto del sistema sí.

---

### **PASO 7: Variables Adicionales**

Agrega también estas para evitar errores:

```
Name: API_VERSION
Value: v1
```

```
Name: REDIS_PASSWORD
Value: (dejar vacío)
```

```
Name: REDIS_DB
Value: 0
```

---

## ✅ **RESUMEN DE TODAS LAS VARIABLES:**

Al final deberías tener **MÍNIMO 10 variables**:

1. ✅ NODE_ENV = production
2. ✅ JWT_SECRET = (tu secreto)
3. ✅ CORS_ORIGIN = *
4. ✅ BOT_ENABLED = false
5. ✅ API_VERSION = v1
6. ✅ DATABASE_URL = ${{Postgres.DATABASE_URL}} (referencia)
7. ✅ MONGODB_URI = ${{MongoDB.MONGO_URL}} (referencia)
8. ✅ REDIS_URL = ${{Redis.REDIS_URL}} (referencia)
9. ✅ OPENAI_API_KEY = sk-... (tu key o dummy)
10. ✅ REDIS_DB = 0

---

## 🔄 **PASO 8: Redeploy**

Una vez agregadas TODAS las variables:

1. Ve a pestaña **"Deployments"**
2. Click **"Redeploy"** (o Deploy si dice así)
3. **Espera 5-10 minutos**

Verás en los logs:
```
✅ PostgreSQL conectado correctamente
✅ MongoDB conectado correctamente
✅ Redis conectado correctamente
✅ Servidor iniciado correctamente
```

---

## 📞 **SI VES OTRO ERROR:**

Cópiame el error completo y lo arreglamos al instante.

---

## 🎯 **SIGUIENTE:**

Una vez el backend funcione, dame la URL que Railway te da y procedemos con el frontend.

**¿Ya agregaste las variables?** Avísame cuando hagas el redeploy. 🚀
