const mongoose = require("mongoose");

const MedicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    brand: String,
    category: String,
    quantity: { type: Number, default: 0 },
    expiryDate: Date,
    dosage: { type: Number, default: 0 },
    instruction: String,
  },

  { timestamps: true },
);

module.exports = mongoose.model("Medicine", MedicineSchema);
