# 🚀 EMPEZAR AHORA - GUÍA PERSONALIZADA

## ✅ LO QUE TIENES
- Node.js v20.11.0 ✅
- npm v10.2.4 ✅
- Código completo del proyecto ✅

## ❌ LO QUE NECESITAS INSTALAR
- Docker Desktop (para bases de datos)

---

## 📝 PASO 1: INSTALAR DOCKER DESKTOP (5 minutos)

### Windows:

1. **Descargar Docker Desktop**
   - Ve a: https://www.docker.com/products/docker-desktop/
   - Haz clic en "Download for Windows"
   - Ejecuta el instalador

2. **Instalar**
   - Sigue el instalador (dejar opciones por defecto)
   - Reiniciar PC si lo pide

3. **Verificar**
   ```bash
   docker --version
   ```

**¿Por qué Docker?**
Para tener PostgreSQL, MongoDB y Redis sin instalar cada uno manualmente.

---

## 🎯 PASO 2: INSTALAR DEPENDENCIAS DEL PROYECTO (3 minutos)

```bash
# Navegar al backend
cd c:\Users\josue\mis-sitios-bluehost\public_html\amico\backend

# Instalar dependencias
npm install
```

Esto instalará todas las librerías necesarias (~200MB).

---

## 🗄️ PASO 3: LEVANTAR BASES DE DATOS (1 minuto)

```bash
# Volver a la raíz del proyecto
cd c:\Users\josue\mis-sitios-bluehost\public_html\amico

# Levantar contenedores Docker
docker-compose up -d
```

Esto iniciará:
- ✅ PostgreSQL (puerto 5432)
- ✅ MongoDB (puerto 27017)
- ✅ Redis (puerto 6379)

Verificar que estén corriendo:
```bash
docker ps
```

---

## ⚙️ PASO 4: CONFIGURAR VARIABLES DE ENTORNO (2 minutos)

```bash
cd backend
copy .env.example .env
```

Abre el archivo `.env` y edita:

```env
# BÁSICO (dejar como está)
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/amico_db
MONGODB_URI=mongodb://localhost:27017/amico_logs
REDIS_URL=redis://localhost:6379

# JWT (cambiar por algo secreto)
JWT_SECRET=tu-clave-super-secreta-cambiar-esto-12345

# IMPORTANTE: OpenAI API Key (si tienes)
OPENAI_API_KEY=sk-tu-api-key-aqui

# Si NO tienes API key de OpenAI, puedes empezar sin ella
# El bot funcionará con respuestas básicas hasta que la agregues
```

**¿Dónde consigo OpenAI API Key?**
- Ve a: https://platform.openai.com/api-keys
- Crea una cuenta (gratis)
- Genera una API key
- Costo: ~$5 inicial, ~$20-50/mes en uso normal

---

## 🗄️ PASO 5: CREAR BASE DE DATOS (1 minuto)

```bash
# Generar cliente de Prisma
npx prisma generate

# Crear tablas en PostgreSQL
npx prisma migrate dev --name init
```

Esto creará todas las tablas necesarias.

---

## 🚀 PASO 6: ¡INICIAR EL SISTEMA! (30 segundos)

```bash
npm run dev
```

Deberías ver:

```
╔══════════════════════════════════════════╗
║     AMICO MANAGEMENT - BACKEND API       ║
║   Sistema de Gestión de Condominios     ║
╚══════════════════════════════════════════╝

✅ PostgreSQL conectado correctamente
✅ MongoDB conectado correctamente
✅ Redis conectado correctamente
✅ Middlewares inicializados
✅ Rutas inicializadas
✅ WebSockets inicializados
📱 Iniciando WhatsApp Bot...

🔌 Esperando conexión WhatsApp...
📱 QR Code generado. Escanea con WhatsApp.
```

---

## 📱 PASO 7: CONECTAR WHATSAPP (30 segundos)

Verás un **QR CODE en la terminal** (cuadrado con puntos).

1. Abre WhatsApp en tu teléfono
2. Ve a **Configuración** → **Dispositivos vinculados**
3. Toca **Vincular un dispositivo**
4. Escanea el QR de la terminal

Cuando conecte verás:
```
✅ WhatsApp conectado correctamente
```

---

## ✅ PASO 8: ¡PROBAR! (1 minuto)

### Prueba 1: Health Check

Abre tu navegador:
```
http://localhost:3000/health
```

Deberías ver:
```json
{
  "status": "ok",
  "timestamp": "...",
  "uptime": 12.34,
  "environment": "development"
}
```

