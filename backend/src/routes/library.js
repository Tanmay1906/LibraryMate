const express = require('express');
const router = express.Router();
const libraryController = require('../controllers/libraryController');

// CRUD operations for libraries
router.get('/', libraryController.getLibraries);
router.get('/:id', libraryController.getLibrary);
router.post('/', libraryController.createLibrary);
router.put('/:id', libraryController.updateLibrary);

// Legacy route for backward compatibility
router.get('/info', (req, res) => {
  res.json({ message: 'Library info endpoint working.' });
});

module.exports = router;
