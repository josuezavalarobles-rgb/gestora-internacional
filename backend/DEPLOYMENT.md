# Guía de Despliegue - Gestora Internacional SRL

## 📦 Preparación

### 1. Instalar Dependencias

```bash
cd ges-internacional/backend
npm install
```

### 2. Configurar Variables de Entorno

Editar `.env` con tus credenciales de producción:

```env
# Production Settings
NODE_ENV=production
PORT=3000

# PostgreSQL (Railway generará automáticamente)
DATABASE_URL=postgresql://user:pass@host:port/database

# MongoDB (Railway o MongoDB Atlas)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/gestora_logs

# Redis (Railway o Redis Cloud)
REDIS_URL=redis://user:pass@host:port

# JWT Secrets (CAMBIAR EN PRODUCCIÓN)
JWT_SECRET=tu-secreto-super-seguro-aqui-cambiar
JWT_REFRESH_SECRET=tu-refresh-secreto-super-seguro-cambiar

# APIs
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# CORS
CORS_ORIGIN=https://tu-dominio.com
```

---

## 🚀 Opción 1: Deploy a Railway (Recomendado)

### Paso 1: Conectar Repositorio

1. Ir a [Railway.app](https://railway.app)
2. Click en **"New Project"**
3. Seleccionar **"Deploy from GitHub repo"**
4. Elegir el repositorio `ges-internacional`
5. Railway detectará automáticamente el `package.json`

### Paso 2: Agregar PostgreSQL

1. En tu proyecto Railway, click **"+ New"**
2. Seleccionar **"Database" → "PostgreSQL"**
3. Railway generará automáticamente:
   - `DATABASE_URL`
   - Usuario, contraseña, host, puerto
4. La variable se agregará automáticamente al backend

### Paso 3: Agregar MongoDB (Opcional)

**Opción A: MongoDB en Railway**
1. Click **"+ New" → "Database" → "MongoDB"**
2. Railway generará `MONGODB_URI`

**Opción B: MongoDB Atlas (Gratis)**
1. Crear cluster en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Obtener connection string
3. Agregar `MONGODB_URI` a variables de Railway

### Paso 4: Agregar Redis

**Opción A: Redis en Railway**
1. Click **"+ New" → "Database" → "Redis"**
2. Railway generará `REDIS_URL`

**Opción B: Redis Cloud (Gratis)**
1. Crear database en [Redis Cloud](https://redis.com/try-free/)
2. Agregar `REDIS_URL` a variables de Railway

### Paso 5: Configurar Variables de Entorno

En Railway Settings → Variables, agregar:

```
JWT_SECRET=<generar-secreto-seguro>
JWT_REFRESH_SECRET=<generar-otro-secreto>
ANTHROPIC_API_KEY=<tu-api-key>
OPENAI_API_KEY=<tu-api-key>
CORS_ORIGIN=https://tu-frontend-url.com
```

### Paso 6: Deploy

1. Railway detectará cambios automáticamente
2. Ejecutará:
   ```bash
   npm install
   npx prisma generate
   npx prisma migrate deploy
   npm run build
   npm run start:prod
   ```
3. El backend estará disponible en: `https://tu-proyecto.up.railway.app`

### Paso 7: Ejecutar Migración

SSH a Railway o usar Railway CLI:

```bash
railway run npx prisma migrate deploy
```

---

## 🐳 Opción 2: Deploy con Docker

### Paso 1: Build de la Imagen

```bash
cd ges-internacional/backend
docker build -t gestora-internacional-backend .
```

### Paso 2: Run con Docker Compose

Crear `docker-compose.yml`:

```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/gestora_db
      - MONGODB_URI=mongodb://mongo:27017/gestora_logs
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    depends_on:
      - postgres
      - mongo
      - redis

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=gestora_db
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  mongo:
    image: mongo:7
    volumes:
      - mongo_data:/data/db

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  mongo_data:
  redis_data:
```

Ejecutar:

```bash
docker-compose up -d
```

---

## 🌐 Opción 3: Deploy Manual (VPS)

### Requisitos

- Node.js 20+
- PostgreSQL 15+
- MongoDB 7+
- Redis 7+
- PM2 (para producción)

### Paso 1: Instalar Dependencias del Sistema

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y nodejs npm postgresql mongodb redis-server

# Instalar PM2 globalmente
sudo npm install -g pm2
```

### Paso 2: Configurar PostgreSQL

```bash
sudo -u postgres psql

CREATE DATABASE gestora_db;
CREATE USER gestora_user WITH PASSWORD 'tu_password_seguro';
GRANT ALL PRIVILEGES ON DATABASE gestora_db TO gestora_user;
\q
```

### Paso 3: Clonar y Configurar Proyecto

```bash
cd /var/www
git clone <tu-repo-url> ges-internacional
cd ges-internacional/backend

# Copiar y editar .env
cp .env.example .env
nano .env

# Instalar dependencias
npm install

# Generar Prisma client
npx prisma generate

# Ejecutar migraciones
npx prisma migrate deploy

# Build
npm run build
```

### Paso 4: Configurar PM2

Crear `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'gestora-internacional',
    script: './dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

Iniciar con PM2:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Paso 5: Configurar Nginx (Opcional)

```nginx
server {
    listen 80;
    server_name api.gestorainternacional.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo systemctl restart nginx
```

---

## ✅ Verificación del Deploy

### 1. Health Check

```bash
curl https://tu-dominio.com/health
```

Respuesta esperada:
```json
{
  "status": "ok",
  "timestamp": "2024-12-15T10:30:00Z",
  "uptime": 123.45,
  "environment": "production"
}
```

### 2. Test de APIs

```bash
# Test Proveedores
curl https://tu-dominio.com/api/v1/proveedores?organizacionId=uuid

# Test Contabilidad
curl https://tu-dominio.com/api/v1/contabilidad/cuentas?organizacionId=uuid

# Test IA
curl -X POST https://tu-dominio.com/api/v1/ia/predicciones/:condominioId/gastos
```

### 3. Verificar Logs

**Railway:**
```bash
railway logs
```

**PM2:**
```bash
pm2 logs gestora-internacional
```

**Docker:**
```bash
docker-compose logs -f backend
```

---

## 🔧 Mantenimiento

### Actualizar Código

```bash
# Pull cambios
git pull origin main

# Instalar dependencias nuevas
npm install

# Ejecutar migraciones
npx prisma migrate deploy

# Rebuild
npm run build

# Reiniciar (PM2)
pm2 restart gestora-internacional

# O reiniciar (Railway)
# Railway detecta cambios automáticamente
```

### Backup de Base de Datos

**PostgreSQL:**
```bash
pg_dump -h localhost -U gestora_user gestora_db > backup_$(date +%Y%m%d).sql
```

**MongoDB:**
```bash
mongodump --uri="mongodb://localhost:27017/gestora_logs" --out=./backup_$(date +%Y%m%d)
```

### Restaurar Backup

**PostgreSQL:**
```bash
psql -h localhost -U gestora_user gestora_db < backup_20241215.sql
```

**MongoDB:**
```bash
mongorestore --uri="mongodb://localhost:27017/gestora_logs" ./backup_20241215
```

---

## 🐛 Troubleshooting

### Error: Cannot connect to database

**Solución:**
1. Verificar que `DATABASE_URL` esté configurado correctamente
2. Verificar que PostgreSQL esté corriendo
3. Verificar que las credenciales sean correctas

```bash
# Test connection
psql $DATABASE_URL
```

### Error: Prisma schema not generated

**Solución:**
```bash
npx prisma generate
npm run build
```

### Error: Migration failed

**Solución:**
```bash
# Reset database (⚠️ CUIDADO: Elimina datos)
npx prisma migrate reset

# O aplicar migraciones manualmente
npx prisma migrate deploy
```

### Error: Port already in use

**Solución:**
```bash
# Encontrar proceso
lsof -i :3000

# Matar proceso
kill -9 <PID>

# O cambiar puerto en .env
PORT=3001
```

---

## 📊 Monitoreo

### Railway Dashboard
- Ver logs en tiempo real
- Métricas de CPU/RAM
- Requests por segundo

### PM2 Monitoring
```bash
pm2 monit
pm2 status
```

### Logs Personalizados
Los logs se guardan en MongoDB en la colección `logs`.

---

## 🔐 Seguridad

### Checklist de Producción

- [ ] Cambiar `JWT_SECRET` y `JWT_REFRESH_SECRET`
- [ ] Usar HTTPS (SSL/TLS)
- [ ] Configurar CORS correctamente
- [ ] Habilitar rate limiting
- [ ] Usar variables de entorno para secretos
- [ ] Configurar firewall
- [ ] Habilitar backups automáticos
- [ ] Configurar logs de seguridad
- [ ] Actualizar dependencias regularmente

---

## 📞 Soporte

- **Documentación**: Ver [README.md](README.md)
- **API Docs**: Ver [API_DOCS.md](API_DOCS.md)
- **Issues**: Reportar en GitHub

---

## 🎉 ¡Listo!

Tu backend de Gestora Internacional SRL está desplegado y listo para recibir requests.

**URL Base:** `https://tu-dominio.com/api/v1`

**Endpoints disponibles:**
- `/proveedores` - Gestión de proveedores
- `/contabilidad` - NCF, gastos, ingresos
- `/estados-cuenta` - Estados de cuenta por unidad
- `/ia` - Facturas IA y predicciones ML

**Próximos pasos:**
1. Configurar frontend para conectarse al backend
2. Crear usuarios iniciales
3. Configurar organizaciones y condominios
4. Importar datos iniciales (opcional)
