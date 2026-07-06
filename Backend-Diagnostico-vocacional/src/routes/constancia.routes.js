const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const c = require('../controllers/constancia.controller');

router.post('/', auth(['docente', 'superadmin']), c.emitir);
router.get('/verificar/:codigo', c.verificar); // público, sin auth

module.exports = router;
