# 🚀 Instrucciones de Deploy - Sistema Amico Management

## 📋 Checklist Pre-Deploy

Antes de hacer el deploy, asegúrate de completar estos pasos:

- [ ] Servidor preparado (VPS con Ubuntu 22.04 LTS recomendado)
- [ ] PostgreSQL 14+ instalado
- [ ] MongoDB 6+ instalado
- [ ] Redis 7+ instalado
- [ ] Node.js 18+ instalado
- [ ] Dominio configurado (opcional pero recomendado)
- [ ] SSL configurado (Let's Encrypt recomendado)
- [ ] OpenAI API Key obtenida
- [ ] WhatsApp Business API configurada

---

## 🔧 Paso 1: Preparar el Servidor

### 1.1 Conectar al Servidor

```bash
ssh usuario@tu-servidor.com
```

### 1.2 Actualizar el Sistema

```bash
sudo apt update
sudo apt upgrade -y
```

### 1.3 Instalar Node.js 18+

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Verificar versión
npm --version
```

### 1.4 Instalar PostgreSQL

```bash
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Crear base de datos
sudo -u postgres psql
CREATE DATABASE amico_db;
CREATE USER amico_user WITH PASSWORD 'tu-password-seguro';
GRANT ALL PRIVILEGES ON DATABASE amico_db TO amico_user;
\q
```

### 1.5 Instalar MongoDB

```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 1.6 Instalar Redis

```bash
sudo apt install redis-server -y
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

---

## 📦 Paso 2: Clonar y Configurar el Proyecto

### 2.1 Clonar el Repositorio

```bash
cd /var/www
sudo mkdir -p amico-management
sudo chown -R $USER:$USER amico-management
cd amico-management

# Si usas Git
git clone <tu-repositorio-url> .

# O copiar archivos manualmente
# scp -r ./amico-management usuario@servidor:/var/www/amico-management
```

### 2.2 Instalar Dependencias del Backend

```bash
cd backend
npm install
```

### 2.3 Configurar Variables de Entorno

```bash
cp .env.example .env
nano .env
```

Editar `.env` con los valores de producción:

```bash
# Server Configuration
PORT=3000
NODE_ENV=production
API_VERSION=v1

# Database - PostgreSQL
DATABASE_URL=postgresql://amico_user:tu-password-seguro@localhost:5432/amico_db?schema=public

# Database - MongoDB
MONGODB_URI=mongodb://localhost:27017/amico_logs
MONGODB_DB_NAME=amico_logs

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT Authentication
JWT_SECRET=genera-un-secret-seguro-aleatorio-aqui-min-32-chars
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=otro-secret-diferente-para-refresh-min-32-chars
JWT_REFRESH_EXPIRES_IN=30d

# OpenAI API
OPENAI_API_KEY=sk-tu-api-key-de-openai-aqui
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_MAX_TOKENS=1000
OPENAI_TEMPERATURE=0.7

# WhatsApp Configuration
WHATSAPP_SESSION_NAME=amico-bot-production
WHATSAPP_PHONE_NUMBER=+18095551234
WHATSAPP_BUSINESS_NAME=Amico Management
WHATSAPP_AUTO_READ=true
WHATSAPP_AUTO_MARK_READ=true
WHATSAPP_GROUP_JID=120363123456789@g.us

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/jpg,video/mp4,video/quicktime,application/pdf
MAX_FILES_PER_CASE=10

# CORS
CORS_ORIGIN=https://tu-dominio.com
CORS_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Bot Configuration
BOT_ENABLED=true
BOT_RESPONSE_DELAY=1000
BOT_MAX_CONTEXT_MESSAGES=10
BOT_ESCALATE_KEYWORDS=urgente,emergencia,supervisor,humano

# Notifications
NOTIFICATIONS_ENABLED=true
NOTIFICATION_BATCH_SIZE=50
NOTIFICATION_RETRY_ATTEMPTS=3

# SLA Times (en horas)
SLA_GARANTIA_HORAS=24
SLA_CONDOMINIO_HORAS=72
SLA_URGENTE_HORAS=4

# Timezone
TZ=America/Santo_Domingo

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@gmail.com
SMTP_PASSWORD=tu-app-password-de-gmail
EMAIL_FROM=noreply@amicomanagement.com

# Feature Flags
FEATURE_AI_CLASSIFICATION=true
FEATURE_AUTO_ASSIGNMENT=true
FEATURE_IMAGE_ANALYSIS=true
FEATURE_VOICE_MESSAGES=true

# Seguimiento Automático
SEGUIMIENTO_DELAY_HORAS=4
SEGUIMIENTO_MAX_INTENTOS=7
SEGUIMIENTO_INTERVALO_HORAS=24
```

**⚠️ IMPORTANTE:**
- Cambiar `JWT_SECRET` y `JWT_REFRESH_SECRET` por valores aleatorios seguros (min 32 caracteres)
- Usar tu OpenAI API Key real
- Configurar SMTP con credenciales reales
- Cambiar `CORS_ORIGIN` al dominio de tu frontend

### 2.4 Generar Secrets Seguros

```bash
# Generar JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Copiar el output y usarlo en .env como JWT_SECRET
# Repetir para JWT_REFRESH_SECRET
```

---

## 🗄️ Paso 3: Configurar Base de Datos

### 3.1 Generar Prisma Client

```bash
npx prisma generate
```

### 3.2 Ejecutar Migraciones

```bash
npx prisma migrate deploy
```

**⚠️ IMPORTANTE:** Si la migración `add_seguimiento_automatico` no existe, crearla:

```bash
npx prisma migrate dev --name add_seguimiento_automatico
```

### 3.3 Verificar Conexión

```bash
npx prisma db push
```

Si aparece este error:
```
Error: P1001: Can't reach database server
```

Verificar:
1. PostgreSQL está corriendo: `sudo systemctl status postgresql`
2. Credenciales correctas en `.env`
3. Base de datos existe: `sudo -u postgres psql -l | grep amico_db`

### 3.4 (Opcional) Cargar Datos de Prueba

```bash
# Si tienes seeds configurados
npx prisma db seed
```

---

## 🔨 Paso 4: Build del Backend

### 4.1 Compilar TypeScript

```bash
npm run build
```

Esto crea la carpeta `dist/` con el código compilado.

### 4.2 Verificar Build

```bash
ls -la dist/
# Deberías ver: index.js, services/, routes/, etc.
```

---

## 📱 Paso 5: Configurar WhatsApp

### 5.1 Primera Conexión (Generar QR)

```bash
# Ejecutar en modo desarrollo la primera vez para generar QR
NODE_ENV=development npm run dev
```

### 5.2 Escanear QR Code

1. El sistema mostrará un QR en la terminal
2. Abrir WhatsApp en tu teléfono
3. Ir a **Configuración → Dispositivos vinculados**
4. Escanear el QR

### 5.3 Verificar Conexión

```bash
# Deberías ver en los logs:
✅ WhatsApp conectado correctamente
✅ WhatsApp socket conectado al servicio de CRON
```

### 5.4 Detener Servidor de Desarrollo

```bash
Ctrl + C
```

---

## 🚀 Paso 6: Configurar PM2 (Process Manager)

### 6.1 Instalar PM2

```bash
sudo npm install -g pm2
```

### 6.2 Crear Archivo de Configuración PM2

```bash
nano ecosystem.config.js
```

Contenido:

```javascript
module.exports = {
  apps: [{
    name: 'amico-backend',
    script: './dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true
  }]
}
```

### 6.3 Crear Carpeta de Logs

```bash
mkdir -p logs
```

### 6.4 Iniciar Backend con PM2

```bash
pm2 start ecosystem.config.js
```

### 6.5 Verificar Estado

```bash
pm2 status
pm2 logs amico-backend
```

Deberías ver:

```
✅ Bases de datos conectadas
✅ WhatsApp Service inicializado
✅ WhatsApp conectado correctamente
⏰ Iniciando sistema de tareas programadas (CRON)...
✅ Tarea programada registrada: seguimiento-automatico (0 * * * *)
✅ Servidor iniciado correctamente
```

### 6.6 Configurar PM2 para Inicio Automático

```bash
pm2 startup
# Copiar y ejecutar el comando que aparece

pm2 save
```

---

## 🌐 Paso 7: Configurar Nginx (Reverse Proxy)

### 7.1 Instalar Nginx

```bash
sudo apt install nginx -y
```

### 7.2 Crear Configuración

```bash
sudo nano /etc/nginx/sites-available/amico-backend
```

Contenido:

```nginx
server {
    listen 80;
    server_name api.tu-dominio.com;  # Cambiar por tu dominio

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:3000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 7.3 Habilitar Sitio

```bash
sudo ln -s /etc/nginx/sites-available/amico-backend /etc/nginx/sites-enabled/
sudo nginx -t  # Verificar configuración
sudo systemctl restart nginx
```

### 7.4 Configurar SSL (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d api.tu-dominio.com

# Seguir instrucciones del asistente
```

---

## 🎨 Paso 8: Deploy del Frontend

### 8.1 Instalar Dependencias

```bash
cd /var/www/amico-management/frontend
npm install
```

### 8.2 Configurar Variables de Entorno

```bash
nano .env.production
```

Contenido:

```bash
VITE_API_URL=https://api.tu-dominio.com/api/v1
VITE_SOCKET_URL=https://api.tu-dominio.com
```

### 8.3 Build del Frontend

```bash
npm run build
```

Esto crea la carpeta `dist/` con el frontend compilado.

### 8.4 Configurar Nginx para Frontend

```bash
sudo nano /etc/nginx/sites-available/amico-frontend
```

Contenido:

```nginx
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;

    root /var/www/amico-management/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 8.5 Habilitar y Configurar SSL

```bash
sudo ln -s /etc/nginx/sites-available/amico-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com
```

---

## ✅ Paso 9: Verificación Final

### 9.1 Verificar Servicios

```bash
# PostgreSQL
sudo systemctl status postgresql

# MongoDB
sudo systemctl status mongod

# Redis
sudo systemctl status redis-server

# Nginx
sudo systemctl status nginx

# PM2
pm2 status
```

### 9.2 Verificar Logs

```bash
# Backend
pm2 logs amico-backend --lines 50

# Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 9.3 Verificar Endpoints

```bash
# Health check
curl https://api.tu-dominio.com/health

# Debería retornar:
{
  "status": "ok",
  "timestamp": "2025-01-XX...",
  "uptime": 123.456,
  "environment": "production"
}
```

### 9.4 Verificar Frontend

```bash
# Abrir en navegador
https://tu-dominio.com

# Deberías ver el login de Amico Management
```

### 9.5 Verificar Cron Jobs

```bash
pm2 logs amico-backend | grep "CRON"

# Deberías ver cada hora:
⏰ Iniciando sistema de tareas programadas (CRON)...
✅ Tarea programada registrada: seguimiento-automatico (0 * * * *)
```

---

## 🔐 Paso 10: Seguridad Post-Deploy

### 10.1 Configurar Firewall

```bash
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
sudo ufw status
```

### 10.2 Deshabilitar Acceso Directo a Bases de Datos

```bash
# Editar PostgreSQL para escuchar solo localhost
sudo nano /etc/postgresql/14/main/postgresql.conf
# Cambiar: listen_addresses = 'localhost'

# Editar MongoDB
sudo nano /etc/mongod.conf
# Verificar: bindIp: 127.0.0.1

sudo systemctl restart postgresql
sudo systemctl restart mongod
```

### 10.3 Configurar Backups Automáticos

```bash
# Crear script de backup
sudo nano /usr/local/bin/backup-amico.sh
```

Contenido:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/amico"

mkdir -p $BACKUP_DIR

# Backup PostgreSQL
pg_dump -U amico_user amico_db | gzip > $BACKUP_DIR/postgres_$DATE.sql.gz

# Backup MongoDB
mongodump --db amico_logs --gzip --archive=$BACKUP_DIR/mongodb_$DATE.gz

# Backup archivos
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /var/www/amico-management/backend/uploads

# Eliminar backups antiguos (más de 7 días)
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completado: $DATE"
```

Hacer ejecutable y programar:

```bash
sudo chmod +x /usr/local/bin/backup-amico.sh

# Agregar a crontab (backup diario a las 3 AM)
sudo crontab -e
# Agregar línea:
0 3 * * * /usr/local/bin/backup-amico.sh
```

---

## 📊 Paso 11: Monitoreo

### 11.1 Instalar Monitoreo de PM2

```bash
pm2 install pm2-logrotate

# Configurar rotación de logs
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### 11.2 Verificar Uso de Recursos

```bash
pm2 monit
```

### 11.3 Configurar Alertas (Opcional)

```bash
# Si usas PM2 Plus (servicio pago)
pm2 link <secret> <public>
```

---

## 🎉 Paso 12: Testing en Producción

### 12.1 Crear Usuario Administrador

```bash
# Usando el panel web o:
curl -X POST https://api.tu-dominio.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@tu-empresa.com",
    "password": "password-seguro",
    "nombreCompleto": "Admin Sistema",
    "rol": "ADMIN"
  }'
```

### 12.2 Login en Panel Web

1. Ir a `https://tu-dominio.com`
2. Login con credenciales de admin
3. Verificar dashboard carga correctamente

### 12.3 Crear Caso de Prueba

1. Cargar un propietario de prueba
2. Enviar mensaje de prueba desde WhatsApp
3. Verificar que el bot responde
4. Verificar reconocimiento automático
5. Crear caso manualmente desde el panel
6. Verificar asignación automática
7. Verificar email de notificación recibido
8. Verificar notificación en grupo de WhatsApp
9. Marcar cita como completada
10. Esperar 4 horas (o ajustar `SEGUIMIENTO_DELAY_HORAS` temporalmente)
11. Verificar mensaje de seguimiento enviado
12. Responder al seguimiento
13. Verificar caso cerrado/reabierto según respuesta

---

## 🚨 Troubleshooting

### Error: No se puede conectar a PostgreSQL

```bash
# Verificar servicio
sudo systemctl status postgresql

# Ver logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log

# Reiniciar
sudo systemctl restart postgresql
```

### Error: WhatsApp no conecta

```bash
# Verificar autenticación
ls -la /var/www/amico-management/backend/auth_info_baileys/

# Si no existe, generar nueva sesión
rm -rf auth_info_baileys
pm2 restart amico-backend
pm2 logs amico-backend

# Escanear nuevo QR que aparece en logs
```

### Error: Cron jobs no ejecutan

```bash
# Verificar zona horaria
timedatectl

# Cambiar si es necesario
sudo timedatectl set-timezone America/Santo_Domingo

# Reiniciar PM2
pm2 restart amico-backend
```

### Error: "Out of memory"

```bash
# Aumentar memoria de PM2
pm2 stop amico-backend
# Editar ecosystem.config.js: max_memory_restart: '2G'
pm2 start ecosystem.config.js
```

### Ver logs en tiempo real

```bash
# Backend
pm2 logs amico-backend --lines 100

# Nginx
sudo tail -f /var/log/nginx/error.log

# PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

---

## 📚 Recursos Adicionales

### Documentación

- [README_SISTEMA_COMPLETO.md](./README_SISTEMA_COMPLETO.md)
- [SEGUIMIENTO_AUTOMATICO.md](./SEGUIMIENTO_AUTOMATICO.md)
- [SISTEMA_COMPLETO_FINAL.md](./SISTEMA_COMPLETO_FINAL.md)

### Comandos Útiles

```bash
# Reiniciar todo el sistema
pm2 restart all
sudo systemctl restart nginx

# Ver uso de recursos
htop
df -h
free -h

# Actualizar código
cd /var/www/amico-management
git pull
cd backend
npm install
npm run build
pm2 restart amico-backend

# Ver logs específicos de seguimiento
pm2 logs amico-backend | grep "seguimiento"
```

---

## ✅ Checklist Final

- [ ] Backend desplegado y corriendo en PM2
- [ ] Frontend compilado y servido por Nginx
- [ ] Base de datos PostgreSQL configurada y migrada
- [ ] MongoDB configurado
- [ ] Redis configurado
- [ ] WhatsApp conectado y respondiendo
- [ ] SSL/HTTPS configurado (Let's Encrypt)
- [ ] Cron jobs ejecutándose cada hora
- [ ] Backups automáticos configurados
- [ ] Firewall configurado
- [ ] Logs rotando correctamente
- [ ] Caso de prueba end-to-end exitoso
- [ ] Seguimiento automático verificado
- [ ] Documentación entregada al cliente

---

## 🎊 ¡Sistema Desplegado Exitosamente!

El sistema Amico Management está ahora en producción y listo para recibir casos reales.

**Siguiente Paso:** Capacitar al equipo del cliente en el uso del sistema.

---

**Última actualización:** Enero 2025
**Versión:** 1.0.0
