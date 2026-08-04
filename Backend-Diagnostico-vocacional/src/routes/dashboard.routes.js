const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const reporteInstitucional = require('../controllers/reporteInstitucional.controller');
const auditoria = require('../controllers/auditoria.controller');
const auth = require('../middlewares/auth');

// Ruta para obtener las estadísticas del dashboard
// Solo accesible para administradores
router.get('/dashboard/stats', auth(['superadmin']), dashboardController.getDashboardStats);

// Reporte institucional agregado del plantel (superadmin).
router.get('/reporte-institucional', auth(['superadmin']), reporteInstitucional.getReporteInstitucional);

// Auditoría: últimos eventos del sistema (superadmin).
router.get('/auditoria', auth(['superadmin']), auditoria.listar);

module.exports = router;
