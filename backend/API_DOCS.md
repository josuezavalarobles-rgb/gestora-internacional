# API Documentation - Gestora Internacional SRL

Base URL: `http://localhost:3000/api/v1`

## 📋 Índice

- [Autenticación](#autenticación)
- [Proveedores](#proveedores)
- [Contabilidad](#contabilidad)
- [Estados de Cuenta](#estados-de-cuenta)
- [Inteligencia Artificial](#inteligencia-artificial)

---

## Autenticación

Todas las rutas (excepto `/auth/login`) requieren JWT token en el header:

```
Authorization: Bearer <token>
```

---

## Proveedores

### Crear Proveedor
```http
POST /api/v1/proveedores
```

**Body:**
```json
{
  "organizacionId": "uuid",
  "nombre": "Pinturas Express SRL",
  "nombreComercial": "Pinturas Express",
  "rnc": "131234567",
  "tipo": "mantenimiento",
  "telefono": "8095551234",
  "email": "info@pinturasexpress.com",
  "direccion": "Ave. Winston Churchill #123",
  "personaContacto": "Juan Pérez",
  "telefonoContacto": "8095559999",
  "banco": "Banco Popular",
  "numeroCuenta": "123456789",
  "tipoCuenta": "corriente"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "nombre": "Pinturas Express SRL",
  "calificacion": null,
  "activo": true,
  ...
}
```

### Obtener Proveedores
```http
GET /api/v1/proveedores?organizacionId=uuid&tipo=mantenimiento&activo=true
```

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "nombre": "Pinturas Express SRL",
    "calificacion": 4.5,
    "evaluaciones": [...],
    "_count": {
      "gastos": 15,
      "evaluaciones": 8
    }
  }
]
```

### Evaluar Proveedor
```http
POST /api/v1/proveedores/evaluar
```

**Body:**
```json
{
  "proveedorId": "uuid",
  "gastoId": "uuid",
  "calidad": 5,
  "puntualidad": 4,
  "precioJusto": 5,
  "comunicacion": 5,
  "comentarios": "Excelente servicio",
  "evaluadoPor": "usuario-uuid"
}
```

### Top Proveedores
```http
GET /api/v1/proveedores/top?organizacionId=uuid&limite=10
```

---

## Contabilidad

### NCF - Crear Secuencia
```http
POST /api/v1/contabilidad/ncf/secuencia
```

**Body:**
```json
{
  "organizacionId": "uuid",
  "tipo": "B01",
  "serie": "B01",
  "secuenciaInicio": 1,
  "secuenciaFin": 1000,
  "fechaVencimiento": "2024-12-31T23:59:59Z"
}
```

### NCF - Obtener Siguiente
```http
GET /api/v1/contabilidad/ncf/siguiente?organizacionId=uuid&tipoNCF=B01
```

**Response:**
```json
{
  "ncf": "B0100000001"
}
```

### Plan de Cuentas - Crear Cuenta
```http
POST /api/v1/contabilidad/cuentas
```

**Body:**
```json
{
  "organizacionId": "uuid",
  "codigo": "4.2.01",
  "nombre": "Gastos de Mantenimiento - Pintura",
  "tipo": "gasto",
  "padre": "4.2",
  "descripcion": "Gastos de pintura y acabados"
}
```

### Plan de Cuentas - Obtener
```http
GET /api/v1/contabilidad/cuentas?organizacionId=uuid
```

### Gastos - Crear
```http
POST /api/v1/contabilidad/gastos
```

**Body:**
```json
{
  "organizacionId": "uuid",
  "condominioId": "uuid",
  "cuentaContableId": "uuid",
  "proveedorId": "uuid",
  "tipoNCF": "B01",
  "numeroFactura": "0001234",
  "concepto": "Pintura de áreas comunes",
  "descripcion": "Pintura completa del lobby y pasillos",
  "subtotal": 50000,
  "itbis": 9000,
  "total": 59000,
  "fechaEmision": "2024-12-01T00:00:00Z",
  "fechaVencimiento": "2024-12-15T00:00:00Z",
  "formaPago": "transferencia",
  "distribuirUnidades": true
}
```

**Response:**
```json
{
  "id": "uuid",
  "ncf": "B0100000001",
  "total": 59000,
  "pagado": false,
  ...
}
```

### Gastos - Obtener
```http
GET /api/v1/contabilidad/gastos?organizacionId=uuid&condominioId=uuid&pagado=false
```

### Gastos - Marcar como Pagado
```http
PUT /api/v1/contabilidad/gastos/:id/pagar
```

**Body:**
```json
{
  "fechaPago": "2024-12-10T00:00:00Z"
}
```

### Ingresos - Crear
```http
POST /api/v1/contabilidad/ingresos
```

**Body:**
```json
{
  "organizacionId": "uuid",
  "condominioId": "uuid",
  "cuentaContableId": "uuid",
  "unidadId": "uuid",
  "concepto": "Pago de mantenimiento - Diciembre 2024",
  "descripcion": "Apt 402",
  "monto": 8500,
  "fechaIngreso": "2024-12-05T00:00:00Z",
  "metodoPago": "transferencia",
  "numeroRecibo": "REC-2024-001234"
}
```

### Reportes - Balance de Saldos
```http
GET /api/v1/contabilidad/reportes/balance?condominioId=uuid&fechaDesde=2024-12-01&fechaHasta=2024-12-31
```

**Response:**
```json
{
  "totalIngresos": 500000,
  "totalGastos": 350000,
  "saldo": 150000
}
```

### Reportes - Gastos por Categoría
```http
GET /api/v1/contabilidad/reportes/gastos-categoria?condominioId=uuid&fechaDesde=2024-12-01&fechaHasta=2024-12-31
```

**Response:**
```json
[
  {
    "categoria": "Mantenimiento - Pintura",
    "total": 59000,
    "cantidad": 3
  },
  {
    "categoria": "Servicios - Electricidad",
    "total": 45000,
    "cantidad": 1
  }
]
```

---

## Estados de Cuenta

### Crear Estado de Cuenta
```http
POST /api/v1/estados-cuenta
```

**Body:**
```json
{
  "unidadId": "uuid",
  "periodo": "2024-12",
  "saldoAnterior": 0,
  "notas": "Estado de cuenta diciembre 2024"
}
```

### Procesar Distribución de Gastos
```http
POST /api/v1/estados-cuenta/distribuir
```

**Body:**
```json
{
  "condominioId": "uuid",
  "periodo": "2024-12"
}
```

**Descripción:** Distribuye automáticamente todos los gastos del mes entre las unidades según su alícuota.

### Registrar Pago
```http
POST /api/v1/estados-cuenta/pago
```

**Body:**
```json
{
  "unidadId": "uuid",
  "periodo": "2024-12",
  "monto": 8500,
  "metodoPago": "transferencia",
  "referencia": "TRX-123456789",
  "notas": "Pago mantenimiento diciembre"
}
```

### Obtener Estado de Cuenta
```http
GET /api/v1/estados-cuenta?unidadId=uuid&periodo=2024-12
```

**Response:**
```json
{
  "id": "uuid",
  "periodo": "2024-12",
  "saldoAnterior": 0,
  "totalCargos": 8500,
  "totalAbonos": 8500,
  "saldoFinal": 0,
  "transacciones": [
    {
      "tipo": "cargo",
      "concepto": "Pintura de áreas comunes",
      "monto": 2950,
      "fecha": "2024-12-01T00:00:00Z"
    },
    {
      "tipo": "abono",
      "concepto": "Pago - transferencia",
      "monto": 8500,
      "fecha": "2024-12-05T00:00:00Z"
    }
  ],
  "unidad": {
    "numero": "402",
    "alicuota": 0.05,
    "propietario": {...}
  }
}
```

### Obtener Historial
```http
GET /api/v1/estados-cuenta/historial/:unidadId
```

### Obtener Unidades Morosas
```http
GET /api/v1/estados-cuenta/morosas?condominioId=uuid&periodo=2024-12
```

**Response:**
```json
[
  {
    "unidadId": "uuid",
    "unidadNumero": "305",
    "propietario": "María González",
    "saldoPendiente": 25500,
    "periodos": ["2024-10", "2024-11", "2024-12"]
  }
]
```

### Reporte de Recaudación
```http
GET /api/v1/estados-cuenta/reporte-recaudacion?condominioId=uuid&periodo=2024-12
```

**Response:**
```json
{
  "periodo": "2024-12",
  "totalUnidades": 50,
  "totalCargos": 425000,
  "totalRecaudado": 380000,
  "totalPendiente": 45000,
  "porcentajeRecaudacion": 89.41,
  "unidadesAlDia": 45,
  "unidadesMorosas": 5
}
```

### Generar Recordatorios de Pago
```http
GET /api/v1/estados-cuenta/recordatorios?condominioId=uuid&periodo=2024-12
```

**Response:**
```json
[
  {
    "unidadId": "uuid",
    "unidadNumero": "305",
    "propietario": "María González",
    "saldoPendiente": 25500,
    "mensaje": "Estimado(a) María González, le recordamos que tiene un saldo pendiente de RD$25500.00..."
  }
]
```

---

## Inteligencia Artificial

### Procesar Factura con IA
```http
POST /api/v1/ia/facturas/procesar
```

**Body:**
```json
{
  "gastoId": "uuid",
  "rutaArchivo": "/uploads/facturas/factura-001.jpg"
}
```

**Response:**
```json
{
  "id": "uuid",
  "gastoId": "uuid",
  "textoExtraido": "...",
  "datosEstructurados": {
    "numeroFactura": "0001234",
    "ncf": "B0100000001",
    "fecha": "2024-12-01",
    "proveedor": {
      "nombre": "Pinturas Express SRL",
      "rnc": "131234567"
    },
    "items": [...],
    "subtotal": 50000,
    "itbis": 9000,
    "total": 59000
  },
  "confianza": 0.95,
  "validada": false
}
```

### Validar Factura Procesada
```http
PUT /api/v1/ia/facturas/:facturaIAId/validar
```

**Body:**
```json
{
  "validadoPor": "usuario-uuid",
  "datosCorregidos": {
    "total": 59500
  }
}
```

### Obtener Facturas Procesadas
```http
GET /api/v1/ia/facturas?validada=false&confianzaMinima=0.8
```

### Analizar Sentimiento
```http
POST /api/v1/ia/sentimiento
```

**Body:**
```json
{
  "texto": "El servicio fue excelente, muy profesionales y puntuales"
}
```

**Response:**
```json
{
  "sentimiento": "positivo",
  "confianza": 0.92,
  "resumen": "Comentario positivo destacando profesionalismo y puntualidad"
}
```

### Predecir Gastos Mensuales
```http
POST /api/v1/ia/predicciones/:condominioId/gastos?meses=3
```

**Response:**
```json
{
  "id": "uuid",
  "tipo": "gastos_mensuales",
  "valorPredicho": 375000,
  "confianza": 0.87,
  "rangoMinimo": 350000,
  "rangoMaximo": 400000,
  "factores": [
    "Tendencia histórica creciente",
    "Estacionalidad detectada",
    "Gastos de mantenimiento programados"
  ],
  "modeloUsado": "claude-3-5-sonnet",
  "fechaPrediccion": "2024-12-15T10:30:00Z"
}
```

### Predecir Tasa de Morosidad
```http
POST /api/v1/ia/predicciones/:condominioId/morosidad
```

**Response:**
```json
{
  "id": "uuid",
  "tipo": "tasa_morosidad",
  "valorPredicho": 12.5,
  "confianza": 0.82,
  "rangoMinimo": 10.0,
  "rangoMaximo": 15.0,
  "factores": [
    "Patrón estable de morosidad",
    "Época navideña afecta pagos",
    "Historial de recuperación en enero"
  ]
}
```

### Analizar Tendencias
```http
GET /api/v1/ia/predicciones/:condominioId/tendencias
```

**Response:**
```json
{
  "gastosProyectados": 375000,
  "tasaMorosidadProyectada": 12.5,
  "alertas": [
    "Tasa de morosidad en nivel de atención"
  ],
  "recomendaciones": [
    "Monitorear de cerca la recaudación",
    "Contactar propietarios morosos",
    "Presupuestar entre RD$375000.00 y RD$400000.00"
  ]
}
```

### Generar Insights
```http
GET /api/v1/ia/predicciones/:condominioId/insights
```

**Response:**
```json
{
  "insights": [
    "Los gastos de mantenimiento han aumentado 15% respecto al trimestre anterior",
    "La tasa de recaudación ha mejorado en los últimos 3 meses",
    "Se recomienda revisar contratos con proveedores de electricidad",
    "Presupuesto de emergencia está por debajo del 10% recomendado",
    "Considerar implementar sistema de pago automático para mejorar recaudación"
  ]
}
```

### Obtener Historial de Predicciones
```http
GET /api/v1/ia/predicciones/:condominioId?tipo=gastos_mensuales
```

---

## Códigos de Error

- `400 Bad Request` - Datos de entrada inválidos
- `401 Unauthorized` - Token JWT inválido o ausente
- `403 Forbidden` - Sin permisos para la acción
- `404 Not Found` - Recurso no encontrado
- `500 Internal Server Error` - Error del servidor

---

## Tipos de Datos

### TipoProveedor
- `mantenimiento`
- `limpieza`
- `seguridad`
- `jardineria`
- `plomeria`
- `electricidad`
- `pintura`
- `elevadores`
- `fumigacion`
- `piscina`
- `otros`

### TipoNCF
- `B01` - Factura de crédito fiscal
- `B02` - Factura de consumidor final
- `B14` - Nota de débito
- `B15` - Nota de crédito
- `B16` - Comprobante de compras

### Estados de Cuenta
- Periodo: `YYYY-MM` (ej: `2024-12`)
- Alícuota: Decimal entre 0 y 1 (ej: `0.05` = 5%)

---

## Notas Importantes

1. **NCF**: Los NCF se generan automáticamente al crear gastos si se especifica el `tipoNCF`
2. **ITBIS**: Se calcula automáticamente como 18% del subtotal si no se especifica
3. **Distribución**: Los gastos se distribuyen automáticamente entre unidades cuando `distribuirUnidades: true`
4. **Alícuota**: La suma de alícuotas de todas las unidades debe ser 1.0 (100%)
5. **IA**: Las facturas procesadas con confianza > 0.9 pueden considerarse confiables
6. **Predicciones**: Se recomienda tener al menos 6 meses de histórico para predicciones precisas
