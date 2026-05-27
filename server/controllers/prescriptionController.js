const Prescription = require("../models/Prescription");
const Medicine = require("../models/Medicine");
const Event = require("../models/Event");

/*
  Pharmacy Queue Mission Rule:

  1. If there is an Ongoing event:
     - Show prescriptions only for patients registered under that ongoing event.
     - If no prescriptions exist for that event, Pharmacy Queue becomes empty.

  2. If there is NO Ongoing event:
     - Show prescriptions from the most recent Completed event.
     - This keeps the last mission's prescriptions visible after completion.
*/

const getPharmacyQueueEvent = async () => {
  const ongoingEvent = await Event.findOne({ status: "Ongoing" }).sort({
    updatedAt: -1,
    date: -1,
  });

  if (ongoingEvent) {
    return ongoingEvent;
  }

  const latestCompletedEvent = await Event.findOne({
    status: "Completed",
  }).sort({
    updatedAt: -1,
    date: -1,
  });

  return latestCompletedEvent;
};

exports.createPrescription = async (req, res) => {
  try {
    const { patient, doctor, items } = req.body;

    const prescription = await Prescription.create({
      patient,
      doctor,
      items,
      status: "Pending",
    });

    res.status(201).json(prescription);
  } catch (err) {
    console.error("CREATE PRESCRIPTION ERROR:", err);

    res.status(500).json({
      message: err.message,
    });
  }
};

exports.getPendingPrescriptions = async (req, res) => {
  try {
    const queueEvent = await getPharmacyQueueEvent();

    if (!queueEvent) {
      return res.json([]);
    }

    const prescriptions = await Prescription.find()
      .populate({
        path: "patient",
        match: {
          eventId: queueEvent._id,
        },
      })
      .populate("doctor")
      .populate("items.medicine")
      .sort({
        createdAt: 1,
      });

    /*
      populate match returns patient: null if the prescription's patient
      does not belong to the selected event, so we remove those.
    */
    const filteredPrescriptions = prescriptions.filter(
      (prescription) => prescription.patient
    );

    res.json(filteredPrescriptions);
  } catch (err) {
    console.error("GET PHARMACY QUEUE ERROR:", err);

    res.status(500).json({
      message: err.message,
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

    medicine.quantity -= item.quantity;
    await medicine.save();

    item.isGiven = true;

    const allGiven = prescription.items.every((prescriptionItem) => {
      return prescriptionItem.isGiven;
    });

    if (allGiven) {
      prescription.status = "Completed";
    }

    await prescription.save();

    res.json({
      message: "Medicine given",
    });
  } catch (err) {
    console.error("MARK AS GIVEN ERROR:", err);

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
    console.error("GET PRESCRIPTIONS BY PATIENT ERROR:", err);

    res.status(500).json({
      message: err.message,
    });
  }
};