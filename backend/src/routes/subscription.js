const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');

// Get all subscription plans
router.get('/', subscriptionController.getSubscriptionPlans);

// Get specific subscription plan
router.get('/:id', subscriptionController.getSubscriptionPlan);

module.exports = router;
