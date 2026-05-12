const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
    res.status(200).json({ message: 'Sync endpoint ready' });
});

module.exports = router;
