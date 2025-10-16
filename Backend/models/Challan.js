import mongoose from "mongoose";

const challanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  violationId: { type: mongoose.Schema.Types.ObjectId, ref: "Violation" },
  amount: { type: Number, required: true },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  status: { type: String, enum: ["unpaid", "paid", "cancelled"], default: "unpaid" },
  issuedAt: { type: Date, default: Date.now },
  paidAt: { type: Date }
});

const Challan = mongoose.model("Challan", challanSchema);
export default Challan;
