import express from "express";
import {
  listSignals,
  getSignal,
  updateSignalStatus,
  syncSignals,
  updateTimer,
  resetSignalTimer,
  updateSchedule,
  generateReport,
  emergencyOverride,
  updateSignalByAmbulance,
    addSignal,
    deleteSignal,
    bulkUpdateSignals,
    bulkResetTimers,
    filterByStatus,
    filterByFlow,
    getTrafficStats
} from "../controllers/signalController.js";

const router = express.Router();

router.get("/", listSignals);
router.get('/stats', getTrafficStats);
router.post("/add", addSignal);
router.delete("/:id", deleteSignal);
router.get("/report", generateReport);
router.get("/:id", getSignal);
router.put("/:id/status", updateSignalStatus);
router.put("/:id/timer", updateTimer);
router.post("/bulk/update", bulkUpdateSignals);
router.post("/bulk/reset", bulkResetTimers);
router.get("/status/:status", filterByStatus); // Active / Offline / Maintenance
router.get("/flow/:level", filterByFlow);     // Low / Medium / High
router.post("/sync", syncSignals);
router.put("/schedule", updateSchedule);
router.post("/:id/reset", resetSignalTimer);
router.post("/:id/override", emergencyOverride);
router.post("/update/:ambulanceId", updateSignalByAmbulance);

export default router;
