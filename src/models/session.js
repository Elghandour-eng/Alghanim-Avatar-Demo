import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    session_id: { type: String, required: true, unique: true },
    bot_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bot",
      required: false,
    },
    avatar_id: { type: String, required: true },
    voice_id: { type: String, required: true },
    end_time: { type: Date, default: null },
    summary: { type: String, default: "" },
    interest: { type: Number, default: null },
    labels: { type: [String], default: [] },
  },
  {
    timestamps: true,
  }
);

const Session = mongoose.model("Session", sessionSchema);

export default Session;
