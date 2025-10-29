# ⚡ COMANDOS RÁPIDOS - AMICO MANAGEMENT

## 🚀 INICIO RÁPIDO (5 minutos)

```bash
# 1. Navegar al proyecto
cd c:\Users\josue\mis-sitios-bluehost\public_html\amico

# 2. Levantar bases de datos
docker-compose up -d

# 3. Instalar dependencias
cd backend
npm install

# 4. Configurar entorno
copy .env.example .env
# Editar .env si es necesario

# 5. Migraciones
npx prisma generate
npx prisma migrate dev --name init

# 6. Iniciar servidor
npm run dev
```

---

## 🔄 COMANDOS DIARIOS

### Levantar todo el sistema

```bash
# Opción 1: Comando único (crear script)
npm run dev:all

# Opción 2: Manual
docker-compose up -d        # Bases de datos
cd backend && npm run dev   # Backend
```

### Detener todo

```bash
# Detener backend: Ctrl+C en la terminal

# Detener bases de datos
docker-compose down

# Detener y borrar volúmenes (⚠️ borra datos)
docker-compose down -v
```

---

## 🗄️ GESTIÓN DE BASE DE DATOS

### PostgreSQL (Prisma)

```bash
# Abrir Prisma Studio (GUI)
npx prisma studio
# http://localhost:5555

# Crear migración
npx prisma migrate dev --name nombre_migracion

# Regenerar cliente
npx prisma generate

# Push schema sin migración (desarrollo)
npx prisma db push

# Reset base de datos (⚠️ borra todo)
npx prisma migrate reset

# Ver estado de migraciones
npx prisma migrate status
```

### MongoDB

```bash
# Conectar con mongosh
mongosh mongodb://localhost:27017/amico_logs

# Ver colecciones
show collections

# Ver mensajes recientes
db.mensajes.find().sort({fechaEnvio: -1}).limit(10).pretty()

# Ver conversaciones activas
db.conversaciones.find({estado: "activa"}).pretty()

# Limpiar colección (⚠️ cuidado)
db.mensajes.deleteMany({})
```

### Redis

```bash
# Conectar con redis-cli
redis-cli

# Ver todas las keys
keys *

# Ver valor de una key
get nombre_key

# Limpiar todo Redis (⚠️ cuidado)
flushall

# Info de Redis
info

# Salir
exit
```

---

## 📱 WHATSAPP

### Ver estado de conexión

```bash
# Opción 1: HTTP Request
curl http://localhost:3000/api/v1/whatsapp/status

# Opción 2: Navegador
# http://localhost:3000/api/v1/whatsapp/status
```

### Obtener QR Code

```bash
# HTTP Request
curl http://localhost:3000/api/v1/whatsapp/qr

# O en navegador:
# http://localhost:3000/api/v1/whatsapp/qr
```

### Reconectar WhatsApp

```bash
# 1. Detener servidor (Ctrl+C)

# 2. Borrar sesión
rm -rf backend/auth_info_baileys

# 3. Reiniciar servidor
npm run dev

# 4. Escanear nuevo QR
```

### Enviar mensaje de prueba

```bash
# Con curl (Windows PowerShell)
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/whatsapp/send-test" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"telefono":"8095551234","mensaje":"Test desde API"}'

# Con curl (Linux/Mac)
curl -X POST http://localhost:3000/api/v1/whatsapp/send-test \
  -H "Content-Type: application/json" \
  -d '{"telefono":"8095551234","mensaje":"Test desde API"}'
```

---

## 🔍 LOGS Y DEBUGGING

### Ver logs en tiempo real

```bash
# Backend (ya incluido en npm run dev)
npm run dev

# Docker logs
docker-compose logs -f

# Solo PostgreSQL
docker-compose logs -f postgres

# Solo MongoDB
docker-compose logs -f mongodb
```

### Ver logs de base de datos

```bash
# PostgreSQL queries (activar en código)
# En prisma client, ya está configurado para development

# MongoDB queries
mongosh --eval "db.setLogLevel(2)"
```

---

## 🧪 TESTING Y VALIDACIÓN

### Health Check

```bash
# API Health
curl http://localhost:3000/health

# Base de datos PostgreSQL
docker exec -it amico-postgres pg_isready -U postgres

# Base de datos MongoDB
docker exec -it amico-mongodb mongosh --eval "db.runCommand({ping: 1})"

# Redis
docker exec -it amico-redis redis-cli ping
```

### Verificar puertos

```bash
# Windows
netstat -ano | findstr :3000
netstat -ano | findstr :5432
netstat -ano | findstr :27017
netstat -ano | findstr :6379

# Linux/Mac
lsof -i :3000
lsof -i :5432
lsof -i :27017
lsof -i :6379
```

---

## 🛠️ TROUBLESHOOTING RÁPIDO

### Puerto 3000 ocupado

```bash
# Windows (encontrar proceso)
netstat -ano | findstr :3000
# Matar proceso
taskkill /PID <numero_pid> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### PostgreSQL no conecta

```bash
# Verificar que está corriendo
docker ps | grep postgres

# Reiniciar
docker-compose restart postgres

# Ver logs
docker-compose logs postgres

# Conectar manualmente
docker exec -it amico-postgres psql -U postgres -d amico_db
```

### MongoDB no conecta

```bash
# Verificar
docker ps | grep mongo

