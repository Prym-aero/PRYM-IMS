const express = require('express');
const router = express.Router();
const { getUser, loginController } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/user', authMiddleware, getUser)
router.post('/user/login', loginController);


module.exports = router;