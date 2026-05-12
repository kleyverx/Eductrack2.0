const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { getAnswers, saveAnswer } = require('../controllers/answer.controller');

// Ruta protegida para que un usuario guarde su test vocacional
router.post('/', auth(['user']), saveAnswer); 
// Ruta protegida para que un usuario obtenga sus respuestas
router.get('/', auth(['user']), getAnswers);

module.exports = router;
