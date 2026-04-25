const Prescription = require("../models/Prescription");
const Medicine = require("../models/Medicine");

exports.createPrescription = async (req, res) => {
  try {
    const { patient, items } = req.body;

    const prescription = await Prescription.create({
      patient,
      items,
      status: "Pending",
    });

    res.status(201).json(prescription);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPendingPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ status: "Pending" })
      .populate("patient")
      .populate("items.medicine");

    res.json(prescriptions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.markAsGiven = async (req, res) => {
  try {
    const { prescriptionId, itemId } = req.params;

    const prescription = await Prescription.findById(prescriptionId);
    const item = prescription.items.id(itemId);

    if (!item) return res.status(404).json({ message: "Item not found" });

    if (item.isGiven) return res.status(400).json({ message: "Already given" });

    const medicine = await Medicine.findById(item.medicine);

    if (medicine.quantity < item.quantity)
      return res.status(400).json({ message: "Not enough stock" });

    // deduct stock
    medicine.quantity -= item.quantity;
    await medicine.save();

    item.isGiven = true;

    // check if all given
    const allGiven = prescription.items.every((i) => i.isGiven);
    if (allGiven) prescription.status = "Completed";

    await prescription.save();

    res.json({ message: "Medicine given" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPrescriptionsByPatient = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({
      patient: req.params.patientId,
    })
      .populate("items.medicine")
      .populate("patient");

    res.json(prescriptions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
