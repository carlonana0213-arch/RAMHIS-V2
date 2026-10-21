const Patient = require("../models/Patient");
const User = require("../models/user");
const Event = require("../models/Event");

const { createOrAppendConflict } = require("./SyncConflictController");
const getMissionFilter = async (req) => {
  const showAll = req.query.all === "true";

  if (showAll) {
    return {};
  }

  const ongoingEvent = await Event.findOne({
    status: "Ongoing",
  });

  if (!ongoingEvent) {
    return {};
  }

  return {
    eventId: ongoingEvent._id,
  };
};
const logAudit = require("../utils/auditLogger");
const { diffObjects, summarizeChanges } = logAudit;
const {
  findDuplicatePatient,
  buildIdentityQuery,
} = require("../utils/patientIdentity");

// "Juan Dela Cruz (34 yrs, Male, born 1990-01-01)"
const describePatient = (patient) => {
  const info = patient?.generalInfo || {};

  const details = [
    info.age !== null && info.age !== undefined && info.age !== ""
      ? `${info.age} yrs`
      : null,
    info.sex || info.gender || null,
    info.birthdate ? `born ${String(info.birthdate).slice(0, 10)}` : null,
  ].filter(Boolean);

  const name = String(info.name || "").trim().replace(/\s+/g, " ");

  return `${name || "Unknown Patient"}${
    details.length ? ` (${details.join(", ")})` : ""
  }`;
};

exports.getAllPatients = async (req, res) => {
  try {
    const missionFilter = await getMissionFilter(req);

    const patients = await Patient.find(missionFilter).sort({
      createdAt: -1,
    });

    res.json(patients);
  } catch (err) {
    console.error("GET ALL PATIENTS ERROR:", err);

    res.status(500).json({
      error: err.message,
    });
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

    if (!location) {
      return res.status(400).json({
        error: "Missing location",
      });
    }

    if (!generalInfo || !generalInfo.name) {
      return res.status(400).json({
        error: "Invalid patient data",
      });
    }

    if (generalInfo.sex && !generalInfo.gender) {
      generalInfo.gender = generalInfo.sex;
    }

    // ---------------------------------------------------------
    // DUPLICATE PATIENT GUARD
    //
    // A patient with the same name and birthdate must not be
    // registered twice.
    // ---------------------------------------------------------

    const duplicate = await findDuplicatePatient(
      generalInfo.name,
      generalInfo.birthdate,
    );

    if (duplicate) {
      await logAudit(req, {
        module: "Registration",
        action: "Duplicate Registration Blocked",
        status: "Blocked",
        reason:
          "A patient with the same name and birthdate is already registered.",
        description: `Blocked registration of ${describePatient({
          generalInfo,
        })}: ${describePatient(duplicate)} is already registered.`,
        targetType: "Patient",
        targetId: duplicate._id,
        targetName: duplicate.generalInfo?.name || "Unknown Patient",
        location,
        eventId: duplicate.eventId,
        metadata: {
          existingPatientId: duplicate._id,
          existingRegisteredAt: duplicate.createdAt,
          existingStatus: duplicate.status,
          existingDepartment: duplicate.department,
          attemptedDepartment: department,
          attemptedLocation: location,
        },
      });

      return res.status(409).json({
        duplicate: true,
        message:
          "This patient already exists. A patient with the same name and birthdate is already registered.",
        existingPatient: duplicate,
      });
    }

    const ongoingEvent = await Event.findOne({
      status: "Ongoing",
    });

    const patientData = {
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
      missionDate: missionDate || null,
    };

    if (ongoingEvent) {
      patientData.eventId = ongoingEvent._id;
      patientData.missionDate = ongoingEvent.date || null;
    }

    const patient = new Patient(patientData);

    await patient.save();

    const io = req.app.get("io");

    io.emit("queueUpdated");

    await logAudit(req, {
      module: "Registration",
      action: "Add Patient",
      description: `Registered ${describePatient(patient)} to the ${
        patient.department || "unassigned"
      } queue${patient.isPriority ? " as a priority patient" : ""} at ${
        patient.location
      }.`,
      targetType: "Patient",
      targetId: patient._id,
      targetName: patient.generalInfo?.name || "Unknown Patient",
      location: patient.location,
      eventId: patient.eventId,
      metadata: {
        department: patient.department,
        status: patient.status,
        isPriority: patient.isPriority,
        initComplaint: patient.initComplaint,
        age: patient.generalInfo?.age,
        sex: patient.generalInfo?.sex,
        birthdate: patient.generalInfo?.birthdate,
        missionDate: patient.missionDate,
      },
    });

    res.status(201).json(patient);
  } catch (err) {
    console.error("MONGOOSE SAVE ERROR:", err);

    res.status(500).json({
      error: err.message,
    });
  }
};

