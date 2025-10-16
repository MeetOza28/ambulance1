import mongoose from "mongoose";

const signalSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // unique signal ID (TS001, TS002...)
  name: { type: String, required: true },             // human-readable name (e.g., "VIP Road Junction")
  location: { type: String, required: true },         // optional full address or area
  coords: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  status: {
    type: String,
    enum: ["Active", "Offline", "Maintenance"],
    default: "Active"
  },
  timer: { type: Number, default: 30 },
  trafficFlow: {
    type: String,
    enum: ["Low", "Medium", "High"],
    default: "Low"
  },
  currentLights: {
    red: { type: Boolean, default: true },
    yellow: { type: Boolean, default: false },
    green: { type: Boolean, default: false }
  },
  emergencyOverride: { type: Boolean, default: false },
  lastUpdated: { type: Date, default: Date.now }
});

// 🧩 Auto-update `lastUpdated` whenever a signal is modified or saved
signalSchema.pre("save", function (next) {
  this.lastUpdated = Date.now();
  next();
});

export default mongoose.model("Signal", signalSchema);
