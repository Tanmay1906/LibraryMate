const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

// CRUD operations for students
router.get('/', studentController.getStudents);
router.post('/', studentController.createStudent);
router.put('/:id', studentController.updateStudent);
router.delete('/:id', studentController.deleteStudent);

// Legacy student-specific routes
router.get('/profile', (req, res) => {
  res.json({ message: 'Student profile endpoint working.' });
});

router.get('/books', (req, res) => {
  res.json({ books: [] });
});

module.exports = router;
