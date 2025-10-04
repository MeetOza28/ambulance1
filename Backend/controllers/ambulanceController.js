// import asyncHandler from "express-async-handler";
// import Ambulance from "../models/Ambulance.js";
// import Signal from "../models/Signal.js";
// import haversine from "../utils/haversine.js";

// /* Create ambulance record */
// export const createAmbulance = asyncHandler(async (req, res) => {
//   const { vehicleId, driverName, phone } = req.body;
//   if (!vehicleId) {
//     res.status(400);
//     throw new Error("vehicleId is required");
//   }
//   const existing = await Ambulance.findOne({ vehicleId });
//   if (existing) {
//     res.status(400);
//     throw new Error("Ambulance already exists");
//   }
//   const amb = await Ambulance.create({ vehicleId, driverName, phone });
//   res.status(201).json(amb);
// });

// /* Update location (coming from device) */
// export const updateLocation = asyncHandler(async (req, res) => {
//   const { vehicleId, lat, lng, status } = req.body;
//   if (!vehicleId || lat == null || lng == null) {
//     res.status(400);
//     throw new Error("vehicleId, lat and lng required");
//   }
//   const amb = await Ambulance.findOneAndUpdate(
//     { vehicleId },
//     { location: { type: "Point", coordinates: [lng, lat] }, status: status || "on_route", lastSeen: new Date() },
//     { upsert: true, new: true }
//   );
//   // Optionally: push to Firebase RTDB for realtime clients
//   // TODO: integrate with firebase if needed

//   res.json({ ok: true, ambulance: amb });
// });

// /* Get ambulance */
// export const getAmbulance = asyncHandler(async (req, res) => {
//   const { vehicleId } = req.params;
//   const amb = await Ambulance.findOne({ vehicleId });
//   if (!amb) {
//     res.status(404);
//     throw new Error("Ambulance not found");
//   }
//   res.json(amb);
// });

// /* Find nearby signals and distances */
// export const getNearbySignals = asyncHandler(async (req, res) => {
//   const { vehicleId } = req.params;
//   const amb = await Ambulance.findOne({ vehicleId });
//   if (!amb) {
//     res.status(404);
//     throw new Error("Ambulance not found");
//   }
//   const [lng, lat] = amb.location.coordinates;
//   const signals = await Signal.find({});
//   const enriched = signals.map(s => {
//     const d = haversine(lat, lng, s.coords.lat, s.coords.lng);
//     return { signal: s, distanceMeters: Math.round(d * 1000) };
//   }).sort((a,b)=>a.distanceMeters - b.distanceMeters);
//   res.json(enriched);
// });
