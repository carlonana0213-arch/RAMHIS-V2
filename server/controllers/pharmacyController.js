const Medicine = require("../models/Medicine");

exports.getAllMedicines = async (req, res) => {
  try {
    const meds = await Medicine.find();
    res.json(meds);
  } catch (err) {
    res.status(500).json(err);
  }
};

exports.addMedicine = async (req, res) => {
  try {
    const med = new Medicine(req.body);
    await med.save();
    res.json(med);
  } catch (err) {
    res.status(400).json(err);
  }
};

exports.updateMedicine = async (req, res) => {
  try {
    const updated = await Medicine.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(updated);
  } catch (err) {
    res.status(400).json(err);
  }
};

exports.deleteMedicine = async (req, res) => {
  try {
    await Medicine.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(400).json(err);
  }
};
