# 🚀 PASOS FINALES - SUBIR A PRODUCCIÓN

## ✅ **LO QUE YA ESTÁ LISTO:**

- ✅ Código completo (75 archivos, 27,859 líneas)
- ✅ Git inicializado y commit creado
- ✅ Sistema funcionando localmente
- ✅ Frontend: http://localhost:5175
- ✅ Backend: http://localhost:3000

---

## 📝 **AHORA HAREMOS ESTO (20 minutos):**

### **PASO 1: Crear Repositorio en GitHub** (5 min)

1. Ve a: **https://github.com**
2. **Login** (o crea cuenta si no tienes)
3. Click en **"New repository"** (botón verde)
4. Configurar:
   ```
   Repository name: amico-management
   Description: Sistema de Gestión de Condominios con IA
   Visibility: Private (recomendado) o Public
   ❌ NO marcar "Add README"
   ❌ NO marcar ".gitignore"
   ❌ NO marcar "license"
   ```
5. Click **"Create repository"**

6. **Copiar la URL** que te muestra (algo como):
   ```
   https://github.com/TU-USUARIO/amico-management.git
   ```

---

### **PASO 2: Subir código a GitHub** (2 min)

Ejecuta estos comandos **UNO POR UNO**:

```bash
# 1. Conectar con GitHub (usa TU URL)
cd c:\Users\josue\mis-sitios-bluehost\public_html\amico
git remote add origin https://github.com/TU-USUARIO/amico-management.git

# 2. Renombrar branch a main
git branch -M main

# 3. Subir código
git push -u origin main
```

Te pedirá autenticación de GitHub (usa token o login).

---

### **PASO 3: Crear cuenta en Railway** (3 min)

1. Ve a: **https://railway.app**
2. Click **"Login with GitHub"**
3. **Autorizar** Railway con tu cuenta GitHub
4. **Verificar email** si te lo pide

---

### **PASO 4: Deploy Backend en Railway** (5 min)

1. En Railway, click **"New Project"**
2. **"Deploy from GitHub repo"**
3. Selecciona **`amico-management`**
4. Railway detectará Node.js

**Configurar el servicio**:
- Click en **Settings**
- **Root Directory**: `backend`
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Watch Paths**: `backend/**`

---

### **PASO 5: Agregar Bases de Datos** (3 min)

En el mismo proyecto de Railway:

1. Click **"New"** → **"Database"** → **"Add PostgreSQL"**
   - Railway lo conectará automáticamente

2. Click **"New"** → **"Database"** → **"Add MongoDB"**
   - Railway lo conectará automáticamente

3. Click **"New"** → **"Database"** → **"Add Redis"**
   - Railway lo conectará automáticamente

---

### **PASO 6: Variables de Entorno del Backend** (5 min)

Click en tu servicio **backend** → **Variables**

Agrega estas variables:

```env
# Las bases de datos se auto-conectan, pero agrega:
NODE_ENV=production
PORT=3000

JWT_SECRET=amico-production-secret-key-super-segura-123456789
JWT_REFRESH_SECRET=amico-refresh-secret-production-987654321

OPENAI_API_KEY=sk-tu-api-key-aqui

BOT_ENABLED=false
WHATSAPP_SESSION_NAME=amico-production

CORS_ORIGIN=https://tu-frontend.up.railway.app

API_VERSION=v1
LOG_LEVEL=info
```

Click **"Deploy"** - Railway desplegará automáticamente.

---

### **PASO 7: Deploy Frontend** (3 min)

1. En Railway, **"New Service"** → **"GitHub Repo"**
2. Mismo repo: **`amico-management`**
3. **Configure**:
   - Root Directory: `frontend`
   - Install Command: `npm install`
   - Build Command: `npm run build`
   - Start Command: (vacío - Railway lo detecta)

4. **Variables**:
```env
VITE_API_URL=https://tu-backend-url.up.railway.app/api/v1
```

(Reemplaza con la URL real de tu backend que Railway te da)

---

### **PASO 8: Migrar Base de Datos** (2 min)

En Railway, abre la **terminal** de tu servicio backend:

```bash
npx prisma migrate deploy
npx tsx src/database/seeds/seed.ts
```

Esto creará las tablas y datos de prueba.

---

## 🎉 **¡LISTO! SISTEMA EN PRODUCCIÓN**

Tendrás 2 URLs:

```
https://amico-backend-XXXXX.up.railway.app     → API
https://amico-frontend-XXXXX.up.railway.app    → Panel Web
```

**Funcionando 24/7 con SSL gratis** ✅

---

## 💰 **COSTOS:**

Railway te dará **$5 de crédito gratis** para probar.

Después:
- **$5/mes**: Servicio básico
- **$5/mes**: PostgreSQL
- **$0**: MongoDB (plan gratis)
- **$0**: Redis (plan gratis)
- **$20-50/mes**: OpenAI (según uso)

**Total**: ~$30-60/mes

---

## 🔧 **CONFIGURAR TU DOMINIO (Opcional)**

Si tienes un dominio:

1. En Railway → tu servicio → **Settings** → **Networking**
2. **Add Custom Domain**
3. Agregar: `app.tudominio.com`
4. Configurar DNS en tu proveedor:
   ```
   CNAME app  →  xxxxx.up.railway.app
   ```

---

## 📞 **¿LISTO PARA SUBIR A GITHUB Y RAILWAY?**

**Necesitas**:
1. Cuenta en GitHub (gratis)
2. Cuenta en Railway (gratis para empezar)

**Si ya tienes GitHub**, empezamos ahora.
**Si NO**, creamos cuenta primero (2 minutos).

---

## 🎯 **SIGUIENTE COMANDO:**

Dime:
- **"Tengo GitHub"** → Procedemos a subir código
- **"No tengo GitHub"** → Te guío a crear cuenta
- **"Prefiero DigitalOcean VPS"** → Te doy guía de VPS
- **"Quiero usar Bluehost"** → Te explico cómo

**¿Qué opción eliges?** 😊
