# 🚀 DEPLOYMENT RÁPIDO - AMICO A BLUEHOST

## 📌 RESUMEN EN 3 PASOS

```
┌─────────────────────────────────────────────────────────────┐
│                     TU COMPUTADORA                          │
│  c:\Users\josue\mis-sitios-bluehost\public_html\amico\    │
│                                                              │
│  ┌──────────────┐         ┌──────────────┐                 │
│  │   BACKEND    │         │   FRONTEND   │                 │
│  │              │         │              │                 │
│  │  TypeScript  │  BUILD  │    React     │                 │
│  │     src/     │ ======> │     src/     │                 │
│  │              │         │              │                 │
│  │  Resultado:  │         │  Resultado:  │                 │
│  │    dist/     │         │    dist/     │                 │
│  └──────────────┘         └──────────────┘                 │
│         │                         │                         │
│         │    FILEZILLA            │                         │
│         ▼                         ▼                         │
└─────────────────────────────────────────────────────────────┘
              │                         │
              │                         │
┌─────────────────────────────────────────────────────────────┐
│                    SERVIDOR BLUEHOST                        │
│                                                              │
│  ┌──────────────────────────────┐  ┌─────────────────────┐ │
│  │  /home/usuario/              │  │  /public_html/      │ │
│  │    amico-backend/            │  │    amico/           │ │
│  │                              │  │                     │ │
│  │  ✓ dist/                    │  │  ✓ index.html      │ │
│  │  ✓ node_modules/            │  │  ✓ assets/         │ │
│  │  ✓ package.json             │  │  ✓ (archivos dist) │ │
│  │  ✓ .env (editar!)           │  │                     │ │
│  │  ✓ prisma/                  │  └─────────────────────┘ │
│  │                              │      ▲                   │
│  │  Ejecutar:                   │      │                   │
│  │  $ npm install --production  │  Accesible desde:       │
│  │  $ pm2 start dist/index.js   │  https://tudominio.com/ │
│  └──────────────────────────────┘       amico/            │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚡ PASO 1: PREPARAR ARCHIVOS (LOCAL)

### Opción A: Script Automático (FÁCIL)

```batch
# Haz doble click en:
PREPARAR_DEPLOYMENT.bat
```

Esto compilará todo y creará la carpeta `deployment/` lista para subir.

### Opción B: Manual

```bash
# Backend
cd c:\Users\josue\mis-sitios-bluehost\public_html\amico\backend
npm run build

# Frontend
cd c:\Users\josue\mis-sitios-bluehost\public_html\amico\frontend
npm run build
```

---

## 📤 PASO 2: SUBIR CON FILEZILLA

### A. Conectar FileZilla

```
Host: ftp.tudominio.com
Usuario: tu-usuario-cpanel
Contraseña: tu-password-cpanel
Puerto: 21
```

### B. Subir BACKEND

**LOCAL (panel izquierdo de FileZilla):**
```
c:\Users\josue\mis-sitios-bluehost\public_html\amico\backend\
```

**REMOTO (panel derecho de FileZilla):**
```
/home/tu-usuario/amico-backend/
```

**Arrastra estos archivos/carpetas:**
```
✓ dist/               (carpeta completa)
✓ prisma/             (carpeta completa)
✓ package.json
✓ package-lock.json
✓ .env                (lo editarás después)
```

**Crea estas carpetas vacías en el servidor:**
```
✓ uploads/
✓ exports/
✓ logs/
✓ auth_info_baileys/
```

### C. Subir FRONTEND

**LOCAL (panel izquierdo):**
```
c:\Users\josue\mis-sitios-bluehost\public_html\amico\frontend\dist\
```

**REMOTO (panel derecho):**
```
/public_html/amico/
```

**Arrastra TODO el contenido de `dist/`:**
```
✓ index.html
✓ assets/          (carpeta completa)
✓ todos los demás archivos
```

---

## ⚙️ PASO 3: CONFIGURAR Y EJECUTAR (SSH)

### A. Conectar por SSH

```bash
ssh tu-usuario@tudominio.com
```

### B. Editar .env

```bash
cd ~/amico-backend
nano .env
```

**Cambia estos valores:**
```bash
# PostgreSQL (obtén de cPanel → PostgreSQL)
DATABASE_URL=postgresql://amico_user:PASSWORD@localhost:5432/amico_db

# MongoDB (de MongoDB Atlas - gratis)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/amico_logs

# CORS (tu dominio real)
CORS_ORIGIN=https://tudominio.com

# OpenAI (tu API key)
OPENAI_API_KEY=sk-tu-api-key-aqui

