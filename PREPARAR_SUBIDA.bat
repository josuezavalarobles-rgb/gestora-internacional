@echo off
chcp 65001 >nul
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║   PREPARAR GESTORA INTERNACIONAL PARA SUBIR A BLUEHOST    ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

set PROYECTO_DIR=%~dp0
cd /d "%PROYECTO_DIR%"

echo [1/6] Verificando estructura del proyecto...
echo.

if not exist "backend" (
    echo ❌ Error: No se encuentra la carpeta backend
    pause
    exit /b 1
)

if not exist "frontend" (
    echo ❌ Error: No se encuentra la carpeta frontend
    pause
    exit /b 1
)

echo ✅ Estructura del proyecto correcta
echo.

echo [2/6] Compilando BACKEND (TypeScript → JavaScript)...
echo.

cd backend

if not exist "node_modules" (
    echo 📦 Instalando dependencias del backend...
    call npm install
    if errorlevel 1 (
        echo ❌ Error al instalar dependencias del backend
        pause
        exit /b 1
    )
)

echo 🔨 Generando cliente de Prisma...
call npm run db:generate
if errorlevel 1 (
    echo ❌ Error al generar cliente de Prisma
    pause
    exit /b 1
)

echo 🔨 Compilando TypeScript...
call npm run build
if errorlevel 1 (
    echo ❌ Error al compilar backend
    pause
    exit /b 1
)

echo ✅ Backend compilado exitosamente
echo.

echo [3/6] Compilando FRONTEND (React + Vite)...
echo.

cd ..\frontend

if not exist "node_modules" (
    echo 📦 Instalando dependencias del frontend...
    call npm install
    if errorlevel 1 (
        echo ❌ Error al instalar dependencias del frontend
        pause
        exit /b 1
    )
)

echo 🔨 Compilando frontend para producción...
call npm run build
if errorlevel 1 (
    echo ❌ Error al compilar frontend
    pause
    exit /b 1
)

echo ✅ Frontend compilado exitosamente
echo.

echo [4/6] Verificando archivos .env...
echo.

cd ..\backend

if not exist ".env.production" (
    echo ⚠️  Advertencia: No existe .env.production
    echo 📝 Creando .env.production desde .env.example...

    if exist ".env.example" (
        copy .env.example .env.production >nul
        echo ✅ .env.production creado - RECUERDA EDITARLO CON TUS CREDENCIALES
    ) else (
        echo ❌ No se encontró .env.example
    )
) else (
    echo ✅ .env.production existe
)

echo.

cd ..\frontend

if not exist ".env.production" (
    echo ⚠️  Advertencia: No existe .env.production en frontend
    echo 📝 Creando .env.production...
    (
        echo VITE_API_URL=https://tudominio.com/api/v1
        echo VITE_WS_URL=wss://tudominio.com
    ) > .env.production
    echo ✅ .env.production creado - RECUERDA EDITAR LA URL
) else (
    echo ✅ .env.production existe
)

echo.

echo [5/6] Creando carpetas necesarias...
echo.

cd ..\backend

if not exist "uploads\temp" (
    echo 📁 Creando uploads\temp...
    mkdir uploads\temp
    echo # Carpeta temporal para uploads > uploads\temp\.gitkeep
)

echo ✅ Carpetas creadas
echo.

echo [6/6] Generando resumen de archivos a subir...
echo.

cd ..

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                    RESUMEN DE ARCHIVOS                     ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

echo 📦 BACKEND (subir a: /home/tuusuario/gestora-backend/)
echo    ├─ backend\dist\                   (código compilado)
echo    ├─ backend\node_modules\            (dependencias)
echo    ├─ backend\prisma\                  (schema y migraciones)
echo    ├─ backend\uploads\                 (carpeta vacía)
echo    ├─ backend\.env.production          (renombrar a .env)
echo    ├─ backend\package.json
echo    └─ backend\package-lock.json
echo.

echo 🌐 FRONTEND (subir a: /home/tuusuario/public_html/gestora-internacional/)
echo    ├─ frontend\dist\index.html
echo    ├─ frontend\dist\assets\
echo    └─ todos los archivos de frontend\dist\
echo.

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                   PRÓXIMOS PASOS                           ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo 1. ✅ Abrir FileZilla
echo.
echo 2. ✅ Conectar a Bluehost:
echo    - Protocolo: SFTP
echo    - Servidor: tudominio.com
echo    - Usuario: tu-usuario-bluehost
echo    - Contraseña: tu-contraseña-bluehost
echo    - Puerto: 22
echo.
echo 3. ✅ Subir BACKEND:
echo    - Origen: backend\dist\, backend\node_modules\, etc.
echo    - Destino: /home/tuusuario/gestora-backend/
echo.
echo 4. ✅ Subir FRONTEND:
echo    - Origen: frontend\dist\*
echo    - Destino: /home/tuusuario/public_html/gestora-internacional/
echo.
echo 5. ✅ Conectar por SSH y ejecutar:
echo    cd ~/gestora-backend
echo    npx prisma migrate deploy
echo    npm run db:seed
echo    pm2 start dist/index.js --name gestora-backend
echo.
echo 6. ✅ Crear .htaccess en public_html/gestora-internacional/
echo    (ver GUIA_SUBIR_BLUEHOST.md)
echo.
echo 7. ✅ Verificar en: https://tudominio.com/gestora-internacional/
echo.

echo.
echo 📖 Para instrucciones detalladas, consulta: GUIA_SUBIR_BLUEHOST.md
echo.

echo ╔════════════════════════════════════════════════════════════╗
echo ║                ✅ PREPARACIÓN COMPLETADA                   ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

pause
