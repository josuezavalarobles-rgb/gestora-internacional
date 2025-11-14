/**
 * ========================================
 * IMPORT ROUTES
 * Importación masiva de datos desde Excel
 * ========================================
 */

import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import * as importController from '../controllers/import.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/requireRole';

const router = Router();

// Configurar multer para subida de archivos Excel
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/temp');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'import-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Solo aceptar archivos Excel
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls)'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo
  },
});

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * @route   POST /api/v1/import/propietarios
 * @desc    Importar propietarios desde Excel
 * @access  Admin, Técnico
 */
router.post(
  '/propietarios',
  requireRole(['admin', 'tecnico']),
  upload.single('file'),
  importController.importarPropietarios
);

/**
 * @route   POST /api/v1/import/proveedores
 * @desc    Importar proveedores desde Excel
 * @access  Admin, Técnico
 */
router.post(
  '/proveedores',
  requireRole(['admin', 'tecnico']),
  upload.single('file'),
  importController.importarProveedores
);

/**
 * @route   POST /api/v1/import/tecnicos
 * @desc    Importar técnicos desde Excel
 * @access  Admin only
 */
router.post(
  '/tecnicos',
  requireRole(['admin']),
  upload.single('file'),
  importController.importarTecnicos
);

/**
 * @route   POST /api/v1/import/casos
 * @desc    Importar casos desde Excel
 * @access  Admin, Técnico
 */
router.post(
  '/casos',
  requireRole(['admin', 'tecnico']),
  upload.single('file'),
  importController.importarCasos
);

/**
 * @route   GET /api/v1/import/plantilla/:tipo
 * @desc    Descargar plantilla de Excel para importación
 * @access  Authenticated users
 * @params  tipo: propietarios | proveedores | tecnicos | casos
 */
router.get(
  '/plantilla/:tipo',
  importController.descargarPlantilla
);

export default router;
