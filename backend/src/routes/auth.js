const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateLogin, validateSignup, validateOTP } = require('../middlewares/validation');
const { authenticate } = require('../middlewares/auth');

router.post('/login', validateLogin, authController.login);
router.post('/signup', validateSignup, authController.signup);
router.post('/send-otp', authController.sendOTP);
router.post('/verify-otp', validateOTP, authController.verifyOTP);
router.post('/complete-signup', validateSignup, authController.completeSignup);
router.get('/verify', authenticate, authController.verify);
router.post('/logout', (req, res) => {
  // For JWT, logout is handled client-side by removing token
  res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;
