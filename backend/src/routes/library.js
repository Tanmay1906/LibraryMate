const express = require('express');
const router = express.Router();
const libraryController = require('../controllers/libraryController');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validation');
const Joi = require('joi');

// Validation schemas
const createLibrarySchema = Joi.object({
  name: Joi.string().required(),
  address: Joi.string().required(),
  phone: Joi.string().optional(),
  email: Joi.string().email().optional(),
  adminId: Joi.string().required(),
  description: Joi.string().optional(),
  establishedYear: Joi.number().integer().min(1800).max(new Date().getFullYear()).optional()
});

const updateLibrarySchema = Joi.object({
  name: Joi.string().optional(),
  address: Joi.string().optional(),
  phone: Joi.string().optional(),
  email: Joi.string().email().optional(),
  description: Joi.string().optional(),
  establishedYear: Joi.number().integer().min(1800).max(new Date().getFullYear()).optional()
}).min(1);

// Public route for viewing libraries (basic info)
router.get('/', libraryController.getLibraries);

// Protected routes require authentication
router.use(auth.authenticate);

// Get specific library (authenticated users only)
router.get('/:id', 
  auth.authorize(['STUDENT', 'LIBRARY_OWNER', 'ADMIN']), 
  libraryController.getLibrary
);

// Create library (only admin)
router.post('/', 
  auth.authorize(['ADMIN']), 
  validate(createLibrarySchema), 
  libraryController.createLibrary
);

// Update library (library owner or admin)
router.put('/:id', 
  auth.authorize(['LIBRARY_OWNER', 'ADMIN']), 
  validate(updateLibrarySchema), 
  libraryController.updateLibrary
);

// Delete library (only admin)
router.delete('/:id', 
  auth.authorize(['ADMIN']), 
  libraryController.deleteLibrary
);

// Legacy route for backward compatibility
router.get('/info', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'Library info endpoint working.',
    data: { timestamp: new Date().toISOString() }
  });
});

module.exports = router;
