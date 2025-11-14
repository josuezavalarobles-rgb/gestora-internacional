@echo off
REM ========================================
REM SCRIPT DE PREPARACIÓN PARA DEPLOYMENT
REM Amico Management - Bluehost
REM ========================================

echo.
echo ========================================
echo  AMICO MANAGEMENT - PREPARACION DEPLOYMENT
echo ========================================
echo.

REM Directorio base
set BASE_DIR=c:\Users\josue\mis-sitios-bluehost\public_html\amico

echo [1/5] Limpiando compilaciones anteriores...
if exist "%BASE_DIR%\backend\dist" rd /s /q "%BASE_DIR%\backend\dist"
if exist "%BASE_DIR%\frontend\dist" rd /s /q "%BASE_DIR%\frontend\dist"
if exist "%BASE_DIR%\deployment" rd /s /q "%BASE_DIR%\deployment"
echo ✓ Limpieza completa

echo.
echo [2/5] Compilando BACKEND (TypeScript → JavaScript)...
cd /d "%BASE_DIR%\backend"
call npm run build
if errorlevel 1 (
    echo ✗ ERROR compilando backend
    pause
    exit /b 1
)
echo ✓ Backend compilado exitosamente

echo.
echo [3/5] Compilando FRONTEND (React → Producción)...
cd /d "%BASE_DIR%\frontend"
call npm run build
if errorlevel 1 (
    echo ✗ ERROR compilando frontend
    pause
    exit /b 1
)
echo ✓ Frontend compilado exitosamente

echo.
echo [4/5] Creando carpeta de deployment...
mkdir "%BASE_DIR%\deployment"
mkdir "%BASE_DIR%\deployment\backend"
mkdir "%BASE_DIR%\deployment\frontend"

REM Copiar archivos del backend
echo Copiando archivos del backend...
xcopy "%BASE_DIR%\backend\dist" "%BASE_DIR%\deployment\backend\dist\" /E /I /Y
xcopy "%BASE_DIR%\backend\package.json" "%BASE_DIR%\deployment\backend\" /Y
xcopy "%BASE_DIR%\backend\package-lock.json" "%BASE_DIR%\deployment\backend\" /Y
xcopy "%BASE_DIR%\backend\.env.example" "%BASE_DIR%\deployment\backend\.env" /Y
xcopy "%BASE_DIR%\backend\prisma" "%BASE_DIR%\deployment\backend\prisma\" /E /I /Y

REM Crear carpetas necesarias
mkdir "%BASE_DIR%\deployment\backend\uploads"
mkdir "%BASE_DIR%\deployment\backend\exports"
mkdir "%BASE_DIR%\deployment\backend\logs"
mkdir "%BASE_DIR%\deployment\backend\auth_info_baileys"

REM Copiar archivos del frontend
echo Copiando archivos del frontend...
xcopy "%BASE_DIR%\frontend\dist" "%BASE_DIR%\deployment\frontend\" /E /I /Y

echo ✓ Archivos copiados a carpeta deployment

echo.
echo [5/5] Generando instrucciones de deployment...

REM Crear archivo de instrucciones
(
echo ========================================
echo ARCHIVOS LISTOS PARA DEPLOYMENT
echo ========================================
echo.
echo BACKEND: deployment/backend/
echo - Sube TODOS los archivos a: /home/tu-usuario/amico-backend/
echo - NO OLVIDES editar el archivo .env con tus credenciales reales
echo.
echo FRONTEND: deployment/frontend/
echo - Sube TODOS los archivos a: /public_html/amico/
echo.
echo SIGUIENTE PASO:
echo 1. Abre FileZilla
echo 2. Conecta a tu servidor Bluehost
echo 3. Sube backend/ a /home/tu-usuario/amico-backend/
echo 4. Sube frontend/ a /public_html/amico/
echo 5. Conecta por SSH y ejecuta: cd ~/amico-backend ^&^& npm install --production
echo 6. Ejecuta migraciones: npx prisma migrate deploy
echo 7. Inicia con PM2: pm2 start dist/index.js --name amico-backend
echo.
echo Ver GUIA_DEPLOYMENT_BLUEHOST.md para instrucciones completas
echo ========================================
) > "%BASE_DIR%\deployment\LEER_PRIMERO.txt"

echo ✓ Instrucciones generadas

echo.
echo ========================================
echo ✓ PREPARACIÓN COMPLETA
echo ========================================
echo.
echo Archivos listos en: %BASE_DIR%\deployment\
echo.
echo Tamaño aproximado:
dir "%BASE_DIR%\deployment" /s | find "File(s)"
echo.
echo SIGUIENTE PASO:
echo 1. Revisa la carpeta 'deployment'
echo 2. Lee el archivo 'LEER_PRIMERO.txt'
echo 3. Abre FileZilla y sube los archivos
echo.
echo Ver GUIA_DEPLOYMENT_BLUEHOST.md para más detalles
echo.
pause
