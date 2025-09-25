const express = require('express');
const router = express.Router();

const notificationController = require('../controllers/notificationController');

// Main routes that match frontend calls
router.get('/', notificationController.getNotifications);
router.post('/', notificationController.sendNotification);

// Legacy route for backward compatibility
router.get('/all', notificationController.getNotifications);

module.exports = router;
