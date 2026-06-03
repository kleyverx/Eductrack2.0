const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const auth = require('../middlewares/auth');

// Ruta para obtener las estadísticas del dashboard
// Solo accesible para administradores
router.get('/dashboard/stats', auth(['superadmin']), dashboardController.getDashboardStats);

module.exports = router;
