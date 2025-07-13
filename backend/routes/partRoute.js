require('dotenv').config();
const express = require('express');
const router = express.Router();
const { AddPart, getParts } = require('../controllers/partController');


router.post('/part', AddPart);
router.get('/part', getParts);

module.exports = router;
