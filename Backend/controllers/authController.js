import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import crypto from 'crypto'; // if you use later


// Sign JWT token
const signToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
// @desc Register new user
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, department } = req.body;

  if (!name || !email || !password || !department) {
  return res.status(400).json({ message: "Missing required fields" });
}

// ✅ Strong password validation
  const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/;
  if (!strongPassword.test(password)) {
    return res.status(400).json({
      message: "Password must include uppercase, lowercase, number, and special character",
    });
  }


  const existingUser = await User.findOne({ email });
  if (existingUser) {
  return res.status(400).json({ message: "Email already registered" });
}

  try {
    const user = await User.create({ name, email, password, phone, department });

    res.status(201).json({
      token: signToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        department: user.department,
      },
    });
  } catch (err) {
    if (err.code === 11000) {
      res.status(400);
      throw new Error("Email already registered");
    } else {
      res.status(500);
      throw new Error("Server error");
    }
  }
});


// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Provide email and password" });
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(401).json({ message: "User not found" });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ message: "Wrong password" });
  }

  res.json({
    token: signToken(user),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department
    }
  });
});


// @desc    Get logged-in user profile
// @route   GET /api/auth/profile
// @access  Private
export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  res.json(user);
});

export const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        // Generate a token (expires in 15 min)
        const secret = user._id + process.env.JWT_SECRET;
        const token = jwt.sign({ userId: user._id }, secret, { expiresIn: '15m' });

        // Password reset link
        const link = `http://localhost:3000/reset-password/${user._id}/${token}`;

        // Send email
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Password Reset Request',
            html: `<p>Click <a href="${link}">here</a> to reset your password. Link expires in 15 minutes.</p>`,
        };

        await transporter.sendMail(mailOptions);

        res.json({ message: 'Password reset link sent to your email' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { id, token } = req.params;
  const { password } = req.body;

  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: "Invalid user" });

  // Password validation
  if (!password || password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters long" });
  }
  // Optional: add regex for special character, number, uppercase
  const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/;
  if (!strongPassword.test(password)) {
    return res.status(400).json({
      message: "Password must include uppercase, lowercase, number, and special character",
    });
  }

  // Verify token and reset password
  const secret = user._id + process.env.JWT_SECRET;
  try {
    jwt.verify(token, secret);
    user.password = password; // pre-save will hash automatically
    await user.save();
    res.json({ message: "Password reset successful" });
  } catch (err) {
    res.status(400).json({ message: "Invalid or expired token" });
  }
});