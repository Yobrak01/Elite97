const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');

const registerSchema = {
  name: { type: 'string', required: true, min: 2, max: 50 },
  email: { type: 'string', required: true, min: 5, max: 100 },
  password: { type: 'string', required: true, min: 6, max: 128 },
  country: { type: 'string', required: false, max: 60 },
  university: { type: 'string', required: false, max: 100 },
  major: { type: 'string', required: false, max: 100 }
};

const loginSchema = {
  email: { type: 'string', required: true },
  password: { type: 'string', required: true }
};

router.post('/register', validate(registerSchema), authController.register);
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-otp', authController.resendOtp);
router.post('/login', validate(loginSchema), authController.login);
router.get('/me', authMiddleware, authController.getMe);
router.put('/settings', authMiddleware, authController.updateSettings);

module.exports = router;
