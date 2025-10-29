# ✅ TODO HOY - DARLE VIDA AL SISTEMA

## 🎯 OBJETIVO: Sistema funcionando en tu PC en 1 hora

---

## PASO 1: INSTALAR DOCKER (10 minutos)

### ¿Qué es Docker?
Un programa que corre "contenedores" (mini-computadoras virtuales). Lo usaremos para tener PostgreSQL, MongoDB y Redis sin instalar cada uno manualmente.

### Instrucciones:

1. **Descargar**:
   - Abre tu navegador
   - Ve a: https://www.docker.com/products/docker-desktop/
   - Clic en **"Download for Windows"**
   - Espera la descarga (~500MB)

2. **Instalar**:
   - Ejecuta el archivo descargado
   - Acepta los términos
   - Deja las opciones por defecto
   - Clic en "Install"
   - Espera (5-7 minutos)

3. **Reiniciar** (si lo pide)

4. **Verificar**:
   ```bash
   docker --version
   ```
   Deberías ver algo como: `Docker version 24.0.6...`

5. **Iniciar Docker Desktop**:
   - Busca "Docker Desktop" en el menú de Windows
   - Ábrelo
   - Espera que termine de iniciar (ícono de ballena en la bandeja)

**Estado**: ⬜ → ✅

---

## PASO 2: INSTALAR DEPENDENCIAS DEL PROYECTO (5 minutos)

Abre **PowerShell** o **CMD** y ejecuta:

```bash
# Navegar al proyecto
cd c:\Users\josue\mis-sitios-bluehost\public_html\amico\backend

# Instalar dependencias (toma 3-5 minutos)
npm install
```

Verás muchas líneas instalando paquetes. Es normal.

Al final verás:
```
added 523 packages, and audited 524 packages in 2m
```

**Estado**: ⬜ → ✅

---

## PASO 3: LEVANTAR BASES DE DATOS (2 minutos)

```bash
# Volver a la raíz del proyecto
cd c:\Users\josue\mis-sitios-bluehost\public_html\amico

# Levantar contenedores Docker
docker-compose up -d
```

Verás:
```
Creating network "amico-network" ... done
Creating amico-postgres ... done
Creating amico-mongodb  ... done
Creating amico-redis    ... done
Creating amico-adminer  ... done
```

**Verificar que estén corriendo**:
```bash
docker ps
```

Deberías ver 4 contenedores activos.

**Estado**: ⬜ → ✅

---

## PASO 4: CONFIGURAR VARIABLES DE ENTORNO (3 minutos)

```bash
# Navegar al backend
cd backend

# Copiar archivo de ejemplo
copy .env.example .env
```

Ahora **abre el archivo `.env`** con un editor de texto (Notepad, VS Code, etc.)

### Editar estas líneas:

```env
# JWT (cambiar por algo secreto)
JWT_SECRET=mi-clave-super-secreta-123456789

# OpenAI API Key (si tienes)
OPENAI_API_KEY=sk-tu-api-key-aqui
```

**¿No tienes OpenAI API Key?**
Por ahora déjalo vacío. El sistema funcionará pero el bot será básico.

Para obtener una:
1. Ve a: https://platform.openai.com/api-keys
2. Regístrate (gratis)
3. Crea una API key
4. Pégala en el `.env`

**Las demás variables déjalas como están** (ya tienen valores correctos).

**Guarda el archivo**.

**Estado**: ⬜ → ✅

---

## PASO 5: CREAR BASE DE DATOS (2 minutos)

```bash
# Asegúrate de estar en /backend
cd c:\Users\josue\mis-sitios-bluehost\public_html\amico\backend

# Generar cliente de Prisma
npx prisma generate

# Crear tablas en PostgreSQL
npx prisma migrate dev --name init
```

Verás:
```
✔ Generated Prisma Client
The following migration(s) have been applied:
migrations/
  └─ 20241029_init/
      └─ migration.sql
```

Esto creó **15 tablas** en PostgreSQL.

**Estado**: ⬜ → ✅

---

## PASO 6: ¡INICIAR EL SISTEMA! (1 minuto)

```bash
npm run dev
```

Deberías ver:

