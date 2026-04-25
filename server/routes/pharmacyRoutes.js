const express = require("express");
const router = express.Router();
const pharmacyController = require("../controllers/pharmacyController");
const auth = require("../middleware/authMiddleware");
const checkPermission = require("../middleware/permissionMiddleware");

router.get(
  "/",
  auth,
  checkPermission("pharmacy"),
  pharmacyController.getAllMedicines,
);

router.post(
  "/add",
  auth,
  checkPermission("pharmacy"),
  pharmacyController.addMedicine,
);

router.put(
  "/update/:id",
  auth,
  checkPermission("pharmacy"),
  pharmacyController.updateMedicine,
);

router.delete(
  "/delete/:id",
  auth,
  checkPermission("pharmacy"),
  pharmacyController.deleteMedicine,
);

module.exports = router;
