import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  // ADD THIS LINE
  department: { type: String, required: true, enum: ["Traffic Management", "Emergency Services", "System Administraion", "Monitoring & Control", "IT Support"] },
  role: { type: String, enum: ["user", "police", "admin"], default: "user" },
  phone: { type: String },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// hash password if modified
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;