const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema({
  name: { type: String },
  coords: { 
    lat: { type: Number },
    lng: { type: Number }
  }
}, { _id: false });

const ViolationSchema = new mongoose.Schema({
  violationId: { type: String, required: true, unique: true }, // e.g. HV001
  vehicleNumber: { type: String, required: true },
  // vehicleType: { type: String, enum: ['Motorcycle','Scooter','Car','Truck','Other'], default: 'Motorcycle' },
  location: LocationSchema,
  time: { type: Date, required: true },
  fineAmount: { type: Number, default: 500 },
  // status: { type: String, enum: ['Pending','Resolved','Under Review','Paid'], default: 'Pending' },
  // severity: { type: String, enum: ['Low','Medium','High'], default: 'Medium' },
  imageUrl: { type: String }, // URL to evidence image
  officerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  challanNumber: { type: String },
  notes: { type: String },
}, {
  timestamps: true
});

module.exports = mongoose.model('Violation', ViolationSchema);
