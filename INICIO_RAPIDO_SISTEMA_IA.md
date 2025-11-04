# INICIO RAPIDO - SISTEMA IA AMICO

## COMANDOS PARA EMPEZAR AHORA

### 1. INICIAR BACKEND (Terminal 1)

```bash
cd c:\Users\josue\mis-sitios-bluehost\public_html\amico\backend
npm start
```

**Resultado**: API disponible en `http://localhost:3000`

---

### 2. INICIAR BOT WHATSAPP (Terminal 2)

```bash
cd c:\Users\josue\mis-sitios-bluehost\public_html\amico\backend
node bot-final.js
```

**Pasos**:
1. Abrir: `http://localhost:4000`
2. Escanear QR con WhatsApp
3. Listo! Bot activo con IA

---

### 3. INICIAR FRONTEND (Terminal 3)

```bash
cd c:\Users\josue\mis-sitios-bluehost\public_html\amico\frontend
npm run dev
```

**Resultado**: Dashboard en `http://localhost:5173`

---

## PROBAR EL SISTEMA

### OPCION A: Probar por WhatsApp

1. Envía mensaje al número conectado
2. Ejemplo: "Tengo una filtración urgente"
3. El bot responde con empatía y crea solicitud
4. Recibes código único: `AMICO-URG-2024-0001`

### OPCION B: Probar por API

```bash
# Crear solicitud
curl -X POST http://localhost:3000/api/v1/solicitudes/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "telefono": "8091234567",
    "tipoSolicitud": "mantenimiento",
    "urgencia": "alta",
    "descripcion": "Filtración en baño",
    "categoria": "filtracion"
  }'

# Ver estadísticas
curl http://localhost:3000/api/v1/solicitudes/estadisticas

# Ver todas las solicitudes
curl http://localhost:3000/api/v1/solicitudes
```

### OPCION C: Ver Dashboard

1. Abrir: `http://localhost:5173`
2. Ver estadísticas actualizadas
3. Ver gráficas interactivas
4. Revisar solicitudes en tiempo real

---

## QUE ESPERAR

### Bot WhatsApp (Daniel):
- Saludo personalizado
- Detección de emociones
- Respuestas empáticas
- Código único de tracking
- Tiempo estimado de atención

### Dashboard:
- 8 cards de estadísticas
- Gráfica de dona (tipos de solicitud)
- Gráfica de barras (urgencia)
- Tabla filtrable de casos
- Métricas en tiempo real

### API:
- Endpoints RESTful completos
- Códigos únicos profesionales
- Tracking de tiempos
- Sistema de calificación

---

## CODIGOS UNICOS GENERADOS

| Código | Significado |
|--------|-------------|
| `AMICO-URG-2024-0001` | Primera urgencia del año |
| `AMICO-MAN-2024-0157` | Mantenimiento #157 |
| `AMICO-PAG-2024-0042` | Consulta de pago #42 |
| `AMICO-RES-2024-0089` | Reserva #89 |

---

## ARCHIVOS IMPORTANTES

```
backend/bot-final.js              ← Bot con neurociencia
backend/src/controllers/solicitudes.controller.ts  ← Lógica de solicitudes
backend/prisma/schema.prisma      ← Modelo de datos
frontend/src/pages/Dashboard.tsx  ← Dashboard mejorado
```

---

## AYUDA RAPIDA

### Backend no inicia:
- Verificar PostgreSQL corriendo
- Revisar `.env` con DATABASE_URL

### Bot no conecta:
- Eliminar carpeta `auth_info_baileys`
- Reiniciar bot
- Escanear nuevo QR

### Frontend no carga datos:
- Verificar backend corriendo en puerto 3000
- Revisar `.env.local` con VITE_API_URL

---

## DOCUMENTACION COMPLETA

Ver: `SISTEMA_PROFESIONAL_IA_IMPLEMENTADO.md`

---

**Sistema listo para usar!** ✅
