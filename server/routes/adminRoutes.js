const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {
  getPendingUsers,
  approveUser,
  rejectUser,
  getAllUsers,
  updateUser,
  updateUserStatus,
} = require("../controllers/adminController");

router.get("/pending", auth, authorize("Admin"), getPendingUsers);
router.patch("/approve/:id", auth, authorize("Admin"), approveUser);
router.patch("/reject/:id", auth, authorize("Admin"), rejectUser);
router.get("/users", auth, authorize("Admin"), getAllUsers);
router.put("/users/:id", auth, authorize("Admin"), updateUser);
router.patch("/:id/status", auth, authorize("Admin"), updateUserStatus);
module.exports = router;
