require('dotenv').config();
const express = require('express');
const multer = require("multer");
const router = express.Router();
const { AddPart, getParts, addToInventory, dispatchPart, getPartById, getInventoryPartById, uploadDispatchPDF, UploadImage, getScannedQRIds, checkQRIdExists, updatePart, bulkRemoveQRIds, checkPartEditPermission, getValidatedParts } = require('../controllers/partController');
const {authMiddleware} = require('../middleware/authMiddleware');

const storage = multer.memoryStorage();
const upload = multer({ storage });


router.post('/part', authMiddleware, AddPart);
router.get('/part', getParts);
router.post('/part/:partNumber/inventory', authMiddleware, addToInventory);
router.get('/part/:id', authMiddleware, getPartById);
router.put('/part/:id', authMiddleware, updatePart);
router.get('/part/:id/edit-permission', authMiddleware, checkPartEditPermission);
router.post('/part/:partNumber/dispatch/:id', authMiddleware, dispatchPart);
router.post("/disptach/upload-pdf", upload.single("pdf"), uploadDispatchPDF);
router.post('/part/upload', authMiddleware, upload.single("image"), UploadImage);
router.get('/qr/scanned-ids', authMiddleware, getScannedQRIds);
router.get('/qr/check/:qrId', authMiddleware, checkQRIdExists);
router.post('/qr/bulk-remove', authMiddleware, bulkRemoveQRIds);

// New workflow routes
router.get('/parts/validated', authMiddleware, getValidatedParts);

module.exports = router;
