const express = require('express');
const router = express.Router();
const { getUser, loginController, registerController } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/user', authMiddleware, getUser)
router.post('/user/login', loginController);
router.post('/user/register', registerController);


module.exports = router;