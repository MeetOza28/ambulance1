// import asyncHandler from "express-async-handler";
// import Violation from "../models/Violation.js";
// import path from "path";
// import fs from "fs";

// /* Create violation with uploaded image */
// export const createViolation = asyncHandler(async (req, res) => {
//   if (!req.file) {
//     res.status(400);
//     throw new Error("Image file missing");
//   }
//   // store file path (serving static /uploads)
//   const fileUrl = `/uploads/${req.file.filename}`;

//   // Placeholder for license plate extraction - integrate OCR later
//   const licensePlate = req.body.licensePlate || null;
//   const signalId = req.body.signalId || null;

//   const v = await Violation.create({
//     imageUrl: fileUrl,
//     licensePlate,
//     signalId,
//     metadata: req.body.metadata ? JSON.parse(req.body.metadata) : {}
//   });

//   res.status(201).json(v);
// });

// /* List */
// export const listViolations = asyncHandler(async (req, res) => {
//   const q = req.query || {};
//   const violations = await Violation.find(q).sort({ timestamp: -1 }).limit(200);
//   res.json(violations);
// });
