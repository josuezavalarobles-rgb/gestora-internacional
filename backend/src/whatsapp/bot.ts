/**
 * ========================================
 * WHATSAPP BOT - INICIALIZADOR
 * ========================================
 * Punto de entrada para inicializar el bot de WhatsApp
 * usando Baileys library
 */

import { WhatsAppService } from '../services/whatsapp/WhatsAppService';
import { logger } from '../utils/logger';
import { config } from '../config';

export class WhatsAppBot {
  private static instance: WhatsAppBot;
  private whatsappService: WhatsAppService;
  private isInitialized: boolean = false;

  private constructor() {
    this.whatsappService = WhatsAppService.getInstance();
  }

  /**
   * Obtener instancia única del bot
   */
  public static getInstance(): WhatsAppBot {
    if (!WhatsAppBot.instance) {
      WhatsAppBot.instance = new WhatsAppBot();
    }
    return WhatsAppBot.instance;
  }

  /**
   * Inicializar el bot de WhatsApp
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('⚠️  WhatsApp Bot ya está inicializado');
      return;
    }

    try {
      logger.info('🤖 Inicializando WhatsApp Bot...');

      if (!config.bot.enabled) {
        logger.warn('⚠️  Bot deshabilitado en configuración');
        return;
      }

      // Inicializar servicio de WhatsApp
      await this.whatsappService.initialize();

      this.isInitialized = true;
      logger.info('✅ WhatsApp Bot inicializado exitosamente');
    } catch (error) {
      logger.error('❌ Error al inicializar WhatsApp Bot:', error);
      throw error;
    }
  }

  /**
   * Obtener estado de conexión del bot
   */
  public getConnectionStatus(): {
    isInitialized: boolean;
    isConnected: boolean;
    qrCode: string | null;
  } {
    return {
      isInitialized: this.isInitialized,
      isConnected: this.whatsappService.isWhatsAppConnected(),
      qrCode: this.whatsappService.getQRCode(),
    };
  }

  /**
   * Enviar mensaje de texto
   */
  public async sendMessage(telefono: string, mensaje: string): Promise<void> {
    if (!this.isInitialized || !this.whatsappService.isWhatsAppConnected()) {
      throw new Error('WhatsApp Bot no está conectado');
    }

    await this.whatsappService.sendMessage(telefono, mensaje);
  }

  /**
   * Enviar imagen con caption
   */
  public async sendImage(
    telefono: string,
    imagePath: string,
    caption?: string
  ): Promise<void> {
    if (!this.isInitialized || !this.whatsappService.isWhatsAppConnected()) {
      throw new Error('WhatsApp Bot no está conectado');
    }

    await this.whatsappService.sendImage(telefono, imagePath, caption);
  }

  /**
   * Obtener QR Code para conexión
   */
  public getQRCode(): string | null {
    return this.whatsappService.getQRCode();
  }

  /**
   * Verificar si está conectado
   */
  public isConnected(): boolean {
    return this.whatsappService.isWhatsAppConnected();
  }

  /**
   * Desconectar el bot
   */
  public async disconnect(): Promise<void> {
    try {
      logger.info('🔌 Desconectando WhatsApp Bot...');

      await this.whatsappService.disconnect();

      this.isInitialized = false;
      logger.info('✅ WhatsApp Bot desconectado');
    } catch (error) {
      logger.error('❌ Error al desconectar WhatsApp Bot:', error);
      throw error;
    }
  }

  /**
   * Reiniciar el bot
   */
  public async restart(): Promise<void> {
    try {
      logger.info('🔄 Reiniciando WhatsApp Bot...');

      await this.disconnect();
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Esperar 2s
      await this.initialize();

      logger.info('✅ WhatsApp Bot reiniciado');
    } catch (error) {
      logger.error('❌ Error al reiniciar WhatsApp Bot:', error);
      throw error;
    }
  }

  /**
   * Obtener servicio de WhatsApp (para uso avanzado)
   */
  public getWhatsAppService(): WhatsAppService {
    return this.whatsappService;
  }
}

// Exportar instancia única
export const whatsappBot = WhatsAppBot.getInstance();

// Exportar clase para uso directo
export default WhatsAppBot;
