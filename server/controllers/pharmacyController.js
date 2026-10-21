const logAudit = require("../utils/auditLogger");

const { diffObjects, summarizeChanges } = logAudit;

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
      description: `Added medicine ${getMedicineName(med)}${
        med.brand ? ` (${med.brand})` : ""
      } to the inventory with a starting stock of ${med.quantity}${
        med.expiryDate
          ? `, expiring ${new Date(med.expiryDate).toLocaleDateString("en-US")}`
          : ""
      }.`,
      targetType: "Medicine",
      targetId: med._id,
      targetName: getMedicineName(med),
      location: "Inventory",
      metadata: {
        names: med.names,
        brand: med.brand,
        quantity: med.quantity,
        dosage: med.dosage,
        category: med.category,
        expiryDate: med.expiryDate,
        instruction: med.instruction,
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

    const changes = diffObjects(previous?.toObject(), updated?.toObject(), {
      fields: Object.keys(req.body || {}),
    });

    await logAudit(req, {
      module: "Inventory",
      action: req.body.quantity !== undefined ? "Update Medicine Stock" : "Update Medicine",
      description:
        req.body.quantity !== undefined
          ? `Updated stock for ${getMedicineName(updated)} from ${oldQuantity} to ${newQuantity} (${
              newQuantity - oldQuantity >= 0 ? "+" : ""
            }${newQuantity - oldQuantity}).${
              changes.filter((change) => change.field !== "quantity").length
                ? ` Also: ${summarizeChanges(
                    changes.filter((change) => change.field !== "quantity"),
                    2,
                  )}.`
                : ""
            }`
          : changes.length
            ? `Updated medicine ${getMedicineName(updated)}. ${summarizeChanges(changes)}.`
            : `Saved medicine ${getMedicineName(updated)} with no field changes.`,
      targetType: "Medicine",
      targetId: updated?._id,
      targetName: getMedicineName(updated),
      location: "Inventory",
      changes,
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
      description: `Deleted medicine ${getMedicineName(med)}${
        med.brand ? ` (${med.brand})` : ""
      } from the inventory, which still had ${med.quantity} in stock.`,
      targetType: "Medicine",
      targetId: med._id,
      targetName: getMedicineName(med),
      location: "Inventory",
      metadata: {
        names: med.names,
        brand: med.brand,
        quantity: med.quantity,
        dosage: med.dosage,
        category: med.category,
        expiryDate: med.expiryDate,
      },
    });

    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(400).json(err);
  }
};
