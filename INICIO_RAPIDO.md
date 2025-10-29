# ⚡ INICIO RÁPIDO - 5 MINUTOS

## 🎯 Lo que vas a hacer:

1. ✅ Instalar dependencias (2 min)
2. ✅ Levantar bases de datos (1 min)
3. ✅ Configurar entorno (1 min)
4. ✅ Iniciar servidor (30 seg)
5. ✅ Conectar WhatsApp (30 seg)

---

## 📝 PASO 1: Instalar Dependencias

```bash
cd c:\Users\josue\mis-sitios-bluehost\public_html\amico\backend
npm install
```

Mientras se instala, pasa al siguiente paso...

---

## 🐳 PASO 2: Levantar Bases de Datos

Abre otra terminal y ejecuta:

```bash
cd c:\Users\josue\mis-sitios-bluehost\public_html\amico
docker-compose up -d
```

Esto levantará:
- PostgreSQL (puerto 5432)
- MongoDB (puerto 27017)
- Redis (puerto 6379)

**¿No tienes Docker?** Descarga: https://www.docker.com/products/docker-desktop

---

## ⚙️ PASO 3: Configurar Entorno

```bash
cd backend
copy .env.example .env
```

Abre `.env` y configura (opcional, tiene valores por defecto):

```env
# Mínimo requerido:
DATABASE_URL=postgresql://postgres:password@localhost:5432/amico_db
MONGODB_URI=mongodb://localhost:27017/amico_logs
JWT_SECRET=cambia-esto-por-algo-secreto

# Opcional (si tienes):
OPENAI_API_KEY=sk-tu-api-key-aqui
```

---

## 🗄️ PASO 4: Crear Base de Datos

```bash
npx prisma generate
npx prisma migrate dev --name init
```

Esto creará todas las tablas en PostgreSQL.

---

## 🚀 PASO 5: Iniciar Servidor

```bash
npm run dev
```

Verás:

```
╔══════════════════════════════════════════╗
║     AMICO MANAGEMENT - BACKEND API       ║
║   Sistema de Gestión de Condominios     ║
╚══════════════════════════════════════════╝

✅ PostgreSQL conectado correctamente
✅ MongoDB conectado correctamente
✅ Redis conectado correctamente
✅ Servidor iniciado correctamente
🚀 API disponible en: http://localhost:3000
📱 Iniciando WhatsApp Bot...
```

---

## 📱 PASO 6: Conectar WhatsApp

Verás un **QR code** en la terminal.

1. Abre WhatsApp en tu teléfono
2. Ve a **Configuración** → **Dispositivos vinculados**
3. Toca **Vincular un dispositivo**
4. Escanea el QR

Cuando conecte verás:

```
✅ WhatsApp conectado correctamente
```

---

## ✅ PASO 7: ¡Probar!

### Opción 1: Health Check

Abre tu navegador:

```
http://localhost:3000/health
```

Deberías ver: `{"status":"ok",...}`

### Opción 2: Enviar mensaje de WhatsApp

Envía **"Hola"** al número que conectaste.

El bot responderá:

```
¡Hola! 👋 Bienvenido a Amico Management.
¿En qué puedo ayudarte hoy?

1️⃣ Reportar avería o problema técnico
2️⃣ Consultar estado de cuenta
3️⃣ Ver mis casos activos
4️⃣ Hablar con un asesor
```

### Opción 3: Ver datos

```bash
npx prisma studio
```

Se abrirá en: http://localhost:5555

---

## 🎉 ¡LISTO!

Tu sistema está funcionando. Ahora puedes:

- 📱 Interactuar con el bot por WhatsApp
- 🗄️ Ver datos en Prisma Studio
- 📊 Hacer peticiones a la API

---

## 🔧 ¿Algo salió mal?

### Error: "Cannot connect to PostgreSQL"

```bash
# Verificar que Docker esté corriendo
docker ps

# Debería ver: amico-postgres, amico-mongodb, amico-redis
```

### Error: "Module not found"

```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

### Error: WhatsApp no conecta

1. Verifica tu internet
2. Borra sesión y reconecta:

```bash
rm -rf auth_info_baileys
npm run dev
```

---

## 📚 PRÓXIMOS PASOS

Una vez funcionando:

1. **Lee**: [RESUMEN_PROYECTO.md](RESUMEN_PROYECTO.md) - Entender qué se construyó
2. **Revisa**: [ESTRUCTURA_PROYECTO.txt](ESTRUCTURA_PROYECTO.txt) - Arquitectura
3. **Explora**: [COMANDOS_RAPIDOS.md](COMANDOS_RAPIDOS.md) - Comandos útiles
4. **Planifica**: [ROADMAP.md](ROADMAP.md) - Qué sigue

---

## 💡 TIPS

- Usa `Ctrl+C` para detener el servidor
- Usa `docker-compose down` para detener las bases de datos
- Los cambios en el código se recargan automáticamente
- Los logs aparecen en la terminal

---

## 🆘 AYUDA

Si tienes problemas:

1. Revisa los logs en la terminal
2. Verifica que todas las bases de datos estén corriendo
3. Consulta [INSTRUCCIONES_INSTALACION.md](INSTRUCCIONES_INSTALACION.md)

---

**¡Disfruta tu nuevo sistema! 🚀**

---

## 📞 COMANDOS MÁS USADOS

```bash
# Iniciar servidor
npm run dev

# Ver base de datos
npx prisma studio

# Levantar Docker
docker-compose up -d

# Detener Docker
docker-compose down

# Ver logs de Docker
docker-compose logs -f

# Ver estado de WhatsApp
curl http://localhost:3000/api/v1/whatsapp/status
```

---

**Tiempo total**: ⏱️ ~5 minutos
**Dificultad**: 🟢 Fácil
**Requerimientos**: Node.js 20+, Docker Desktop
