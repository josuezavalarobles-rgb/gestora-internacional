# 🚀 INSTRUCCIONES DE INSTALACIÓN - AMICO MANAGEMENT

## 📋 REQUISITOS PREVIOS

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** 20.x o superior ([Descargar](https://nodejs.org/))
- **PostgreSQL** 15.x o superior ([Descargar](https://www.postgresql.org/download/))
- **MongoDB** 7.x o superior ([Descargar](https://www.mongodb.com/try/download/community))
- **Redis** 7.x o superior ([Descargar](https://redis.io/download))
- **Git** (opcional)

### Alternativa: Docker

Si prefieres usar Docker (recomendado para desarrollo):

```bash
# Instalar Docker Desktop
# Windows/Mac: https://www.docker.com/products/docker-desktop
```

---

## 🔧 INSTALACIÓN PASO A PASO

### 1. Instalar Dependencias del Backend

```bash
cd c:\Users\josue\mis-sitios-bluehost\public_html\amico\backend
npm install
```

**Tiempo estimado:** 3-5 minutos

---

### 2. Configurar Variables de Entorno

Copia el archivo `.env.example` a `.env`:

```bash
# Windows
copy .env.example .env

# Linux/Mac
cp .env.example .env
```

Edita el archivo `.env` y configura:

```env
# Base de datos PostgreSQL
DATABASE_URL=postgresql://postgres:tu_password@localhost:5432/amico_db

# MongoDB
MONGODB_URI=mongodb://localhost:27017/amico_logs

# Redis
REDIS_URL=redis://localhost:6379

# JWT (genera una clave secreta fuerte)
JWT_SECRET=tu-clave-super-secreta-aqui-cambiar-en-produccion

# OpenAI (si tienes API key)
OPENAI_API_KEY=sk-tu-api-key-de-openai
```

---

### 3. Levantar Bases de Datos

#### Opción A: Con Docker (Recomendado)

Crea un archivo `docker-compose.yml` en la raíz del proyecto:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: amico-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: amico_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  mongodb:
    image: mongo:7
    container_name: amico-mongodb
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  redis:
    image: redis:7-alpine
    container_name: amico-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  mongodb_data:
  redis_data:
```

Luego ejecuta:

```bash
docker-compose up -d
```

#### Opción B: Instalación Manual

1. **PostgreSQL:**
   - Instalar PostgreSQL 15+
   - Crear base de datos: `CREATE DATABASE amico_db;`
   - Configurar usuario y password

2. **MongoDB:**
   - Instalar MongoDB
   - Iniciar servicio: `mongod`
   - No requiere configuración adicional

3. **Redis:**
   - Instalar Redis
   - Iniciar servicio: `redis-server`

---

### 4. Ejecutar Migraciones de Base de Datos

```bash
cd backend

# Generar cliente de Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate dev --name init
```

Esto creará todas las tablas en PostgreSQL.

---

### 5. (Opcional) Poblar con Datos de Prueba

```bash
# Ejecutar seeds (cuando estén disponibles)
npm run db:seed
```

---

### 6. Iniciar el Backend

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

(Aparecerá un QR code en la terminal)

✅ Servidor iniciado correctamente
🚀 API disponible en: http://localhost:3000
```

---

### 7. Conectar WhatsApp

1. Abre WhatsApp en tu teléfono
2. Ve a **Configuración** → **Dispositivos vinculados**
3. Toca **Vincular un dispositivo**
4. Escanea el QR code que aparece en la terminal

Una vez conectado verás:

```
✅ WhatsApp conectado correctamente
```

---

## 🧪 PROBAR QUE TODO FUNCIONA

### 1. Health Check

Abre tu navegador y ve a:

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

### 2. Verificar Conexión WhatsApp

```
http://localhost:3000/api/v1/whatsapp/status
```

Respuesta esperada:

```json
{
  "connected": true,
  "timestamp": "..."
}
```

### 3. Enviar Mensaje de Prueba

Usando Postman, Thunder Client o curl:

```bash
POST http://localhost:3000/api/v1/whatsapp/send-test
Content-Type: application/json

{
  "telefono": "8095551234",
  "mensaje": "Hola, este es un mensaje de prueba desde Amico Management 🚀"
}
```

---

## 📱 PROBAR EL BOT CONVERSACIONAL

1. Envía un mensaje de WhatsApp al número conectado:
   ```
   Hola
   ```

2. El bot debería responder:
   ```
   ¡Hola! 👋 Bienvenido a Amico Management.
   ¿En qué puedo ayudarte hoy?

   1️⃣ Reportar avería o problema técnico
   2️⃣ Consultar estado de cuenta
   3️⃣ Ver mis casos activos
   4️⃣ Hablar con un asesor
   ```

3. Responde con:
   ```
   1
   ```

4. El bot iniciará el proceso conversacional de recopilación de información.

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Error: "Cannot connect to PostgreSQL"

```bash
# Verificar que PostgreSQL esté corriendo
# Windows (PowerShell)
Get-Service postgresql*

# Verificar conexión
psql -U postgres -h localhost
```

### Error: "MongoDB connection refused"

```bash
# Verificar que MongoDB esté corriendo
# Windows
net start MongoDB

# Verificar conexión
mongo --eval "db.runCommand({ ping: 1 })"
```

### Error: "Redis connection refused"

```bash
# Windows
redis-server

# Verificar conexión
redis-cli ping
# Debería responder: PONG
```

### Error: "OpenAI API key invalid"

Si no tienes API key de OpenAI:
1. Regístrate en: https://platform.openai.com/
2. Crea una API key
3. Agrégala al `.env`

**O** puedes desactivar temporalmente la IA:

```env
BOT_ENABLED=false
```

### WhatsApp no se conecta

1. Asegúrate de tener buena conexión a internet
2. Intenta reiniciar el servidor
3. Borra la carpeta `auth_info_baileys` y vuelve a escanear el QR

---

## 📊 VERIFICAR LOGS

Los logs del sistema se encuentran en:

```bash
# Logs en consola (desarrollo)
# Se muestran automáticamente al ejecutar npm run dev

# Ver logs de base de datos
npx prisma studio
# Abre en http://localhost:5555
```

---

## 🎉 ¡LISTO!

Si llegaste hasta aquí, tu sistema está completamente operativo.

### Próximos pasos:

1. ✅ Backend funcionando
2. ✅ WhatsApp conectado
3. ✅ Bot conversacional activo
4. 🚧 Falta: Panel de administración web (React)

---

## 📞 ¿NECESITAS AYUDA?

Si encuentras algún problema:

1. Revisa los logs en la terminal
2. Verifica que todas las bases de datos estén corriendo
3. Confirma que las variables de entorno estén correctas
4. Consulta la documentación de cada tecnología

---

## 🔐 SEGURIDAD

**IMPORTANTE:** Antes de producción:

- [ ] Cambiar `JWT_SECRET` por una clave segura
- [ ] Usar variables de entorno de producción
- [ ] Habilitar HTTPS
- [ ] Configurar CORS correctamente
- [ ] Revisar permisos de base de datos
- [ ] Activar rate limiting estricto
- [ ] Implementar logging de auditoría

---

## 📚 COMANDOS ÚTILES

```bash
# Desarrollo
npm run dev              # Iniciar servidor en modo desarrollo

# Base de datos
npx prisma studio        # Abrir GUI de base de datos
npx prisma generate      # Regenerar cliente Prisma
npx prisma migrate dev   # Crear nueva migración
npx prisma db push       # Push schema sin migración

# Build
npm run build            # Compilar TypeScript
npm run start            # Iniciar en producción

# Utilidades
npm run lint             # Linter
npm run format           # Formatear código
npm run test             # Tests (cuando estén disponibles)
```

---

**¡Mucha suerte con tu proyecto! 🚀**
