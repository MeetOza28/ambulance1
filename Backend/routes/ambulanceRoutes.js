// routes/ambulanceRoutes.js
import express from "express";
import {
  getAllAmbulances,
  getAmbulanceById,
  addAmbulance,
  updateStatus,
  updateLocation,
  updateDetails,
  deleteAmbulance,
  getStats
} from "../controllers/ambulanceController.js";

const router = express.Router();

// GET    /api/ambulances         -> list all ambulances
router.get("/", getAllAmbulances);

// GET    /api/ambulances/stats   -> dashboard summary stats
router.get("/stats", getStats);

// GET    /api/ambulances/:id     -> get single ambulance by ambulanceId
router.get("/:id", getAmbulanceById);

// POST   /api/ambulances         -> create a new ambulance
router.post("/", addAmbulance);

// PUT    /api/ambulances/:id/status   -> update status/priority (body: { status, priority })
router.put("/:id/status", updateStatus);

// PUT    /api/ambulances/:id/location -> update live location, coordinates, eta, distance, speed, fuel
router.put("/:id/location", updateLocation);

// PUT    /api/ambulances/:id/details  -> update patient, destination, contactNumber, caseId etc.
router.put("/:id/details", updateDetails);

// DELETE /api/ambulances/:id     -> delete ambulance by ambulanceId
router.delete("/:id", deleteAmbulance);

export default router;
