import express from "express";
import { register, login, getProfile, forgotPassword, resetPassword} from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getProfile);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:id/:token", resetPassword);
export default router;
