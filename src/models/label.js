import mongoose from "mongoose";

const labelSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, default: "" },
  color: { type: String, default: "" },
});

const Label = mongoose.model("Label", labelSchema);

export default Label;
