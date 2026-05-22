const express = require("express");
const router = express.Router();

const {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  joinEvent,
  updateParticipantStatus,
} = require("../controllers/eventController");

const protect = require("../middleware/protect");

// Public / authenticated event viewing
router.get("/", protect, getAllEvents);
router.get("/:id", protect, getEventById);

// Admin event management
router.post("/", protect, createEvent);
router.put("/:id", protect, updateEvent);
router.delete("/:id", protect, deleteEvent);

// Mobile user join event
router.post("/:id/join", protect, joinEvent);

// Admin participant approval/rejection
router.patch(
  "/:eventId/participants/:userId/status",
  protect,
  updateParticipantStatus
);

module.exports = router;