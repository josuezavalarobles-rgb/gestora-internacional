-- CreateEnum
CREATE TYPE "TipoSolicitud" AS ENUM ('mantenimiento', 'pago', 'reserva', 'acceso', 'emergencia', 'consulta');

-- CreateEnum
CREATE TYPE "UrgenciaSolicitud" AS ENUM ('baja', 'media', 'alta', 'critica');

-- CreateEnum
CREATE TYPE "EstadoSolicitud" AS ENUM ('nueva', 'en_proceso', 'resuelta', 'cerrada');

-- CreateTable
CREATE TABLE "solicitudes" (
    "id" TEXT NOT NULL,
    "codigo_unico" TEXT NOT NULL,
    "tipo_solicitud" "TipoSolicitud" NOT NULL,
    "urgencia" "UrgenciaSolicitud" NOT NULL,
    "categoria" TEXT,
    "usuario_id" TEXT,
    "telefono" TEXT NOT NULL,
    "nombre_usuario" TEXT,
    "descripcion" TEXT NOT NULL,
    "estado" "EstadoSolicitud" NOT NULL DEFAULT 'nueva',
    "asignado_a" TEXT,
    "fecha_asignacion" TIMESTAMP(3),
    "mensajes_whatsapp" JSONB,
    "emocion_detectada" TEXT,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_resolucion" TIMESTAMP(3),
    "tiempo_respuesta" INTEGER,
    "tiempo_resolucion" INTEGER,
    "calificacion" INTEGER,
    "comentario" TEXT,
    "metadata" JSONB,

    CONSTRAINT "solicitudes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "solicitudes_codigo_unico_key" ON "solicitudes"("codigo_unico");

-- CreateIndex
CREATE INDEX "solicitudes_codigo_unico_idx" ON "solicitudes"("codigo_unico");

-- CreateIndex
CREATE INDEX "solicitudes_tipo_solicitud_idx" ON "solicitudes"("tipo_solicitud");

-- CreateIndex
CREATE INDEX "solicitudes_urgencia_idx" ON "solicitudes"("urgencia");

-- CreateIndex
CREATE INDEX "solicitudes_estado_idx" ON "solicitudes"("estado");

-- CreateIndex
CREATE INDEX "solicitudes_telefono_idx" ON "solicitudes"("telefono");

-- CreateIndex
CREATE INDEX "solicitudes_fecha_creacion_idx" ON "solicitudes"("fecha_creacion");