```
╔══════════════════════════════════════════╗
║     AMICO MANAGEMENT - BACKEND API       ║
║   Sistema de Gestión de Condominios     ║
╚══════════════════════════════════════════╝

🔌 Conectando a bases de datos...
✅ PostgreSQL conectado correctamente
✅ MongoDB conectado correctamente
✅ Redis conectado correctamente
✅ Bases de datos conectadas
✅ Middlewares inicializados
✅ Rutas inicializadas
✅ WebSockets inicializados
📱 Iniciando WhatsApp Bot...

✅ Servidor iniciado correctamente
🚀 API disponible en: http://localhost:3000
📚 API Docs: http://localhost:3000/api-docs
🌍 Environment: development
📱 WhatsApp Bot: Habilitado
```

Y después:

```
🔌 Esperando conexión WhatsApp...
📱 QR Code generado. Escanea con WhatsApp.

[Verás un cuadrado con puntos (QR code)]
```

**¡NO CIERRES ESTA TERMINAL!** Déjala corriendo.

**Estado**: ⬜ → ✅

---

## PASO 7: CONECTAR WHATSAPP (1 minuto)

### En la terminal verás un QR CODE (cuadrado con puntos negros).

### En tu teléfono:

1. Abre **WhatsApp**
2. Ve a **Configuración** (⚙️)
3. Toca **Dispositivos vinculados**
4. Toca **Vincular un dispositivo**
5. **Escanea el QR** que aparece en la terminal

### Después de escanear:

En la terminal verás:
```
✅ WhatsApp conectado correctamente
```

**¡LISTO! WhatsApp está conectado.**

**Estado**: ⬜ → ✅

---

## PASO 8: ¡PROBAR QUE FUNCIONA! (3 minutos)

### Prueba 1: Health Check 🏥

**Abre tu navegador** y ve a:
```
http://localhost:3000/health
```

Deberías ver:
```json
{
  "status": "ok",
  "timestamp": "2024-10-29T...",
  "uptime": 123.45,
  "environment": "development"
}
```

✅ **Si ves esto, la API funciona correctamente.**

---

### Prueba 2: Estado de WhatsApp 📱

En tu navegador:
```
http://localhost:3000/api/v1/whatsapp/status
```

Deberías ver:
```json
{
  "connected": true,
  "timestamp": "2024-10-29T..."
}
```

✅ **Si ves `"connected": true`, WhatsApp está conectado.**

---

### Prueba 3: Enviar Mensaje de WhatsApp 💬

Desde **OTRO TELÉFONO** (no el que escaneó el QR), envía un mensaje de WhatsApp al número que conectaste:

```
Hola
```

El bot debería responder:
```
¡Hola! 👋 Bienvenido a Amico Management.
¿En qué puedo ayudarte hoy?

1️⃣ Reportar avería o problema técnico
2️⃣ Consultar estado de cuenta
3️⃣ Ver mis casos activos
4️⃣ Hablar con un asesor
```

✅ **Si el bot responde, ¡FUNCIONA!**

---

### Prueba 4: Ver Base de Datos 🗄️

Abre otra terminal y ejecuta:

```bash
cd c:\Users\josue\mis-sitios-bluehost\public_html\amico\backend
npx prisma studio
```

Se abrirá en tu navegador: http://localhost:5555

Aquí puedes ver todas las tablas y datos.

Navega a la tabla **"usuarios"** o **"casos"** para ver los datos.

✅ **Si ves la interfaz, la base de datos funciona.**

---

## PASO 9: PROBAR CONVERSACIÓN COMPLETA (5 minutos)

Desde el teléfono que NO escaneó el QR, envía:

```
Usuario: Hola
Bot: [responde con opciones]

Usuario: 1
Bot: [pregunta sobre el problema]

Usuario: Tengo una filtración en el baño
Bot: [pide más detalles]

Usuario: En el techo
Bot: [pide foto]

[Envía una foto de prueba]

Bot: [confirma que recibió y crea el caso]
```

Al final, el bot creará un caso con número como: **AMC-2024-0001**

✅ **Si crea el caso, todo el flujo funciona!**

---

## 🎉 ¡SISTEMA FUNCIONANDO!

