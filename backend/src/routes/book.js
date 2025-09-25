const express = require('express');
const router = express.Router();

const bookController = require('../controllers/bookController');

// CRUD operations for books
router.get('/', bookController.getBooks);
router.get('/:id', bookController.getBook);
router.post('/', bookController.createBook);
router.put('/:id', bookController.updateBook);

// Keep legacy endpoint for backward compatibility
router.get('/list', bookController.getBooks);

module.exports = router;
