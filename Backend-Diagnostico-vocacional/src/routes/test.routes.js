const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { createTest, getAllTests, getTestById, updateTest, deleteTest, getActiveTest } = require('../controllers/test.controller');

// Ruta para crear un nuevo test
router.post('/',auth(['admin']), createTest);
// Ruta para obtener todos los tests
router.get('/', auth(['admin']), getAllTests);
// Ruta para obtener el test activo
router.get('/active', auth(), getActiveTest);
// Ruta para obtener un test por ID
router.get('/:id', auth(['admin']), getTestById);
// Ruta para actualizar un test
router.put('/:id', auth(['admin']), updateTest);
// Ruta para eliminar un test
router.delete('/:id', auth(['admin']), deleteTest);   

module.exports = router; // Exportamos el router para usarlo en app.js
