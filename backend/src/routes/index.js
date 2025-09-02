const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const adminRoutes = require('./admin');
const studentRoutes = require('./student');
const libraryRoutes = require('./library');
const bookRoutes = require('./book');
const paymentRoutes = require('./payment');
const borrowRoutes = require('./borrow');
const notificationRoutes = require('./notification');
const reportRoutes = require('./report');

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/student', studentRoutes);
router.use('/libraries', libraryRoutes);
router.use('/books', bookRoutes);
router.use('/payments', paymentRoutes);
router.use('/borrow', borrowRoutes);
router.use('/notifications', notificationRoutes);
router.use('/reports', reportRoutes);

module.exports = router;
