const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth'); // Middleware auth que controla roles
const questionController = require('../controllers/question.controller');

// Crear pregunta (solo admin)
router.post('/', auth(['admin']), questionController.createQuestion);

// Obtener todas las preguntas (cualquiera autenticado)
router.get('/', auth(), questionController.getQuestions);

// Editar pregunta (solo admin)
router.put('/:id', auth(['admin']), questionController.editQuestion);

// Eliminar pregunta (solo admin)
router.delete('/:id', auth(['admin']), questionController.deleteQuestion);

// La nueva ruta usa ':test_id' para coincidir con el controlador
router.get('/:test_id', auth(), questionController.getQuestionsByTestId);

router.post('/createQuestions', auth(['admin']), questionController.createQuestions)

router.post('/bulk', auth(['admin']), questionController.createQuestions);

module.exports = router;
