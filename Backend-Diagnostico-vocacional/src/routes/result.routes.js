const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { getResultById ,generateResult, getResult } = require('../controllers/result.controller');
const  {getDashboardStats } = require('../controllers/dashboard.controller');
// Ruta protegida para que un usuario obtenga su resultado del test vocacional
router.post('/', auth(['user']), generateResult);

router.get('/', auth(['user']), getResult);


router.get('/:id', auth(), getResultById); // Ruta para que un admin obtenga el resultado de un usuario por ID 

module.exports = router; // Exportamos el router para usarlo en app.js
