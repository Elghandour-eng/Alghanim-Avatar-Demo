import mongoose from "mongoose";
import cron from "node-cron";
import dotenv from "dotenv";
import { processInactiveSessions } from "./sessionProcessor.js";
import config from "../config/config.js";
// Load environment variables
dotenv.config();

const MONGO_URI = config.db.uri;

// --- Database Connection ---
const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected successfully for scheduler.");
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1); // Exit process with failure
  }
};

// --- Job Scheduling ---

// A simple lock to prevent the job from running multiple times if a previous run is still active.
let isJobRunning = false;

// Schedule the job to run. This example runs every 10 minutes.
// Cron syntax: [minute] [hour] [day_of_month] [month] [day_of_week]
// '*/10 * * * *' means "at every 10th minute"
cron.schedule(config.CRON_SCHEDULE, async () => {
  console.log("--------------------------------------------------");
  console.log(`Cron job triggered at: ${new Date().toISOString()}`);

  if (isJobRunning) {
    console.log("Skipping this run because a previous job is still running.");
    return;
  }

  isJobRunning = true;
  try {
    // Call the core logic from our processor module
    await processInactiveSessions();
  } catch (error) {
    console.error(
      "An unhandled error occurred during the cron job execution:",
      error
    );
  } finally {
    // IMPORTANT: Always release the lock
    isJobRunning = false;
    console.log(`Job finished. Next run scheduled.`);
  }
});

// --- Start the Scheduler ---
const startScheduler = async () => {
  console.log("Scheduler starting...");
  if (
    !MONGO_URI ||
    !config.DIFY_API_ENDPOINT ||
    !config.DIFY_WORKFLOW_API_KEY
  ) {
    console.error(
      "Missing required environment variables. Check your .env file."
    );
    process.exit(1);
  }
  await connectDB();
  console.log("Scheduler is running. Waiting for scheduled jobs to trigger...");
};

startScheduler();

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Scheduler shutting down...");
  await mongoose.disconnect();
  console.log("MongoDB connection closed.");
  process.exit(0);
});
