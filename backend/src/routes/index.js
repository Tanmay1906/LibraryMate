const express = require('express');
const router = express.Router();

const { authenticate, authorize } = require('../middlewares/auth');

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
const uploadRoutes = require('./upload');
const notificationController = require('../controllers/notificationController');

// Public routes (no authentication required)
router.use('/auth', authRoutes);

// Protected routes (authentication required)
router.use('/admin', authenticate, authorize(['admin', 'owner']), adminRoutes);
router.use('/students', authenticate, studentRoutes);
router.use('/libraries', authenticate, libraryRoutes);
router.use('/books', authenticate, bookRoutes);
router.use('/payments', authenticate, paymentRoutes);
router.use('/borrow', authenticate, borrowRoutes);
router.use('/notifications', authenticate, notificationRoutes);
router.use('/reports', authenticate, authorize(['admin', 'owner']), reportRoutes);
router.use('/subscription-plans', authenticate, subscriptionRoutes);
router.use('/upload', uploadRoutes);

// Notification templates route (frontend expects /api/notification-templates)
router.get('/notification-templates', notificationController.getNotificationTemplates);

module.exports = router;
