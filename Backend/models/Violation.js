import mongoose from "mongoose";

const violationSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },
  licensePlate: { type: String },
  signalId: { type: mongoose.Schema.Types.ObjectId, ref: "Signal" },
  timestamp: { type: Date, default: Date.now },
  fineAmount: { type: Number, default: 0 },
  status: { type: String, enum: ["pending", "sent", "paid", "rejected"], default: "pending" },
  metadata: { type: mongoose.Schema.Types.Mixed }
});

const Violation = mongoose.model("Violation", violationSchema);
export default Violation;
