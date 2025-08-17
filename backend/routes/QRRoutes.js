const express = require('express');
const router = express.Router();
const { getCounts, addCounts, getQrIds } = require('../controllers/QRController');
const {authMiddleware} = require('../middleware/authMiddleware');

router.get('/qr/count', authMiddleware, getCounts);
router.post('/qr/count', authMiddleware, addCounts);
router.get('/qr/qrids', authMiddleware, getQrIds);


module.exports = router;