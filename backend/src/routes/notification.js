const express = require('express');
const router = express.Router();

const notificationController = require('../controllers/notificationController');
const auth = require('../middlewares/auth');

// All notification routes require authentication
router.use(auth.authenticate);

// Get notifications (students see their own, admins/owners see all)
router.get('/', 
  auth.authorize(['STUDENT', 'LIBRARY_OWNER', 'ADMIN']),
  notificationController.getNotifications
);

// Send notification (only admins and library owners)
router.post('/', 
  auth.authorize(['LIBRARY_OWNER', 'ADMIN']),
  notificationController.sendNotification
);

// Legacy route for backward compatibility
router.get('/all', 
  auth.authorize(['LIBRARY_OWNER', 'ADMIN']),
  notificationController.getNotifications
);

module.exports = router;
