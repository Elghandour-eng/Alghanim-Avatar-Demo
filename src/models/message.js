const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  message_id: { type: String, required: true, unique: true },
  session_id: { type: String, required: true },
  sender: { type: String, enum: ["USER", "BOT"], required: true },
  message_text: { type: String, required: true },
  media_url: { type: String },
  screen_type: { type: String, enum: ["chat_box", "media"], required: true },
  timestamp: { type: Date, default: Date.now },
});

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
