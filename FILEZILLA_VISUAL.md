# 📁 GUÍA VISUAL FILEZILLA - DÓNDE VA CADA CARPETA

## 🖥️ INTERFAZ DE FILEZILLA

```
┌─────────────────────────────────────────────────────────────────────────┐
│  FileZilla - Conexión a Bluehost                                        │
├─────────────────────────────────────────────────────────────────────────┤
│  Host: ftp.tudominio.com  Usuario: cpanel_user  Puerto: 21    [Conectar]│
├──────────────────────────────┬──────────────────────────────────────────┤
│   TU COMPUTADORA (LOCAL)     │   SERVIDOR BLUEHOST (REMOTO)             │
├──────────────────────────────┼──────────────────────────────────────────┤
│                              │                                          │
│  Panel IZQUIERDO             │   Panel DERECHO                          │
│  ▼                           │   ▼                                      │
└──────────────────────────────┴──────────────────────────────────────────┘
```

---

## 📤 SUBIDA 1: BACKEND

### Panel IZQUIERDO (Tu computadora)

```
c:\
└── Users\
    └── josue\
        └── mis-sitios-bluehost\
            └── public_html\
                └── amico\
                    └── backend\              ← NAVEGA AQUÍ
                        ├── dist\             ✓ SUBE ESTO
                        ├── prisma\           ✓ SUBE ESTO
                        ├── package.json      ✓ SUBE ESTO
                        ├── package-lock.json ✓ SUBE ESTO
                        ├── .env              ✓ SUBE ESTO
                        ├── node_modules\     ⚠️ NO subir (muy pesado)
                        └── src\              ✗ NO subir (código fuente)
```

### Panel DERECHO (Servidor Bluehost)

```
/
└── home\
    └── tu-usuario\              ← PRIMERO: Navega a la raíz
        └── amico-backend\       ← CREA esta carpeta
            │
            ├── dist\            ← Aquí va backend/dist/
            ├── prisma\          ← Aquí va backend/prisma/
            ├── package.json     ← Aquí va backend/package.json
            ├── package-lock.json← Aquí va backend/package-lock.json
            ├── .env             ← Aquí va backend/.env
            │
            └── (carpetas vacías a crear):
                ├── uploads\
                ├── exports\
                ├── logs\
                └── auth_info_baileys\
```

### Pasos en FileZilla:

1. **Panel DERECHO:** Click en `..` varias veces hasta llegar a `/home/tu-usuario/`
2. **Panel DERECHO:** Click derecho → "Create directory" → nombra: `amico-backend`
3. **Panel DERECHO:** Entra a la carpeta `amico-backend/`
4. **Panel IZQUIERDO:** Navega a `c:\Users\josue\...\amico\backend\`
5. **Selecciona** en panel IZQUIERDO:
   - `dist/` (carpeta completa)
   - `prisma/` (carpeta completa)
   - `package.json`
   - `package-lock.json`
   - `.env`
6. **Arrastra** al panel DERECHO o click derecho → "Upload"
7. **Espera** a que termine (puede tardar 5-10 minutos)

---

## 📤 SUBIDA 2: FRONTEND

### Panel IZQUIERDO (Tu computadora)

```
c:\
└── Users\
    └── josue\
        └── mis-sitios-bluehost\
            └── public_html\
                └── amico\
                    └── frontend\
                        └── dist\              ← NAVEGA AQUÍ
                            ├── index.html     ✓ TODO ESTO
                            ├── assets\        ✓ SUBE
                            └── (otros)        ✓ AL SERVIDOR
```

### Panel DERECHO (Servidor Bluehost)

```
/
└── home\
    └── tu-usuario\
        └── public_html\         ← Navega aquí
            └── amico\           ← CREA esta carpeta
                ├── index.html   ← Aquí va frontend/dist/index.html
                ├── assets\      ← Aquí va frontend/dist/assets/
                └── (otros)      ← Aquí van todos los archivos de dist/
```

### Pasos en FileZilla:

1. **Panel DERECHO:** Navega a `/home/tu-usuario/public_html/`
2. **Panel DERECHO:** Click derecho → "Create directory" → nombra: `amico`
3. **Panel DERECHO:** Entra a la carpeta `amico/`
4. **Panel IZQUIERDO:** Navega a `c:\Users\josue\...\amico\frontend\dist\`
5. **Selecciona TODO** dentro de `dist/`:
   - `index.html`
   - carpeta `assets/`
   - todos los demás archivos
6. **Arrastra** al panel DERECHO
7. **Espera** a que termine (1-2 minutos)

---

## 🎯 RESULTADO FINAL EN SERVIDOR

```
/home/tu-usuario/
│
├── public_html/                    ← Accesible desde web
│   ├── index.html                  (tu sitio principal)
│   ├── otras-carpetas/
│   └── amico/                      ← FRONTEND AQUÍ
│       ├── index.html
│       ├── assets/
│       │   ├── index-abc123.js
│       │   ├── index-def456.css
│       │   └── (imágenes, etc.)
│       └── (otros archivos)
│
│       URL: https://tudominio.com/amico/
│
└── amico-backend/                  ← NO accesible desde web (seguro)
    ├── dist/
    │   ├── index.js
    │   ├── config/
    │   ├── controllers/
    │   ├── services/
    │   └── (código compilado)
    ├── prisma/
    │   ├── schema.prisma
    │   └── migrations/
    ├── uploads/
    ├── exports/
    ├── logs/
    ├── auth_info_baileys/
    ├── package.json
    ├── package-lock.json
    └── .env                        ← EDITAR ESTE ARCHIVO
