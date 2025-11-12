// import express from "express";
// import { protect } from "../middlewares/authMiddleware.js";
// import { generateChallan, payChallan, listChallans } from "../controllers/challanController.js";

// const router = express.Router();

// router.post("/generate", protect, generateChallan);
// router.post("/pay", protect, payChallan); // payment verification webhook-ish
// router.get("/", protect, listChallans);

// export default router;


// routes/challanRoutes.js
import express from 'express';
import { getChallanStats, /* other controllers */ } from '../controllers/challanController.js';
const router = express.Router();

router.get('/stats', getChallanStats);

// other routes (generate/pay/list)...
export default router;
