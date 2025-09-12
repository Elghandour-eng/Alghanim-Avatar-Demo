import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    session_id: { type: String, required: true },
    reply_to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    sender: { type: String, enum: ["USER", "BOT"], required: true },
    message_text: { type: String, required: true },
    media_url: { type: String },
    screen_type: { type: String, enum: ["chat_box", "media"], required: true },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;