Si llegaste hasta aquí, tienes:

- ✅ Backend corriendo
- ✅ Bases de datos activas
- ✅ WhatsApp conectado
- ✅ Bot conversacional funcionando
- ✅ Casos creándose automáticamente

---

## 🔍 VER LOS DATOS

### Opción 1: Prisma Studio

```bash
npx prisma studio
```

Ve a: http://localhost:5555

- Tabla **"casos"**: Ver casos creados
- Tabla **"usuarios"**: Ver usuarios registrados
- Tabla **"timelineEventos"**: Ver historial de eventos

### Opción 2: Adminer (PostgreSQL GUI)

Ve a: http://localhost:8080

- **Sistema**: PostgreSQL
- **Servidor**: postgres
- **Usuario**: postgres
- **Contraseña**: password
- **Base de datos**: amico_db

---

## 📊 MONITOREO

Mientras el servidor está corriendo, verás en la terminal:

```
📥 Mensaje recibido de 8095551234: Hola
📤 Mensaje enviado a 8095551234: ¡Hola! 👋 Bienvenido...
✅ Caso AMC-2024-0001 creado exitosamente
📬 Notificación enviada para caso AMC-2024-0001
```

---

## 🛑 CÓMO DETENER EL SISTEMA

### Detener el servidor backend:
En la terminal donde está corriendo, presiona:
```
Ctrl + C
```

### Detener las bases de datos:
```bash
cd c:\Users\josue\mis-sitios-bluehost\public_html\amico
docker-compose down
```

### Para reiniciar todo:
```bash
# 1. Bases de datos
docker-compose up -d

# 2. Backend
cd backend
npm run dev
```

---

## ❓ PROBLEMAS COMUNES

### Error: "Cannot connect to PostgreSQL"

**Solución**:
```bash
# Verificar que Docker esté corriendo
docker ps

# Si no ves contenedores, levántalos:
docker-compose up -d
```

---

### Error: "Port 3000 is already in use"

**Solución**:
```bash
# Windows - encontrar y matar proceso
netstat -ano | findstr :3000
taskkill /PID <numero_que_aparece> /F

# O cambiar el puerto en .env:
PORT=3001
```

---

### Error: WhatsApp no conecta

**Solución**:
```bash
# 1. Detener servidor (Ctrl+C)

# 2. Borrar sesión
cd backend
rm -rf auth_info_baileys

# 3. Reiniciar
npm run dev

# 4. Escanear nuevo QR
```

---

### Error: "OpenAI API key invalid"

**Solución**:
Si no tienes API key, el bot funcionará en modo básico.

Para obtener una:
1. https://platform.openai.com/api-keys
2. Crear cuenta
3. Generar API key
4. Agregar a `.env`

---

## 📞 SIGUIENTE PASO

Una vez que todo funcione localmente, avísame y procedemos a:

1. **Subir a GitHub** (10 min)
2. **Deploy en Railway** (20 min)
3. **Configurar dominio** (15 min)
4. **Sistema en producción** ✅

---

## 💡 TIPS

- Mantén Docker Desktop corriendo siempre
- No cierres la terminal del backend mientras lo uses
- Usa `Ctrl+C` para detener el servidor (no cierres la ventana)
- Los datos NO se pierden al reiniciar
- El QR de WhatsApp solo lo escaneas una vez

---

## 📝 CHECKLIST FINAL

Antes de continuar, verifica:

- [ ] Docker Desktop instalado y corriendo
- [ ] `npm install` completado sin errores
- [ ] `docker-compose up -d` muestra 4 contenedores
- [ ] `.env` configurado (mínimo JWT_SECRET)
- [ ] `npx prisma migrate dev` completado
- [ ] `npm run dev` inicia sin errores
- [ ] http://localhost:3000/health responde "ok"
- [ ] WhatsApp conectado (QR escaneado)
- [ ] Bot responde mensajes
- [ ] Casos se crean en la base de datos
- [ ] Prisma Studio se abre en http://localhost:5555

---

**Si todos los checks están ✅, ¡tu sistema está vivo y funcionando! 🎉**

**Próximo paso: Deploy a producción (Railway)**

**¿Listo para el siguiente paso?** 🚀
