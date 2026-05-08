const jwt = require('jsonwebtoken');

// Verifies JWT and attaches decoded payload to req.user
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log('=== verifyToken Middleware ===');
  console.log('Authorization header:', authHeader ? `${authHeader.substring(0, 30)}...` : 'NO HEADER');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ No valid Bearer token in header');
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token verified. Decoded:', decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('❌ Token verification failed:', err.message);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Allows only role === "admin"
const verifyAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Allows only role === "user"
const verifyUser = (req, res, next) => {
  console.log('=== verifyUser Middleware ===');
  console.log('req.user:', req.user);
  console.log('User role:', req.user?.role);
  
  if (!req.user) {
    console.log('❌ Not authenticated');
    return res.status(401).json({ message: 'Not authenticated' });
  }
  if (req.user.role !== 'user' && req.user.role !== 'admin') {
    console.log(`❌ User role "${req.user.role}" is neither "user" nor "admin"`);
    return res.status(403).json({ message: 'User access required' });
  }
  console.log('✅ User verified');
  next();
};

// Backwards-compatible exports
const authMiddleware = verifyToken;
const adminOnly = verifyAdmin;

module.exports = { verifyToken, verifyAdmin, verifyUser, authMiddleware, adminOnly };


