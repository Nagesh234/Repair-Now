const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');

// POST /api/auth/register
router.post('/register', authController.register);

// POST /api/auth/login
router.post('/login', authController.login);

router.post('/check-unique', userController.checkUniqueness);
router.post('/send-otp', userController.sendOTP);
router.post('/verify-otp', userController.verifyOTP);

module.exports = router;
