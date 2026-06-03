const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth'); // Middleware auth que controla roles
const questionController = require('../controllers/question.controller');

// Crear pregunta (solo admin)
router.post('/', auth(['superadmin']), questionController.createQuestion);

// Obtener todas las preguntas (cualquiera autenticado)
router.get('/', auth(), questionController.getQuestions);

// Editar pregunta (solo admin)
router.put('/:id', auth(['superadmin']), questionController.editQuestion);

// Eliminar pregunta (solo admin)
router.delete('/:id', auth(['superadmin']), questionController.deleteQuestion);

// La nueva ruta usa ':test_id' para coincidir con el controlador
router.get('/:test_id', auth(), questionController.getQuestionsByTestId);

router.post('/createQuestions', auth(['superadmin']), questionController.createQuestions)

router.post('/bulk', auth(['superadmin']), questionController.createQuestions);

module.exports = router;
