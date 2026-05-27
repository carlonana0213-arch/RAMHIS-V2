const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  full_name: {
    type: String,
    default: "",
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,
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

  account_type: {
    type: String,
    default: "",
  },

  age: {
    type: String,
    default: "",
  },

  birthday: {
    type: String,
    default: "",
  },

  birthdate: {
    type: String,
    default: "",
  },

  bdate: {
    type: String,
    default: "",
  },

  contact_number: {
    type: String,
    default: "",
  },

  contactNumber: {
    type: String,
    default: "",
  },

  phone: {
    type: String,
    default: "",
  },

  phoneNumber: {
    type: String,
    default: "",
  },

  profileImage: {
    type: String,
    default: "",
  },

  profileImageUrl: {
    type: String,
    default: "",
  },

  profile_image_url: {
    type: String,
    default: "",
  },

  avatar: {
    type: String,
    default: "",
  },

  imageUrl: {
    type: String,
    default: "",
  },

  accepted_terms: {
    type: Boolean,
    default: false,
  },

  /* =========================
     VOLUNTEER INFO
  ========================= */

  verificationStatus: {
    type: String,
    enum: ["Pending", "Approved", "Rejected", "Deactivated"],
    default: "Pending",
  },

  mustChangePassword: {
    type: Boolean,
    default: true,
  },

  tempPassword: {
    type: String,
  },

  resetPasswordToken: {
    type: String,
  },

  resetPasswordExpire: {
    type: Date,
  },

  volunteerType: {
    type: String,
    default: "",
  },
  otp_code: {
  type: String,
  default: null,
},

otp_expiry: {
  type: Date,
  default: null,
},

otp_attempts: {
  type: Number,
  default: 0,
},

otp_locked_until: {
  type: Date,
  default: null,
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
      type: String,
      required: function () {
        return this.role === "Doctor";
      },
    },

    proofOfDoctorate: {
      type: String,
      required: function () {
        return this.role === "Doctor";
      },
    },
  },
});

module.exports =
  mongoose.models.User ||
  mongoose.model("User", UserSchema);