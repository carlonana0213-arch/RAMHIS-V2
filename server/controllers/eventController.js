const Event = require("../models/Event");

let io = null;

exports.initEventController = (socketIo) => {
  io = socketIo;
};

const emitEventsUpdated = (eventId = null) => {
  if (io) {
    io.emit("events_updated", { eventId });
  }
};

// GET /api/events
exports.getAllEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .populate("createdBy", "name email role")
      .populate("participants.userId", "name email role")
      .sort({ date: 1, createdAt: -1 });

    res.status(200).json({
      ok: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Failed to fetch events",
      error: error.message,
    });
  }
};

// GET /api/events/:id
exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("createdBy", "name email role")
      .populate("participants.userId", "name email role");

    if (!event) {
      return res.status(404).json({
        ok: false,
        message: "Event not found",
      });
    }

    res.status(200).json({
      ok: true,
      data: event,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Failed to fetch event",
      error: error.message,
    });
  }
};

// POST /api/events
exports.createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      location,
      date,
      startTime,
      endTime,
      type,
      status,
      imageUrl,
    } = req.body;

    if (!title || !location || !date || !type) {
      return res.status(400).json({
        ok: false,
        message: "Title, location, date, and type are required",
      });
    }

    const event = await Event.create({
      title,
      description,
      location,
      date,
      startTime,
      endTime,
      type,
      status,
      imageUrl,
      createdBy: req.user?._id || req.user?.id,
      participants: [],
    });

    emitEventsUpdated(event._id);

    res.status(201).json({
      ok: true,
      message: "Event created successfully",
      data: event,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Failed to create event",
      error: error.message,
    });
  }
};

// PUT /api/events/:id
exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("createdBy", "name email role")
      .populate("participants.userId", "name email role");

    if (!event) {
      return res.status(404).json({
        ok: false,
        message: "Event not found",
      });
    }

    emitEventsUpdated(event._id);

    res.status(200).json({
      ok: true,
      message: "Event updated successfully",
      data: event,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Failed to update event",
      error: error.message,
    });
  }
};

// DELETE /api/events/:id
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);

    if (!event) {
      return res.status(404).json({
        ok: false,
        message: "Event not found",
      });
    }

    emitEventsUpdated(event._id);

    res.status(200).json({
      ok: true,
      message: "Event deleted successfully",
      data: event,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Failed to delete event",
      error: error.message,
    });
  }
};

// POST /api/events/:id/join
exports.joinEvent = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        ok: false,
        message: "Event not found",
      });
    }

    if (event.registrationOpen === false) {
      return res.status(400).json({
        ok: false,
        message: "Registration is closed for this event.",
      });
    }

    if (event.status === "Completed" || event.status === "Cancelled") {
      return res.status(400).json({
        ok: false,
        message: "This event is no longer accepting participants.",
      });
    }

    const alreadyJoined = event.participants.some(
      (participant) => participant.userId.toString() === userId.toString()
    );

    if (alreadyJoined) {
      return res.status(400).json({
        ok: false,
        message: "You already joined/applied for this event",
      });
    }

    event.participants.push({
      userId,
      status: "Pending",
      joinedAt: new Date(),
    });

    await event.save();

    emitEventsUpdated(event._id);

    res.status(200).json({
      ok: true,
      message: "Join request submitted successfully",
      data: event,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Failed to join event",
      error: error.message,
    });
  }
};

// POST /api/events/:id/leave
exports.leaveEvent = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        ok: false,
        message: "Event not found",
      });
    }

    event.participants = event.participants.filter(
      (participant) => participant.userId.toString() !== userId.toString()
    );

    await event.save();

    emitEventsUpdated(event._id);

    res.status(200).json({
      ok: true,
      message: "Request cancelled.",
      data: event,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Failed to cancel request",
      error: error.message,
    });
  }
};

// PATCH /api/events/:eventId/participants/:userId/status
exports.updateParticipantStatus = async (req, res) => {
  try {
    const { eventId, userId } = req.params;
    const { status } = req.body;

    if (!["Pending", "Approved", "Rejected"].includes(status)) {
      return res.status(400).json({
        ok: false,
        message: "Invalid participant status",
      });
    }

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        ok: false,
        message: "Event not found",
      });
    }

    const participant = event.participants.find(
      (item) => item.userId.toString() === userId.toString()
    );

    if (!participant) {
      return res.status(404).json({
        ok: false,
        message: "Participant not found",
      });
    }

    participant.status = status;

    await event.save();

    const updatedEvent = await Event.findById(eventId)
      .populate("createdBy", "name email role")
      .populate("participants.userId", "name email role");

    emitEventsUpdated(eventId);

    res.status(200).json({
      ok: true,
      message: `Participant marked as ${status}`,
      data: updatedEvent,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Failed to update participant status",
      error: error.message,
    });
  }
};