```

---

## 🔍 VERIFICAR SUBIDA CORRECTA

### Backend

**En Panel DERECHO de FileZilla:**
```
/home/tu-usuario/amico-backend/

Debes ver:
✓ dist/ (carpeta)
✓ prisma/ (carpeta)
✓ package.json (archivo)
✓ .env (archivo)
```

**Verificar tamaño:**
- La carpeta `dist/` debe tener varios archivos .js
- `package.json` debe pesar ~2-3 KB

### Frontend

**En Panel DERECHO de FileZilla:**
```
/home/tu-usuario/public_html/amico/

Debes ver:
✓ index.html (archivo)
✓ assets/ (carpeta con archivos .js y .css)
```

**Verificar contenido de assets/:**
- Debe tener archivos con nombres tipo: `index-abc123.js`
- Debe tener archivos CSS
- Puede tener imágenes

---

## ⚡ TIPS DE FILEZILLA

### Acelerar la subida

1. **Conexión simultánea:**
   - FileZilla → Editar → Configuración
   - Transferencias → Número máximo de transferencias simultáneas: `5`

2. **Reanudar transferencias:**
   - Si se interrumpe, FileZilla reanuda automáticamente

3. **Filtrar archivos:**
   - Vista → Filtrado de nombre de archivo
   - Excluir: `node_modules`, `.git`, `src`, `*.md`

### Ver progreso

```
┌────────────────────────────────────────┐
│  Transferencias                        │
├────────────────────────────────────────┤
│  ✓ dist/index.js        (45 KB)       │
│  ✓ dist/config.js       (12 KB)       │
│  → package.json         (2 KB) [50%]  │
│  ⏳ .env                (1 KB) [cola] │
└────────────────────────────────────────┘
```

### Permisos de archivos

**Después de subir, verificar permisos:**

1. Click derecho en archivo/carpeta
2. "Permisos de archivo..."
3. Valor numérico: `755` para carpetas, `644` para archivos

---

## 🆘 PROBLEMAS COMUNES EN FILEZILLA

### "No se puede crear directorio"

**Causa:** No tienes permisos en esa ubicación

**Solución:**
- Asegúrate de estar en `/home/tu-usuario/`
- Contacta soporte de Bluehost si persiste

### "Conexión rechazada"

**Causa:** Credenciales incorrectas o puerto bloqueado

**Solución:**
1. Verifica usuario/password de cPanel
2. Intenta puerto 22 (SFTP) en lugar de 21 (FTP)
3. En cPanel → "FTP Accounts" → verifica que tu cuenta FTP existe

### "Transferencia muy lenta"

**Causa:** node_modules/ tiene miles de archivos

**Solución:**
- **NO subas node_modules/** por FileZilla
- Sube solo lo necesario
- Luego por SSH ejecuta: `npm install --production`

### "Archivo ya existe"

**Opciones:**
- **Sobrescribir:** Reemplaza el archivo existente
- **Reanudar:** Continúa transferencia interrumpida
- **Saltar:** Deja el archivo existente

**Recomendación:** Selecciona "Sobrescribir" si es deployment nuevo

---

## 📋 CHECKLIST VISUAL FILEZILLA

### Antes de empezar:
- [ ] FileZilla instalado
- [ ] Credenciales de Bluehost listas
- [ ] Backend compilado (`npm run build` ejecutado)
- [ ] Frontend compilado (`npm run build` ejecutado)

### Durante la subida:
- [ ] Conectado a Bluehost
- [ ] Navegado a `/home/tu-usuario/`
- [ ] Carpeta `amico-backend/` creada
- [ ] Backend subido (dist, prisma, package.json, .env)
- [ ] Navegado a `/public_html/`
- [ ] Carpeta `amico/` creada
- [ ] Frontend subido (todo el contenido de dist/)

### Después de subir:
- [ ] Verificar archivos en servidor (panel derecho)
- [ ] Verificar permisos (755 para carpetas, 644 para archivos)
- [ ] Desconectar FileZilla
- [ ] Continuar con configuración SSH

---

## 🎯 SIGUIENTE PASO

Después de subir los archivos con FileZilla:

1. **Conecta por SSH:**
   ```bash
   ssh tu-usuario@tudominio.com
   ```

2. **Verifica que los archivos están:**
   ```bash
   ls -la ~/amico-backend/
   ls -la ~/public_html/amico/
   ```

3. **Continúa con la configuración:**
   - Ver archivo: `DEPLOYMENT_RAPIDO.md` - Paso 3

---

**¡Éxito con tu deployment!** 🚀
