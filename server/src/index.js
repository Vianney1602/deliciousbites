const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Load env vars BEFORE any module that reads process.env
dotenv.config();

const http = require('http');
const path = require('path');
const passport = require('passport');
const session = require('express-session');
const ensureDefaultAdmin = require('./seed/ensureDefaultAdmin');
const seedMenu = require('./seed/menuSeed');
const { attachWebSocketServer } = require('./ws/broadcast');

// Initialize Google Auth config (after dotenv so env vars are available)
require('./config/googleAuth');

const app = express();
const server = http.createServer(app);

// Attach WebSocket server to the same HTTP server
attachWebSocketServer(server);

app.use(cors({
  origin: function(origin, callback) {
    // Allowed origins
    const allowedOrigins = [
      'https://delicious-bites-tau.vercel.app',
      'https://delicious-bites-git-main-vianney-infant-rajs-projects.vercel.app',
      'http://localhost:5173',
      'http://localhost:3000'
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Configure morgan logging based on environment
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat));

// Configure session middleware (required for Passport)
app.use(session({
  secret: process.env.JWT_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // HTTPS in production
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Disable ETag to prevent 304 Not Modified responses
app.disable('etag');

// Serve uploaded images as static files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Run startup seed tasks (Prisma uses DATABASE_URL)
ensureDefaultAdmin().catch((err) => {
  console.error('Error ensuring default admin:', err);
});

seedMenu().catch((err) => {
  console.error('Error seeding menu:', err);
});

app.get('/', (req, res) => {
  res.json({ message: 'Delicious Bites API is running' });
});

// Health check endpoint
app.get('/api', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'Delicious Bites Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/admin/orders', require('./routes/adminOrders'));
app.use('/api/admin/dashboard', require('./routes/adminDashboard'));

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

