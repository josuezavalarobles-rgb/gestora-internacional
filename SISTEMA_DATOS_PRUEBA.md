# Sistema de Datos de Prueba y Gestión - Gestora Internacional

## Resumen Ejecutivo

Se ha implementado un sistema completo para:
1. Cargar datos de prueba para demostración
2. Limpiar datos cuando se vaya a usar en producción
3. Importar datos masivos desde Excel
4. Gestión fácil de configuración y datos

---

## 1. Datos de Prueba (Seed)

### Usuario Administrador

**Credenciales de acceso:**
- Email: `admin@gestorainternacional.com`
- Contraseña: `admin123`
- Rol: `admin`

### Datos Incluidos

El seed crea automáticamente:

- **1 Organización**: Gestora Demo (ID: org-demo-001)
- **1 Condominio**: Residencial Las Palmas
  - Dirección: Av. Winston Churchill, Santo Domingo
  - 20 unidades habitacionales
  - 100 unidades en total

- **20 Unidades** con:
  - Números desde 101 hasta 120
  - Alícuota distribuida (5% cada una)
  - Estados de cuenta inicializados

- **5 Propietarios** con datos realistas dominicanos:
  - Juan Carlos Pérez (809-555-1234)
  - María José González (809-555-1235)
  - Pedro Antonio Martínez (809-555-1236)
  - Ana Isabel Rodríguez (809-555-1237)
  - Luis Fernando Díaz (809-555-1238)

- **4 Proveedores**:
  - Pinturas Dominicanas SRL
  - Plomería Pro RD
  - Electricidad Total
  - Servicios de Limpieza El Sol

- **Plan de Cuentas** (20 cuentas contables):
  - Activos, Pasivos, Patrimonio, Ingresos, Gastos
  - Estructura completa para contabilidad dominicana

- **4 Secuencias NCF**:
  - B01: Crédito Fiscal (hasta 1000000)
  - B02: Consumo (hasta 1000000)
  - B14: Regímenes Especiales (hasta 500000)
  - B15: Gubernamentales (hasta 500000)

- **2 Gastos de Ejemplo**:
  - Mantenimiento de piscina (RD$15,000)
  - Fumigación general (RD$8,000)
  - Ambos con NCF generado automáticamente

---

## 2. Cómo Cargar los Datos de Prueba

### Opción A: Localmente

```bash
cd backend
npm run db:seed
```

### Opción B: En Railway

Railway ejecutará automáticamente el seed después del despliegue.

Si necesitas ejecutarlo manualmente:

1. Ve a tu proyecto en Railway
2. Selecciona el servicio "gestora-internacional"
3. Ve a la pestaña "Settings"
4. En "Deploy", agrega el comando: `npm run db:seed`

---

## 3. Endpoints de Administración

Todos requieren autenticación y rol de **admin**.

### Obtener Estadísticas

```http
GET /api/v1/admin/estadisticas
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "organizaciones": 1,
    "condominios": 1,
    "unidades": 20,
    "usuarios": 6,
    "proveedores": 4,
    "gastos": 2,
    "ingresos": 0,
    "estadosCuenta": 20
  }
}
```

### Limpiar Solo Datos Demo

Elimina únicamente la organización "org-demo-001" y todo lo relacionado:

```http
DELETE /api/v1/admin/limpiar-datos-demo
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Datos de demostración eliminados exitosamente",
  "data": {
    "eliminados": {
      "facturasIA": 0,
      "predicciones": 0,
      "evaluaciones": 0,
      "transacciones": 0,
      "estadosCuenta": 20,
      "gastos": 2,
      "ingresos": 0,
      "unidades": 20,
      "proveedores": 4,
      "cuentasContables": 20,
      "secuenciasNCF": 4,
      "condominios": 1,
      "usuarios": 5,
      "organizaciones": 1
    }
  }
}
```

### Limpiar TODOS los Datos

⚠️ **PELIGROSO**: Elimina toda la información de la base de datos:

