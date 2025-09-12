import mongoose from "mongoose";

const labelSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  color: { type: String },
});

const Label = mongoose.model("Label", labelSchema);

export default Label;
