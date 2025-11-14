# 📦 Resumen Ejecutivo: Deployment de Gestora Internacional a Bluehost

## 🎯 Lo que tienes que hacer

Subir tu sistema **Gestora Internacional** desde tu PC local a tu servidor Bluehost usando FileZilla, igual que hiciste con Amico Management.

---

## 📚 Archivos Creados para Ti

He creado 4 guías completas para ayudarte:

### 1. **PASOS_RAPIDOS_FILEZILLA.md** ⚡ (EMPIEZA AQUÍ)
- Guía visual paso a paso
- Formato fácil de seguir
- 8 pasos simples
- Tiempo estimado: 30-40 minutos
- **👉 RECOMENDADO PARA EMPEZAR**

### 2. **GUIA_SUBIR_BLUEHOST.md** 📖 (GUÍA COMPLETA)
- Documentación detallada
- Troubleshooting completo
- Comandos SSH explicados
- Configuración avanzada
- **Consultar si tienes dudas**

### 3. **LISTA_ARCHIVOS_SUBIR.txt** 📋 (CHECKLIST)
- Lista exacta de qué subir
- Qué NO subir
- Tamaños de archivos
- Tiempos estimados
- **Imprimir o tener abierto**

### 4. **PREPARAR_SUBIDA.bat** 🤖 (SCRIPT AUTOMÁTICO)
- Compila backend automáticamente
- Compila frontend automáticamente
- Verifica todo antes de subir
- **Ejecutar ANTES de FileZilla**

---

## 🚀 Flujo Rápido (30 minutos)

```
┌─────────────────────────────────────────────────────────────┐
│ PASO 1: Preparar localmente (5 min)                        │
├─────────────────────────────────────────────────────────────┤
│ Doble click en: PREPARAR_SUBIDA.bat                        │
│ Espera a que compile todo                                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ PASO 2: Conectar FileZilla (1 min)                         │
├─────────────────────────────────────────────────────────────┤
│ - Protocolo: SFTP                                           │
│ - Servidor: tudominio.com                                   │
│ - Puerto: 22                                                │
│ - Usuario: tu-usuario-bluehost                              │
│ - Contraseña: tu-contraseña-bluehost                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ PASO 3: Crear carpetas en Bluehost (2 min)                 │
├─────────────────────────────────────────────────────────────┤
│ Click derecho > Crear directorio:                          │
│ - /home/tuusuario/gestora-backend/                          │
│ - /home/tuusuario/public_html/gestora-internacional/        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ PASO 4: Subir BACKEND (10-15 min)                          │
├─────────────────────────────────────────────────────────────┤
│ Arrastrar desde:                                            │
│   backend/dist/                                             │
│   backend/prisma/                                           │
│   backend/.env.production                                   │
│   backend/package.json                                      │
│   backend/package-lock.json                                 │
│                                                             │
│ A: /home/tuusuario/gestora-backend/                         │
│                                                             │
│ 💡 TIP: NO subir node_modules/                             │
│        Instalarlo después por SSH                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ PASO 5: Subir FRONTEND (2-3 min)                           │
├─────────────────────────────────────────────────────────────┤
│ Arrastrar CONTENIDO de frontend/dist/                      │
│                                                             │
│ A: /home/tuusuario/public_html/gestora-internacional/      │
│                                                             │
│ ⚠️ Solo el CONTENIDO, no la carpeta dist/                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ PASO 6: Configurar por SSH (5 min)                         │
├─────────────────────────────────────────────────────────────┤
│ ssh tuusuario@tudominio.com                                 │
│                                                             │
│ cd ~/gestora-backend                                        │
│ mv .env.production .env                                     │
│ nano .env  # Editar credenciales                            │
│ npm install --production                                    │
│ npx prisma generate                                         │
│ npx prisma migrate deploy                                   │
│ npm run db:seed                                             │
│ pm2 start dist/index.js --name gestora-backend             │
│ pm2 save                                                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ PASO 7: Crear .htaccess (2 min)                            │
├─────────────────────────────────────────────────────────────┤
│ En FileZilla:                                               │
│ Click derecho en gestora-internacional/                    │
│ > Crear archivo > .htaccess                                 │
│ > Ver/Editar > Copiar contenido del paso 7 de la guía      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ PASO 8: Verificar (2 min)                                  │
├─────────────────────────────────────────────────────────────┤
│ Abrir: https://tudominio.com/gestora-internacional/        │
│                                                             │
│ Login:                                                      │
│   Email: admin@gestorainternacional.com                     │
│   Password: admin123                                        │
│                                                             │
│ ✅ Debería funcionar!                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Estructura Final en Bluehost

```
/home/tuusuario/
│
├── gestora-backend/                    ← Backend (seguro, fuera de web)
│   ├── dist/                           ← Código compilado JS
│   ├── node_modules/                   ← Dependencias
│   ├── prisma/                         ← Schema y migraciones
│   ├── uploads/                        ← Archivos subidos
│   ├── .env                            ← Configuración (SECRET!)
│   ├── package.json
│   └── package-lock.json
│
└── public_html/                        ← Carpeta web pública
    └── gestora-internacional/          ← Frontend
        ├── index.html                  ← Página principal
        ├── assets/                     ← JS, CSS, imágenes
        │   ├── index-abc123.js
        │   └── index-xyz789.css
        └── .htaccess                   ← Configuración Apache
