// import asyncHandler from "express-async-handler";
// import Razorpay from "razorpay";
// import Challan from "../models/Challan.js";
// import Violation from "../models/Violation.js";
// import User from "../models/User.js";

// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET
// });

// /* Generate challan (create Razorpay order & Challan) */
// export const generateChallan = asyncHandler(async (req, res) => {
//   const { violationId, userId, amount } = req.body;
//   if (!violationId || !userId || !amount) {
//     res.status(400);
//     throw new Error("violationId, userId and amount required");
//   }

//   // create order in razorpay
//   const order = await razorpay.orders.create({
//     amount: Math.round(amount * 100), // paise
//     currency: "INR",
//     receipt: `challan_${violationId}`,
//     payment_capture: 1
//   });

//   const challan = await Challan.create({
//     userId,
//     violationId,
//     amount,
//     razorpayOrderId: order.id,
//     status: "unpaid"
//   });

//   // mark violation as sent
//   await Violation.findByIdAndUpdate(violationId, { status: "sent" });

//   res.status(201).json({ challan, order });
// });

// /* Pay challan (verify payment details) */
// export const payChallan = asyncHandler(async (req, res) => {
//   const { challanId, razorpayPaymentId, razorpayOrderId } = req.body;
//   if (!challanId || !razorpayPaymentId || !razorpayOrderId) {
//     res.status(400);
//     throw new Error("Missing payment info");
//   }

//   const challan = await Challan.findById(challanId);
//   if (!challan) {
//     res.status(404);
//     throw new Error("Challan not found");
//   }

//   if (challan.razorpayOrderId !== razorpayOrderId) {
//     res.status(400);
//     throw new Error("Order mismatch");
//   }

//   // Optionally: verify signature — implement webhook for production
//   challan.razorpayPaymentId = razorpayPaymentId;
//   challan.status = "paid";
//   challan.paidAt = new Date();
//   await challan.save();

//   await Violation.findByIdAndUpdate(challan.violationId, { status: "paid" });

//   res.json(challan);
// });

// /* List challans */
// export const listChallans = asyncHandler(async (req, res) => {
//   const q = {};
//   if (req.user.role !== "admin") {
//     q.userId = req.user.id;
//   }
//   const list = await Challan.find(q).populate("violationId").populate("userId").sort({ issuedAt: -1 });
//   res.json(list);
// });
