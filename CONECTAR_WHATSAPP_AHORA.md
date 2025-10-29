# 📱 CONECTAR WHATSAPP - GUÍA RÁPIDA

## ✅ **TODO ESTÁ LISTO PARA WHATSAPP:**

El código de WhatsApp + IA ya está 100% implementado. Solo falta:
1. Habilitar WhatsApp
2. Conectar con QR
3. Probar el bot

---

## 🚀 **PASO 1: Habilitar WhatsApp Local (5 min)**

### **Edita el archivo .env del backend:**

```bash
# Abre este archivo:
c:\Users\josue\mis-sitios-bluehost\public_html\amico\backend\.env
```

### **Cambia esta línea:**

```env
BOT_ENABLED=false
```

**A:**

```env
BOT_ENABLED=true
```

**Guarda el archivo.**

---

## 🚀 **PASO 2: Iniciar Backend Local (2 min)**

Abre PowerShell o CMD y ejecuta:

```bash
cd c:\Users\josue\mis-sitios-bluehost\public_html\amico\backend
npm run dev
```

Verás:
```
✅ PostgreSQL conectado correctamente
✅ MongoDB conectado correctamente
✅ Redis conectado correctamente
📱 Iniciando WhatsApp Bot...
```

Y luego verás un **QR CODE** en la terminal (cuadrado con puntos).

---

## 📱 **PASO 3: Escanear QR con WhatsApp (30 seg)**

### **En tu celular:**

1. Abre **WhatsApp**
2. Ve a **Configuración** (⚙️)
3. **Dispositivos vinculados**
4. **Vincular un dispositivo**
5. **Escanea el QR** que aparece en la terminal

### **Cuando conecte verás:**

```
✅ WhatsApp conectado correctamente
```

---

## 🤖 **PASO 4: PROBAR EL BOT (2 min)**

### **Desde OTRO teléfono** (no el que escaneó el QR):

Envía un mensaje de WhatsApp al número que conectaste:

```
Hola
```

### **El bot responderá:**

```
¡Hola! 👋 Bienvenido a Amico Management.
¿En qué puedo ayudarte hoy?

1️⃣ Reportar avería o problema técnico
2️⃣ Consultar estado de cuenta
3️⃣ Ver mis casos activos
4️⃣ Hablar con un asesor
```

### **Prueba el flujo completo:**

```
Tú: 1

Bot: Entendido. ¿Es un problema de GARANTÍA o del CONDOMINIO?

Tú: Garantía

Bot: ¿Qué tipo de problema tienes?

Tú: Tengo una filtración en el techo del baño

Bot: Entiendo. ¿Desde cuándo lo notas?

Tú: Desde ayer

Bot: ¿Puedes enviarme una foto del problema?

[Envía una foto]

Bot: Perfecto. He creado el caso #AMC-2024-XXXX
     Un técnico revisará tu caso y te contactará pronto.
```

---

## ✅ **EL SISTEMA HACE AUTOMÁTICAMENTE:**

1. ✅ Crea el caso en la base de datos
2. ✅ Clasifica como "garantía" + "filtración"
3. ✅ Asigna prioridad según urgencia
4. ✅ Notifica a los administradores
5. ✅ Propone horarios de cita
6. ✅ Confirma la cita elegida
7. ✅ Envía recordatorios
8. ✅ Hace seguimiento post-visita
9. ✅ Todo en español dominicano natural

---

## 🎯 **LO QUE VERÁS EN EL PANEL WEB:**

Mientras chateas por WhatsApp, abre:
```
http://kbj.ebq.mybluehost.me/amico-app/
```

Verás en tiempo real:
- ✅ Nuevo caso creado
- ✅ Información del cliente
- ✅ Descripción del problema
- ✅ Timeline actualizado
- ✅ Estado del caso

**¡TODO automático!**

---

## ⚠️ **NOTA IMPORTANTE:**

WhatsApp funciona **SOLO localmente** por ahora (en tu PC).

**Para producción:**
- Necesitarías usar WhatsApp Business API oficial (Twilio, 360Dialog)
- Costo: $50-200/mes
- O dejar el bot corriendo 24/7 en un VPS

**Para demos:** Local está perfecto.

---

## 🚀 **EJECUTA AHORA:**

```bash
cd c:\Users\josue\mis-sitios-bluehost\public_html\amico\backend
npm run dev
```

Escanea el QR y prueba el bot.

**¡Avísame cuando veas el QR code!** 🚀
