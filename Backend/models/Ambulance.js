import mongoose from "mongoose";

const locationSchema = new mongoose.Schema({
  type: { type: String, default: "Point" },
  coordinates: { type: [Number], index: "2dsphere" } // [lng, lat]
});

const ambulanceSchema = new mongoose.Schema({
  vehicleId: { type: String, required: true, unique: true },
  driverName: { type: String },
  phone: { type: String },
  location: { type: locationSchema, default: { type: "Point", coordinates: [0, 0] } },
  status: { type: String, enum: ["idle", "on_route", "available"], default: "available" },
  lastSeen: { type: Date, default: Date.now }
});

const Ambulance = mongoose.model("Ambulance", ambulanceSchema);
export default Ambulance;
