const express = require('express');
const router = express.Router();                     // Creamos un enrutador de Express
const { asistente } = require('../controllers/aiAsistent.controller'); 
const auth = require('../middlewares/auth');

// Importamos los controladores

router.post('/asistente', auth(['user']), asistente); // Ruta para generar un cuento
// router.post('/cuento', auth(['user']), cuento); // Ruta protegida para generar un cuento
module.exports = router 