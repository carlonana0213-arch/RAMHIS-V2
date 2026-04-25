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

module.exports = router;
