import mongoose from "mongoose";
import config from "../config/config.js";

const connectDB = async () => {
  try {
    await mongoose.connect(config.db.uri);
    console.log("MongoDB connected successfully", { db: config.db.uri });
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

export default connectDB;
