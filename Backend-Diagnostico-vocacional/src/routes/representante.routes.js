const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const c = require('../controllers/representante.controller');

router.get('/mis-representados', auth(['representante']), c.misRepresentados);
router.get('/representado/:id', auth(['representante']), c.representadoDetalle);

module.exports = router;
