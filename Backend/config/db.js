import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    // Log database name and host
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Using Database: ${conn.connection.name}`); // should print "ambulance"
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};

export default connectDB;
