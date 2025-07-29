const express = require('express');
const router = express.Router();
const { getCounts, addCounts } = require('../controllers/QRController');

router.get('/qr/count', getCounts);
router.post('/qr/count', addCounts);


module.exports = router;