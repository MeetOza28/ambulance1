import mongoose from "mongoose";

const ambulanceSchema = new mongoose.Schema({
  ambulanceId: {
    type: String,
    required: true,
    unique: true,
  },
  driverName: {
    type: String,
    required: true,
  },
  contactNumber: {
    type: String,
  },
  status: {
    type: String,
    enum: ["Available", "En Route", "Emergency", "Returning"],
    default: "Available",
  },

  caseId: {
  type: String,
  default: null,
  unique: true, // unique identifier for each emergency case/patient
},
patient: {
  type: String,
  default: null, // patient name can be repeated, uniqueness is enforced on caseId
},

  // destination: {
  //   type: String,
  //   default: null,
  // },
  location: {
    type: String,
    default: null, // “Ring Road, Varachha”
  },
  coordinates: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
  },
  // distance: {
  //   type: String,
  //   default: "-",
  // },
  // eta: {
  //   type: String,
  //   default: "-",
  // },
  speed: {
    type: Number,
    default: 0,
  },
  // fuel: {
  //   type: Number,
  //   default: 100,
  // },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Ambulance", ambulanceSchema);
