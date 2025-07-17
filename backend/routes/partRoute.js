require('dotenv').config();
const express = require('express');
const router = express.Router();
const { AddPart, getParts, addToInventory, dispatchPart, getPartById, getInventoryPartById } = require('../controllers/partController');


router.post('/part', AddPart);
router.get('/part', getParts);
router.post('/part/:partNumber/inventory', addToInventory);
router.get('/part/:id', getPartById);
router.post('/part/:partNumber/dispatch/:id', dispatchPart);

module.exports = router;
