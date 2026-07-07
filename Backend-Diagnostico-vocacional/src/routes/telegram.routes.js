const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const c = require('../controllers/telegram.controller');

router.get('/mi-codigo', auth(['representante']), c.miCodigo);
router.post('/desvincular', auth(['representante']), c.desvincular);

module.exports = router;
