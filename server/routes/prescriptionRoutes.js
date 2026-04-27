const express = require("express");
const router = express.Router();
const controller = require("../controllers/prescriptionController");
const auth = require("../middleware/authMiddleware");
const checkPermission = require("../middleware/permissionMiddleware");

router.post(
  "/",
  auth,
  checkPermission("prescriptions"),
  controller.createPrescription,
);

router.get(
  "/pending",
  auth,
  checkPermission("pharmacy"),
  controller.getPendingPrescriptions,
);

router.get(
  "/patient/:patientId",
  auth,
  checkPermission("prescriptions"),
  controller.getPrescriptionsByPatient,
);

router.patch(
  "/:prescriptionId/:itemId",
  auth,
  checkPermission("prescriptions"),
  controller.markAsGiven,
);

router.get("/", auth, checkPermission("pharmacy"), async (req, res) => {
  try {
    const prescriptions = await require("../models/Prescription")
      .find()
      .populate("items.medicine");

    res.json(prescriptions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
