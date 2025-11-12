import asyncHandler from "express-async-handler";
import Signal from "../models/Signal.js";
import Ambulance from "../models/Ambulance.js";
import admin from "../config/firebase.js";

/* ---------------- Haversine for distance ---------------- */
const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) ** 2 +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/* ---------------- CRUD OPERATIONS ---------------- */
export const listSignals = asyncHandler(async (req, res) => {
  const signals = await Signal.find({});
  res.json(signals);
});

/* ---------------- GET SIGNAL ---------------- */
export const getSignal = asyncHandler(async (req, res) => {
  const signal = await Signal.findOne({ id: req.params.id });
  if (!signal) return res.status(404).json({ message: "Signal not found" });
  res.json(signal);
});

// controllers/signalController.js
// make sure at top of file you have:
// import Signal from "../models/Signal.js";

export const getTrafficStats = async (req, res) => {
  try {
    // Guard: ensure Signal model is present
    if (!Signal || typeof Signal.find !== "function") {
      console.warn("Signal model missing or invalid");
      return res.status(200).json({ totalSignals: 0, online: 0, offline: 0, maintenance: 0 });
    }

    // Fetch all signals (lean for better perf)
    const all = await Signal.find().lean().catch((err) => {
      console.error("Signal.find() failed:", err);
      return [];
    });

    const totalSignals = Array.isArray(all) ? all.length : 0;
    // Normalize status strings (defensive)
    const normalize = (s) => (String(s || "").trim().toLowerCase());
    const online = Array.isArray(all) ? all.filter((s) => normalize(s.status) === "active" || normalize(s.status) === "online").length : 0;
    const offline = Array.isArray(all) ? all.filter((s) => normalize(s.status) === "offline").length : 0;
    const maintenance = Array.isArray(all) ? all.filter((s) => normalize(s.status) === "maintenance").length : 0;

    // Return a clean JSON shape the frontend expects
    return res.status(200).json({ totalSignals, online, offline, maintenance });
  } catch (err) {
    console.error("getTrafficStats error:", err);
    // return safe defaults so frontend doesn't break
    return res.status(200).json({ totalSignals: 0, online: 0, offline: 0, maintenance: 0 });
  }
};


/* ---------------- UPDATE SIGNAL STATUS ---------------- */
export const updateSignalStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const signal = await Signal.findOneAndUpdate({ id: req.params.id }, { status }, { new: true });
  if (!signal) return res.status(404).json({ message: "Signal not found" });
  res.json({ message: "Signal status updated", signal });
});

/* ---------------- SYNC ALL (MongoDB only) ---------------- */
export const syncSignals = asyncHandler(async (req, res) => {
  const signals = await Signal.find({});
  res.json({ message: "All signals fetched", signals });
});

/* ---------------- RESET TIMER ---------------- */
export const resetSignalTimer = asyncHandler(async (req, res) => {
  const signal = await Signal.findOneAndUpdate({ id: req.params.id }, { timer: 30 }, { new: true });
  if (!signal) return res.status(404).json({ message: "Signal not found" });
  res.json({ message: "Timer reset to default", signal });
});


export const updateTimer = asyncHandler(async (req, res) => {
  const { timer, currentLights, emergencyOverride } = req.body;

  const signal = await Signal.findOneAndUpdate(
    { id: req.params.id },
    {
      timer,
      currentLights,
      emergencyOverride,
      lastUpdated: new Date()
    },
    { new: true }
  );

  if (!signal) return res.status(404).json({ message: "Signal not found" });

  res.json({ message: "Signal updated", signal });
});


/* ---------------- UPDATE SCHEDULE ---------------- */
export const updateSchedule = asyncHandler(async (req, res) => {
  const { redTime, yellowTime, greenTime } = req.body;
  // store globally or per signal (simplified example)
  res.json({ message: "Schedule updated", redTime, yellowTime, greenTime });
});

/* ---------------- GENERATE REPORT ---------------- */
export const generateReport = asyncHandler(async (req, res) => {
  const signals = await Signal.find({});

  const total = signals.length;
  const stats = {
    total,
    active: signals.filter(s => s.status === "Active").length,
    offline: signals.filter(s => s.status === "Offline").length,
    maintenance: signals.filter(s => s.status === "Maintenance").length,
    avgTimer: total > 0 ? signals.reduce((acc, s) => acc + s.timer, 0) / total : 0
  };

  res.json({ message: "Report generated", stats });
});


