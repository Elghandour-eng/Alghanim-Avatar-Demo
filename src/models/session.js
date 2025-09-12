import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
  session_id: { type: String, required: true, unique: true },
  bot_id: { type: String, required: true },
  avatar_id: { type: String, required: true },
  voice_id: { type: String, required: true },
  start_time: { type: Date, default: Date.now },
  end_time: { type: Date },
  summary: { type: String },
  interest: { type: String },
  created_at: { type: Date, default: Date.now },
});

const Session = mongoose.model("Session", sessionSchema);

export default Session;
