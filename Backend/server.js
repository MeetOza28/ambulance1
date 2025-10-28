import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import firebaseAdmin from "./config/firebase.js";
import { errorHandler, notFound } from "./middlewares/errorMiddleware.js";
import logger from "./utils/logger.js";

dotenv.config();

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

const app = express();

/* Middleware */
app.use(helmet());
app.use(cors());
// app.use(express.json({ limit: "10mb" }));
// app.use(express.urlencoded({ extended: true }));
// app.use(morgan("combined", { stream: logger.stream }));
app.use(express.json());
app.use(morgan("dev"));

// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 200,
// });
// app.use(limiter);

/* Static uploads (images) */
// app.use("/uploads", express.static(path.join(__dirname, process.env.UPLOAD_DIR || "uploads")));

/* Connect DB & Firebase */
connectDB();
/* firebaseAdmin is initialized by import side-effect */

/* Routes */
import authRoutes from "./routes/authRoutes.js";
// import ambulanceRoutes from "./routes/ambulanceRoutes.js";
import signalRoutes from "./routes/signalRoutes.js";
// import violationRoutes from "./routes/violationRoutes.js";
// import challanRoutes from "./routes/challanRoutes.js";

app.use("/api/auth", authRoutes);
// app.use("/api/ambulance", ambulanceRoutes);
app.use("/api/signal", signalRoutes);
// app.use("/api/violation", violationRoutes);
// app.use("/api/challan", challanRoutes);

// Test Route
app.get("/", (req, res) => res.send("API is running"));

/* Health */
// app.get("/health", (req, res) => res.json({ ok: true, ts: Date.now() }));

/* Not found + error handlers */
app.use(notFound);
app.use(errorHandler);

/* Start */
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
