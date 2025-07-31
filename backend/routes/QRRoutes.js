const express = require('express');
const router = express.Router();
const { getCounts, addCounts, getQrIds } = require('../controllers/QRController');

router.get('/qr/count', getCounts);
router.post('/qr/count', addCounts);
router.get('/qr/qrids', getQrIds);


module.exports = router;