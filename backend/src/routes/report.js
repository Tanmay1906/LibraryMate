const express = require('express');
const router = express.Router();

const reportController = require('../controllers/reportController');

// Report endpoints
router.get('/summary', reportController.getReportSummary);
router.get('/students', reportController.getStudentReport);
router.get('/payments', reportController.getPaymentReport);

module.exports = router;
