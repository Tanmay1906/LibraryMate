const express = require('express');
const router = express.Router();

const borrowController = require('../controllers/borrowController');
router.get('/status', borrowController.getBorrowStatus);

module.exports = router;
