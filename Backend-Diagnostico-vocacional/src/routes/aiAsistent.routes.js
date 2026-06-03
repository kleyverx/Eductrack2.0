const express = require('express');
const router = express.Router();                     // Creamos un enrutador de Express
const { asistente } = require('../controllers/aiAsistent.controller'); 
const auth = require('../middlewares/auth');

// Importamos los controladores

router.post('/asistente', auth(['estudiante']), asistente); // Ruta del asistente
// router.post('/cuento', auth(['user']), cuento); // Ruta protegida para generar un cuento
module.exports = router 