-- CreateEnum
CREATE TYPE "MensajeSeguimiento" AS ENUM ('inicial', 'reintento', 'cierre');

-- CreateEnum
CREATE TYPE "EstadoEncuesta" AS ENUM ('pendiente', 'completada', 'expirada');

-- CreateEnum
CREATE TYPE "TipoUnidad" AS ENUM ('apartamento', 'local_comercial', 'oficina', 'deposito', 'estacionamiento');

-- CreateEnum
CREATE TYPE "EstadoUnidad" AS ENUM ('ocupada', 'vacia', 'en_renta', 'en_venta');

-- CreateEnum
CREATE TYPE "TipoDependiente" AS ENUM ('conyuge', 'hijo', 'padre', 'otro_familiar', 'empleado_domestico');

-- CreateEnum
CREATE TYPE "TipoVehiculo" AS ENUM ('automovil', 'motocicleta', 'camioneta', 'camion', 'bicicleta', 'otro');

-- CreateEnum
CREATE TYPE "TipoProveedor" AS ENUM ('mantenimiento', 'construccion', 'limpieza', 'seguridad', 'jardineria', 'electricidad', 'plomeria', 'aire_acondicionado', 'fumigacion', 'suministros', 'otro');

-- CreateEnum
CREATE TYPE "TipoCuenta" AS ENUM ('activo', 'pasivo', 'patrimonio', 'ingreso', 'gasto');

-- CreateEnum
CREATE TYPE "TipoNCF" AS ENUM ('B01', 'B02', 'B14', 'B15', 'B16');

-- CreateEnum
CREATE TYPE "TipoGasto" AS ENUM ('servicios_publicos', 'mantenimiento', 'limpieza', 'seguridad', 'jardineria', 'personal', 'suministros', 'impuestos', 'seguros', 'honorarios_profesionales', 'reparaciones', 'mejoras', 'otro');

-- CreateEnum
CREATE TYPE "FormaPago" AS ENUM ('efectivo', 'cheque', 'transferencia', 'tarjeta_credito', 'tarjeta_debito');

-- CreateEnum
CREATE TYPE "TipoIngreso" AS ENUM ('cuota_mantenimiento', 'multa', 'reserva_area_comun', 'alquiler', 'intereses', 'donacion', 'venta_activo', 'otro');

-- CreateEnum
CREATE TYPE "TipoPrediccion" AS ENUM ('gasto_mensual', 'consumo_energia', 'consumo_agua', 'mantenimiento_preventivo', 'flujo_caja');

-- CreateEnum
CREATE TYPE "TipoPersonal" AS ENUM ('administrativo', 'mantenimiento', 'limpieza', 'seguridad', 'jardineria', 'otro');

-- CreateEnum
CREATE TYPE "EstadoPersonal" AS ENUM ('activo', 'inactivo', 'vacaciones', 'suspendido');

-- CreateEnum
CREATE TYPE "TipoAreaComun" AS ENUM ('salon_eventos', 'salon_fiestas', 'gimnasio', 'piscina', 'cancha_tenis', 'cancha_padel', 'cancha_basketball', 'area_bbq', 'gazebo', 'terraza', 'salon_ninos', 'sala_juegos', 'salon_conferencias', 'coworking', 'otro');

-- CreateEnum
CREATE TYPE "EstadoAreaComun" AS ENUM ('disponible', 'en_mantenimiento', 'fuera_servicio');

-- CreateEnum
CREATE TYPE "EstadoReserva" AS ENUM ('pendiente', 'confirmada', 'cancelada', 'completada', 'no_show');

-- CreateEnum
CREATE TYPE "TipoVisita" AS ENUM ('personal', 'proveedor', 'delivery', 'uber_taxi', 'mudanza', 'otro');

-- CreateEnum
CREATE TYPE "EstadoVisita" AS ENUM ('esperada', 'en_espera', 'autorizada', 'ingresada', 'rechazada', 'salida_registrada');

-- CreateEnum
CREATE TYPE "TipoEstadoCuenta" AS ENUM ('mensual', 'trimestral', 'anual');

-- CreateEnum
CREATE TYPE "TipoTransaccion" AS ENUM ('cargo', 'pago', 'ajuste', 'nota_credito', 'nota_debito');

-- CreateEnum
CREATE TYPE "TipoEventoCalendario" AS ENUM ('asamblea', 'reunion_junta', 'mantenimiento_programado', 'corte_servicio', 'evento_social', 'fecha_limite_pago', 'otro');

-- CreateEnum
CREATE TYPE "CanalRecordatorio" AS ENUM ('email', 'whatsapp', 'notificacion_app', 'sms');

-- CreateEnum
CREATE TYPE "TipoDocumento" AS ENUM ('acta_asamblea', 'reglamento', 'contrato', 'factura', 'recibo', 'certificado', 'plano', 'manual', 'otro');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TipoEvento" ADD VALUE 'seguimiento_iniciado';
ALTER TYPE "TipoEvento" ADD VALUE 'seguimiento_reintento';
ALTER TYPE "TipoEvento" ADD VALUE 'seguimiento_respondido';

