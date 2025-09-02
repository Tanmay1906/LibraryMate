const express = require('express');
const router = express.Router();

const paymentController = require('../controllers/paymentController');
router.get('/history', paymentController.getPaymentHistory);

module.exports = router;
