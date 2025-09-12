import Label from "../models/label.js";

class LabelService {
  async getAllLabels() {
    return await Label.find();
  }

  async getLabelById(id) {
    return await Label.findById(id);
  }

  async createLabel(labelData) {
    // update or new Label(labelData); with name
    const label = await Label.findOneAndUpdate(
      { name: labelData.name },
      labelData,
      { new: true, upsert: true }
    );
    return label;
  }

  async updateLabel(id, labelData) {
    return await Label.findByIdAndUpdate(id, labelData, { new: true });
  }

  async deleteLabel(id) {
    return await Label.findByIdAndDelete(id);
  }
}

export default new LabelService();
