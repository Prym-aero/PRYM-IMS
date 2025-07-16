const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.post('/product', productController.addProduct);
router.get('/product', productController.getProcuts);


module.exports = router;