# JWT (genera secretos seguros)
JWT_SECRET=genera-un-secreto-super-seguro-aqui-123456
JWT_REFRESH_SECRET=otro-secreto-diferente-789
```

**Guarda:** `Ctrl+X`, luego `Y`, luego `Enter`

### C. Instalar Dependencias

```bash
cd ~/amico-backend
npm install --production
```

### D. Ejecutar Migraciones

```bash
npx prisma generate
npx prisma migrate deploy
```

### E. Iniciar Backend con PM2

```bash
# Instalar PM2 (si no está instalado)
npm install -g pm2

# Iniciar aplicación
pm2 start dist/index.js --name amico-backend

# Guardar configuración
pm2 save
pm2 startup

# Ver logs
pm2 logs amico-backend
```

---

## ✅ VERIFICAR QUE TODO FUNCIONA

### 1. Backend está corriendo

```bash
pm2 status
# Debe mostrar "amico-backend" en estado "online"
```

### 2. API responde

```bash
curl http://localhost:3000/health
```

Debería responder:
```json
{
  "status": "ok",
  "timestamp": "2024-11-12T...",
  "uptime": 123
}
```

### 3. Frontend carga

Abre en navegador:
```
https://tudominio.com/amico/
```

Debe cargar la interfaz de Amico Management.

---

## 🎯 ESTRUCTURA FINAL EN BLUEHOST

```
/home/tu-usuario/
│
├── public_html/
│   └── amico/                    ← FRONTEND (accesible por web)
│       ├── index.html
│       └── assets/
│
└── amico-backend/                ← BACKEND (NO accesible por web)
    ├── dist/                     ← Código compilado
    ├── node_modules/             ← Dependencias
    ├── prisma/                   ← Base de datos schema
    ├── uploads/                  ← Archivos subidos
    ├── exports/                  ← Reportes Excel
    ├── logs/                     ← Logs del sistema
    ├── auth_info_baileys/        ← Sesión WhatsApp
    ├── package.json
    ├── package-lock.json
    └── .env                      ← Configuración (EDITADO)
```

---

## 🔧 COMANDOS ÚTILES

### Ver estado del backend
```bash
pm2 status
```

### Ver logs en tiempo real
```bash
pm2 logs amico-backend
```

### Reiniciar backend
```bash
pm2 restart amico-backend
```

### Detener backend
```bash
pm2 stop amico-backend
```

### Ver uso de memoria
```bash
pm2 monit
```

---

## 🆘 PROBLEMAS COMUNES

### Backend no inicia

```bash
# Ver logs de error
pm2 logs amico-backend --lines 100

# Verificar .env
cat ~/amico-backend/.env

# Verificar permisos
chmod -R 755 ~/amico-backend
```

### No puedo conectar a PostgreSQL

```bash
# Probar conexión
psql -U amico_user -d amico_db -h localhost

# Si falla, verifica en cPanel que:
# 1. La base de datos existe
# 2. El usuario tiene permisos
# 3. El password es correcto
```

### Frontend no carga

1. Verifica que los archivos están en `/public_html/amico/`
2. Verifica que `index.html` existe
3. Verifica permisos: `chmod -R 755 /public_html/amico/`

### API no responde

1. Verifica que PM2 está corriendo: `pm2 status`
2. Verifica logs: `pm2 logs amico-backend`
3. Verifica puerto 3000 abierto: `netstat -tulpn | grep 3000`

---

## 📊 CHECKLIST RÁPIDO

- [ ] ✓ Compilé backend (`npm run build`)
- [ ] ✓ Compilé frontend (`npm run build`)
- [ ] ✓ Subí backend a `/home/usuario/amico-backend/`
- [ ] ✓ Subí frontend a `/public_html/amico/`
- [ ] ✓ Edité `.env` con valores reales
- [ ] ✓ Ejecuté `npm install --production`
- [ ] ✓ Ejecuté `npx prisma migrate deploy`
- [ ] ✓ Inicié con `pm2 start dist/index.js`
- [ ] ✓ `pm2 status` muestra "online"
- [ ] ✓ `/health` endpoint responde
- [ ] ✓ Frontend carga en navegador

---

## 🎉 ¡LISTO!

Si completaste todos los pasos, tu sistema está funcionando en Bluehost.

**Accesos:**
- Frontend: `https://tudominio.com/amico/`
- Dashboard: `https://tudominio.com/amico/dashboard`

**Para más detalles, consulta:**
- `GUIA_DEPLOYMENT_BLUEHOST.md` - Guía completa paso a paso
- Backend logs: `pm2 logs amico-backend`

---

**Última actualización:** 12 de noviembre, 2024
