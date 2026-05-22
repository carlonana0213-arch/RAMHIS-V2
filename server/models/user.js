const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      set: (value) =>
        String(value || "").toLowerCase().trim(),
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    password_hash: {
      type: String,
      select: false,
    },

    role: {
      type: String,
      enum: [
        "volunteer",
        "pharmacist",
        "doctor",
        "admin",
        
      ],
      required: true,
      default: "volunteer",
      set: (value) =>
        String(value || "volunteer").toLowerCase().trim(),
    },

    age: {
      type: String,
    },

    birthday: {
      type: String,
    },

    first_name: {
      type: String,
      trim: true,
    },

    last_name: {
      type: String,
      trim: true,
    },

    account_type: {
      type: String,
      default: "user",
    },

    contact_number: {
      type: String,
    },

    birthdate: {
      type: String,
    },

    accepted_terms: {
      type: Boolean,
      default: false,
    },

    profile_image_url: {
      type: String,
      default: "",
    },

    verificationStatus: {
      type: String,
      enum: [
        "Pending",
        "Approved",
        "Rejected",
        "Deactivated",
      ],
      default: "Pending",
    },

    status: {
      type: String,
      enum: [
        "pending",
        "active",
        "rejected",
        "deactivated",
      ],
      default: "pending",
    },

    is_verified: {
      type: Boolean,
      default: false,
    },

    mustChangePassword: {
      type: Boolean,
      default: false,
    },

    tempPassword: {
      type: String,
      select: false,
    },

    volunteerType: {
      type: String,
    },

    organization: {
      type: String,
    },

    skills: {
      type: String,
    },

    doctorInfo: {
      specialization: {
        type: String,
      },

      licenseNumber: {
        type: String,
      },

      proofOfLicense: {
        type: String,
      },

      proofOfDoctorate: {
        type: String,
      },
    },

    prc_license_number: {
      type: String,
    },

    specialty: {
      type: String,
    },

    hospital_clinic: {
      type: String,
    },

    license_proof_url: {
      type: String,
      default: "",
    },

    refresh_token: {
      type: String,
      select: false,
    },

    reset_token: {
      type: String,
      select: false,
      index: true,
    },

    reset_token_expiry: {
      type: Date,
      select: false,
      index: true,
    },

    created_at: {
      type: Date,
    },

    updated_at: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.virtual("full_name").get(function () {
  const fullName =
    `${this.first_name || ""} ${this.last_name || ""}`.trim();

  return fullName || this.name || "";
});

UserSchema.pre("save", function () {
  if (this.role) {
    this.role = String(this.role).toLowerCase().trim();
  }

  if (this.email) {
    this.email = String(this.email).toLowerCase().trim();
  }

  if (!this.password_hash && this.password) {
    this.password_hash = this.password;
  }

  if (this.role === "admin") {
    this.verificationStatus = "Approved";
    this.status = "active";
    this.is_verified = true;
  }
});

module.exports =
  mongoose.models.User ||
  mongoose.model("User", UserSchema);