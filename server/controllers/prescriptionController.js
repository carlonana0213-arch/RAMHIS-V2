const Prescription = require("../models/Prescription");
const Medicine = require("../models/Medicine");

exports.createPrescription = async (req, res) => {
  try {
    const { patient, doctor, items } = req.body;

    const prescription = await Prescription.create({
      patient,
      doctor,
      items,
      status: "Pending",
    });

    return res.status(201).json(prescription);
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

exports.getPendingPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find()
      .populate("patient")
      .populate("doctor")
      .populate("items.medicine");

    return res.json(prescriptions);
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

exports.markAsGiven = async (req, res) => {
  try {
    const { prescriptionId, itemId } = req.params;

    const prescription = await Prescription.findById(prescriptionId);

    if (!prescription) {
      return res.status(404).json({
        message: "Prescription not found",
      });
    }

    const item = prescription.items.id(itemId);

    if (!item) {
      return res.status(404).json({
        message: "Item not found",
      });
    }

    if (item.isGiven) {
      return res.status(400).json({
        message: "Already given",
      });
    }

    const medicine = await Medicine.findById(item.medicine);

    if (!medicine) {
      return res.status(404).json({
        message: "Medicine not found",
      });
    }

    if (medicine.quantity < item.quantity) {
      return res.status(400).json({
        message: "Not enough stock",
      });
    }

    medicine.quantity -= item.quantity;
    await medicine.save();

    item.isGiven = true;

    const allGiven = prescription.items.every((i) => i.isGiven);

    if (allGiven) {
      prescription.status = "Completed";
    }

    await prescription.save();

    return res.json({
      message: "Medicine given",
      prescription,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

exports.getPrescriptionsByPatient = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({
      patient: req.params.patientId,
    })
      .populate("doctor")
      .populate("items.medicine")
      .populate("patient");

    return res.json(prescriptions);
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};