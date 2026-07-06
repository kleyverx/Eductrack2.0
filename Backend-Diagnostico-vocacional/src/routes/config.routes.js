const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const c = require('../controllers/config.controller');

router.get('/', auth(), c.obtener);
router.put('/', auth(['superadmin']), c.actualizar);

module.exports = router;
