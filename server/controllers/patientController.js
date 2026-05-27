const Patient = require("../models/Patient");
const Event = require("../models/Event");

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
      isPriority,
      location,
      missionDate,
      eventId,
      eventTitle,
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

    let finalLocation = location;
    let finalMissionDate = missionDate;
    let finalEventId = eventId || null;
    let finalEventTitle = eventTitle || "";

    if (!finalLocation || !finalMissionDate || !finalEventId) {
      const ongoingEvent = await Event.findOne({ status: "Ongoing" }).sort({
        updatedAt: -1,
        date: -1,
      });

      if (!ongoingEvent) {
        return res.status(400).json({
          error: "No ongoing event found. Please set an event as Ongoing first.",
        });
      }

      finalLocation = ongoingEvent.location;
      finalMissionDate = ongoingEvent.date || new Date();
      finalEventId = ongoingEvent._id;
      finalEventTitle = ongoingEvent.title;
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
      isPriority,
      location: finalLocation,
      missionDate: finalMissionDate,
      eventId: finalEventId,
      eventTitle: finalEventTitle,
    });

    await patient.save();

    res.status(201).json(patient);
  } catch (err) {
    console.error("MONGOOSE SAVE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getPatientsByName = async (req, res) => {
  try {
    const { name, birthdate } = req.query;

    if (!name) {
      return res.json([]);
    }

    const cleanedName = name.trim();

    const query = {
      "generalInfo.name": {
        $regex: `^${cleanedName}$`,
        $options: "i",
      },
    };

    // safer duplicate matching
    if (birthdate) {
      query["generalInfo.birthdate"] = birthdate;
    }

    const patients = await Patient.find(query).sort({
      updatedAt: -1,
    });

    res.json(patients);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to search patient",
    });
  }
};

exports.updatePatient = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await Patient.findByIdAndUpdate(
      id,
      {
        $set: req.body,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    res.json(updated);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to update patient",
    });
  }
};

exports.deletePatient = async (req, res) => {
  const { id } = req.params;
  await Patient.findByIdAndDelete(id);
  res.json({ msg: "Patient deleted" });
};

exports.getPatientQueue = async (req, res) => {
  try {
    const ongoingEvent = await Event.findOne({ status: "Ongoing" }).sort({
      updatedAt: -1,
      date: -1,
    });

    let patients = [];

    if (ongoingEvent) {
      patients = await Patient.find({
        eventId: ongoingEvent._id,
        status: { $ne: "released" },
      }).sort({
        isPriority: -1,
        createdAt: 1,
      });

      return res.json({
        ongoingEvent,
        patients,
      });
    }

    patients = await Patient.find({
      status: { $ne: "released" },
    }).sort({
      isPriority: -1,
      createdAt: 1,
    });

    return res.json({
      ongoingEvent: null,
      patients,
    });
  } catch (err) {
    console.error("Queue error:", err);

    res.status(500).json({
      msg: "Server error",
    });
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

exports.getLocations = async (req, res) => {
  try {
    const locations = await Patient.distinct("location");

    // remove empty values
    const cleanedLocations = locations.filter(
      (location) => location && location.trim() !== "",
    );

    res.json(cleanedLocations);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch locations",
    });
  }
};
 