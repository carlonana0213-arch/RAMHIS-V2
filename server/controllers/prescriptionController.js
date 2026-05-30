const Prescription = require("../models/Prescription");
const Medicine = require("../models/Medicine");
const Patient = require("../models/Patient");
exports.createPrescription = async (req, res) => {
  try {
    const { patient, doctor, items } = req.body;
    const prescription = await Prescription.create({
      patient,
      doctor,
      items,
      status: "Pending",
    });

    const io = req.app.get("io");

    io.emit("queueUpdated");

    res.status(201).json(prescription);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPendingPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find()
      .select(
        `
          patient
          doctor
          items
          status
          createdAt
          `,
      )

      .populate({
        path: "patient",
        select: `
            generalInfo.name
            generalInfo.age
            generalInfo.gender
            generalInfo.sex
            status
          `,
      })

      .populate({
        path: "doctor",
        select: "name",
      })

      .populate({
        path: "items.medicine",
        select: `
            names
            quantity
            dosage
            brand
          `,
      })

      .sort({
        createdAt: -1,
      })

      .lean();

    res.json(prescriptions);
  } catch (err) {
    console.error(err);

    res.status(500).json({
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

    // deduct stock
    medicine.quantity -= item.quantity;

    await medicine.save();

    // mark item given
    item.isGiven = true;

    // current prescription complete?
    const allItemsGiven = prescription.items.every((i) => i.isGiven);

    if (allItemsGiven) {
      prescription.status = "Completed";
    }

    await prescription.save();

    // =====================
    // CHECK ALL PRESCRIPTIONS
    // =====================

    const patientPrescriptions = await Prescription.find({
      patient: prescription.patient,
    });

    const allCompleted = patientPrescriptions.every(
      (p) => p.status === "Completed",
    );

    if (allCompleted) {
      await Patient.findByIdAndUpdate(prescription.patient, {
        status: "released",
      });
    }

    // socket update
    const io = req.app.get("io");

    io.emit("queueUpdated");

    res.json({
      message: allCompleted
        ? "Medicine given. Patient released."
        : "Medicine given",
      patientReleased: allCompleted,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
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

    res.json(prescriptions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
