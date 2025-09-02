const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateLogin, validateSignup, validateOTP } = require('../middlewares/validation');

router.post('/login', validateLogin, authController.login);
router.post('/signup', validateSignup, authController.signup);
router.post('/send-otp', authController.sendOTP);
router.post('/verify-otp', validateOTP, authController.verifyOTP);

module.exports = router;
