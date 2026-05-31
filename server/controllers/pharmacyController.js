const logAudit = require("../utils/auditLogger");

const getMedicineName = (medicine) => {
  return (
    medicine?.names?.[0] ||
    medicine?.name ||
    "Medicine"
  );
};

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

    await logAudit(req, {
      module: "Inventory",
      action: "Add Medicine",
      description: `Added medicine ${getMedicineName(med)}.`,
      targetId: med._id,
      targetName: getMedicineName(med),
      location: "Inventory",
      metadata: {
        quantity: med.quantity,
        dosage: med.dosage,
        category: med.category,
      },
    });

    res.json(med);
  } catch (err) {
    res.status(400).json(err);
  }
};

exports.updateMedicine = async (req, res) => {
  try {
    const previous = await Medicine.findById(req.params.id);

    const updated = await Medicine.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    const oldQuantity = previous?.quantity ?? 0;
    const newQuantity = updated?.quantity ?? 0;

    await logAudit(req, {
      module: "Inventory",
      action: req.body.quantity !== undefined ? "Update Medicine Stock" : "Update Medicine",
      description:
        req.body.quantity !== undefined
          ? `Updated stock for ${getMedicineName(updated)} from ${oldQuantity} to ${newQuantity}.`
          : `Updated medicine ${getMedicineName(updated)}.`,
      targetId: updated?._id,
      targetName: getMedicineName(updated),
      location: "Inventory",
      metadata: {
        previousQuantity: oldQuantity,
        newQuantity,
        updatedFields: Object.keys(req.body || {}),
      },
    });

    res.json(updated);
  } catch (err) {
    res.status(400).json(err);
  }
};

exports.deleteMedicine = async (req, res) => {
  try {
    const med = await Medicine.findById(req.params.id);

    if (!med) {
      return res.status(404).json({
        message: "Medicine not found",
      });
    }

    await Medicine.findByIdAndDelete(req.params.id);

    await logAudit(req, {
      module: "Inventory",
      action: "Delete Medicine",
      description: `Deleted medicine ${getMedicineName(med)}.`,
      targetId: med._id,
      targetName: getMedicineName(med),
      location: "Inventory",
      metadata: {
        quantity: med.quantity,
        dosage: med.dosage,
        category: med.category,
      },
    });

    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(400).json(err);
  }
};
