const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// PATCH /api/users/:id/fcm-token
router.patch('/:id/fcm-token', userController.updateFcmToken);

// PUT /api/users/:id - Update Profile (supports multipart/form-data for avatar)
router.put('/:id', userController.uploadAvatarMiddleware, userController.updateProfile);

// PATCH /api/users/:id/kyc
router.patch('/:id/kyc', userController.approveKyc);

module.exports = router;
