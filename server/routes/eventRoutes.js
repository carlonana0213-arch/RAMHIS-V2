const express = require("express");
const router = express.Router();

const {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  joinEvent,
  leaveEvent,
  updateParticipantStatus,
  getOngoingEvent,
} = require("../controllers/eventController");

const protect = require("../middleware/protect");

// Public event viewing
router.get("/", getAllEvents);
router.get("/current/ongoing", getOngoingEvent);
router.get("/:id", getEventById);

// Admin event management
router.post("/", protect, createEvent);
router.put("/:id", protect, updateEvent);
router.delete("/:id", protect, deleteEvent);

// Mobile user join / leave event
router.post("/:id/join", protect, joinEvent);
router.post("/:id/leave", protect, leaveEvent);

// Admin participant approval/rejection
router.patch(
  "/:eventId/participants/:userId/status",
  protect,
  updateParticipantStatus
);

module.exports = router;