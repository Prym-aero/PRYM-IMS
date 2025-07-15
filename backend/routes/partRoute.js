require('dotenv').config();
const express = require('express');
const router = express.Router();
const { AddPart, getParts, addToInventory } = require('../controllers/partController');


router.post('/part', AddPart);
router.get('/part', getParts);
router.post('/part/:partNumber/inventory', addToInventory);

module.exports = router;