/* ---------------- EMERGENCY OVERRIDE ---------------- */
export const emergencyOverride = asyncHandler(async (req, res) => {
  try {
    // Fetch ambulance location from Firebase
    const ambulanceRef = admin.database().ref("GPS/Location");
    const ambulanceSnap = await ambulanceRef.once("value");
    const ambulance = ambulanceSnap.val();

    if (!ambulance) return res.status(404).json({ message: "Ambulance location not found" });

    // Get all traffic signals from MongoDB
    const signals = await Signal.find({});
    const updatedSignals = [];

    for (const s of signals) {
      const distance = haversine(ambulance.lat, ambulance.lng, s.coords.lat, s.coords.lng);

      if (distance <= 1000) {
        s.currentLights = { red: false, yellow: false, green: true };
        s.emergencyOverride = true;
        s.status = "Active";
      } else {
        s.currentLights = { red: true, yellow: false, green: false };
        s.emergencyOverride = false;
      }

      s.lastUpdated = new Date();
      await s.save(); // store in MongoDB
      updatedSignals.push({
        id: s.id,
        distance: distance.toFixed(2),
        currentLights: s.currentLights,
        emergencyOverride: s.emergencyOverride,
      });
    }

    res.status(200).json({ message: "Emergency override activated", signals: updatedSignals });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ---------------- UPDATE SIGNALS BASED ON AMBULANCE ---------------- */
export const updateSignalByAmbulance = asyncHandler(async (req, res) => {
  try {
    // Fetch ambulance location from Firebase
    const ambulanceRef = admin.database().ref("GPS/Location");
    const ambulanceSnap = await ambulanceRef.once("value");
    const ambulance = ambulanceSnap.val();

    if (!ambulance || !ambulance.lat || !ambulance.lng) {
      return res.status(404).json({ message: "Ambulance location not found or invalid" });
    }

    // Convert string coordinates to numbers
    const ambulanceLat = parseFloat(ambulance.lat);
    const ambulanceLng = parseFloat(ambulance.lng);

    console.log("🚑 Ambulance Current Location:", { ambulanceLat, ambulanceLng });

    const signals = await Signal.find({});
    const updatedSignals = [];

    for (const signal of signals) {
      const distance = haversine(
        ambulanceLat,
        ambulanceLng,
        signal.coords.lat,
        signal.coords.lng
      );

      if (distance <= 1000) {
            signal.currentLights = { red: false, yellow: false, green: true };
            signal.emergencyOverride = true;
            signal.status = "Active";
            } else {
            signal.currentLights = { red: true, yellow: false, green: false };
            signal.emergencyOverride = false;
            signal.status = "Offline"; // ✅ valid enum value
            }


      signal.lastUpdated = new Date();
      await signal.save();

      updatedSignals.push({
        id: signal.id,
        distance: distance.toFixed(2),
        currentLights: signal.currentLights,
        emergencyOverride: signal.emergencyOverride,
      });
    }

    res.status(200).json({
      message: "Emergency override activated based on ambulance proximity",
      ambulanceLocation: { lat: ambulanceLat, lng: ambulanceLng },
      signals: updatedSignals,
    });
  } catch (error) {
    console.error("❌ Error updating signals:", error);
    res.status(500).json({ message: error.message });
  }
});



/* ---------------- ADD SIGNAL ---------------- */
export const addSignal = asyncHandler(async (req, res) => {
  const { id, name, location, coords, status, timer, trafficFlow } = req.body;

  const existing = await Signal.findOne({ id });
  if (existing) return res.status(400).json({ message: "Signal ID already exists" });

  const newSignal = new Signal({ id, name, location, coords, status, timer, trafficFlow });
  await newSignal.save();

  res.status(201).json({ message: "Signal added successfully", signal: newSignal });
});


/* ---------------- DELETE SIGNAL ---------------- */
export const deleteSignal = asyncHandler(async (req, res) => {
  const signal = await Signal.findOne({ id: req.params.id });
  if (!signal) return res.status(404).json({ message: "Signal not found" });

  await Signal.deleteOne({ id: req.params.id });
  res.json({ message: "Signal deleted successfully" });
});


/* ---------------- BULK UPDATE SIGNALS ---------------- */
export const bulkUpdateSignals = asyncHandler(async (req, res) => {
  const updates = req.body.updates; // ✅ match your request body

  if (!Array.isArray(updates) || updates.length === 0) {
    throw new Error("No signal updates provided");
  }

  const results = [];

  for (const u of updates) {
    // Update the signal by id with the fields provided in the object (excluding id)
    const { id, ...fieldsToUpdate } = u;
    const updated = await Signal.findOneAndUpdate({ id }, fieldsToUpdate, { new: true });
    if (updated) results.push(updated);
  }

  res.json({ message: "Bulk update complete", updatedSignals: results });
});


/* ---------------- BULK RESET TIMERS ---------------- */
export const bulkResetTimers = asyncHandler(async (req, res) => {
  const result = await Signal.updateMany({}, { timer: 30 });
  res.json({ message: "All signal timers reset to 30s", modifiedCount: result.modifiedCount });
});

/* ---------------- FILTER BY STATUS ---------------- */
export const filterByStatus = asyncHandler(async (req, res) => {
  const { status } = req.params;
  const valid = ["Active", "Offline", "Maintenance"];
  if (!valid.includes(status)) return res.status(400).json({ message: "Invalid status value" });

  const signals = await Signal.find({ status });
  res.json({ count: signals.length, signals });
});

/* ---------------- FILTER BY TRAFFIC FLOW ---------------- */
export const filterByFlow = asyncHandler(async (req, res) => {
  const { level } = req.params;
  const valid = ["Low", "Medium", "High"];
  if (!valid.includes(level)) return res.status(400).json({ message: "Invalid flow level" });

  const signals = await Signal.find({ trafficFlow: level });
  res.json({ count: signals.length, signals });
});
