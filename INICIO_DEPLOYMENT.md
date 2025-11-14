# 🚀 INICIO RÁPIDO: DEPLOYMENT A BLUEHOST

## 👋 ¡BIENVENIDO!

Esta guía te ayudará a subir tu sistema **Amico Management** a Bluehost paso a paso.

---

## 📚 DOCUMENTACIÓN DISPONIBLE

Tenemos **4 guías** para diferentes niveles de detalle:

### 1️⃣ **DEPLOYMENT_RAPIDO.md** ⚡ (COMIENZA AQUÍ)
**Para:** Deployment rápido en 3 pasos
**Tiempo:** 30-45 minutos
**Ideal si:** Quieres hacerlo rápido y ya conoces lo básico

### 2️⃣ **GUIA_DEPLOYMENT_BLUEHOST.md** 📖
**Para:** Guía completa paso a paso
**Tiempo:** 1-2 horas (leyendo todo)
**Ideal si:** Es tu primer deployment o quieres entender todo en detalle

### 3️⃣ **FILEZILLA_VISUAL.md** 📁
**Para:** Guía visual de dónde va cada archivo en FileZilla
**Tiempo:** 10 minutos
**Ideal si:** Ya compilaste todo y solo necesitas saber qué subir y dónde

### 4️⃣ **FAQ_DEPLOYMENT.md** ❓
**Para:** Preguntas frecuentes y solución de problemas
**Tiempo:** Consulta según necesites
**Ideal si:** Tienes un problema específico o duda

---

## 🎯 ¿POR DÓNDE EMPIEZO?

### 📌 Ruta Recomendada (Principiante)

```
1. Lee: DEPLOYMENT_RAPIDO.md (5 min)
   ├─ Entiende el proceso general
   └─ Ve qué necesitas preparar

2. Ejecuta: PREPARAR_DEPLOYMENT.bat (5 min)
   ├─ Compila backend y frontend
   └─ Crea carpeta deployment/ lista

3. Lee: FILEZILLA_VISUAL.md (5 min)
   ├─ Aprende a usar FileZilla
   └─ Ve dónde va cada archivo

4. Sube archivos por FileZilla (20-30 min)
   ├─ Backend a /home/usuario/amico-backend/
   └─ Frontend a /public_html/amico/

5. Configura por SSH (10-15 min)
   ├─ Edita .env
   ├─ npm install --production
   ├─ npx prisma migrate deploy
   └─ pm2 start dist/index.js

6. ¡Listo! Verifica que funcione (5 min)
   ├─ https://tudominio.com/amico/
   └─ Login y pruebas
```

**TIEMPO TOTAL:** ~1 hora

---

### 📌 Ruta Rápida (Avanzado)

```
1. Ejecuta: PREPARAR_DEPLOYMENT.bat
2. Abre FileZilla, sube archivos
3. SSH: npm install && npx prisma migrate deploy && pm2 start dist/index.js
4. ¡Listo!
```

**TIEMPO TOTAL:** ~30 minutos

---

## ✅ CHECKLIST PRE-DEPLOYMENT

Antes de comenzar, asegúrate de tener:

### 📋 Información Necesaria

- [ ] ✅ **Credenciales Bluehost**
  - Usuario cPanel
  - Contraseña cPanel
  - Dominio (ej: tudominio.com)

- [ ] ✅ **Base de Datos PostgreSQL** (crear en cPanel)
  - Nombre de base de datos
  - Usuario de base de datos
  - Contraseña de base de datos

- [ ] ✅ **MongoDB** (una de estas opciones)
  - [ ] Cuenta MongoDB Atlas (gratis)
  - [ ] O modificar código para usar solo PostgreSQL

- [ ] ✅ **API Keys**
  - OpenAI API Key (para IA)

- [ ] ✅ **WhatsApp Business**
  - Número de teléfono
  - App instalada en móvil

### 🛠️ Software Necesario

- [ ] ✅ **FileZilla Client** (gratis)
  - Descargar: https://filezilla-project.org/

- [ ] ✅ **Cliente SSH** (gratis)
  - Windows: PowerShell, PuTTY, o Git Bash
  - Mac/Linux: Terminal nativo

- [ ] ✅ **Node.js** (local, para compilar)
  - Ya debería estar instalado si trabajaste en el proyecto

---

## 🚦 INICIO RÁPIDO: 3 COMANDOS

### 1️⃣ Preparar (Local - Tu Computadora)

```batch
REM Ejecuta este archivo para compilar todo
PREPARAR_DEPLOYMENT.bat
```

Resultado: Carpeta `deployment/` creada con todo listo.

### 2️⃣ Subir (FileZilla)

```
Backend:  deployment/backend/  →  /home/usuario/amico-backend/
Frontend: deployment/frontend/ →  /public_html/amico/
```

### 3️⃣ Configurar (SSH - Servidor)

