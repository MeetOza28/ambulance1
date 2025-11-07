// import jwt from "jsonwebtoken";
// import asyncHandler from "express-async-handler";
// import User from "../models/User.js";

// export const tokenBlacklist = new Set();

// export const protect = asyncHandler(async (req, res, next) => {
//   let token = null;
//   const auth = req.headers.authorization;
//   if (auth && auth.startsWith("Bearer ")) {
//     token = auth.split(" ")[1];
//   }
//   if (!token) {
//     res.status(401);
//     throw new Error("Not authorized, token missing");
//   }
//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const user = await User.findById(decoded.id).select("-password");
//     if (!user) {
//       res.status(401);
//       throw new Error("Not authorized, user missing");
//     }
//     req.user = { id: user._id, role: user.role, email: user.email };
//     next();
//   } catch (err) {
//     res.status(401);
//     throw new Error("Not authorized, token invalid");
//   }
// });

// /* role guard */
// export const authorize = (...roles) => {
//   return (req, res, next) => {
//     if (!req.user || !roles.includes(req.user.role)) {
//       res.status(403);
//       throw new Error("Forbidden");
//     }
//     next();
//   };
// };

// middlewares/authMiddleware.js
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/User.js";

// In-memory token blacklist (Set of token strings).
// NOTE: This is process-memory only — it will be cleared on server restart.
// For production use a persistent store (Redis) with expiry.
export const tokenBlacklist = new Set();

export const protect = asyncHandler(async (req, res, next) => {
  let token = null;
  const auth = req.headers.authorization;
  if (auth && auth.startsWith("Bearer ")) {
    token = auth.split(" ")[1];
  }
  if (!token) {
    res.status(401);
    throw new Error("Not authorized, token missing");
  }

  // Reject if token is blacklisted (logged out)
  if (tokenBlacklist.has(token)) {
    res.status(401);
    throw new Error("Not authorized, token has been logged out");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      res.status(401);
      throw new Error("Not authorized, user missing");
    }
    req.user = { id: user._id, role: user.role, email: user.email };
    next();
  } catch (err) {
    res.status(401);
    throw new Error("Not authorized, token invalid");
  }
});

/* role guard */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403);
      throw new Error("Forbidden");
    }
    next();
  };
};