```

---

## ⚙️ Credenciales que Necesitas

### Bluehost (para FileZilla y SSH)
- Servidor: `tudominio.com`
- Usuario: `tu-usuario-bluehost`
- Contraseña: `tu-contraseña-bluehost`
- Puerto: `22`

### PostgreSQL (para .env)
- Host: `localhost`
- Puerto: `5432`
- Base de datos: `gestora_db` (crear en cPanel)
- Usuario: `gestora_user` (crear en cPanel)
- Contraseña: (crear en cPanel)

### API Keys (para .env)
- OpenAI: `sk-...`
- Anthropic Claude: `sk-ant-...`

### JWT (para .env)
- JWT_SECRET: `tu-secret-super-seguro-123` (cambiar!)
- JWT_REFRESH_SECRET: `tu-refresh-secret-456` (cambiar!)

---

## ⚠️ Puntos Críticos

### 1. **node_modules/**
- ❌ NO subir por FileZilla (tarda mucho)
- ✅ Instalar por SSH: `npm install --production`

### 2. **.env.production**
- ⚠️ Renombrar a `.env` después de subir
- ⚠️ Editar con credenciales reales
- ⚠️ Cambiar JWT_SECRET

### 3. **frontend/dist/**
- ⚠️ Subir SOLO el CONTENIDO
- ❌ NO subir la carpeta "dist" en sí
- ✅ `index.html` debe estar directamente en `gestora-internacional/`

### 4. **.htaccess**
- ⚠️ Crear manualmente en Bluehost
- ⚠️ Necesario para que el frontend funcione
- ⚠️ Necesario para proxy de API

### 5. **PostgreSQL**
- ⚠️ Crear base de datos ANTES de migrar
- ⚠️ Crear usuario con permisos ALL
- ⚠️ Actualizar DATABASE_URL en .env

---

## 🎯 Orden Recomendado de Ejecución

```
1. ✅ Ejecutar PREPARAR_SUBIDA.bat
2. ✅ Abrir FileZilla y conectar
3. ✅ Crear carpetas en Bluehost
4. ✅ Subir backend (sin node_modules)
5. ✅ Subir frontend
6. ✅ Conectar por SSH
7. ✅ Instalar dependencias (npm install)
8. ✅ Configurar .env
9. ✅ Crear base de datos PostgreSQL en cPanel
10. ✅ Ejecutar migraciones
11. ✅ Cargar datos de prueba
12. ✅ Iniciar con PM2
13. ✅ Crear .htaccess
14. ✅ Verificar en navegador
```

---

## 🆘 Comandos de Rescate

### Ver si backend está corriendo
```bash
ssh tuusuario@tudominio.com
pm2 status
```

### Ver logs de errores
```bash
pm2 logs gestora-backend --err
```

### Reiniciar backend
```bash
pm2 restart gestora-backend
```

### Verificar base de datos
```bash
cd ~/gestora-backend
npx prisma studio
# Abre en http://localhost:5555
```

### Cargar datos de prueba nuevamente
```bash
cd ~/gestora-backend
npm run db:seed
```

---

## 📊 Tiempos Estimados

| Tarea | Tiempo |
|-------|--------|
| Compilar localmente | 3-5 min |
| Subir backend | 10-15 min |
| Subir frontend | 2-3 min |
| Configurar SSH | 5-10 min |
| Crear .htaccess | 2 min |
| Verificar | 2 min |
| **TOTAL** | **24-37 min** |

---

## 🎓 Diferencias con Amico Management

Si ya subiste Amico, esto es igual excepto:

| Aspecto | Amico | Gestora |
|---------|-------|---------|
| Carpeta backend | `amico-backend/` | `gestora-backend/` |
| Carpeta frontend | `amico-management/` | `gestora-internacional/` |
| Base de datos | `amico_db` | `gestora_db` |
| Puerto backend | `3000` | `3001` |
| Usuario admin | `admin@amico...` | `admin@gestora...` |

Todo lo demás es idéntico.

---

## 📞 Soporte

### Documentación
- **Inicio rápido**: `PASOS_RAPIDOS_FILEZILLA.md`
- **Guía completa**: `GUIA_SUBIR_BLUEHOST.md`
- **Checklist**: `LISTA_ARCHIVOS_SUBIR.txt`
- **Datos de prueba**: `SISTEMA_DATOS_PRUEBA.md`

### Bluehost
- Chat: https://my.bluehost.com/
- Teléfono: 1-888-401-4678

### Logs
```bash
ssh tuusuario@tudominio.com
pm2 logs gestora-backend
```

---

## ✅ Resultado Final

Una vez completado, tendrás:

### 🌐 URL Frontend
```
https://tudominio.com/gestora-internacional/
```

### 🔌 URL API
```
https://tudominio.com/api/v1/
```

### 👤 Login de Prueba
```
Email: admin@gestorainternacional.com
Password: admin123
```

### 📊 Funcionalidades
- ✅ Sistema de condominios funcionando
- ✅ Login y autenticación JWT
- ✅ Gestión de usuarios
- ✅ Contabilidad con NCF
- ✅ Estados de cuenta
- ✅ Proveedores
- ✅ Importación Excel
- ✅ IA con Claude y OpenAI
- ✅ WhatsApp Bot
- ✅ Datos de prueba listos

---

## 🚀 ¡Comienza Aquí!

```bash
# Paso 1: Compilar todo
PREPARAR_SUBIDA.bat

# Paso 2: Seguir la guía
PASOS_RAPIDOS_FILEZILLA.md
```

---

**Creado**: 2024-01-15
**Sistema**: Gestora Internacional SRL v1.0
**Tiempo estimado total**: 30-40 minutos
**Dificultad**: Media (igual que Amico)
