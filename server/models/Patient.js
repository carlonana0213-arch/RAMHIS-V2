const mongoose = require("mongoose");

const PatientSchema = new mongoose.Schema({
  generalInfo: {
    name: String,
    age: { type: Number, default: null },
    birthdate: String,
    sex: String,
    insurance: String,
    tobacco: String,
    alcohol: String,
    allergies: String,
    vaccine: String,
  },

  examination: {
    bp: String,
    temp: String,
    height: String,
    weight: String,
    bmi: String,
  },

  obstetricHistory: {
    contraception: { type: Boolean, default: false },
    type: { type: String, default: "" },
    gpfpal: { type: String, default: "" },
    bf: { type: String, default: "" },
    birthHistory: { type: String, default: "" },
    deliverySite: { type: String, default: "" },
    lmp: { type: String, default: "" },
  },

  perinatalHistory: {
    bw: { type: String, default: "" },
    bf: { type: String, default: "" },
    birthHistory: { type: String, default: "" },
    deliverySite: { type: String, default: "" },
  },

  medicalHistory: [String],
  familyHistory: [String],

  doctorSheets: [
    {
      date: { type: Date, default: Date.now },
      doctorName: { type: String, required: true },
      department: { type: String, required: true },
      examination: {
        generalAppearance: String,
        heent: String,
        pulmonary: String,
        cardiovascular: String,
        gastrointestinal: String,
        musculoskeletal: String,
        genitourinary: String,
        neuroPsych: String,
        checkupPanel: String,
      },

      initComplaint: String,
      diagnosis: String,
      treatment: String,
      medication: String,

      referral: {
        department: String,
        reason: String,
        date: { type: Date, default: Date.now },
      },

      recordType: {
        type: String,
        enum: ["initial", "follow-up", "referral"],
        default: "initial",
      },
    },
  ],

  status: {
    type: String,
    enum: ["waiting", "beingSeen", "released"],
    default: "waiting",
  },
  needsFurtherTreatment: {
    type: Boolean,
    default: false,
  },

  initComplaint: {
    type: String,
    default: "",
  },

  department: {
    type: String,
    enum: ["Pediatrics", "Ortho", "Opta", "Dental", "Cardio", "General"],
  },
  deletedDoctorRecords: [
    {
      examination: Object,
      initComplaint: String,
      diagnosis: String,
      treatment: String,
      medication: String,
      doctorName: String,
      department: String,
      date: Date,

      deletedBy: String,
      deletedAt: Date,
    },
  ],
  missionDate: {
    type: Date,
    default: Date.now,
  },
  location: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Patient", PatientSchema);