exports.getPatientsByName = async (req, res) => {
  try {
    const { name, birthdate } = req.query;

    if (!name) {
      return res.json([]);
    }

    // Name and birthdate are escaped/normalised so special
    // characters in a name cannot break the search.
    const query = buildIdentityQuery(name, birthdate);

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

    // ---------------------------------------------------------
    // Offline synchronization metadata
    // ---------------------------------------------------------

    const syncMetadata = req.body?._sync || {};

    const { operationId = null, baseUpdatedAt = null } = syncMetadata;

    // Remove synchronization metadata from the actual
    // patient update.
    const { _sync, ...patientUpdateData } = req.body;

    // ---------------------------------------------------------
    // Get the CURRENT patient
    // ---------------------------------------------------------

    const currentPatient = await Patient.findById(id);

    if (!currentPatient) {
      return res.status(404).json({
        message: "Patient not found",
      });
    }

    // Snapshot used to record exactly what this update changed.
    const patientBefore = currentPatient.toObject();

    // ---------------------------------------------------------
    // SERVER-SIDE CONFLICT DETECTION
    // ---------------------------------------------------------

    if (baseUpdatedAt) {
      const clientBaseDate = new Date(baseUpdatedAt);
      const serverUpdatedAt = currentPatient.updatedAt;

      if (Number.isNaN(clientBaseDate.getTime()) || !serverUpdatedAt) {
        return res.status(400).json({
          message: "Invalid synchronization version",
          conflict: false,
        });
      }

      const clientVersion = clientBaseDate.getTime();
      const serverVersion = new Date(serverUpdatedAt).getTime();

      // -------------------------------------------------------
      // STALE VERSION = CONFLICT
      // -------------------------------------------------------

      if (clientVersion !== serverVersion) {
        console.warn(
          "[SYNC CONFLICT] Patient update is based on an older version",
          {
            patientId: id,
            operationId,
            baseUpdatedAt,
            serverUpdatedAt,
          },
        );

        // -----------------------------------------------------
        // SERVER CANDIDATE
        // -----------------------------------------------------

        const serverCandidate = {
          ownerKey: req.user?.id,

          operationId: `server-${currentPatient._id}-${serverUpdatedAt.getTime()}`,

          data: currentPatient.toObject(),

          baseUpdatedAt: serverUpdatedAt,

          source: "server",

          createdAt: serverUpdatedAt,
        };

        // -----------------------------------------------------
        // OFFLINE CANDIDATE
        // -----------------------------------------------------

        const incomingCandidate = {
          ownerKey: req.user?.id,

          operationId: operationId || `offline-${Date.now()}`,

          data: patientUpdateData,

          baseUpdatedAt: clientBaseDate,

          source: "offline",

          createdAt: new Date(),
        };

        // -----------------------------------------------------
        // STORE CONFLICT
        // -----------------------------------------------------

        const conflict = await createOrAppendConflict({
          patientId: currentPatient._id,

          entityType: "patient",

          entityKey: id,

          baseUpdatedAt: clientBaseDate,

          incomingCandidate,

          serverCandidate,
        });

        await logAudit(req, {
          module: "Sync",
          action: "Sync Conflict Detected",
          status: "Blocked",
          reason:
            "The offline change was based on an older version of this patient.",
          description: `Offline update to ${describePatient(
            currentPatient,
          )} was held for review because the record changed on the server after it was downloaded.`,
          targetType: "Patient",
          targetId: currentPatient._id,
          targetName: currentPatient.generalInfo?.name || "Unknown Patient",
          location: currentPatient.location,
          eventId: currentPatient.eventId,
          operationId,
          changes: diffObjects(patientBefore, patientUpdateData, {
            fields: Object.keys(patientUpdateData || {}),
          }),
          metadata: {
            conflictId: conflict._id,
            entityType: "patient",
            baseUpdatedAt,
            serverUpdatedAt,
          },
        });

        // -----------------------------------------------------
        // RETURN CONFLICT TO CLIENT
        // -----------------------------------------------------

        return res.status(409).json({
          message: "Sync conflict detected",

          conflict: true,

          conflictId: conflict._id,

          entityType: "patient",

          entityKey: id,

          patientId: id,

          operationId,

          baseUpdatedAt,

          serverUpdatedAt,

          candidates: conflict.candidates,

          serverData: currentPatient,
        });
      }
    }

    // ---------------------------------------------------------
    // NO CONFLICT — NORMAL UPDATE
    // ---------------------------------------------------------

    const updated = await Patient.findByIdAndUpdate(
      id,
      {
        $set: patientUpdateData,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    const io = req.app.get("io");

    if (io) {
      io.emit("queueUpdated");
    }

    if (updated) {
      const changes = diffObjects(patientBefore, updated.toObject(), {
        fields: Object.keys(patientUpdateData || {}),
      });

      await logAudit(req, {
        module: "Registration",

        action: req.body.status ? "Update Patient Status" : "Update Patient",

        description: changes.length
          ? `Updated ${describePatient(updated)}. ${summarizeChanges(changes)}.`
          : `Saved ${describePatient(updated)} with no field changes.`,

        targetType: "Patient",

        targetId: updated._id,

        targetName: updated.generalInfo?.name || "Unknown Patient",

        location: updated.location,

        eventId: updated.eventId,

        operationId,

        changes,

        metadata: {
          updatedFields: Object.keys(patientUpdateData || {}),
          status: updated.status,
          department: updated.department,
        },
      });
    }

    return res.json(updated);
  } catch (err) {
    console.error("UPDATE PATIENT ERROR:", err);

    return res.status(500).json({
      error: "Failed to update patient",
    });
  }
};

exports.deletePatient = async (req, res) => {
  try {
    const { id } = req.params;

    const patient = await Patient.findById(id);

    if (!patient) {
      return res.status(404).json({
        message: "Patient not found",
      });
    }

    await Patient.findByIdAndDelete(id);

    await logAudit(req, {
      module: "Registration",
      action: "Delete Patient",
      description: `Deleted ${describePatient(patient)} from ${
        patient.location
      }, including ${patient.doctorSheets?.length || 0} doctor record(s).`,
      targetType: "Patient",
      targetId: patient._id,
      targetName: patient.generalInfo?.name || "Unknown Patient",
      location: patient.location,
      eventId: patient.eventId,
      metadata: {
        // Kept so there is still a trace of what was removed.
        deletedRecord: {
          generalInfo: patient.generalInfo,
          department: patient.department,
          status: patient.status,
          registeredAt: patient.createdAt,
          doctorRecordCount: patient.doctorSheets?.length || 0,
        },
      },
    });

    res.json({ msg: "Patient deleted" });
  } catch (err) {
    res.status(500).json({
      message: "Failed to delete patient",
      error: err.message,
    });
  }
};

exports.getPatientQueue = async (req, res) => {
  try {
    const { page = 1, limit = 15, search = "", department = "All" } = req.query;

    const pageNumber = Number(page);
    const pageLimit = Number(limit);

    const missionFilter = await getMissionFilter(req);

    const filter = {
      ...missionFilter,
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
        createdAt
        updatedAt
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
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.addDoctorRecord = async (req, res) => {
  try {
    const { id } = req.params;

    // ---------------------------------------------------------
    // Offline synchronization metadata
    // ---------------------------------------------------------
    const syncMetadata = req.body?._sync || {};

    const { operationId = null, baseUpdatedAt = null } = syncMetadata;

    // Remove synchronization metadata from the actual
    // doctor record.
    const { _sync, ...doctorRecordData } = req.body;

    // ---------------------------------------------------------
    // Get the CURRENT patient
    // ---------------------------------------------------------
    const currentPatient = await Patient.findById(id);

    if (!currentPatient) {
      return res.status(404).json({
        msg: "Patient not found",
      });
    }

    // ---------------------------------------------------------
    // OFFLINE PATIENT CONFLICT DETECTION
    // ---------------------------------------------------------
    //
    // Any patient update that arrives with _sync metadata
    // originated from the offline outbox.
    //
    // Offline patient edits must always go through the
    // conflict-resolution workflow, even when the server
    // patient has not changed since the offline snapshot.
    //

    if (operationId && baseUpdatedAt) {
      const clientBaseDate = new Date(baseUpdatedAt);
      const serverUpdatedAt = currentPatient.updatedAt;

      if (Number.isNaN(clientBaseDate.getTime()) || !serverUpdatedAt) {
        return res.status(400).json({
          message: "Invalid synchronization version",
          conflict: false,
        });
      }

      const clientVersion = clientBaseDate.getTime();
      const serverVersion = new Date(serverUpdatedAt).getTime();

      if (clientVersion !== serverVersion) {
        console.warn(
          "[SYNC CONFLICT] Doctor record was created from an older patient version",
          {
            patientId: id,
            operationId,
            baseUpdatedAt,
            serverUpdatedAt,
          },
        );

        const serverCandidate = {
          ownerKey: req.user?.id,

          operationId: `server-${currentPatient._id}-${serverUpdatedAt.getTime()}`,

          data: currentPatient.toObject(),

          baseUpdatedAt: serverUpdatedAt,

          source: "server",

          createdAt: serverUpdatedAt,
        };

        const incomingCandidate = {
          ownerKey: req.user?.id,

          operationId,

          data: doctorRecordData,

          baseUpdatedAt: clientBaseDate,

          source: "offline",

          createdAt: new Date(),
        };

        const conflict = await createOrAppendConflict({
          patientId: currentPatient._id,

          entityType: "doctorRecord",

          entityKey: id,

          baseUpdatedAt: clientBaseDate,

          incomingCandidate,

          serverCandidate,
        });

        await logAudit(req, {
          module: "Sync",
          action: "Sync Conflict Detected",
          status: "Blocked",
          reason:
            "The offline doctor record was based on an older version of this patient.",
          description: `Offline doctor record for ${describePatient(
            currentPatient,
          )} (${doctorRecordData.department || "no department"}, Dr. ${
            doctorRecordData.doctorName || "unknown"
          }) was held for review because the patient changed on the server.`,
          targetType: "Doctor Record",
          targetId: currentPatient._id,
          targetName: currentPatient.generalInfo?.name || "Unknown Patient",
          location: currentPatient.location,
          eventId: currentPatient.eventId,
          operationId,
          metadata: {
            conflictId: conflict._id,
            entityType: "doctorRecord",
            diagnosis: doctorRecordData.diagnosis,
            baseUpdatedAt,
            serverUpdatedAt,
          },
        });

        return res.status(409).json({
          message: "Doctor record sync conflict detected",

          conflict: true,

          conflictId: conflict._id,

          entityType: "doctorRecord",

          entityKey: id,

          patientId: id,

          operationId,

          baseUpdatedAt,

          serverUpdatedAt,

          candidates: conflict.candidates,

          serverData: currentPatient.toObject(),
        });
      }
    }

    // ---------------------------------------------------------
    // NO CONFLICT
    // ---------------------------------------------------------

    const record = {
      ...doctorRecordData,
      date: new Date(),
    };

    currentPatient.doctorSheets.push(record);

    await currentPatient.save();

    const io = req.app.get("io");

    io.emit("queueUpdated");

    const savedRecord =
      currentPatient.doctorSheets[currentPatient.doctorSheets.length - 1];

    await logAudit(req, {
      module: "Consultation",
      action: "Add Doctor Record",
      description: `Added a consultation record (${
        doctorRecordData.recordType || "initial"
      }, ${doctorRecordData.department || "no department"}) by Dr. ${
        doctorRecordData.doctorName || "unknown"
      } for ${describePatient(currentPatient)}${
        doctorRecordData.diagnosis
          ? `. Diagnosis: ${doctorRecordData.diagnosis}`
          : ""
      }.`,
      targetType: "Doctor Record",
      targetId: currentPatient._id,
      targetName: currentPatient.generalInfo?.name || "Unknown Patient",
      location: currentPatient.location,
      eventId: currentPatient.eventId,
      operationId,
      metadata: {
        recordId: savedRecord?._id,
        recordType: doctorRecordData.recordType || "initial",
        doctorName: doctorRecordData.doctorName,
        department: doctorRecordData.department,
        initComplaint: doctorRecordData.initComplaint,
        diagnosis: doctorRecordData.diagnosis,
        treatment: doctorRecordData.treatment,
        medication: doctorRecordData.medication,
        referral: doctorRecordData.referral,
        totalRecordsForPatient: currentPatient.doctorSheets.length,
      },
    });

    res.json(currentPatient);
  } catch (err) {
    console.error("ADD DOCTOR RECORD ERROR:", {
      message: err.message,
      name: err.name,
      errors: err.errors,
      body: req.body,
      patientId: req.params.id,
    });

    res.status(500).json({
      msg: "Error adding record",
      error: err.message,
    });
  }
};

exports.deleteDoctorRecord = async (req, res) => {
  try {
    const { id, recordId } = req.params;
    const { deletedBy, deletedAt } = req.body;

    const patient = await Patient.findById(id);

    if (!patient) {
      return res.status(404).json({
        message: "Patient not found",
      });
    }

    const record = patient.doctorSheets.id(recordId);

    if (!record) {
      return res.status(404).json({
        message: "Record not found",
      });
    }

    const removedRecord = record.toObject();

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

    await logAudit(req, {
      module: "Consultation",
      action: "Delete Doctor Record",
      description: `Deleted the ${
        removedRecord.department || "unspecified department"
      } consultation record by Dr. ${
        removedRecord.doctorName || "unknown"
      } for ${describePatient(patient)}${
        removedRecord.diagnosis ? `. Diagnosis was: ${removedRecord.diagnosis}` : ""
      }.`,
      targetType: "Doctor Record",
      targetId: patient._id,
      targetName: patient.generalInfo?.name || "Unknown Patient",
      location: patient.location,
      eventId: patient.eventId,
      metadata: {
        recordId,
        deletedBy,
        deletedAt,
        // The record is also kept in patient.deletedDoctorRecords.
        deletedRecord: {
          date: removedRecord.date,
          recordType: removedRecord.recordType,
          doctorName: removedRecord.doctorName,
          department: removedRecord.department,
          initComplaint: removedRecord.initComplaint,
          diagnosis: removedRecord.diagnosis,
          treatment: removedRecord.treatment,
          medication: removedRecord.medication,
        },
      },
    });

    res.json(patient);
  } catch (err) {
    console.error("Delete doctor record error:", err);

    res.status(500).json({
      message: "Server error",
    });
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
    const missionFilter = await getMissionFilter(req);

    const patients = await Patient.find({
      ...missionFilter,
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
    const missionFilter = await getMissionFilter(req);

    const summary = await Patient.aggregate([
      {
        $match: {
          ...missionFilter,
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
      General: 0,
      Pediatrics: 0,
      Neurology: 0,
      Pathology: 0,
      Circumcision: 0,
      Surgery: 0,
      PT: 0,
      OBGyn: 0,
      Dental: 0,
      Ophthalmology: 0,
      Dermatology: 0,
      AdultMed: 0,
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
      role = "doctor",
    } = req.query;

    const pageNumber = Number(page);

    const pageLimit = Number(limit);

    let doctorDepartment = null;

    if (role !== "admin") {
      const doctor = await User.findById(req.user.id).select("role department");

      if (!doctor) {
        return res.status(404).json({
          msg: "Doctor account not found",
        });
      }

      if (doctor.role !== "Doctor") {
        return res.status(403).json({
          msg: "Only doctors can access the doctor queue",
        });
      }

      if (!doctor.department) {
        return res.status(400).json({
          msg: "Doctor has no department assigned",
        });
      }

      doctorDepartment = doctor.department;
    }

    const missionFilter = await getMissionFilter(req);

    const filter = {
      ...missionFilter,
      status: {
        $ne: "released",
      },
    };

    // non-admin doctors
    if (role !== "admin") {
      filter.department = doctorDepartment;
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
          $in: ["waiting", "beingSeen"],
        };
      }

      if (queueFilter === "all") {
        filter.status = {
          $in: ["waiting", "beingSeen"],
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
