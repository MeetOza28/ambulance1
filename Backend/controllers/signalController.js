// import asyncHandler from "express-async-handler";
// import Signal from "../models/Signal.js";
// import admin from "../config/firebase.js";

// /* List */
// export const listSignals = asyncHandler(async (req, res) => {
//   const signals = await Signal.find({});
//   res.json(signals);
// });

// /* Get single */
// export const getSignal = asyncHandler(async (req, res) => {
//   const s = await Signal.findById(req.params.id);
//   if (!s) {
//     res.status(404);
//     throw new Error("Signal not found");
//   }
//   res.json(s);
// });

// /* Update status (and optionally propagate to Firebase RTDB / hardware) */
// export const updateSignalStatus = asyncHandler(async (req, res) => {
//   const { id } = req.params;
//   const { status } = req.body;
//   if (!status) {
//     res.status(400);
//     throw new Error("status required");
//   }
//   const signal = await Signal.findByIdAndUpdate(id, { status, lastUpdated: new Date() }, { new: true });
//   if (!signal) {
//     res.status(404);
//     throw new Error("Signal not found");
//   }

//   // Push to Firebase Realtime Database for the hardware (if initialized)
//   try {
//     if (admin?.database) {
//       const dbRef = admin.database().ref(`signals/${id}`);
//       await dbRef.set({
//         status: signal.status,
//         coords: signal.coords,
//         updatedAt: signal.lastUpdated.toISOString()
//       });
//     }
//   } catch (err) {
//     // log but don't fail
//     console.error("Firebase push error", err.message);
//   }

//   res.json(signal);
// });
