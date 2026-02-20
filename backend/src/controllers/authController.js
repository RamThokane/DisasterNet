const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const User = require('../models/User');
const Room = require('../models/Room');
const config = require('../config/env');

/**
 * Generate JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
};

/**
 * Validation rules
 */
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

const loginValidation = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Check if username is taken
    const existingUser = await User.findOne({ username: username.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Username is already taken',
      });
    }

    // Create user
    const user = await User.create({ username: username.toLowerCase().trim(), password });

    // Ensure default room exists and add user to it
    let defaultRoom = await Room.findOne({ name: 'chat-room' });
    if (!defaultRoom) {
      defaultRoom = await Room.create({
        name: 'chat-room',
        description: 'Default emergency communication room',
        createdBy: user._id,
        participants: [user._id],
      });
    } else if (!defaultRoom.participants.includes(user._id)) {
      defaultRoom.participants.push(user._id);
      await defaultRoom.save();
    }

    user.isOnline = true;
    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        user: user.toJSON(),
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username: username.toLowerCase().trim() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password',
      });
    }

    // Ensure default room exists and add user
    let defaultRoom = await Room.findOne({ name: 'chat-room' });
    if (!defaultRoom) {
      defaultRoom = await Room.create({
        name: 'chat-room',
        description: 'Default emergency communication room',
        createdBy: user._id,
        participants: [user._id],
      });
    } else if (!defaultRoom.participants.some(p => p.toString() === user._id.toString())) {
      defaultRoom.participants.push(user._id);
      await defaultRoom.save();
    }

    user.isOnline = true;
    await user.save();

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      data: {
        user: user.toJSON(),
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
const logout = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { isOnline: false });
    res.status(200).json({
      success: true,
      data: { message: 'Logged out successfully' },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  logout,
  registerValidation,
  loginValidation,
};
