import { Router } from 'express';
import { WhatsAppService } from '../services/whatsapp/WhatsAppService';

const router = Router();
const whatsappService = WhatsAppService.getInstance();

// Obtener QR Code para conectar WhatsApp
router.get('/qr', (req, res) => {
  const qr = whatsappService.getQRCode();

  if (!qr) {
    return res.json({
      connected: whatsappService.isWhatsAppConnected(),
      qr: null,
      message: 'WhatsApp ya está conectado o esperando conexión',
    });
  }

  res.json({
    connected: false,
    qr,
  });
});

// Estado de conexión
router.get('/status', (req, res) => {
  res.json({
    connected: whatsappService.isWhatsAppConnected(),
    timestamp: new Date(),
  });
});

// Enviar mensaje de prueba (solo desarrollo)
router.post('/send-test', async (req, res) => {
  try {
    const { telefono, mensaje } = req.body;
    await whatsappService.sendMessage(telefono, mensaje);

    res.json({
      success: true,
      message: 'Mensaje enviado',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
