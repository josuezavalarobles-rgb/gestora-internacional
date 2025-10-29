-- CreateEnum
CREATE TYPE "TipoUsuario" AS ENUM ('propietario', 'inquilino', 'autorizado', 'tecnico', 'admin', 'super_admin');

-- CreateEnum
CREATE TYPE "EstadoUsuario" AS ENUM ('pendiente', 'activo', 'inactivo', 'suspendido');

-- CreateEnum
CREATE TYPE "EstadoCondominio" AS ENUM ('activo', 'inactivo', 'en_construccion');

-- CreateEnum
CREATE TYPE "TipoCaso" AS ENUM ('garantia', 'condominio');

-- CreateEnum
CREATE TYPE "EstadoCaso" AS ENUM ('nuevo', 'asignado', 'en_proceso', 'en_visita', 'esperando_repuestos', 'resuelto', 'cerrado', 'reabierto', 'cancelado');

-- CreateEnum
CREATE TYPE "PrioridadCaso" AS ENUM ('baja', 'media', 'alta', 'urgente');

-- CreateEnum
CREATE TYPE "CategoriaCaso" AS ENUM ('filtraciones_humedad', 'problemas_electricos', 'plomeria', 'puertas_ventanas', 'pisos_paredes_techo', 'aires_acondicionados', 'areas_comunes', 'seguridad', 'limpieza', 'otro');

-- CreateEnum
CREATE TYPE "TipoAdjunto" AS ENUM ('imagen', 'video', 'audio', 'documento');

-- CreateEnum
CREATE TYPE "TipoEvento" AS ENUM ('creado', 'asignado', 'reasignado', 'estado_cambiado', 'prioridad_cambiada', 'visita_programada', 'visita_completada', 'diagnostico_enviado', 'reparacion_programada', 'reparacion_completada', 'comentario_agregado', 'transferido', 'escalado', 'cerrado', 'reabierto');

-- CreateEnum
CREATE TYPE "TipoTransferencia" AS ENUM ('bot_a_humano', 'humano_a_bot', 'humano_a_humano', 'escalamiento');

-- CreateEnum
CREATE TYPE "TipoNotificacion" AS ENUM ('nueva_conversacion', 'mensaje_nuevo', 'bot_necesita_ayuda', 'lead_caliente', 'caso_asignado', 'caso_actualizado', 'visita_programada', 'sla_proximo_vencer', 'sla_violado', 'sistema');

-- CreateEnum
CREATE TYPE "PrioridadNotificacion" AS ENUM ('baja', 'media', 'alta', 'critica');

-- CreateEnum
CREATE TYPE "EstadoSesion" AS ENUM ('online', 'ausente', 'ocupado', 'offline');

-- CreateEnum
CREATE TYPE "TipoAmenidad" AS ENUM ('salon_eventos', 'gimnasio', 'piscina', 'cancha_tenis', 'cancha_padel', 'cancha_basketball', 'area_bbq', 'salon_ninos', 'otro');

