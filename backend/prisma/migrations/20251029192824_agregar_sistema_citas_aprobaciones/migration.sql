-- CreateEnum
CREATE TYPE "DiaSemana" AS ENUM ('lunes', 'martes', 'miercoles', 'jueves', 'viernes');

-- CreateEnum
CREATE TYPE "EstadoCita" AS ENUM ('pendiente', 'confirmada_propietario', 'confirmada_ingenieria', 'completada', 'no_realizada', 'reprogramada', 'cancelada');

-- CreateEnum
CREATE TYPE "EstadoAprobacion" AS ENUM ('pendiente', 'aprobado', 'rechazado', 'solicitar_info');

-- CreateTable
CREATE TABLE "bloques_horarios" (
    "id" TEXT NOT NULL,
    "dia_semana" "DiaSemana" NOT NULL,
    "hora_inicio" TEXT NOT NULL,
    "hora_fin" TEXT NOT NULL,
    "capacidad" INTEGER NOT NULL DEFAULT 5,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "bloques_horarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "citas" (
    "id" TEXT NOT NULL,
    "caso_id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "bloque_horario_id" TEXT NOT NULL,
    "tecnico_id" TEXT,
    "estado" "EstadoCita" NOT NULL DEFAULT 'pendiente',
    "propietario_confirmo" BOOLEAN NOT NULL DEFAULT false,
    "ingenieria_confirmo" BOOLEAN NOT NULL DEFAULT false,
    "fecha_confirmacion_prop" TIMESTAMP(3),
    "fecha_confirmacion_ing" TIMESTAMP(3),
    "visita_realizada" BOOLEAN NOT NULL DEFAULT false,
    "solucionado" BOOLEAN,
    "comentario_propietario" TEXT,
    "motivo_cancelacion" TEXT,
    "notas" TEXT,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "citas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aprobaciones" (
    "id" TEXT NOT NULL,
    "caso_id" TEXT NOT NULL,
    "tipo_aprobacion" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "costo_estimado" DECIMAL(10,2),
    "justificacion" TEXT,
    "solicitado_por" TEXT NOT NULL,
    "estado" "EstadoAprobacion" NOT NULL DEFAULT 'pendiente',
    "aprobado_por" TEXT,
    "fecha_solicitud" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_respuesta" TIMESTAMP(3),
    "comentarios" TEXT,

    CONSTRAINT "aprobaciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "citas_caso_id_idx" ON "citas"("caso_id");

-- CreateIndex
CREATE INDEX "citas_fecha_idx" ON "citas"("fecha");

-- CreateIndex
CREATE INDEX "citas_tecnico_id_idx" ON "citas"("tecnico_id");

-- CreateIndex
CREATE INDEX "aprobaciones_caso_id_idx" ON "aprobaciones"("caso_id");

-- CreateIndex
CREATE INDEX "aprobaciones_estado_idx" ON "aprobaciones"("estado");

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_caso_id_fkey" FOREIGN KEY ("caso_id") REFERENCES "casos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_bloque_horario_id_fkey" FOREIGN KEY ("bloque_horario_id") REFERENCES "bloques_horarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aprobaciones" ADD CONSTRAINT "aprobaciones_caso_id_fkey" FOREIGN KEY ("caso_id") REFERENCES "casos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
