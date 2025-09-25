const subscriptionPlans = {
  monthly: {
    id: 'monthly',
    name: 'Monthly Plan',
    price: 2499,
    duration: '1 month',
    features: [
      'Access to all digital books',
      'Mobile app access',
      'Email support',
      'Reading progress sync'
    ]
  },
  quarterly: {
    id: 'quarterly',
    name: 'Quarterly Plan',
    price: 6499,
    duration: '3 months',
    features: [
      'All monthly features',
      'Priority support',
      '10% discount',
      'Offline reading'
    ]
  },
  yearly: {
    id: 'yearly',
    name: 'Yearly Plan',
    price: 24999,
    duration: '1 year',
    features: [
      'All quarterly features',
      '2 months free',
      'Premium support',
      'Exclusive content'
    ]
  }
};

exports.getSubscriptionPlans = async (req, res) => {
  try {
    res.json(subscriptionPlans);
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    res.status(500).json({ error: 'Failed to fetch subscription plans.' });
  }
};

exports.getSubscriptionPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = subscriptionPlans[id];
    if (!plan) {
      return res.status(404).json({ error: 'Subscription plan not found.' });
    }
    res.json(plan);
  } catch (error) {
    console.error('Error fetching subscription plan:', error);
    res.status(500).json({ error: 'Failed to fetch subscription plan.' });
  }
};
