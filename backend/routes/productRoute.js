const express = require('express');
const router = express.Router();
const { addProduct, getProcuts, getProductById, updateProduct, checkProductEditPermission } = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/product', addProduct);
router.get('/product', getProcuts);
router.get('/product/:id', getProductById);
router.put('/product/:id', authMiddleware, updateProduct);
router.get('/product/:id/edit-permission', authMiddleware, checkProductEditPermission);

module.exports = router;
