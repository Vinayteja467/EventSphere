import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Sponsor from '../models/Sponsor.js';

// Helper to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    console.log("REGISTER BODY:", { name, email, role, passwordProvided: !!password });

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email and password'
      });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      passwordHash,
      role: role || 'participant',
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`
    });

    // If role is sponsor, create an empty Sponsor profile
    if (user.role === 'sponsor') {
      await Sponsor.create({
        userId: user._id,
        companyName: `${name}'s Company`,
        industry: 'Technology',
        budgetRange: '$5,000 - $10,000',
        interests: ['Hackathon', 'Workshop'],
        verificationStatus: 'verified' // Auto-verify for easy demo
      });
    }

    if (user) {
      res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          xp: user.xp,
          badges: user.badges,
          token: generateToken(user._id)
        },
        message: 'User registered successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid user data'
      });
    }
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    console.log("LOGIN EMAIL:", email);

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user in MongoDB
    const user = await User.findOne({ email });

    console.log("FOUND USER:", user);

    // Check if user exists
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found'
      });
    }

    // Compare password with hashed password
    const hash = user.passwordHash || user.password;
    const isMatch = await bcrypt.compare(password, hash);

    console.log("PASSWORD MATCH:", isMatch);

    // Invalid password
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Login failed. Please check credentials.'
      });
    }

    const token = generateToken(user._id);

    // Dynamic, backward-compatible and user-specified response format!
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        xp: user.xp,
        badges: user.badges,
        token
      }
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    next(error);
  }
};

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user registered with this email'
      });
    }

    // In a production app, we would send a link. Here, we mock a successful token request.
    res.json({
      success: true,
      data: null,
      message: 'A password reset link has been dispatched to your email address.'
    });
  } catch (error) {
    next(error);
  }
};
