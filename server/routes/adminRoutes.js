const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/authMiddleware");

const {
  getPendingUsers,
  approveUser,
  rejectUser,
  getAllUsers,
  updateUser,
  updateUserStatus,
  resetUserPassword,
  getDoctors,
  approveDoctor,
  rejectDoctor,
  getVolunteers,
  updateVolunteerStatus,
} = require("../controllers/adminController");

const adminGuard = [authMiddleware, adminOnly];

// Web admin routes
router.get("/pending", ...adminGuard, getPendingUsers);
router.patch("/approve/:id", ...adminGuard, approveUser);
router.patch("/reject/:id", ...adminGuard, rejectUser);
router.get("/users", ...adminGuard, getAllUsers);
router.put("/users/:id", ...adminGuard, updateUser);
router.patch("/:id/status", ...adminGuard, updateUserStatus);
router.put("/users/:id/status", ...adminGuard, updateUserStatus);
router.patch("/reset-password/:id", ...adminGuard, resetUserPassword);

// Mobile compatibility routes
router.get("/doctors", ...adminGuard, getDoctors);
router.put("/doctors/:id/approve", ...adminGuard, approveDoctor);
router.put("/doctors/:id/reject", ...adminGuard, rejectDoctor);
router.get("/volunteers", ...adminGuard, getVolunteers);
router.put("/volunteers/:id/status", ...adminGuard, updateVolunteerStatus);

module.exports = router;