-- CreateEnum
CREATE TYPE "PlataformaKPI" AS ENUM ('whatsapp', 'web', 'todas');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nombre_completo" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "email" TEXT,
    "password" TEXT,
    "tipo_usuario" "TipoUsuario" NOT NULL,
    "estado" "EstadoUsuario" NOT NULL DEFAULT 'pendiente',
    "condominio_id" TEXT,
    "unidad" TEXT,
    "puede_votar" BOOLEAN NOT NULL DEFAULT false,
    "avatar_url" TEXT,
    "notas" TEXT,
    "metadata" JSONB,
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimo_acceso" TIMESTAMP(3),
    "validado_por" TEXT,
    "fecha_validacion" TIMESTAMP(3),

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "condominios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "ciudad" TEXT NOT NULL,
    "provincia" TEXT NOT NULL,
    "codigo_postal" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "estado" "EstadoCondominio" NOT NULL DEFAULT 'activo',
    "total_unidades" INTEGER NOT NULL,
    "fecha_entrega" TIMESTAMP(3),
    "sla_garantia" INTEGER NOT NULL DEFAULT 24,
    "sla_condominio" INTEGER NOT NULL DEFAULT 72,
    "horario_atencion" JSONB,
    "logo" TEXT,
    "metadata" JSONB,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "condominios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "casos" (
    "id" TEXT NOT NULL,
    "numero_caso" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "condominio_id" TEXT NOT NULL,
    "unidad" TEXT NOT NULL,
    "tipo" "TipoCaso" NOT NULL,
    "categoria" "CategoriaCaso" NOT NULL,
    "subcategoria" TEXT,
    "descripcion" TEXT NOT NULL,
    "estado" "EstadoCaso" NOT NULL DEFAULT 'nuevo',
    "prioridad" "PrioridadCaso" NOT NULL DEFAULT 'media',
    "tecnico_asignado_id" TEXT,
    "fecha_asignacion" TIMESTAMP(3),
    "diagnostico" TEXT,
    "solucion_aplicada" TEXT,
    "tiempo_estimado" TEXT,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_visita" TIMESTAMP(3),
    "fecha_resolucion" TIMESTAMP(3),
    "fecha_cierre" TIMESTAMP(3),
    "sla_violado" BOOLEAN NOT NULL DEFAULT false,
    "tiempo_respuesta" INTEGER,
    "tiempo_resolucion" INTEGER,
    "satisfaccion_cliente" INTEGER,
    "comentario_cliente" TEXT,
    "costo_estimado" DECIMAL(10,2),
    "costo_real" DECIMAL(10,2),
    "metadata" JSONB,

    CONSTRAINT "casos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adjuntos" (
    "id" TEXT NOT NULL,
    "caso_id" TEXT NOT NULL,
    "tipo" "TipoAdjunto" NOT NULL,
    "url" TEXT NOT NULL,
    "nombre_archivo" TEXT NOT NULL,
    "tamano_bytes" BIGINT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "ancho" INTEGER,
    "alto" INTEGER,
    "duracion" INTEGER,
    "fecha_subida" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "adjuntos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timeline_eventos" (
    "id" TEXT NOT NULL,
    "caso_id" TEXT NOT NULL,
    "tipo_evento" "TipoEvento" NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "usuario_id" TEXT,
    "usuario_nombre" TEXT,
    "metadata" JSONB,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "timeline_eventos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transferencias" (
    "id" TEXT NOT NULL,
    "caso_id" TEXT NOT NULL,
    "tipo" "TipoTransferencia" NOT NULL,
    "de_agente_id" TEXT,
    "a_agente_id" TEXT,
    "motivo" TEXT,
    "notas" TEXT,
    "fecha_transferencia" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transferencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "tipo" "TipoNotificacion" NOT NULL,
    "prioridad" "PrioridadNotificacion" NOT NULL DEFAULT 'media',
    "caso_id" TEXT,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "url_accion" TEXT,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "fecha_leida" TIMESTAMP(3),
    "metadata" JSONB,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sesiones" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "estado" "EstadoSesion" NOT NULL DEFAULT 'online',
    "conversaciones_activas" INTEGER NOT NULL DEFAULT 0,
    "socket_id" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "ultima_actividad" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_login" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_logout" TIMESTAMP(3),

    CONSTRAINT "sesiones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "amenidades" (
    "id" TEXT NOT NULL,
    "condominio_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoAmenidad" NOT NULL,
    "descripcion" TEXT,
    "capacidad" INTEGER,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "requiere_reserva" BOOLEAN NOT NULL DEFAULT true,
    "costo_reserva" DECIMAL(10,2),
    "metadata" JSONB,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "amenidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kpis_diarios" (
    "id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "condominio_id" TEXT,
    "plataforma" "PlataformaKPI" NOT NULL DEFAULT 'whatsapp',
    "casos_nuevos" INTEGER NOT NULL DEFAULT 0,
    "casos_asignados" INTEGER NOT NULL DEFAULT 0,
    "casos_resueltos" INTEGER NOT NULL DEFAULT 0,
    "casos_cerrados" INTEGER NOT NULL DEFAULT 0,
    "mensajes_enviados" INTEGER NOT NULL DEFAULT 0,
    "mensajes_recibidos" INTEGER NOT NULL DEFAULT 0,
    "mensajes_bot" INTEGER NOT NULL DEFAULT 0,
    "mensajes_humano" INTEGER NOT NULL DEFAULT 0,
    "tiempo_respuesta_promedio" INTEGER,
    "tiempo_resolucion_promedio" INTEGER,
    "satisfaccion_promedio" DECIMAL(3,2),
    "slas_cumplidos" INTEGER NOT NULL DEFAULT 0,
    "slas_violados" INTEGER NOT NULL DEFAULT 0,
    "tasa_conversion" DECIMAL(5,2),
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kpis_diarios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_telefono_key" ON "usuarios"("telefono");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_telefono_idx" ON "usuarios"("telefono");

-- CreateIndex
CREATE INDEX "usuarios_condominio_id_idx" ON "usuarios"("condominio_id");

-- CreateIndex
CREATE INDEX "usuarios_estado_idx" ON "usuarios"("estado");

-- CreateIndex
CREATE INDEX "condominios_estado_idx" ON "condominios"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "casos_numero_caso_key" ON "casos"("numero_caso");

-- CreateIndex
CREATE INDEX "casos_numero_caso_idx" ON "casos"("numero_caso");

-- CreateIndex
CREATE INDEX "casos_estado_idx" ON "casos"("estado");

-- CreateIndex
CREATE INDEX "casos_prioridad_idx" ON "casos"("prioridad");

-- CreateIndex
CREATE INDEX "casos_usuario_id_idx" ON "casos"("usuario_id");

-- CreateIndex
CREATE INDEX "casos_condominio_id_idx" ON "casos"("condominio_id");

-- CreateIndex
CREATE INDEX "casos_tecnico_asignado_id_idx" ON "casos"("tecnico_asignado_id");

-- CreateIndex
CREATE INDEX "casos_fecha_creacion_idx" ON "casos"("fecha_creacion");

-- CreateIndex
CREATE INDEX "adjuntos_caso_id_idx" ON "adjuntos"("caso_id");

-- CreateIndex
CREATE INDEX "timeline_eventos_caso_id_idx" ON "timeline_eventos"("caso_id");

-- CreateIndex
CREATE INDEX "timeline_eventos_fecha_idx" ON "timeline_eventos"("fecha");

-- CreateIndex
CREATE INDEX "transferencias_caso_id_idx" ON "transferencias"("caso_id");

-- CreateIndex
CREATE INDEX "notificaciones_usuario_id_idx" ON "notificaciones"("usuario_id");

-- CreateIndex
CREATE INDEX "notificaciones_leida_idx" ON "notificaciones"("leida");

-- CreateIndex
CREATE INDEX "notificaciones_prioridad_idx" ON "notificaciones"("prioridad");

-- CreateIndex
CREATE INDEX "sesiones_usuario_id_idx" ON "sesiones"("usuario_id");

-- CreateIndex
CREATE INDEX "sesiones_estado_idx" ON "sesiones"("estado");

-- CreateIndex
CREATE INDEX "amenidades_condominio_id_idx" ON "amenidades"("condominio_id");

-- CreateIndex
CREATE INDEX "kpis_diarios_fecha_idx" ON "kpis_diarios"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "kpis_diarios_fecha_condominio_id_plataforma_key" ON "kpis_diarios"("fecha", "condominio_id", "plataforma");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_condominio_id_fkey" FOREIGN KEY ("condominio_id") REFERENCES "condominios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "casos" ADD CONSTRAINT "casos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "casos" ADD CONSTRAINT "casos_condominio_id_fkey" FOREIGN KEY ("condominio_id") REFERENCES "condominios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "casos" ADD CONSTRAINT "casos_tecnico_asignado_id_fkey" FOREIGN KEY ("tecnico_asignado_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adjuntos" ADD CONSTRAINT "adjuntos_caso_id_fkey" FOREIGN KEY ("caso_id") REFERENCES "casos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_eventos" ADD CONSTRAINT "timeline_eventos_caso_id_fkey" FOREIGN KEY ("caso_id") REFERENCES "casos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencias" ADD CONSTRAINT "transferencias_caso_id_fkey" FOREIGN KEY ("caso_id") REFERENCES "casos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones" ADD CONSTRAINT "sesiones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amenidades" ADD CONSTRAINT "amenidades_condominio_id_fkey" FOREIGN KEY ("condominio_id") REFERENCES "condominios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
