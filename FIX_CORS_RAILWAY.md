# 🔧 FIX CORS - SOLUCIÓN INMEDIATA

## ❌ **PROBLEMA:**
```
Access to XMLHttpRequest has been blocked by CORS policy
```

El backend en Railway bloquea las peticiones desde Bluehost.

---

## ✅ **SOLUCIÓN (2 minutos):**

### **En Railway:**

1. Ve a: https://railway.app/dashboard
2. Click en tu proyecto **amico-management**
3. Click en el servicio **backend**
4. Pestaña **"Variables"**
5. Busca la variable **CORS_ORIGIN**
6. **Edítala** o **Créala** con este valor:

```
CORS_ORIGIN=https://kbj.ebq.mybluehost.me,http://kbj.ebq.mybluehost.me,http://box5358.bluehost.com
```

O más simple (permite todo - SOLO para desarrollo):

```
CORS_ORIGIN=*
```

7. Click **"Update Variables"** o **"Save"**
8. Railway hará **redeploy automático** (2-3 min)

---

## 🔄 **DESPUÉS:**

1. Espera que Railway termine el redeploy
2. Recarga tu Bluehost: http://kbj.ebq.mybluehost.me/amico-app/
3. ¡Todo debería funcionar!

---

## ✅ **VERIFICACIÓN:**

Abre la consola del navegador (F12) y ya NO deberías ver errores de CORS.

El Dashboard cargará los datos correctamente.

---

**¡Haz este cambio en Railway ahora y el sistema funcionará completo!** 🚀
