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
const subscriptionRoutes = require('./subscription');
const notificationController = require('../controllers/notificationController');

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/students', studentRoutes);
router.use('/libraries', libraryRoutes);
router.use('/books', bookRoutes);
router.use('/payments', paymentRoutes);
router.use('/borrow', borrowRoutes);
router.use('/notifications', notificationRoutes);
router.use('/reports', reportRoutes);
router.use('/subscription-plans', subscriptionRoutes);

// Notification templates route (frontend expects /api/notification-templates)
router.get('/notification-templates', notificationController.getNotificationTemplates);

module.exports = router;
