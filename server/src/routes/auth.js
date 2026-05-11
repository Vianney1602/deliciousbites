const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');
const passport = require('passport');
const { OAuth2Client } = require('google-auth-library');

const router = express.Router();

// Initialize Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const createToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    
    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    // Check if user already exists by email
    const existingUser = await prisma.user.findUnique({ 
      where: { email: email.toLowerCase().trim() } 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User already exists',
        suggestion: 'This email is already registered. Please login.' 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create new user
    const user = await prisma.user.create({
      data: { 
        name: name.trim(), 
        email: email.toLowerCase().trim(), 
        password: passwordHash, 
        role: 'user' 
      }
    });
    
    // Generate JWT token
    const token = createToken(user);

    res.status(201).json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error('Registration error:', err);
    
    // Handle Prisma unique constraint errors
    if (err.code === 'P2002') {
      return res.status(400).json({ 
        message: 'User already exists',
        suggestion: 'This email is already registered. Please login.' 
      });
    }
    
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password, admin } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (admin && user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin account not found for this email' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = createToken(user);
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── Google OAuth Routes ─────────────────────────────────
// Redirect to Google login
router.get('/google', 
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google callback
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL}/login` }),
  async (req, res) => {
    try {
      if (!req.user) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
      }

      // Create JWT token for the user
      const token = createToken(req.user);

      // Redirect to frontend OAuth callback handler with token and user info
      res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}&email=${encodeURIComponent(req.user.email)}&name=${encodeURIComponent(req.user.name)}`);
    } catch (err) {
      console.error('Google callback error:', err);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
    }
  }
);

// Get current authenticated user
router.get('/me', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  res.json({
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role
  });
});

// Get Google Client ID for frontend
router.get('/google-client-id', (req, res) => {
  res.json({
    clientId: process.env.GOOGLE_CLIENT_ID
  });
});

// Verify Google Sign-In Token (Frontend Google Sign-In)
router.post('/verify-google-token', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    // Verify the token using Google's official library
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();

    // Extract user info from token
    const { email, name, picture } = payload;

    if (!email) {
      return res.status(401).json({ message: 'Email not found in token' });
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Create new user from Google profile
      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          password: await bcrypt.hash(Math.random().toString(), 10), // Random password for OAuth users
          role: 'user',
          isActive: true,
          phone: null
        }
      });

      // Create customer profile
      await prisma.customerProfile.create({
        data: {
          userId: user.id,
          isVerified: true
        }
      });
    }

    // Create JWT token
    const jwtToken = createToken(user);

    res.json({ 
      token: jwtToken, 
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Google token verification error:', error.message);
    console.error('Error stack:', error.stack);
    res.status(401).json({ message: 'Token verification failed: ' + error.message });
  }
});

module.exports = router;