### Prueba 2: Enviar mensaje de WhatsApp

Desde TU teléfono (el mismo que escaneó el QR), envía un mensaje a cualquier número:
```
Hola
```

El bot responderá automáticamente.

O mejor, desde OTRO teléfono, envía "Hola" al número que conectaste.

### Prueba 3: Ver Base de Datos

```bash
npx prisma studio
```

Se abrirá en: http://localhost:5555

Aquí puedes ver todas las tablas y datos.

---

## 🎉 ¡FUNCIONANDO!

Tu sistema está vivo en tu PC local.

---

## 🌍 AHORA: SUBIR A TU HOSTING

Veo que tienes acceso a Bluehost. Necesitamos revisar:

1. **¿Qué tipo de hosting tienes?**
   - ¿Shared hosting?
   - ¿VPS?
   - ¿Dedicado?

2. **¿Tiene Node.js instalado?**
   - La mayoría de shared hosting NO soporta Node.js
   - Necesitarías VPS o hosting especializado

3. **¿Tiene acceso SSH?**
   - Para instalar dependencias y configurar

**Opciones para subir a producción:**

### Opción A: VPS Económico (Recomendado)
- **DigitalOcean**: $6/mes (Droplet más pequeño)
- **Linode**: $5/mes
- **Vultr**: $6/mes
- **Railway.app**: Gratis para empezar, luego pago por uso

### Opción B: Serverless (Más caro pero escalable)
- **Vercel**: Gratis para frontend, backend con límites
- **Railway**: $5/mes para empezar
- **Render**: Gratis pero lento, $7/mes plan básico

### Opción C: Tu Bluehost (Si soporta Node.js)
- Necesitamos verificar si tiene Node.js
- Necesitamos acceso SSH

---

## 📊 PLAN SUGERIDO

### HOY (Local):
1. ✅ Instalar Docker
2. ✅ Levantar sistema localmente
3. ✅ Conectar WhatsApp
4. ✅ Probar funcionamiento

### MAÑANA (Producción):
1. Decidir hosting (VPS recomendado)
2. Configurar servidor
3. Subir código
4. Configurar bases de datos en cloud
5. Conectar WhatsApp Business API (opcional, más profesional)

---

## 💰 COSTOS MENSUALES ESTIMADOS

### Desarrollo Local (Actual):
- $0 (todo gratis excepto OpenAI)

### Producción Mínima:
- VPS: $5-10/mes
- OpenAI API: $20-50/mes (según uso)
- WhatsApp Baileys: $0 (gratis)
- **Total**: ~$30-60/mes

### Producción Profesional:
- VPS: $20/mes (más potente)
- MongoDB Atlas: $0-25/mes (plan gratis suficiente al inicio)
- OpenAI API: $50-100/mes
- WhatsApp Business API (Twilio/360Dialog): $50-200/mes
- **Total**: ~$120-345/mes

---

## 🚨 IMPORTANTE AHORA

**PRIMERO**: Instala Docker y pon el sistema funcionando localmente.

**DESPUÉS**: Hablamos de producción.

---

## ❓ ¿PREGUNTAS FRECUENTES?

### ¿Puedo usar sin OpenAI API Key?
Sí, pero el bot será muy básico. Mejor tener la API key.

### ¿El QR de WhatsApp expira?
No, una vez conectado permanece conectado. Solo necesitas escanearlo una vez.

### ¿Puedo usar mi número personal de WhatsApp?
Sí, pero recomiendo un número dedicado para el negocio.

### ¿Cómo detengo el sistema?
- Backend: `Ctrl + C` en la terminal
- Docker: `docker-compose down`

### ¿Los datos se pierden al cerrar?
No, Docker guarda los datos en volúmenes persistentes.

---

## 📞 SIGUIENTE PASO

**Ejecuta esto ahora:**

```bash
# 1. Descargar Docker Desktop
# https://www.docker.com/products/docker-desktop/

# 2. Después de instalar Docker, ejecuta:
cd c:\Users\josue\mis-sitios-bluehost\public_html\amico\backend
npm install

# 3. Levantar bases de datos
cd ..
docker-compose up -d

# 4. Configurar entorno
cd backend
copy .env.example .env

# 5. Crear BD
npx prisma generate
npx prisma migrate dev --name init

# 6. Iniciar
npm run dev
```

---

**¡Avísame cuando tengas Docker instalado y corramos el sistema juntos! 🚀**
