/**
 * ========================================
 * MODELO MONGODB - MENSAJES WHATSAPP
 * ========================================
 * Almacena todos los mensajes de WhatsApp
 * con su contexto conversacional para la IA
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IMensaje extends Document {
  // Identificadores
  whatsappMessageId: string;
  casoId?: string;
  telefono: string;

  // Contenido del mensaje
  direccion: 'entrante' | 'saliente';
  tipo: 'texto' | 'imagen' | 'video' | 'audio' | 'documento' | 'ubicacion' | 'contacto';
  contenido: string;
  mediaUrl?: string;

  // Bot vs Humano
  enviadoPor: 'bot' | 'humano' | 'sistema';
  idUsuario?: string;
  nombreUsuario?: string;

  // IA
  procesadoPorIA: boolean;
  respuestaIA?: string;
  contextoIA?: {
    intent?: string;
    entities?: Record<string, any>;
    confidence?: number;
    requiereHumano?: boolean;
    razonEscalamiento?: string;
  };

  // Estado de entrega (WhatsApp)
  estadoEntrega: 'enviando' | 'enviado' | 'entregado' | 'leido' | 'fallido';
  errorMensaje?: string;

  // Timestamps
  fechaEnvio: Date;
  fechaEntrega?: Date;
  fechaLeido?: Date;

  // Metadata adicional
  metadata?: Record<string, any>;
}

const MensajeSchema = new Schema<IMensaje>(
  {
    whatsappMessageId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    casoId: {
      type: String,
      index: true,
    },
    telefono: {
      type: String,
      required: true,
      index: true,
    },
    direccion: {
      type: String,
      enum: ['entrante', 'saliente'],
      required: true,
    },
    tipo: {
      type: String,
      enum: ['texto', 'imagen', 'video', 'audio', 'documento', 'ubicacion', 'contacto'],
      required: true,
      default: 'texto',
    },
    contenido: {
      type: String,
      required: true,
    },
    mediaUrl: String,
    enviadoPor: {
      type: String,
      enum: ['bot', 'humano', 'sistema'],
      required: true,
      default: 'bot',
    },
    idUsuario: String,
    nombreUsuario: String,
    procesadoPorIA: {
      type: Boolean,
      default: false,
    },
    respuestaIA: String,
    contextoIA: {
      intent: String,
      entities: Schema.Types.Mixed,
      confidence: Number,
      requiereHumano: Boolean,
      razonEscalamiento: String,
    },
    estadoEntrega: {
      type: String,
      enum: ['enviando', 'enviado', 'entregado', 'leido', 'fallido'],
      default: 'enviando',
    },
    errorMensaje: String,
    fechaEnvio: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    fechaEntrega: Date,
    fechaLeido: Date,
    metadata: Schema.Types.Mixed,
  },
  {
    timestamps: true,
    collection: 'mensajes',
  }
);

// Índices compuestos para consultas frecuentes
MensajeSchema.index({ telefono: 1, fechaEnvio: -1 });
MensajeSchema.index({ casoId: 1, fechaEnvio: 1 });
MensajeSchema.index({ procesadoPorIA: 1, fechaEnvio: -1 });

// Método para obtener contexto de conversación reciente
MensajeSchema.statics.obtenerContextoConversacion = async function (
  telefono: string,
  limite: number = 10
) {
  return this.find({ telefono })
    .sort({ fechaEnvio: -1 })
    .limit(limite)
    .lean();
};

export const Mensaje = mongoose.model<IMensaje>('Mensaje', MensajeSchema);
