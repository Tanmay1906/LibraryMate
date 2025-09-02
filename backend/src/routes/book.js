const express = require('express');
const router = express.Router();

const bookController = require('../controllers/bookController');
router.get('/list', bookController.getBooks);

module.exports = router;
