const jwt = require('jsonwebtoken');

// Define permissions for each role
const permissions = {
  owner: [
    'read:students', 'write:students', 'delete:students',
    'read:library', 'write:library', 'delete:library',
    'read:books', 'write:books', 'delete:books',
    'read:payments', 'write:payments',
    'read:reports', 'write:reports',
    'read:notifications', 'write:notifications'
  ],
  admin: [
    'read:students', 'write:students',
    'read:library', 'write:library',
    'read:books', 'write:books',
    'read:payments', 'write:payments',
    'read:reports', 'read:notifications', 'write:notifications'
  ],
  student: [
    'read:books', 'read:profile', 'write:profile',
    'read:payments:own', 'write:payments:own',
    'read:borrowings:own', 'write:borrowings:own'
  ]
};

exports.authenticate = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      error: 'Access denied', 
      message: 'No token provided' 
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ 
      error: 'Invalid token', 
      message: 'Token verification failed' 
    });
  }
};

exports.authorize = (roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ 
      error: 'Forbidden', 
      message: `Access denied. Required roles: ${roles.join(', ')}` 
    });
  }
  
  next();
};

exports.requirePermission = (permission) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const userPermissions = permissions[req.user.role] || [];
  
  if (!userPermissions.includes(permission)) {
    return res.status(403).json({ 
      error: 'Insufficient permissions', 
      message: `Required permission: ${permission}` 
    });
  }
  
  next();
};

// Check if user owns the resource (for student-specific resources)
exports.checkOwnership = (resourceField = 'studentId') => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Owners and admins can access all resources
  if (['owner', 'admin'].includes(req.user.role)) {
    return next();
  }
  
  // Students can only access their own resources
  const resourceId = req.params[resourceField] || req.body[resourceField];
  if (req.user.role === 'student' && req.user.id !== resourceId) {
    return res.status(403).json({ 
      error: 'Access denied', 
      message: 'You can only access your own resources' 
    });
  }
  
  next();
};