```bash
cd ~/amico-backend
nano .env  # Edita con tus credenciales reales
npm install --production
npx prisma migrate deploy
pm2 start dist/index.js --name amico-backend
```

---

## 📊 ESTRUCTURA FINAL

```
BLUEHOST SERVIDOR
│
├── /home/tu-usuario/amico-backend/    (Backend - Seguro)
│   ├── dist/                          (Código compilado)
│   ├── node_modules/                  (Dependencias)
│   ├── .env                           (Config - EDITAR!)
│   └── ...
│
└── /home/tu-usuario/public_html/amico/ (Frontend - Público)
    ├── index.html
    ├── assets/
    └── ...
```

**URLs Resultantes:**
- Frontend: `https://tudominio.com/amico/`
- Dashboard: `https://tudominio.com/amico/dashboard`

---

## 🎬 VIDEO TUTORIAL (Próximamente)

Estamos preparando un video tutorial paso a paso.

Mientras tanto, sigue las guías escritas.

---

## 📞 AYUDA Y SOPORTE

### ¿Tienes un problema?

1. **Consulta:** [FAQ_DEPLOYMENT.md](FAQ_DEPLOYMENT.md)
2. **Revisa logs:** `pm2 logs amico-backend`
3. **Contacta:** Soporte técnico de Bluehost

### ¿Algo no funciona?

**Checklist rápido:**
- [ ] ¿Backend compilado? (`npm run build`)
- [ ] ¿Frontend compilado? (`npm run build`)
- [ ] ¿Archivos subidos correctamente?
- [ ] ¿`.env` editado con credenciales reales?
- [ ] ¿Dependencias instaladas? (`npm install`)
- [ ] ¿Migraciones ejecutadas? (`npx prisma migrate deploy`)
- [ ] ¿PM2 corriendo? (`pm2 status`)

---

## 🎯 PRÓXIMOS PASOS

### Después del Deployment:

1. **Conecta WhatsApp:**
   ```bash
   cd ~/amico-backend
   node wa-qr.js
   ```
   Escanea el QR con WhatsApp Business.

2. **Crea usuario admin:**
   ```bash
   node seed-railway.js
   ```
   O manualmente via Prisma Studio.

3. **Prueba el sistema:**
   - Login en frontend
   - Envía mensaje de prueba por WhatsApp
   - Verifica dashboard

4. **Configura SSL/HTTPS:**
   - cPanel → "SSL/TLS Status"
   - Activa para tu dominio (gratis con Let's Encrypt)

5. **Configura backups:**
   - Backup de base de datos (diario)
   - Backup de archivos (semanal)

---

## 📖 GUÍAS RELACIONADAS

**En el proyecto:**
- [DASHBOARD_ADMINISTRATIVO.md](backend/DASHBOARD_ADMINISTRATIVO.md) - Documentación del dashboard
- [ENCUESTAS_SATISFACCION.md](backend/ENCUESTAS_SATISFACCION.md) - Sistema de encuestas
- [SEGUIMIENTO_AUTOMATICO.md](backend/SEGUIMIENTO_AUTOMATICO.md) - Seguimiento de casos
- [SISTEMA_COMPLETO_FINAL.md](backend/SISTEMA_COMPLETO_FINAL.md) - Visión general

**Deployment:**
- [DEPLOYMENT_RAPIDO.md](DEPLOYMENT_RAPIDO.md) ⭐ Comienza aquí
- [GUIA_DEPLOYMENT_BLUEHOST.md](GUIA_DEPLOYMENT_BLUEHOST.md) - Guía completa
- [FILEZILLA_VISUAL.md](FILEZILLA_VISUAL.md) - Ayuda visual
- [FAQ_DEPLOYMENT.md](FAQ_DEPLOYMENT.md) - Preguntas frecuentes

---

## ⭐ RECOMENDACIÓN

**Para tu primera vez:**

1. Lee **DEPLOYMENT_RAPIDO.md** completo (15 min)
2. Ejecuta **PREPARAR_DEPLOYMENT.bat**
3. Sigue los pasos uno por uno
4. Si tienes dudas, consulta **FAQ_DEPLOYMENT.md**

**¡No te preocupes!** Las guías están diseñadas para ser claras y fáciles de seguir.

---

## 🎉 ¡ÉXITO!

Una vez completado, tendrás:

✅ Sistema Amico Management corriendo en Bluehost
✅ Frontend accesible desde tu dominio
✅ Backend seguro ejecutándose 24/7
✅ WhatsApp Bot respondiendo automáticamente
✅ Dashboard administrativo funcional
✅ Base de datos PostgreSQL + MongoDB
✅ Sistema de encuestas activo
✅ Seguimiento automatizado de casos

---

**¿Listo para comenzar?**

👉 Abre: [DEPLOYMENT_RAPIDO.md](DEPLOYMENT_RAPIDO.md)

---

**Última actualización:** 12 de noviembre, 2024
**Versión del sistema:** Amico Management v1.0
**Documentación completa:** Carpeta `amico/`