-- AlterTable
ALTER TABLE "citas" ADD COLUMN     "fecha_completada" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "seguimientos_casos" (
    "id" TEXT NOT NULL,
    "caso_id" TEXT NOT NULL,
    "cita_id" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "intentos" INTEGER NOT NULL DEFAULT 0,
    "proximo_intento" TIMESTAMP(3),
    "ultimo_intento" TIMESTAMP(3),
    "mensajes_tipo" "MensajeSeguimiento" NOT NULL,
    "respuesta_propietario" TEXT,
    "fecha_respuesta" TIMESTAMP(3),
    "resultado" TEXT,
    "fecha_inicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_cierre" TIMESTAMP(3),

    CONSTRAINT "seguimientos_casos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "encuestas_satisfaccion" (
    "id" TEXT NOT NULL,
    "caso_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "estado" "EstadoEncuesta" NOT NULL DEFAULT 'pendiente',
    "actitud_ingeniero" INTEGER,
    "rapidez_reparacion" INTEGER,
    "calidad_servicio" INTEGER,
    "promedio_general" DECIMAL(3,2),
    "comentarios" TEXT,
    "enviada_whatsapp" BOOLEAN NOT NULL DEFAULT false,
    "enviada_email" BOOLEAN NOT NULL DEFAULT false,
    "fecha_envio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_respuesta" TIMESTAMP(3),
    "fecha_expiracion" TIMESTAMP(3),

    CONSTRAINT "encuestas_satisfaccion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizaciones" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "rnc" TEXT,
    "direccion" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "logo" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "condominios_extendidos" (
    "id" TEXT NOT NULL,
    "organizacion_id" TEXT NOT NULL,
    "condominio_base_id" TEXT,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "ciudad" TEXT NOT NULL,
    "provincia" TEXT NOT NULL,
    "codigo_postal" TEXT,
    "rnc" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "total_unidades" INTEGER NOT NULL,
    "fecha_entrega" TIMESTAMP(3),
    "administrador_id" TEXT,
    "logo" TEXT,
    "metadata" JSONB,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "condominios_extendidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unidades" (
    "id" TEXT NOT NULL,
    "condominio_id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "edificio" TEXT,
    "piso" INTEGER,
    "tipo" "TipoUnidad" NOT NULL,
    "metros_cuadrados" DECIMAL(8,2),
    "habitaciones" INTEGER,
    "banos" INTEGER,
    "estacionamientos" INTEGER DEFAULT 0,
    "propietario_id" TEXT,
    "inquilino_id" TEXT,
    "estado" "EstadoUnidad" NOT NULL DEFAULT 'ocupada',
    "alicuota" DECIMAL(8,6) NOT NULL,
    "telefono_emergencia" TEXT,
    "email_contacto" TEXT,
    "notas" TEXT,
    "metadata" JSONB,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dependientes" (
    "id" TEXT NOT NULL,
    "unidad_id" TEXT NOT NULL,
    "nombre_completo" TEXT NOT NULL,
    "cedula" TEXT,
    "relacion" "TipoDependiente" NOT NULL,
    "telefono" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "foto_url" TEXT,
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dependientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehiculos" (
    "id" TEXT NOT NULL,
    "unidad_id" TEXT NOT NULL,
    "tipo" "TipoVehiculo" NOT NULL,
    "marca" TEXT,
    "modelo" TEXT,
    "color" TEXT,
    "placa" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehiculos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proveedores" (
    "id" TEXT NOT NULL,
    "organizacion_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nombre_comercial" TEXT,
    "rnc" TEXT,
    "tipo" "TipoProveedor" NOT NULL,
    "telefono" TEXT NOT NULL,
    "email" TEXT,
    "direccion" TEXT,
    "persona_contacto" TEXT,
    "telefono_contacto" TEXT,
    "banco" TEXT,
    "numero_cuenta" TEXT,
    "tipo_cuenta" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "calificacion" DECIMAL(3,2),
    "notas" TEXT,
    "metadata" JSONB,
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proveedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "condominio_proveedor" (
    "condominio_id" TEXT NOT NULL,
    "proveedor_id" TEXT NOT NULL,
    "fecha_asociacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "condominio_proveedor_pkey" PRIMARY KEY ("condominio_id","proveedor_id")
);

-- CreateTable
CREATE TABLE "evaluaciones_proveedor" (
    "id" TEXT NOT NULL,
    "proveedor_id" TEXT NOT NULL,
    "gasto_id" TEXT,
    "calidad" INTEGER NOT NULL,
    "puntualidad" INTEGER NOT NULL,
    "precio_justo" INTEGER NOT NULL,
    "comunicacion" INTEGER NOT NULL,
    "promedio_general" DECIMAL(3,2) NOT NULL,
    "comentarios" TEXT,
    "evaluado_por" TEXT NOT NULL,
    "fecha_evaluacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evaluaciones_proveedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_cuentas" (
    "id" TEXT NOT NULL,
    "organizacion_id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" "TipoCuenta" NOT NULL,
    "nivel" INTEGER NOT NULL,
    "cuenta_padre_id" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "acepta_movimientos" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_cuentas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ncf_secuencias" (
    "id" TEXT NOT NULL,
    "organizacion_id" TEXT NOT NULL,
    "tipo" "TipoNCF" NOT NULL,
    "serie" TEXT NOT NULL,
    "secuencia_inicio" BIGINT NOT NULL,
    "secuencia_fin" BIGINT NOT NULL,
    "secuencia_actual" BIGINT NOT NULL,
    "fecha_vencimiento" TIMESTAMP(3) NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ncf_secuencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gastos" (
    "id" TEXT NOT NULL,
    "condominio_id" TEXT NOT NULL,
    "cuenta_contable_id" TEXT NOT NULL,
    "proveedor_id" TEXT,
    "ncf_secuencia_id" TEXT,
    "numero_factura" TEXT,
    "ncf" TEXT,
    "tipo" "TipoGasto" NOT NULL,
    "concepto" TEXT NOT NULL,
    "descripcion" TEXT,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "itbis" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "forma_pago" "FormaPago" NOT NULL,
    "fecha_emision" TIMESTAMP(3) NOT NULL,
    "fecha_pago" TIMESTAMP(3),
    "pagado" BOOLEAN NOT NULL DEFAULT false,
    "distribuir_unidades" BOOLEAN NOT NULL DEFAULT true,
    "adjunto_url" TEXT,
    "procesado_por_ia" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "creado_por" TEXT NOT NULL,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gastos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "distribucion_gastos" (
    "id" TEXT NOT NULL,
    "gasto_id" TEXT NOT NULL,
    "unidad_id" TEXT NOT NULL,
    "monto_asignado" DECIMAL(12,2) NOT NULL,
    "pagado" BOOLEAN NOT NULL DEFAULT false,
    "fecha_pago" TIMESTAMP(3),
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "distribucion_gastos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingresos" (
    "id" TEXT NOT NULL,
    "condominio_id" TEXT NOT NULL,
    "cuenta_contable_id" TEXT NOT NULL,
    "ncf_secuencia_id" TEXT,
    "numero_recibo" TEXT,
    "ncf" TEXT,
    "tipo" "TipoIngreso" NOT NULL,
    "concepto" TEXT NOT NULL,
    "descripcion" TEXT,
    "monto" DECIMAL(12,2) NOT NULL,
    "forma_pago" "FormaPago" NOT NULL,
    "fecha_emision" TIMESTAMP(3) NOT NULL,
    "fecha_cobro" TIMESTAMP(3),
    "cobrado" BOOLEAN NOT NULL DEFAULT false,
    "unidad_id" TEXT,
    "adjunto_url" TEXT,
    "metadata" JSONB,
    "creado_por" TEXT NOT NULL,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ingresos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facturas_ia_procesadas" (
    "id" TEXT NOT NULL,
    "gasto_id" TEXT NOT NULL,
    "texto_extraido" TEXT,
    "datos_estructurados" JSONB,
    "confianza" DECIMAL(3,2),
    "validada" BOOLEAN NOT NULL DEFAULT false,
    "validada_por" TEXT,
    "fecha_validacion" TIMESTAMP(3),
    "fecha_procesamiento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "facturas_ia_procesadas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "predicciones_ia" (
    "id" TEXT NOT NULL,
    "condominio_id" TEXT NOT NULL,
    "tipo" "TipoPrediccion" NOT NULL,
    "periodo" TEXT NOT NULL,
    "valor_predicho" DECIMAL(12,2) NOT NULL,
    "valor_real" DECIMAL(12,2),
    "confianza" DECIMAL(3,2) NOT NULL,
    "margen_error" DECIMAL(12,2),
    "modelo_usado" TEXT NOT NULL,
    "datos_entrenamiento" JSONB,
    "fecha_prediccion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3),

    CONSTRAINT "predicciones_ia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personal" (
    "id" TEXT NOT NULL,
    "organizacion_id" TEXT NOT NULL,
    "nombre_completo" TEXT NOT NULL,
    "cedula" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "email" TEXT,
    "direccion" TEXT,
    "tipo" "TipoPersonal" NOT NULL,
    "puesto" TEXT NOT NULL,
    "fecha_ingreso" TIMESTAMP(3) NOT NULL,
    "fecha_salida" TIMESTAMP(3),
    "estado" "EstadoPersonal" NOT NULL DEFAULT 'activo',
    "salario_mensual" DECIMAL(12,2) NOT NULL,
    "afiliacion_afp" TEXT,
    "afiliacion_ars" TEXT,
    "banco" TEXT,
    "numero_cuenta" TEXT,
    "foto_url" TEXT,
    "metadata" JSONB,
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nominas" (
    "id" TEXT NOT NULL,
    "personal_id" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "fecha_pago" TIMESTAMP(3) NOT NULL,
    "salario_base" DECIMAL(12,2) NOT NULL,
    "bonificaciones" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "horas_extra" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "deduccion_afp" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "deduccion_ars" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "deduccion_isr" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "otras_deducciones" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_devengado" DECIMAL(12,2) NOT NULL,
    "total_deducciones" DECIMAL(12,2) NOT NULL,
    "salario_neto" DECIMAL(12,2) NOT NULL,
    "pagado" BOOLEAN NOT NULL DEFAULT false,
    "notas" TEXT,
    "metadata" JSONB,
    "creado_por" TEXT NOT NULL,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nominas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "areas_comunes" (
    "id" TEXT NOT NULL,
    "condominio_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoAreaComun" NOT NULL,
    "descripcion" TEXT,
    "ubicacion" TEXT,
    "capacidad" INTEGER,
    "metros_cuadrados" DECIMAL(8,2),
    "equipamiento" JSONB,
    "estado" "EstadoAreaComun" NOT NULL DEFAULT 'disponible',
    "requiere_reserva" BOOLEAN NOT NULL DEFAULT true,
    "hora_apertura" TEXT,
    "hora_cierre" TEXT,
    "dias_disponibles" JSONB,
    "costo_reserva" DECIMAL(10,2),
    "requiere_deposito" BOOLEAN NOT NULL DEFAULT false,
    "monto_deposito" DECIMAL(10,2),
    "tiempo_maximo_reserva" INTEGER,
    "anticipacion_minima" INTEGER,
    "fotos" JSONB,
    "metadata" JSONB,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "areas_comunes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservas_areas" (
    "id" TEXT NOT NULL,
    "area_id" TEXT NOT NULL,
    "unidad_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "fecha_reserva" TIMESTAMP(3) NOT NULL,
    "hora_inicio" TEXT NOT NULL,
    "hora_fin" TEXT NOT NULL,
    "estado" "EstadoReserva" NOT NULL DEFAULT 'pendiente',
    "numero_personas" INTEGER,
    "tipo_evento" TEXT,
    "costo_reserva" DECIMAL(10,2),
    "deposito_pagado" DECIMAL(10,2),
    "deposito_devuelto" BOOLEAN NOT NULL DEFAULT false,
    "notas" TEXT,
    "motivo_cancelacion" TEXT,
    "fecha_solicitud" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,
    "cancelado_por" TEXT,

    CONSTRAINT "reservas_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitas" (
    "id" TEXT NOT NULL,
    "condominio_id" TEXT NOT NULL,
    "unidad_id" TEXT NOT NULL,
    "nombre_visitante" TEXT NOT NULL,
    "cedula" TEXT,
    "telefono" TEXT,
    "vehiculo_id" TEXT,
    "tipo" "TipoVisita" NOT NULL,
    "estado" "EstadoVisita" NOT NULL DEFAULT 'en_espera',
    "fecha_esperada" TIMESTAMP(3),
    "fecha_hora_llegada" TIMESTAMP(3),
    "fecha_hora_salida" TIMESTAMP(3),
    "autorizado_por" TEXT,
    "fecha_autorizacion" TIMESTAMP(3),
    "motivo_rechazo" TEXT,
    "foto_visitante" TEXT,
    "foto_vehiculo" TEXT,
    "observaciones" TEXT,
    "metadata" JSONB,
    "registrado_por" TEXT NOT NULL,
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "visita_frecuente_id" TEXT,

    CONSTRAINT "visitas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitas_frecuentes" (
    "id" TEXT NOT NULL,
    "unidad_id" TEXT NOT NULL,
    "nombre_completo" TEXT NOT NULL,
    "cedula" TEXT,
    "telefono" TEXT,
    "relacion" TEXT NOT NULL,
    "autorizacion_activa" BOOLEAN NOT NULL DEFAULT true,
    "dias_autorizados" JSONB,
    "horario_autorizado" JSONB,
    "foto_url" TEXT,
    "autorizado_por" TEXT NOT NULL,
    "fecha_autorizacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_vencimiento" TIMESTAMP(3),

    CONSTRAINT "visitas_frecuentes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estados_cuenta" (
    "id" TEXT NOT NULL,
    "condominio_id" TEXT NOT NULL,
    "unidad_id" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "tipo" "TipoEstadoCuenta" NOT NULL,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3) NOT NULL,
    "saldo_anterior" DECIMAL(12,2) NOT NULL,
    "total_cargos" DECIMAL(12,2) NOT NULL,
    "total_pagos" DECIMAL(12,2) NOT NULL,
    "saldo_actual" DECIMAL(12,2) NOT NULL,
    "cuota_mantenimiento" DECIMAL(12,2),
    "gastos_distribuidos" DECIMAL(12,2),
    "multas" DECIMAL(12,2) DEFAULT 0,
    "intereses_mora" DECIMAL(12,2) DEFAULT 0,
    "otros" DECIMAL(12,2) DEFAULT 0,
    "pagado" BOOLEAN NOT NULL DEFAULT false,
    "fecha_vencimiento" TIMESTAMP(3) NOT NULL,
    "pdf_url" TEXT,
    "fecha_generacion" TIMESTAMP(3),
    "enviado_email" BOOLEAN NOT NULL DEFAULT false,
    "enviado_whatsapp" BOOLEAN NOT NULL DEFAULT false,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estados_cuenta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transacciones_cuenta" (
    "id" TEXT NOT NULL,
    "estado_cuenta_id" TEXT,
    "unidad_id" TEXT NOT NULL,
    "tipo" "TipoTransaccion" NOT NULL,
    "concepto" TEXT NOT NULL,
    "referencia" TEXT,
    "monto" DECIMAL(12,2) NOT NULL,
    "saldo" DECIMAL(12,2) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "fecha_procesamiento" TIMESTAMP(3),
    "metadata" JSONB,
    "creado_por" TEXT NOT NULL,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transacciones_cuenta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendario_eventos" (
    "id" TEXT NOT NULL,
    "condominio_id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" "TipoEventoCalendario" NOT NULL,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3),
    "todo_el_dia" BOOLEAN NOT NULL DEFAULT false,
    "ubicacion" TEXT,
    "es_publico" BOOLEAN NOT NULL DEFAULT true,
    "unidades_invitadas" JSONB,
    "metadata" JSONB,
    "creado_por" TEXT NOT NULL,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendario_eventos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recordatorios" (
    "id" TEXT NOT NULL,
    "evento_id" TEXT NOT NULL,
    "canal" "CanalRecordatorio" NOT NULL,
    "minutos_antes" INTEGER NOT NULL,
    "enviado" BOOLEAN NOT NULL DEFAULT false,
    "fecha_envio" TIMESTAMP(3),
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recordatorios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos" (
    "id" TEXT NOT NULL,
    "condominio_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoDocumento" NOT NULL,
    "descripcion" TEXT,
    "url" TEXT NOT NULL,
    "nombre_archivo" TEXT NOT NULL,
    "tamano_bytes" BIGINT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "carpeta" TEXT,
    "etiquetas" JSONB,
    "es_publico" BOOLEAN NOT NULL DEFAULT false,
    "unidades_con_acceso" JSONB,
    "metadata" JSONB,
    "subido_por" TEXT NOT NULL,
    "fecha_subida" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documentos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "seguimientos_casos_caso_id_idx" ON "seguimientos_casos"("caso_id");

-- CreateIndex
CREATE INDEX "seguimientos_casos_activo_idx" ON "seguimientos_casos"("activo");

-- CreateIndex
CREATE INDEX "seguimientos_casos_proximo_intento_idx" ON "seguimientos_casos"("proximo_intento");

-- CreateIndex
CREATE INDEX "encuestas_satisfaccion_caso_id_idx" ON "encuestas_satisfaccion"("caso_id");

-- CreateIndex
CREATE INDEX "encuestas_satisfaccion_usuario_id_idx" ON "encuestas_satisfaccion"("usuario_id");

-- CreateIndex
CREATE INDEX "encuestas_satisfaccion_estado_idx" ON "encuestas_satisfaccion"("estado");

-- CreateIndex
CREATE INDEX "encuestas_satisfaccion_fecha_envio_idx" ON "encuestas_satisfaccion"("fecha_envio");

-- CreateIndex
CREATE UNIQUE INDEX "organizaciones_slug_key" ON "organizaciones"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "organizaciones_rnc_key" ON "organizaciones"("rnc");

-- CreateIndex
CREATE UNIQUE INDEX "condominios_extendidos_condominio_base_id_key" ON "condominios_extendidos"("condominio_base_id");

-- CreateIndex
CREATE UNIQUE INDEX "condominios_extendidos_rnc_key" ON "condominios_extendidos"("rnc");

-- CreateIndex
CREATE INDEX "condominios_extendidos_organizacion_id_idx" ON "condominios_extendidos"("organizacion_id");

-- CreateIndex
CREATE INDEX "unidades_condominio_id_idx" ON "unidades"("condominio_id");

-- CreateIndex
CREATE INDEX "unidades_propietario_id_idx" ON "unidades"("propietario_id");

-- CreateIndex
CREATE INDEX "unidades_inquilino_id_idx" ON "unidades"("inquilino_id");

-- CreateIndex
CREATE UNIQUE INDEX "unidades_condominio_id_numero_key" ON "unidades"("condominio_id", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "dependientes_cedula_key" ON "dependientes"("cedula");

-- CreateIndex
CREATE INDEX "dependientes_unidad_id_idx" ON "dependientes"("unidad_id");

-- CreateIndex
CREATE UNIQUE INDEX "vehiculos_placa_key" ON "vehiculos"("placa");

-- CreateIndex
CREATE INDEX "vehiculos_unidad_id_idx" ON "vehiculos"("unidad_id");

-- CreateIndex
CREATE INDEX "vehiculos_placa_idx" ON "vehiculos"("placa");

-- CreateIndex
CREATE UNIQUE INDEX "proveedores_rnc_key" ON "proveedores"("rnc");

-- CreateIndex
CREATE INDEX "proveedores_organizacion_id_idx" ON "proveedores"("organizacion_id");

-- CreateIndex
CREATE INDEX "proveedores_tipo_idx" ON "proveedores"("tipo");

-- CreateIndex
CREATE INDEX "evaluaciones_proveedor_proveedor_id_idx" ON "evaluaciones_proveedor"("proveedor_id");

-- CreateIndex
CREATE INDEX "evaluaciones_proveedor_gasto_id_idx" ON "evaluaciones_proveedor"("gasto_id");

-- CreateIndex
CREATE INDEX "plan_cuentas_organizacion_id_idx" ON "plan_cuentas"("organizacion_id");

-- CreateIndex
CREATE INDEX "plan_cuentas_tipo_idx" ON "plan_cuentas"("tipo");

-- CreateIndex
CREATE UNIQUE INDEX "plan_cuentas_organizacion_id_codigo_key" ON "plan_cuentas"("organizacion_id", "codigo");

-- CreateIndex
CREATE INDEX "ncf_secuencias_organizacion_id_idx" ON "ncf_secuencias"("organizacion_id");

-- CreateIndex
CREATE INDEX "ncf_secuencias_tipo_idx" ON "ncf_secuencias"("tipo");

-- CreateIndex
CREATE UNIQUE INDEX "gastos_ncf_key" ON "gastos"("ncf");

-- CreateIndex
CREATE INDEX "gastos_condominio_id_idx" ON "gastos"("condominio_id");

-- CreateIndex
CREATE INDEX "gastos_proveedor_id_idx" ON "gastos"("proveedor_id");

-- CreateIndex
CREATE INDEX "gastos_tipo_idx" ON "gastos"("tipo");

-- CreateIndex
CREATE INDEX "gastos_fecha_emision_idx" ON "gastos"("fecha_emision");

-- CreateIndex
CREATE INDEX "gastos_pagado_idx" ON "gastos"("pagado");

-- CreateIndex
CREATE INDEX "distribucion_gastos_gasto_id_idx" ON "distribucion_gastos"("gasto_id");

-- CreateIndex
CREATE INDEX "distribucion_gastos_unidad_id_idx" ON "distribucion_gastos"("unidad_id");

-- CreateIndex
CREATE INDEX "distribucion_gastos_pagado_idx" ON "distribucion_gastos"("pagado");

-- CreateIndex
CREATE UNIQUE INDEX "distribucion_gastos_gasto_id_unidad_id_key" ON "distribucion_gastos"("gasto_id", "unidad_id");

-- CreateIndex
CREATE UNIQUE INDEX "ingresos_numero_recibo_key" ON "ingresos"("numero_recibo");

-- CreateIndex
CREATE UNIQUE INDEX "ingresos_ncf_key" ON "ingresos"("ncf");

-- CreateIndex
CREATE INDEX "ingresos_condominio_id_idx" ON "ingresos"("condominio_id");

-- CreateIndex
CREATE INDEX "ingresos_tipo_idx" ON "ingresos"("tipo");

-- CreateIndex
CREATE INDEX "ingresos_fecha_emision_idx" ON "ingresos"("fecha_emision");

-- CreateIndex
CREATE INDEX "ingresos_cobrado_idx" ON "ingresos"("cobrado");

-- CreateIndex
CREATE INDEX "ingresos_unidad_id_idx" ON "ingresos"("unidad_id");

-- CreateIndex
CREATE UNIQUE INDEX "facturas_ia_procesadas_gasto_id_key" ON "facturas_ia_procesadas"("gasto_id");

-- CreateIndex
CREATE INDEX "facturas_ia_procesadas_gasto_id_idx" ON "facturas_ia_procesadas"("gasto_id");

-- CreateIndex
CREATE INDEX "predicciones_ia_condominio_id_idx" ON "predicciones_ia"("condominio_id");

-- CreateIndex
CREATE INDEX "predicciones_ia_tipo_idx" ON "predicciones_ia"("tipo");

-- CreateIndex
CREATE UNIQUE INDEX "personal_cedula_key" ON "personal"("cedula");

-- CreateIndex
CREATE INDEX "personal_organizacion_id_idx" ON "personal"("organizacion_id");

-- CreateIndex
CREATE INDEX "personal_tipo_idx" ON "personal"("tipo");

-- CreateIndex
CREATE INDEX "personal_estado_idx" ON "personal"("estado");

-- CreateIndex
CREATE INDEX "nominas_personal_id_idx" ON "nominas"("personal_id");

-- CreateIndex
CREATE INDEX "nominas_periodo_idx" ON "nominas"("periodo");

-- CreateIndex
CREATE INDEX "nominas_pagado_idx" ON "nominas"("pagado");

-- CreateIndex
CREATE UNIQUE INDEX "nominas_personal_id_periodo_key" ON "nominas"("personal_id", "periodo");

-- CreateIndex
CREATE INDEX "areas_comunes_condominio_id_idx" ON "areas_comunes"("condominio_id");

-- CreateIndex
CREATE INDEX "areas_comunes_tipo_idx" ON "areas_comunes"("tipo");

-- CreateIndex
CREATE INDEX "areas_comunes_estado_idx" ON "areas_comunes"("estado");

-- CreateIndex
CREATE INDEX "reservas_areas_area_id_idx" ON "reservas_areas"("area_id");

-- CreateIndex
CREATE INDEX "reservas_areas_unidad_id_idx" ON "reservas_areas"("unidad_id");

-- CreateIndex
CREATE INDEX "reservas_areas_usuario_id_idx" ON "reservas_areas"("usuario_id");

-- CreateIndex
CREATE INDEX "reservas_areas_fecha_reserva_idx" ON "reservas_areas"("fecha_reserva");

-- CreateIndex
CREATE INDEX "reservas_areas_estado_idx" ON "reservas_areas"("estado");

-- CreateIndex
CREATE INDEX "visitas_condominio_id_idx" ON "visitas"("condominio_id");

-- CreateIndex
CREATE INDEX "visitas_unidad_id_idx" ON "visitas"("unidad_id");

-- CreateIndex
CREATE INDEX "visitas_estado_idx" ON "visitas"("estado");

-- CreateIndex
CREATE INDEX "visitas_fecha_hora_llegada_idx" ON "visitas"("fecha_hora_llegada");

-- CreateIndex
CREATE INDEX "visitas_tipo_idx" ON "visitas"("tipo");

-- CreateIndex
CREATE UNIQUE INDEX "visitas_frecuentes_cedula_key" ON "visitas_frecuentes"("cedula");

-- CreateIndex
CREATE INDEX "visitas_frecuentes_unidad_id_idx" ON "visitas_frecuentes"("unidad_id");

-- CreateIndex
CREATE INDEX "visitas_frecuentes_autorizacion_activa_idx" ON "visitas_frecuentes"("autorizacion_activa");

-- CreateIndex
CREATE INDEX "estados_cuenta_condominio_id_idx" ON "estados_cuenta"("condominio_id");

-- CreateIndex
CREATE INDEX "estados_cuenta_unidad_id_idx" ON "estados_cuenta"("unidad_id");

-- CreateIndex
CREATE INDEX "estados_cuenta_periodo_idx" ON "estados_cuenta"("periodo");

-- CreateIndex
CREATE INDEX "estados_cuenta_pagado_idx" ON "estados_cuenta"("pagado");

-- CreateIndex
CREATE UNIQUE INDEX "estados_cuenta_condominio_id_unidad_id_periodo_key" ON "estados_cuenta"("condominio_id", "unidad_id", "periodo");

-- CreateIndex
CREATE INDEX "transacciones_cuenta_estado_cuenta_id_idx" ON "transacciones_cuenta"("estado_cuenta_id");

-- CreateIndex
CREATE INDEX "transacciones_cuenta_unidad_id_idx" ON "transacciones_cuenta"("unidad_id");

-- CreateIndex
CREATE INDEX "transacciones_cuenta_tipo_idx" ON "transacciones_cuenta"("tipo");

-- CreateIndex
CREATE INDEX "transacciones_cuenta_fecha_idx" ON "transacciones_cuenta"("fecha");

-- CreateIndex
CREATE INDEX "calendario_eventos_condominio_id_idx" ON "calendario_eventos"("condominio_id");

-- CreateIndex
CREATE INDEX "calendario_eventos_tipo_idx" ON "calendario_eventos"("tipo");

-- CreateIndex
CREATE INDEX "calendario_eventos_fecha_inicio_idx" ON "calendario_eventos"("fecha_inicio");

-- CreateIndex
CREATE INDEX "recordatorios_evento_id_idx" ON "recordatorios"("evento_id");

-- CreateIndex
CREATE INDEX "recordatorios_enviado_idx" ON "recordatorios"("enviado");

-- CreateIndex
CREATE INDEX "documentos_condominio_id_idx" ON "documentos"("condominio_id");

-- CreateIndex
CREATE INDEX "documentos_tipo_idx" ON "documentos"("tipo");

-- CreateIndex
CREATE INDEX "documentos_carpeta_idx" ON "documentos"("carpeta");

-- AddForeignKey
ALTER TABLE "seguimientos_casos" ADD CONSTRAINT "seguimientos_casos_caso_id_fkey" FOREIGN KEY ("caso_id") REFERENCES "casos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguimientos_casos" ADD CONSTRAINT "seguimientos_casos_cita_id_fkey" FOREIGN KEY ("cita_id") REFERENCES "citas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encuestas_satisfaccion" ADD CONSTRAINT "encuestas_satisfaccion_caso_id_fkey" FOREIGN KEY ("caso_id") REFERENCES "casos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encuestas_satisfaccion" ADD CONSTRAINT "encuestas_satisfaccion_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "condominios_extendidos" ADD CONSTRAINT "condominios_extendidos_organizacion_id_fkey" FOREIGN KEY ("organizacion_id") REFERENCES "organizaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unidades" ADD CONSTRAINT "unidades_condominio_id_fkey" FOREIGN KEY ("condominio_id") REFERENCES "condominios_extendidos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dependientes" ADD CONSTRAINT "dependientes_unidad_id_fkey" FOREIGN KEY ("unidad_id") REFERENCES "unidades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehiculos" ADD CONSTRAINT "vehiculos_unidad_id_fkey" FOREIGN KEY ("unidad_id") REFERENCES "unidades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proveedores" ADD CONSTRAINT "proveedores_organizacion_id_fkey" FOREIGN KEY ("organizacion_id") REFERENCES "organizaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "condominio_proveedor" ADD CONSTRAINT "condominio_proveedor_condominio_id_fkey" FOREIGN KEY ("condominio_id") REFERENCES "condominios_extendidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "condominio_proveedor" ADD CONSTRAINT "condominio_proveedor_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluaciones_proveedor" ADD CONSTRAINT "evaluaciones_proveedor_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluaciones_proveedor" ADD CONSTRAINT "evaluaciones_proveedor_gasto_id_fkey" FOREIGN KEY ("gasto_id") REFERENCES "gastos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_cuentas" ADD CONSTRAINT "plan_cuentas_organizacion_id_fkey" FOREIGN KEY ("organizacion_id") REFERENCES "organizaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_cuentas" ADD CONSTRAINT "plan_cuentas_cuenta_padre_id_fkey" FOREIGN KEY ("cuenta_padre_id") REFERENCES "plan_cuentas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ncf_secuencias" ADD CONSTRAINT "ncf_secuencias_organizacion_id_fkey" FOREIGN KEY ("organizacion_id") REFERENCES "organizaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos" ADD CONSTRAINT "gastos_condominio_id_fkey" FOREIGN KEY ("condominio_id") REFERENCES "condominios_extendidos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos" ADD CONSTRAINT "gastos_cuenta_contable_id_fkey" FOREIGN KEY ("cuenta_contable_id") REFERENCES "plan_cuentas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos" ADD CONSTRAINT "gastos_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos" ADD CONSTRAINT "gastos_ncf_secuencia_id_fkey" FOREIGN KEY ("ncf_secuencia_id") REFERENCES "ncf_secuencias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribucion_gastos" ADD CONSTRAINT "distribucion_gastos_gasto_id_fkey" FOREIGN KEY ("gasto_id") REFERENCES "gastos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribucion_gastos" ADD CONSTRAINT "distribucion_gastos_unidad_id_fkey" FOREIGN KEY ("unidad_id") REFERENCES "unidades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingresos" ADD CONSTRAINT "ingresos_condominio_id_fkey" FOREIGN KEY ("condominio_id") REFERENCES "condominios_extendidos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingresos" ADD CONSTRAINT "ingresos_cuenta_contable_id_fkey" FOREIGN KEY ("cuenta_contable_id") REFERENCES "plan_cuentas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingresos" ADD CONSTRAINT "ingresos_ncf_secuencia_id_fkey" FOREIGN KEY ("ncf_secuencia_id") REFERENCES "ncf_secuencias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas_ia_procesadas" ADD CONSTRAINT "facturas_ia_procesadas_gasto_id_fkey" FOREIGN KEY ("gasto_id") REFERENCES "gastos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal" ADD CONSTRAINT "personal_organizacion_id_fkey" FOREIGN KEY ("organizacion_id") REFERENCES "organizaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nominas" ADD CONSTRAINT "nominas_personal_id_fkey" FOREIGN KEY ("personal_id") REFERENCES "personal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "areas_comunes" ADD CONSTRAINT "areas_comunes_condominio_id_fkey" FOREIGN KEY ("condominio_id") REFERENCES "condominios_extendidos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas_areas" ADD CONSTRAINT "reservas_areas_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas_comunes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas_areas" ADD CONSTRAINT "reservas_areas_unidad_id_fkey" FOREIGN KEY ("unidad_id") REFERENCES "unidades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitas" ADD CONSTRAINT "visitas_condominio_id_fkey" FOREIGN KEY ("condominio_id") REFERENCES "condominios_extendidos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitas" ADD CONSTRAINT "visitas_unidad_id_fkey" FOREIGN KEY ("unidad_id") REFERENCES "unidades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitas" ADD CONSTRAINT "visitas_vehiculo_id_fkey" FOREIGN KEY ("vehiculo_id") REFERENCES "vehiculos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitas" ADD CONSTRAINT "visitas_visita_frecuente_id_fkey" FOREIGN KEY ("visita_frecuente_id") REFERENCES "visitas_frecuentes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estados_cuenta" ADD CONSTRAINT "estados_cuenta_condominio_id_fkey" FOREIGN KEY ("condominio_id") REFERENCES "condominios_extendidos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacciones_cuenta" ADD CONSTRAINT "transacciones_cuenta_estado_cuenta_id_fkey" FOREIGN KEY ("estado_cuenta_id") REFERENCES "estados_cuenta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacciones_cuenta" ADD CONSTRAINT "transacciones_cuenta_unidad_id_fkey" FOREIGN KEY ("unidad_id") REFERENCES "unidades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendario_eventos" ADD CONSTRAINT "calendario_eventos_condominio_id_fkey" FOREIGN KEY ("condominio_id") REFERENCES "condominios_extendidos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recordatorios" ADD CONSTRAINT "recordatorios_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "calendario_eventos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_condominio_id_fkey" FOREIGN KEY ("condominio_id") REFERENCES "condominios_extendidos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