```http
DELETE /api/v1/admin/limpiar-todos-datos
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Todos los datos han sido eliminados",
  "data": {
    "eliminados": {
      "facturasIA": 0,
      "predicciones": 0,
      "evaluaciones": 0,
      "transacciones": 0,
      "estadosCuenta": 20,
      "gastos": 2,
      "ingresos": 0,
      "unidades": 20,
      "proveedores": 4,
      "cuentasContables": 20,
      "secuenciasNCF": 4,
      "condominios": 1,
      "usuarios": 5,
      "organizaciones": 1
    }
  }
}
```

---

## 4. Sistema de Importación Masiva

Permite cargar datos desde archivos Excel (.xlsx, .xls).

### Endpoints Disponibles

#### Importar Propietarios

```http
POST /api/v1/import/propietarios
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [archivo.xlsx]
```

#### Importar Proveedores

```http
POST /api/v1/import/proveedores
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [archivo.xlsx]
```

#### Importar Técnicos

```http
POST /api/v1/import/tecnicos
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [archivo.xlsx]
```

#### Importar Casos

```http
POST /api/v1/import/casos
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [archivo.xlsx]
```

### Descargar Plantillas

Obtén plantillas Excel pre-formateadas para cada tipo de importación:

```http
GET /api/v1/import/plantilla/propietarios
GET /api/v1/import/plantilla/proveedores
GET /api/v1/import/plantilla/tecnicos
GET /api/v1/import/plantilla/casos
Authorization: Bearer {token}
```

### Formato de Respuesta de Importación

```json
{
  "success": true,
  "message": "Importación completada: 15 de 20 registros",
  "data": {
    "success": true,
    "totalRows": 20,
    "importedRows": 15,
    "failedRows": 5,
    "errors": [
      { "row": 3, "error": "Email duplicado" },
      { "row": 7, "error": "Condominio no encontrado" },
      { "row": 12, "error": "Teléfono inválido" },
      { "row": 15, "error": "Unidad no encontrada" },
      { "row": 18, "error": "Datos incompletos" }
    ]
  }
}
```

---

## 5. Flujo Recomendado de Uso

### Para Demostración

1. **Cargar datos de prueba**:
   ```bash
   npm run db:seed
   ```

2. **Iniciar sesión**:
   - Email: `admin@gestorainternacional.com`
   - Contraseña: `admin123`

3. **Explorar el sistema**:
   - Ver condominios
   - Ver unidades y propietarios
   - Ver gastos con NCF
   - Ver estados de cuenta

4. **Verificar estadísticas**:
   ```http
   GET /api/v1/admin/estadisticas
   ```

### Para Producción

1. **Limpiar datos demo**:
   ```http
   DELETE /api/v1/admin/limpiar-datos-demo
   ```

2. **Crear organización real**:
   ```http
   POST /api/v1/organizaciones
   ```

3. **Importar datos reales**:
   - Descargar plantillas
   - Llenar con datos del cliente
   - Importar proveedores
   - Importar propietarios
   - Configurar unidades

4. **Configurar contabilidad**:
   - Crear plan de cuentas personalizado
   - Configurar secuencias NCF reales

---

## 6. Permisos de Endpoints

### Admin (`admin`)
- ✅ Todos los endpoints
- ✅ Limpiar datos
- ✅ Ver estadísticas
- ✅ Importar todos los tipos

### Técnico (`tecnico`)
- ✅ Importar propietarios
- ✅ Importar proveedores
- ✅ Importar casos
- ❌ Importar técnicos
- ❌ Limpiar datos

### Propietario (`propietario`)
- ❌ No tiene acceso a importación
- ❌ No tiene acceso a admin

---

## 7. Validaciones de Importación

### Propietarios

**Columnas requeridas**:
- Nombre
- Unidad
- Teléfono
- Condominio

**Validaciones**:
- Email único (si se proporciona)
- Teléfono válido
- Condominio debe existir
- Unidad debe existir

### Proveedores

**Columnas requeridas**:
- Nombre
- RNC
- Teléfono
- Organización

