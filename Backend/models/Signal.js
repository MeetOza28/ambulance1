import mongoose from "mongoose";

const signalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  coords: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  status: {
    north: { type: String, enum: ["red", "yellow", "green"], default: "red" },
    east: { type: String, enum: ["red", "yellow", "green"], default: "red" },
    south: { type: String, enum: ["red", "yellow", "green"], default: "red" },
    west: { type: String, enum: ["red", "yellow", "green"], default: "red" }
  },
  lastUpdated: { type: Date, default: Date.now }
});

const Signal = mongoose.model("Signal", signalSchema);
export default Signal;
