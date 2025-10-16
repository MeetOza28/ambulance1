// controllers/ambulanceController.js
import Ambulance from "../models/Ambulance.js";

/*
  Note: this code assumes Ambulance schema has field `ambulanceId` (string),
  and `coordinates` object { lat, lng } as in previous schema.
*/

// Get all ambulances
export const getAllAmbulances = async (req, res) => {
  try {
    const ambulances = await Ambulance.find().sort({ lastUpdated: -1 });
    res.status(200).json(ambulances);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get single ambulance by :id (ambulanceId)
export const getAmbulanceById = async (req, res) => {
  try {
    const amb = await Ambulance.findOne({ ambulanceId: req.params.id });
    if (!amb) return res.status(404).json({ message: "Ambulance not found" });
    res.status(200).json(amb);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Add new ambulance
import Counter from "../models/Counter.js";

export const addAmbulance = async (req, res) => {
  try {
    const payload = req.body;

    // ✅ Auto-increment ambulanceId counter
    let counter = await Counter.findOneAndUpdate(
      { name: "ambulanceNumber" },
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );

    const newAmbNumber = counter.value;
    const formattedAmbId = `AMB${String(newAmbNumber).padStart(3, "0")}`; // e.g., AMB001

    // ✅ Create the new ambulance entry
    const newAmbulance = new Ambulance({
      ...payload,
      ambulanceId: formattedAmbId,
      status: "Available", // default status
    });

    await newAmbulance.save();

    res.status(201).json({
      message: "Ambulance added successfully",
      ambulance: newAmbulance,
    });
  } catch (err) {
    console.error("Error adding ambulance:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


// Update status & priority
export const updateStatus = async (req, res) => {
  try {
    const { status, priority } = req.body;
    const update = {};
    if (status) update.status = status;
    if (priority) update.priority = priority;
    update.lastUpdated = new Date();

    const amb = await Ambulance.findOneAndUpdate(
      { ambulanceId: req.params.id },
      { $set: update },
      { new: true }
    );
    if (!amb) return res.status(404).json({ message: "Ambulance not found" });
    res.status(200).json(amb);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Update location data (coordinates, location name, eta, distance, speed, fuel)
export const updateLocation = async (req, res) => {
  try {
    const { location, coordinates, eta, distance, speed, fuel } = req.body;
    const update = {
      lastUpdated: new Date()
    };
    if (location !== undefined) update.location = location;
    if (coordinates !== undefined) update.coordinates = coordinates; // { lat, lng }
    if (eta !== undefined) update.eta = eta;
    if (distance !== undefined) update.distance = distance;
    if (speed !== undefined) update.speed = speed;
    if (fuel !== undefined) update.fuel = fuel;

    const amb = await Ambulance.findOneAndUpdate(
      { ambulanceId: req.params.id },
      { $set: update },
      { new: true }
    );
    if (!amb) return res.status(404).json({ message: "Ambulance not found" });
    res.status(200).json(amb);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Update generic details (patient, destination, contactNumber, caseId, driverName)
import Counter from "../models/Counter.js";

export const updateDetails = async (req, res) => {
  try {
    const allowed = ["patient", "destination", "contactNumber", "driverName"];
    const payload = req.body;
    const update = { lastUpdated: new Date() };

    // If patient is being assigned
    if (payload.patient) {
      // Ensure the same patient isn’t assigned to another ambulance
      const existingPatient = await Ambulance.findOne({
        patient: payload.patient,
        ambulanceId: { $ne: req.params.id },
      });
      if (existingPatient) {
        return res.status(409).json({ message: "This patient is already assigned to another ambulance" });
      }

      // ✅ Auto-increment Case ID counter
      let counter = await Counter.findOneAndUpdate(
        { name: "caseNumber" },
        { $inc: { value: 1 } },
        { new: true, upsert: true }
      );

      const newCaseNumber = counter.value;

      // Assign patient and formatted case ID
      update.patient = payload.patient;
      update.caseId = `Case #${newCaseNumber}`;

      // Automatically mark ambulance as "Emergency"
      update.status = "Emergency";
    }

    // Update other allowed fields
    for (const key of allowed) {
      if (payload[key] !== undefined && key !== "patient") {
        update[key] = payload[key];
      }
    }

    const amb = await Ambulance.findOneAndUpdate(
      { ambulanceId: req.params.id },
      { $set: update },
      { new: true }
    );

    if (!amb) return res.status(404).json({ message: "Ambulance not found" });

    res.status(200).json(amb);
  } catch (err) {
    console.error("Error updating ambulance details:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};



// Delete ambulance
export const deleteAmbulance = async (req, res) => {
  try {
    const amb = await Ambulance.findOneAndDelete({ ambulanceId: req.params.id });
    if (!amb) return res.status(404).json({ message: "Ambulance not found" });
    res.status(200).json({ message: "Deleted", ambulance: amb });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Dashboard stats: emergency count, en-route count, available count, avg response (sample)
export const getStats = async (req, res) => {
  try {
    const all = await Ambulance.find();
    const emergency = all.filter(a => a.status === "Emergency").length;
    const enRoute = all.filter(a => a.status === "En Route").length;
    const available = all.filter(a => a.status === "Available").length;

    // Option: compute avg response from logs or ETA; here we return mocked value or compute if you have data
    const avgResponse = all.length ? Number((Math.random() * 10 + 5).toFixed(1)) : 0;

    res.status(200).json({ emergency, enRoute, available, avgResponse });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
