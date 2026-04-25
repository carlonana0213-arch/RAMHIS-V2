const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  password: {
    type: String,
    required: true,
  },

  role: {
    type: String,
    enum: ["Volunteer", "Pharmacist", "Doctor", "Admin"],
    required: true,
  },

  age: {
    type: String,
  },

  birthday: {
    type: String,
  },

  /* =========================
     VOLUNTEER INFO
  ========================= */
  verificationStatus: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending",
  },
  volunteerType: {
    type: String,
  },

  /* =========================
     DOCTOR INFO
  ========================= */

  doctorInfo: {
    specialization: {
      type: String,
      required: function () {
        return this.role === "Doctor";
      },
    },

    licenseNumber: {
      type: String,
      required: function () {
        return this.role === "Doctor";
      },
    },

    proofOfLicense: {
      type: String, // file path or cloud URL
      required: function () {
        return this.role === "Doctor";
      },
    },

    proofOfDoctorate: {
      type: String, // file path or cloud URL
      required: function () {
        return this.role === "Doctor";
      },
    },
  },
});

module.exports = mongoose.model("User", UserSchema);
