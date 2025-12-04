const bcrypt = require('bcrypt');
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRE = process.env.JWT_EXPIRES_IN;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);


async function signUpUser(req, res) {
  try {
    const { first_name, last_name, email, password } = req.body;
    if (!first_name || !last_name || !email || !password)
      return res.status(400).json({ error: 'All fields required' });

    const existing = await User.findByEmailWithPassword(email);
    if (existing) return res.status(400).json({ error: 'Email already in use' });

    const hashed = await bcrypt.hash(password, 10);
    const userId = await User.create(first_name, last_name, email, hashed);
    return res.status(201).json({ userId, message: 'User created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during sign up' });
  }
}

async function loginUser(req, res) {
  try {
    const { email, password } = req.body;
    const user = await User.findByEmailWithPassword(email);

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    // 💡 إنشاء JWT Token باستخدام user_id
    const token = jwt.sign(
        { id: user.user_id }, 
        JWT_SECRET, 
        { expiresIn: JWT_EXPIRE }
    );
    
    // إرسال الـ Token مع بيانات المستخدم
    res.status(200).json({ 
        token, 
        user: {
            id: user.user_id,
            email: user.email,
            first_name: user.first_name
        }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during login' });
  }
}

// Google OAuth Login
async function googleLogin(req, res) {
  try {
    const { credential } = req.body;
    
    if (!credential) {
      return res.status(400).json({ error: 'Google credential is required' });
    }

    // Verify the Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, given_name, family_name, picture } = payload;

    // Check if user exists by Google ID
    let user = await User.findByGoogleId(googleId);
    let needsPasswordSetup = false;

    if (!user) {
      // Check if user exists by email
      user = await User.findByEmailWithPassword(email);
      
      if (user) {
        // Link Google account to existing user
        await User.linkGoogleAccount(user.user_id, googleId);
      } else {
        // Create new user with Google account (no password yet)
        const userId = await User.createGoogleUser(
          given_name || 'User',
          family_name || '',
          email,
          googleId
        );
        user = await User.findById(userId);
        needsPasswordSetup = true; // New Google user needs to set password
      }
    } else {
      // Check if existing Google user has a password set
      const fullUser = await User.findByEmailWithPassword(email);
      if (fullUser && !fullUser.password) {
        needsPasswordSetup = true;
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.user_id },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE }
    );

    res.status(200).json({
      token,
      needsPasswordSetup,
      user: {
        id: user.user_id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name
      }
    });

  } catch (err) {
    console.error('Google login error:', err);
    res.status(401).json({ error: 'Invalid Google token' });
  }
}

module.exports = { signUpUser, loginUser, googleLogin };