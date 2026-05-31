const Prescription = require("../models/Prescription");
const Medicine = require("../models/Medicine");
const Patient = require("../models/Patient");
const logAudit = require("../utils/auditLogger");

const getMedicineName = (medicine) => {
  return (
    medicine?.names?.[0] ||
    medicine?.name ||
    "Medicine"
  );
};

exports.createPrescription = async (req, res) => {
  try {
    const { patient, doctor, items } = req.body;

    const patientRecord = await Patient.findById(patient);

    if (!patientRecord) {
      return res.status(404).json({
        message: "Patient not found",
      });
    }

    const prescription = await Prescription.create({
      patient,
      doctor,
      items,
      status: "Pending",
      eventId: patientRecord.eventId || null,
      eventTitle: patientRecord.eventTitle || "",
    });

    const io = req.app.get("io");

    io.emit("queueUpdated");

    await logAudit(req, {
      module: "Consultation",
      action: "Create Prescription",
      description: `Created prescription for ${patientRecord.generalInfo?.name || "Unknown Patient"}.`,
      targetId: prescription._id,
      targetName: patientRecord.generalInfo?.name || "Unknown Patient",
      location: patientRecord.location || "System",
      eventId: patientRecord.eventId,
      eventTitle: patientRecord.eventTitle,
      metadata: {
        itemCount: items?.length || 0,
        status: prescription.status,
      },
    });

    res.status(201).json(prescription);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPendingPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find()
      .select(
        `
          patient
          doctor
          items
          status
          createdAt
          `,
      )

      .populate({
        path: "patient",
        select: `
            generalInfo.name
            generalInfo.age
            generalInfo.gender
            generalInfo.sex
            status
          `,
      })

      .populate({
        path: "doctor",
        select: "name",
      })

      .populate({
        path: "items.medicine",
        select: `       
            names
            quantity
            dosage
            brand
          `,
      })

      .sort({
        createdAt: -1,
      })

      .lean();

    res.json(prescriptions);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: err.message,
    });
  }
};

exports.getPharmacyQueue = async (req, res) => {
  try {
    const { page = 1, limit = 15, search = "", filter = "Pending" } = req.query;

    const pageNumber = Number(page);

    const pageLimit = Number(limit);

    const query = {};

    // status
    if (filter === "Pending") {
      query.status = "Pending";
    }

    if (filter === "Given") {
      query.status = "Completed";
    }

    // search patient name
    // search patient OR medicine
    if (search.trim()) {
      // patient matches
      const matchingPatients = await Patient.find({
        "generalInfo.name": {
          $regex: search.trim(),
          $options: "i",
        },
      }).select("_id");

      // medicine matches (NEW schema)
      const matchingMedicines = await Medicine.find({
        names: {
          $regex: search.trim(),
          $options: "i",
        },
      }).select("_id");

      query.$or = [
        {
          patient: {
            $in: matchingPatients.map((p) => p._id),
          },
        },

        {
          "items.medicine": {
            $in: matchingMedicines.map((m) => m._id),
          },
        },

        // OLD SCHEMA fallback
        {
          "items.name": {
            $regex: search.trim(),
            $options: "i",
          },
        },
      ];
    }

    // total count
    const total = await Prescription.countDocuments(query);

    // PAGINATE FIRST
    const prescriptions = await Prescription.find(query)
      .select(
        `
            patient
            doctor
            items
            status
            createdAt
          `,
      )
      .sort({
        createdAt: -1,
      })
      .skip((pageNumber - 1) * pageLimit)
      .limit(pageLimit)
      .populate({
        path: "patient",
        select: `
              generalInfo.name
              generalInfo.age
              generalInfo.gender
              generalInfo.sex
              status
            `,
      })
      .populate({
        path: "doctor",
        select: "name",
      })
      .populate({
        path: "items.medicine",
        select: `
              names
              quantity
              dosage
              brand
            `,
      })
      .lean();

    const grouped = prescriptions.map((prescription) => ({
      _id: prescription._id,
      patient: prescription.patient,
      doctor: prescription.doctor,
      filteredItems: prescription.items
        .filter((item) =>
          filter === "Pending" ? !Boolean(item.isGiven) : Boolean(item.isGiven),
        )
        .map((item) => ({
          ...item,
          prescriptionId: prescription._id,
        })),
    }));

    res.json({
      prescriptions: grouped,
      total,
      totalPages: Math.ceil(total / pageLimit),
      currentPage: pageNumber,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to load pharmacy queue",
    });
  }
};

exports.markAsGiven = async (req, res) => {
  try {
    const { prescriptionId, itemId } = req.params;

    const prescription = await Prescription.findById(prescriptionId);

    if (!prescription) {
      return res.status(404).json({
        message: "Prescription not found",
      });
    }

    const item = prescription.items.id(itemId);

    if (!item) {
      return res.status(404).json({
        message: "Item not found",
      });
    }

    if (item.isGiven) {
      return res.status(400).json({
        message: "Already given",
      });
    }

    const medicine = await Medicine.findById(item.medicine);

    if (!medicine) {
      return res.status(404).json({
        message: "Medicine not found",
      });
    }

    if (medicine.quantity < item.quantity) {
      return res.status(400).json({
        message: "Not enough stock",
      });
    }

    // deduct stock
    medicine.quantity -= item.quantity;

    await medicine.save();

    // mark item given
    item.isGiven = true;

    // current prescription complete?
    const allItemsGiven = prescription.items.every((i) => i.isGiven);

    if (allItemsGiven) {
      prescription.status = "Completed";
    }

    await prescription.save();

    const patientRecord = await Patient.findById(prescription.patient);

    await logAudit(req, {
      module: "Medicine Release",
      action: "Medicine Given",
      description: `Released ${item.quantity} ${getMedicineName(medicine)} to ${patientRecord?.generalInfo?.name || "Unknown Patient"}.`,
      targetId: prescription._id,
      targetName: getMedicineName(medicine),
      location: patientRecord?.location || "Pharmacy",
      eventId: patientRecord?.eventId || prescription.eventId,
      eventTitle: patientRecord?.eventTitle || prescription.eventTitle,
      metadata: {
        medicineId: medicine._id,
        medicineName: getMedicineName(medicine),
        quantityGiven: item.quantity,
        remainingStock: medicine.quantity,
        prescriptionStatus: prescription.status,
      },
    });

    // =====================
    // CHECK ALL PRESCRIPTIONS
    // =====================

    const patientPrescriptions = await Prescription.find({
      patient: prescription.patient,
    });

    const allCompleted = patientPrescriptions.every(
      (p) => p.status === "Completed",
    );

    if (allCompleted) {
      await Patient.findByIdAndUpdate(prescription.patient, {
        status: "released",
      });
    }

    // socket update
    const io = req.app.get("io");

    io.emit("queueUpdated");

    res.json({
      message: allCompleted
        ? "Medicine given. Patient released."
        : "Medicine given",
      patientReleased: allCompleted,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: err.message,
    });
  }
};

exports.getPrescriptionsByPatient = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({
      patient: req.params.patientId,
    })
      .populate("doctor")
      .populate("items.medicine")
      .populate("patient");

    res.json(prescriptions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPharmacyStats = async (req, res) => {
  try {
    const pending = await Prescription.countDocuments({
      status: "Pending",
    });

    const completed = await Prescription.countDocuments({
      status: "Completed",
    });

    res.json({
      pending,
      completed,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to load pharmacy stats",
    });
  }
};
