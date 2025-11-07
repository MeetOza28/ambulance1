import mongoose from "mongoose";

const logSchema = new mongoose.Schema({
  ambulanceId: { type: String, required: true },
  coordinates: {
    lat: Number,
    lng: Number,
  },
  speed: Number,
  status: String,
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model("Log", logSchema);
