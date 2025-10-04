import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const signToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
  });
};

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, department } = req.body; // ✅ include department
  if (!name || !email || !password || !department) {  // ✅ check department
    res.status(400);
    throw new Error("Missing required fields");
  }

  const existing = await User.findOne({ email });
  if (existing) {
    res.status(400);
    throw new Error("Email already registered");
  }

  const user = await User.create({ name, email, password, phone, department }); // ✅ include department
  res.status(201).json({
    token: signToken(user),
    user: { id: user._id, name: user.name, email: user.email, role: user.role, department: user.department },
  });
});


export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Provide email and password");
  }

  const user = await User.findOne({ email });

  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error("Invalid credentials");
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


// export const getProfile = asyncHandler(async (req, res) => {
//   const user = await User.findById(req.user.id).select("-password");
//   res.json(user);
// });
