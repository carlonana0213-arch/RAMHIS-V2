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
      isPriority,
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
      isPriority,
      location,
      missionDate,
    });

    await patient.save();

    const io = req.app.get("io");

    io.emit("queueUpdated");

    res.status(201).json(patient);

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

    const io = req.app.get("io");

    io.emit("queueUpdated");

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
    const { page = 1, limit = 15, search = "", department = "All" } = req.query;

    const pageNumber = Number(page);
    const pageLimit = Number(limit);

    const filter = {
      status: { $nin: ["released"] },
    };

    // department filter
    if (department !== "All") {
      filter.department = department;
    }

    // search filter
    if (search.trim()) {
      filter["generalInfo.name"] = {
        $regex: search.trim(),
        $options: "i",
      };
    }

    const total = await Patient.countDocuments(filter);

    const patients = await Patient.find(filter)
      .select(
        `
        _id
        status
        department
        isPriority
        createdAt
        generalInfo.name
        generalInfo.age
        generalInfo.sex
        generalInfo.gender
      `,
      )
      .sort({
        isPriority: -1,
        createdAt: -1,
      })
      .skip((pageNumber - 1) * pageLimit)
      .limit(pageLimit)
      .lean();

    res.json({
      patients,
      total,
      totalPages: Math.ceil(total / pageLimit),
      currentPage: pageNumber,
    });
  } catch (err) {
    console.error(err);

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

    const io = req.app.get("io");

    io.emit("queueUpdated");

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

    const io = req.app.get("io");

    io.emit("queueUpdated");

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

    const io = req.app.get("io");

    io.emit("queueUpdated");

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

exports.getAnalyticsPatients = async (req, res) => {
  try {
    const { location, page = 1, limit = 10 } = req.query;

    const pageNumber = Number(page);

    const pageLimit = Number(limit);

    const filter = {
      $or: [{ location }, { visitPlace: location }],
    };

    const total = await Patient.countDocuments(filter);

    const patients = await Patient.find(filter)
      .select(
        `
          generalInfo.name
          generalInfo.sex
          generalInfo.gender
          generalInfo.age
          missionDate
          location
          visitPlace
          doctorSheets
        `,
      )
      .sort({
        missionDate: -1,
      })
      .skip((pageNumber - 1) * pageLimit)
      .limit(pageLimit)
      .lean();

    const formatted = patients.map((patient) => ({
      id: patient._id,

      name: patient.generalInfo?.name,

      sex: patient.generalInfo?.sex || patient.generalInfo?.gender,

      age: patient.generalInfo?.age,

      diagnosis:
        patient.doctorSheets?.[patient.doctorSheets.length - 1]?.diagnosis,

      visitDate: patient.missionDate,

      visitPlace: patient.location || patient.visitPlace,
    }));

    res.json({
      patients: formatted,
      total,
      totalPages: Math.ceil(total / pageLimit),
      currentPage: pageNumber,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: err.message,
    });
  }
};

exports.syncOfflineQueue = async (req, res) => {
  try {
    const patients = await Patient.find({
      status: { $ne: "released" },
    })
      .select(
        `
        _id
        status
        department
        isPriority
        createdAt
        location
        generalInfo
        examination
        medicalHistory
        familyHistory
        obstetricHistory
        perinatalHistory
        initComplaint
      `,
      )
      .sort({
        isPriority: -1,
        createdAt: -1,
      })
      .lean();

    res.json(patients);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      msg: "Failed to sync queue",
    });
  }
};

exports.getQueueSummary = async (req, res) => {
  try {
    const summary = await Patient.aggregate([
      {
        $match: {
          status: {
            $ne: "released",
          },
        },
      },

      {
        $group: {
          _id: "$department",
          count: {
            $sum: 1,
          },
        },
      },
    ]);

    const formatted = {
      Pediatrics: 0,
      Ortho: 0,
      Opta: 0,
      Dental: 0,
      Cardio: 0,
      General: 0,
    };

    summary.forEach((item) => {
      formatted[item._id] = item.count;
    });

    res.json(formatted);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      msg: "Failed to fetch queue summary",
    });
  }
};

exports.getDoctorQueue = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 15,
      search = "",
      queueFilter = "all",
      department = "General",
      role = "doctor",
    } = req.query;

    const pageNumber = Number(page);

    const pageLimit = Number(limit);

    const filter = {
      status: {
        $ne: "released",
      },
    };

    // non-admin doctors
    if (role !== "admin" && !search.trim()) {
      filter.department = department;
    }

    // search all
    if (search.trim()) {
      filter["generalInfo.name"] = {
        $regex: search.trim(),
        $options: "i",
      };
    }

    // queue filters
    // ONLY apply when not searching

    if (!search.trim()) {
      if (queueFilter === "priority") {
        filter.isPriority = true;

        filter.status = {
          $nin: ["released", "unconsulted"],
        };
      }

      if (queueFilter === "all") {
        filter.status = {
          $nin: ["released", "unconsulted"],
        };
      }

      if (queueFilter === "unconsulted") {
        filter.status = "unconsulted";
      }
    }

    const total = await Patient.countDocuments(filter);

    const patients = await Patient.find(filter)
      .select(
        `
          _id
          status
          department
          isPriority
          createdAt
          initComplaint
          doctorSheets
          generalInfo.name
          generalInfo.age
          generalInfo.sex
          generalInfo.gender
        `,
      )
      .sort({
        isPriority: -1,
        createdAt: -1,
      })
      .skip((pageNumber - 1) * pageLimit)
      .limit(pageLimit)
      .lean();

    res.json({
      patients,
      total,
      totalPages: Math.ceil(total / pageLimit),
      currentPage: pageNumber,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      msg: "Failed to load doctor queue",
    });
  }
};
