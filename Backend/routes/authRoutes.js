import express from "express";
import { register, login} from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
// router.get("/me", protect, getProfile);

export default router;
