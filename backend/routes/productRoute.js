const express = require('express');
const router = express.Router();
const { addProduct, getProcuts, getProductById, updateProduct, checkProductEditPermission } = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/product', authMiddleware, addProduct);
router.get('/product', authMiddleware, getProcuts);
router.get('/product/:id', getProductById);
router.put('/product/:id', authMiddleware, updateProduct);
router.get('/product/:id/edit-permission', authMiddleware, checkProductEditPermission);

module.exports = router;