**Validaciones**:
- RNC único
- RNC formato válido (9 u 11 dígitos)
- Email válido (si se proporciona)
- Organización debe existir

---

## 8. Limites y Configuración

### Archivos Excel

- **Tamaño máximo**: 10MB
- **Formatos**: .xlsx, .xls
- **Ubicación temporal**: `uploads/temp/`
- **Eliminación**: Automática después de procesar

### Rate Limiting

- **Ventana**: 15 minutos
- **Máximo**: 100 peticiones
- **Aplica a**: `/api/v1/*`

---

## 9. Seguridad

### Protecciones Implementadas

- ✅ JWT para autenticación
- ✅ Bcrypt para contraseñas (10 rounds)
- ✅ Validación de roles
- ✅ Rate limiting
- ✅ Helmet.js para headers HTTP
- ✅ CORS configurado
- ✅ Validación de tipos de archivo
- ✅ Sanitización de inputs

### Usuario Admin

El usuario admin creado por el seed tiene:
- Contraseña hasheada con bcrypt
- No puede ser eliminado por `limpiarDatosDemo`
- Puede ser eliminado por `limpiarTodosLosDatos`

---

## 10. Troubleshooting

### Problema: Seed falla con "email duplicado"

**Solución**: El admin ya existe. Usa `limpiarTodosLosDatos` primero o modifica el seed para hacer `upsert`.

### Problema: Importación falla con "file too large"

**Solución**: Archivo mayor a 10MB. Dividir en archivos más pequeños.

### Problema: Importación falla con "invalid file type"

**Solución**: Solo se aceptan archivos Excel (.xlsx, .xls).

### Problema: No se puede limpiar datos

**Solución**: Verificar que tienes rol de admin y token válido.

---

## 11. Testing con Postman/Thunder Client

### 1. Autenticarse

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@gestorainternacional.com",
  "password": "admin123"
}
```

**Guardar el token** de la respuesta.

### 2. Ver Estadísticas

```http
GET /api/v1/admin/estadisticas
Authorization: Bearer {tu-token}
```

### 3. Importar Datos

```http
POST /api/v1/import/propietarios
Authorization: Bearer {tu-token}
Content-Type: multipart/form-data

file: [seleccionar archivo.xlsx]
```

### 4. Limpiar Datos Demo

```http
DELETE /api/v1/admin/limpiar-datos-demo
Authorization: Bearer {tu-token}
```

---

## 12. Información de Deployment

### URL de Producción

```
https://gestora-internacional-production.up.railway.app
```

### Health Check

```http
GET /health
```

**Respuesta:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "environment": "production"
}
```

### Variables de Entorno Requeridas en Railway

```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret
OPENAI_API_KEY=sk-...
NODE_ENV=production
PORT=3000
```

---

## Resumen de Archivos Creados

### Backend

```
backend/
├── prisma/
│   └── seed.ts                           # Datos de prueba
├── src/
│   ├── controllers/
│   │   ├── admin.controller.ts           # Control de limpieza
│   │   └── import.controller.ts          # Control de importación
│   ├── routes/
│   │   ├── admin.routes.ts               # Rutas admin
│   │   └── import.routes.ts              # Rutas importación
│   └── services/
│       └── admin/
│           └── AdminService.ts           # Lógica de limpieza
├── uploads/
│   └── temp/
│       └── .gitkeep                      # Mantener directorio
└── package.json                          # Script db:seed añadido
```

---

## Próximos Pasos Sugeridos

1. ✅ Verificar que Railway deployó correctamente
2. ✅ Probar login con credenciales admin
3. ✅ Verificar estadísticas iniciales
4. ✅ Probar importación con archivo de prueba
5. ✅ Crear frontend para gestión visual de datos
6. ✅ Agregar más validaciones según necesidades
7. ✅ Documentar procesos para usuarios finales

---

**Documentación generada el**: 2024-01-15
**Sistema**: Gestora Internacional SRL v1.0
**Autor**: Claude Code + Josué Zavala
