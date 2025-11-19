/**
 * ========================================
 * DOCUMENTOS ROUTES
 * ========================================
 */

import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/requireRole';
import { DocumentosService } from '../services/documentos/DocumentosService';

const router = Router();
const documentosService = DocumentosService.getInstance();

// Configurar multer para subida de documentos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/documentos');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'doc-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB máximo
  },
  fileFilter: (req, file, cb) => {
    // Tipos de archivo permitidos
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/jpg',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'));
    }
  },
});

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * @route   GET /api/v1/documentos
 * @desc    Obtener documentos de un condominio
 * @access  Authenticated
 */
router.get('/', async (req, res, next) => {
  try {
    const { condominioId, tipo, carpeta } = req.query;
    const documentos = await documentosService.obtenerDocumentos({
      condominioId: condominioId as string,
      tipo: tipo as any,
      carpeta: carpeta as string,
      usuarioId: req.user!.id,
      tipoUsuario: req.user!.tipoUsuario,
    });
    res.json({ success: true, data: documentos });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/documentos/:id
 * @desc    Obtener detalle de un documento
 * @access  Authenticated
 */
router.get('/:id', async (req, res, next) => {
  try {
    const documento = await documentosService.obtenerDocumentoPorId(
      req.params.id,
      req.user!.id,
      req.user!.tipoUsuario
    );
    res.json({ success: true, data: documento });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/documentos
 * @desc    Subir nuevo documento
 * @access  Admin
 */
router.post(
  '/',
  requireRole(['admin']),
  upload.single('archivo'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No se recibió ningún archivo',
        });
      }

      const documento = await documentosService.subirDocumento({
        ...req.body,
        archivo: req.file,
        subidoPor: req.user!.id,
      });

      res.status(201).json({ success: true, data: documento });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   PUT /api/v1/documentos/:id
 * @desc    Actualizar metadatos de documento
 * @access  Admin
 */
router.put('/:id', requireRole(['admin']), async (req, res, next) => {
  try {
    const documento = await documentosService.actualizarDocumento(
      req.params.id,
      req.body
    );
    res.json({ success: true, data: documento });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/v1/documentos/:id
 * @desc    Eliminar documento
 * @access  Admin
 */
router.delete('/:id', requireRole(['admin']), async (req, res, next) => {
  try {
    await documentosService.eliminarDocumento(req.params.id);
    res.json({ success: true, message: 'Documento eliminado' });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/documentos/:id/descargar
 * @desc    Descargar documento
 * @access  Authenticated (con permisos)
 */
router.get('/:id/descargar', async (req, res, next) => {
  try {
    const { url, nombreArchivo } = await documentosService.obtenerUrlDescarga(
      req.params.id,
      req.user!.id,
      req.user!.tipoUsuario
    );

    // Redirigir a la URL del documento
    res.redirect(url);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/documentos/carpetas/listado
 * @desc    Obtener estructura de carpetas
 * @access  Authenticated
 */
router.get('/carpetas/listado', async (req, res, next) => {
  try {
    const { condominioId } = req.query;
    const carpetas = await documentosService.obtenerCarpetas(condominioId as string);
    res.json({ success: true, data: carpetas });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/documentos/carpetas
 * @desc    Crear nueva carpeta
 * @access  Admin
 */
router.post('/carpetas', requireRole(['admin']), async (req, res, next) => {
  try {
    const carpeta = await documentosService.crearCarpeta(req.body);
    res.status(201).json({ success: true, data: carpeta });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/v1/documentos/:id/compartir
 * @desc    Compartir documento con unidades específicas
 * @access  Admin
 */
router.put('/:id/compartir', requireRole(['admin']), async (req, res, next) => {
  try {
    const { unidadesConAcceso, esPublico } = req.body;
    const documento = await documentosService.compartirDocumento(
      req.params.id,
      unidadesConAcceso,
      esPublico
    );
    res.json({ success: true, data: documento });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/documentos/tipos/listado
 * @desc    Obtener tipos de documentos disponibles
 * @access  Authenticated
 */
router.get('/tipos/listado', (req, res) => {
  const tipos = [
    { value: 'acta_asamblea', label: 'Acta de Asamblea' },
    { value: 'reglamento', label: 'Reglamento' },
    { value: 'contrato', label: 'Contrato' },
    { value: 'factura', label: 'Factura' },
    { value: 'recibo', label: 'Recibo' },
    { value: 'certificado', label: 'Certificado' },
    { value: 'plano', label: 'Plano' },
    { value: 'manual', label: 'Manual' },
    { value: 'otro', label: 'Otro' },
  ];
  res.json({ success: true, data: tipos });
});

export default router;