# Reiniciar
docker-compose restart mongodb

# Conectar
docker exec -it amico-mongodb mongosh
```

### Redis no conecta

```bash
# Verificar
docker ps | grep redis

# Reiniciar
docker-compose restart redis

# Test
docker exec -it amico-redis redis-cli ping
```

### WhatsApp desconectado

```bash
# 1. Verificar logs del backend
# Buscar errores relacionados con Baileys

# 2. Borrar sesión y reconectar
rm -rf backend/auth_info_baileys
npm run dev

# 3. Si persiste, verificar internet y firewall
```

### Error "Module not found"

```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install

# Regenerar Prisma client
npx prisma generate
```

### TypeScript errors

```bash
# Limpiar build
rm -rf dist

# Rebuild
npm run build

# Verificar tsconfig.json
```

---

## 📊 MONITOREO

### Estadísticas de sistema

```bash
# Uso de Docker
docker stats

# Espacio de Docker
docker system df

# Limpiar Docker (⚠️ cuidado)
docker system prune -a
```

### Tamaño de base de datos

```bash
# PostgreSQL
docker exec -it amico-postgres psql -U postgres -d amico_db -c "
SELECT
  pg_size_pretty(pg_database_size('amico_db')) as size;
"

# MongoDB
docker exec -it amico-mongodb mongosh --eval "
  db.stats()
"
```

---

## 🔧 MANTENIMIENTO

### Backup de base de datos

```bash
# PostgreSQL
docker exec -it amico-postgres pg_dump -U postgres amico_db > backup_$(date +%Y%m%d).sql

# MongoDB
docker exec -it amico-mongodb mongodump --db=amico_logs --out=/tmp/backup
docker cp amico-mongodb:/tmp/backup ./backup_mongodb_$(date +%Y%m%d)
```

### Restore de base de datos

```bash
# PostgreSQL
docker exec -i amico-postgres psql -U postgres amico_db < backup.sql

# MongoDB
docker exec -i amico-mongodb mongorestore --db=amico_logs /tmp/backup/amico_logs
```

### Limpiar logs viejos (MongoDB)

```bash
# Mensajes más viejos de 30 días
mongosh mongodb://localhost:27017/amico_logs --eval '
  db.mensajes.deleteMany({
    fechaEnvio: {
      $lt: new Date(Date.now() - 30*24*60*60*1000)
    }
  })
'
```

---

## 🚀 PRODUCCIÓN (Cuando esté listo)

### Build para producción

```bash
# Backend
cd backend
npm run build

# Iniciar en producción
NODE_ENV=production npm start
```

### Variables de entorno de producción

```bash
# .env.production
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://...  # URL de producción
MONGODB_URI=mongodb+srv://...   # MongoDB Atlas
REDIS_URL=redis://...           # Redis Cloud
OPENAI_API_KEY=sk-...
JWT_SECRET=<clave-super-segura>
CORS_ORIGIN=https://tudominio.com
```

---

## 📦 SCRIPTS ÚTILES (Agregar a package.json)

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "dev:all": "concurrently \"docker-compose up\" \"npm run dev\"",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    "db:seed": "tsx src/database/seeds/index.ts",
    "db:reset": "prisma migrate reset",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down",
    "docker:logs": "docker-compose logs -f",
    "clean": "rm -rf dist node_modules",
    "clean:all": "npm run clean && docker-compose down -v"
  }
}
```

---

## 🎯 FLUJO DE TRABAJO DIARIO

```bash
# 1. Mañana - Iniciar desarrollo
docker-compose up -d
cd backend && npm run dev

# 2. Durante el día - Ver cambios
# Los cambios se recargan automáticamente con tsx watch

# 3. Ver datos
npx prisma studio  # PostgreSQL
mongosh            # MongoDB

# 4. Tarde - Commit cambios
git add .
git commit -m "feat: nueva funcionalidad"
git push

# 5. Noche - Detener todo
# Ctrl+C en terminal del backend
docker-compose down
```

---

## 💡 TIPS Y TRUCOS

### Acelerar desarrollo

```bash
# Hot reload está habilitado con tsx watch
# No necesitas reiniciar el servidor al cambiar código

# Usar Prisma Studio para ver datos rápidamente
npx prisma studio

# Usar Thunder Client o Postman para testing API
```

### Snippets útiles VS Code

```json
{
  "Prisma Query": {
    "prefix": "pq",
    "body": [
      "const $1 = await prisma.$2.findMany({",
      "  where: { $3 },",
      "  include: { $4 }",
      "});"
    ]
  }
}
```

### Aliases útiles (PowerShell Profile)

```powershell
# $PROFILE

function amico-start {
  cd c:\Users\josue\mis-sitios-bluehost\public_html\amico
  docker-compose up -d
  cd backend
  npm run dev
}

function amico-stop {
  docker-compose down
}

function amico-logs {
  docker-compose logs -f
}
```

---

## 🔗 URLS ÚTILES

- **API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **WhatsApp Status**: http://localhost:3000/api/v1/whatsapp/status
- **Prisma Studio**: http://localhost:5555
- **Adminer (PostgreSQL GUI)**: http://localhost:8080

---

**Guarda este archivo! Te ahorrará horas de búsqueda de comandos 🚀**
