const Patient = require("../models/Patient");

exports.createPatient = async (req, res) => {
  try {
    console.log("Incoming payload:", JSON.stringify(req.body, null, 2));

    const patient = new Patient(req.body);
    await patient.save();

    res.json(patient);
  } catch (err) {
    console.error("MONGOOSE SAVE ERROR:");
    console.error(err);

    res.status(500).json({ msg: "Error saving patient" });
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
        $push: { doctorSheets: record }, // 🔥 APPEND
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

    // 🔥 Save deleted record (audit trail)
    patient.deletedDoctorRecords = patient.deletedDoctorRecords || [];

    patient.deletedDoctorRecords.push({
      ...record.toObject(),
      deletedBy,
      deletedAt,
    });

    // 🔥 Remove from active records
    record.deleteOne();

    await patient.save();

    res.json(patient);
  } catch (err) {
    console.error("Delete doctor record error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
