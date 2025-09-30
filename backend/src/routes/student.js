const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { validateStudent } = require('../middlewares/validation');
const { authorize, requirePermission, checkOwnership } = require('../middlewares/auth');

// CRUD operations for students (protected with permissions)
router.get('/', 
  requirePermission('read:students'), 
  studentController.getStudents
);

router.post('/', 
  requirePermission('write:students'), 
  validateStudent, 
  studentController.createStudent
);

router.put('/:id', 
  requirePermission('write:students'),
  checkOwnership('id'), 
  validateStudent, 
  studentController.updateStudent
);

router.delete('/:id', 
  requirePermission('delete:students'), 
  studentController.deleteStudent
);

// Student-specific routes (students can access their own data)
router.get('/profile', 
  authorize(['student', 'admin', 'owner']), 
  (req, res) => {
    res.json({ 
      success: true,
      message: 'Student profile endpoint working.',
      user: req.user 
    });
  }
);

router.get('/books', 
  authorize(['student', 'admin', 'owner']), 
  (req, res) => {
    // TODO: Implement actual book fetching logic
    res.json({ 
      success: true,
      books: [],
      message: 'Books endpoint working' 
    });
  }
);

module.exports = router;
