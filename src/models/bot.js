import mongoose from "mongoose";

const botSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    dify_api_key: { type: String, required: true },
    dify_summary_api_key: { type: String, required: true },
    bot_type: { type: String, enum: ["agent", "chatbot"], required: true },
    avatar_id: { type: String, required: true },
    voice_id: { type: String, required: true },
    orientation: {
      type: String,
      enum: ["portrait", "landscape"],
      required: true,
    },
  },
  { timestamps: true }
);

const Bot = mongoose.model("Bot", botSchema);

export default Bot;
