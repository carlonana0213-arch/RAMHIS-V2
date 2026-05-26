const express = require("express");
const router = express.Router();
const controller = require("../controllers/patientController");
const { updatePatientInfo } = require("../controllers/patientController");
const { getAllPatients } = require("../controllers/patientController");

const patientController = require("../controllers/patientController");
const auth = require("../middleware/authMiddleware");
const checkPermission = require("../middleware/permissionMiddleware");
const { referPatient } = require("../controllers/referralController");
const Patient = require("../models/Patient");
const { getLocations } = require("../controllers/patientController");
router.get("/locations", getLocations);

router.patch("/:id/referral", referPatient);

router.post("/", auth, checkPermission("registry"), controller.createPatient);

router.get("/", auth, checkPermission("registry"), getAllPatients);

router.get(
  "/search",
  auth,
  checkPermission("registry"),
  controller.getPatientsByName,
);

router.get(
  "/queue",
  auth,
  checkPermission("queue"),
  patientController.getPatientQueue,
);

router.get("/:id", auth, checkPermission("registry"), async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.json(patient);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put(
  "/:id",
  auth,
  checkPermission("registry", "doctorSheet"),
  controller.updatePatient,
);

router.delete(
  "/:id",
  auth,
  checkPermission("registry"),
  controller.deletePatient,
);

router.post(
  "/:id/doctor-record",
  auth,
  checkPermission("doctorSheet"),
  controller.addDoctorRecord,
);

router.delete(
  "/:id/doctor-record/:recordId",
  auth,
  checkPermission("doctorSheet"),
  controller.deleteDoctorRecord,
);

module.exports = router;
 