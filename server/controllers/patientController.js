const Patient = require("../models/Patient");

exports.getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.find().sort({ createdAt: -1 });
    res.json(patients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createPatient = async (req, res) => {
  try {
    const {
      generalInfo,
      medicalHistory,
      familyHistory,
      examination,
      obstetricHistory,
      perinatalHistory,
      department,
      initComplaint,
      location,
      missionDate,
    } = req.body;

    if (!location || !missionDate) {
      return res.status(400).json({
        error: "Missing mission data (location or missionDate)",
      });
    }

    if (generalInfo.sex && !generalInfo.gender) {
      generalInfo.gender = generalInfo.sex;
    }
    if (!generalInfo || !generalInfo.name) {
      return res.status(400).json({ error: "Invalid patient data" });
    }

    const patient = new Patient({
      generalInfo,
      medicalHistory,
      familyHistory,
      examination,
      obstetricHistory,
      perinatalHistory,
      department,
      initComplaint,
      location,
      missionDate,
    });

    await patient.save();

    res.status(201).json(patient);
  } catch (err) {
    console.error("MONGOOSE SAVE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getPatientsByName = async (req, res) => {
  const { name } = req.query;
  const patients = await Patient.find({
    "generalInfo.name": { $regex: name, $options: "i" },
  });
  res.json(patients);
};

exports.updatePatient = async (req, res) => {
  const { id } = req.params;
  const updated = await Patient.findByIdAndUpdate(id, req.body, { new: true });
  res.json(updated);
};

exports.deletePatient = async (req, res) => {
  const { id } = req.params;
  await Patient.findByIdAndDelete(id);
  res.json({ msg: "Patient deleted" });
};

exports.getPatientQueue = async (req, res) => {
  try {
    const patients = await Patient.find({
      status: { $ne: "released" },
    });

    res.json(patients);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

exports.updatePatientInfo = async (req, res) => {
  try {
    const updatedPatient = await Patient.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );

    res.json(updatedPatient);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addDoctorRecord = async (req, res) => {
  try {
    const { id } = req.params;

    const record = {
      ...req.body,
      date: new Date(),
    };

    const updated = await Patient.findByIdAndUpdate(
      id,
      {
        $push: { doctorSheets: record },
      },
      { new: true },
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ msg: "Error adding record" });
  }
};

exports.deleteDoctorRecord = async (req, res) => {
  try {
    const { id, recordId } = req.params;
    const { deletedBy, deletedAt } = req.body;

    const patient = await Patient.findById(id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const record = patient.doctorSheets.id(recordId);

    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    patient.deletedDoctorRecords = patient.deletedDoctorRecords || [];

    patient.deletedDoctorRecords.push({
      ...record.toObject(),
      deletedBy,
      deletedAt,
    });

    record.deleteOne();

    await patient.save();

    res.json(patient);
  } catch (err) {
    console.error("Delete doctor record error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
