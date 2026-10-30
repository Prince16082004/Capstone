const jwt = require("jsonwebtoken");
const User = require("../models/User");
const jwtSecret = require("../config/jwt");

const generateToken = (id) => {
  return jwt.sign({ id }, jwtSecret, {
    expiresIn: "30d",
  });
};

// @desc    Register new farmer user
// @route   POST /api/auth/register
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Please provide all required fields." });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: "User already exists with this email." });
    }

    const user = await User.create({ name, email, password });

    res.status(201).json({
      success: true,
      message: "Registration successful!",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error during registration." });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Please enter email and password." });
    }

    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      res.json({
        success: true,
        message: "Login successful!",
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          token: generateToken(user._id),
        },
      });
    } else {
      res.status(401).json({ success: false, message: "Invalid email or password." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error during login." });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
const getMe = async (req, res) => {
  res.json({
    success: true,
    data: req.user,
  });
};

module.exports = { registerUser, loginUser, getMe };
