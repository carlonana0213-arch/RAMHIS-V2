const mongoose = require("mongoose");

const MedicineSchema = new mongoose.Schema(
  {
    names: {
      type: [String],
      required: true,
    },
    brand: String,
    category: String,
    quantity: { type: Number, default: 0 },
    expiryDate: Date,
    dosage: { type: Number, default: 0 },
    instruction: String,
  },

  { timestamps: true },
);
MedicineSchema.index({ quantity: 1 });
MedicineSchema.index({ createdAt: 1 });
module.exports = mongoose.model("Medicine", MedicineSchema);
