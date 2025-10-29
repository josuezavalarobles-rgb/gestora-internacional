/**
 * ========================================
 * MODELO MONGODB - CONVERSACIONES
 * ========================================
 * Estado de las conversaciones activas
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IConversacion extends Document {
  telefono: string;
  nombreContacto?: string;

  // Estado de la conversación
  estado: 'activa' | 'esperando_usuario' | 'esperando_tecnico' | 'cerrada';
  etapa: 'inicial' | 'recopilando_info' | 'procesando' | 'en_seguimiento' | 'finalizada';

  // Casos relacionados
  casosActivos: string[];
  casoActual?: string;

  // Contexto de IA
  contexto: {
    ultimoIntent?: string;
    datosRecopilados?: {
      tipo?: 'garantia' | 'condominio';
      categoria?: string;
      descripcion?: string;
      urgencia?: boolean;
      fotosRecibidas?: number;
    };
    requiereHumano?: boolean;
    razonEscalamiento?: string;
    historialIntents: string[];
  };

  // Asignación
  asignadoA?: string;
  tipoAsignacion?: 'bot' | 'humano';

  // Actividad
  ultimaActividad: Date;
  fechaInicio: Date;
  fechaCierre?: Date;

  // Métricas
  totalMensajes: number;
  mensajesBot: number;
  mensajesHumano: number;
  tiempoRespuestaPromedio?: number; // segundos

  // Metadata
  metadata?: Record<string, any>;
}

const ConversacionSchema = new Schema<IConversacion>(
  {
    telefono: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    nombreContacto: String,
    estado: {
      type: String,
      enum: ['activa', 'esperando_usuario', 'esperando_tecnico', 'cerrada'],
      default: 'activa',
      index: true,
    },
    etapa: {
      type: String,
      enum: ['inicial', 'recopilando_info', 'procesando', 'en_seguimiento', 'finalizada'],
      default: 'inicial',
    },
    casosActivos: [String],
    casoActual: String,
    contexto: {
      ultimoIntent: String,
      datosRecopilados: {
        tipo: {
          type: String,
          enum: ['garantia', 'condominio'],
        },
        categoria: String,
        descripcion: String,
        urgencia: Boolean,
        fotosRecibidas: Number,
      },
      requiereHumano: Boolean,
      razonEscalamiento: String,
      historialIntents: [String],
    },
    asignadoA: String,
    tipoAsignacion: {
      type: String,
      enum: ['bot', 'humano'],
      default: 'bot',
    },
    ultimaActividad: {
      type: Date,
      default: Date.now,
      index: true,
    },
    fechaInicio: {
      type: Date,
      default: Date.now,
    },
    fechaCierre: Date,
    totalMensajes: {
      type: Number,
      default: 0,
    },
    mensajesBot: {
      type: Number,
      default: 0,
    },
    mensajesHumano: {
      type: Number,
      default: 0,
    },
    tiempoRespuestaPromedio: Number,
    metadata: Schema.Types.Mixed,
  },
  {
    timestamps: true,
    collection: 'conversaciones',
  }
);

// Índices
ConversacionSchema.index({ estado: 1, ultimaActividad: -1 });
ConversacionSchema.index({ 'contexto.requiereHumano': 1 });

// Método para actualizar actividad
ConversacionSchema.methods.actualizarActividad = function () {
  this.ultimaActividad = new Date();
  this.totalMensajes += 1;
  return this.save();
};

// Método para marcar como requiere humano
ConversacionSchema.methods.escalarAHumano = function (razon: string) {
  this.contexto.requiereHumano = true;
  this.contexto.razonEscalamiento = razon;
  this.tipoAsignacion = 'humano';
  return this.save();
};

export const Conversacion = mongoose.model<IConversacion>('Conversacion', ConversacionSchema);
