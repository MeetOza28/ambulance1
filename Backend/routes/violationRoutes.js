// import express from "express";
// import multer from "multer";
// import path from "path";
// import { fileURLToPath } from "url";
// import { protect } from "../middlewares/authMiddleware.js";
// import { createViolation, listViolations } from "../controllers/violationController.js";

// const router = express.Router();
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// const uploadDir = path.join(__dirname, "..", process.env.UPLOAD_DIR || "uploads");

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, uploadDir),
//   filename: (req, file, cb) => {
//     const ext = path.extname(file.originalname);
//     cb(null, Date.now() + "-" + Math.round(Math.random() * 1e9) + ext);
//   }
// });

// const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// router.post("/upload", protect, upload.single("image"), createViolation);
// router.get("/", protect, listViolations);

// export default router;
