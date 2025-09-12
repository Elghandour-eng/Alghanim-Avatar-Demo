import labelService from "../services/label.service.js";

class LabelController {
  async getAllLabels(req, res) {
    try {
      const labels = await labelService.getAllLabels();
      res.json(labels);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async getLabelById(req, res) {
    try {
      const label = await labelService.getLabelById(req.params.id);
      if (label) {
        res.json(label);
      } else {
        res.status(404).json({ message: "Label not found" });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async createLabel(req, res) {
    try {
      const label = await labelService.createLabel(req.body);
      res.status(201).json(label);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
  async updateLabel(req, res) {
    try {
      const label = await labelService.updateLabel(req.params.id, req.body);
      if (label) {
        res.json(label);
      } else {
        res.status(404).json({ message: "Label not found" });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
  async deleteLabel(req, res) {
    try {
      const label = await labelService.deleteLabel(req.params.id);
      if (label) {
        res.json({ message: "Label deleted" });
      } else {
        res.status(404).json({ message: "Label not found" });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

export default new LabelController();
