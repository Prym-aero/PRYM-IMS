require('dotenv').config();
const express = require('express');
const multer = require("multer");
const router = express.Router();
const { AddPart, getParts, addToInventory, dispatchPart, getPartById, getInventoryPartById, uploadDispatchPDF, UploadImage } = require('../controllers/partController');

const storage = multer.memoryStorage();
const upload = multer({ storage });


router.post('/part', AddPart);
router.get('/part', getParts);
router.post('/part/:partNumber/inventory', addToInventory);
router.get('/part/:id', getPartById);
router.post('/part/:partNumber/dispatch/:id', dispatchPart);
router.post("/disptach/upload-pdf", upload.single("pdf"), uploadDispatchPDF);
router.post('/part/upload', upload.single("image"), UploadImage);

module.exports = router;
