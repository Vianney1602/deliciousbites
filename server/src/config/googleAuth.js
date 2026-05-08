const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const prisma = require('../prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Configure Google OAuth
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Find or create user
      let user = await prisma.user.findUnique({
        where: { email: profile.emails[0].value }
      });

      if (!user) {
        // Create new user from Google profile
        user = await prisma.user.create({
          data: {
            email: profile.emails[0].value,
            name: profile.displayName,
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

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

// Serialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user
passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
