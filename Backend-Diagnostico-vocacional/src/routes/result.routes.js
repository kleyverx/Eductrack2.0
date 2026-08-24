const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { getResultById ,generateResult, getResult, regenerarAnalisis, areasTop } = require('../controllers/result.controller');
const  {getDashboardStats } = require('../controllers/dashboard.controller');
// Ruta protegida para que un usuario obtenga su resultado del test vocacional
router.post('/', auth(['estudiante']), generateResult);

router.get('/', auth(['estudiante']), getResult);


// Áreas vocacionales dominantes de varios estudiantes en una sola petición.
// OJO: tiene que ir ANTES de '/:id' o esa ruta capturaría "areas-top" como un id.
router.get('/areas-top', auth(['docente', 'superadmin']), areasTop);

// Regenerar el análisis con IA de un resultado (estudiante: el suyo; docente/superadmin: cualquiera)
router.post('/:id/analisis', auth(), regenerarAnalisis);

router.get('/:id', auth(), getResultById); // Ruta para que un admin obtenga el resultado de un usuario por ID

module.exports = router; // Exportamos el router para usarlo en app.js
