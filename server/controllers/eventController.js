const Event = require("../models/Event");
const ChatThread = require("../models/ChatThread");
const logAudit = require("../utils/auditLogger");

let io = null;

exports.initEventController = (socketIo) => {
  io = socketIo;
};

const emitEventsUpdated = (eventId = null) => {
  if (io) {
    io.emit("events_updated", { eventId });
  }
};

const checkOngoingEventConflict = async (excludeEventId = null) => {
  const query = {
    status: "Ongoing",
  };

  if (excludeEventId) {
    query._id = {
      $ne: excludeEventId,
    };
  }

  return Event.findOne(query);
};

const emitMissionStarted = (event) => {
  if (io) {
    io.emit("mission_started", {
      eventId: event._id,
      eventTitle: event.title,
      message: "New mission started. Patient list has been reset.",
    });
  }
};

const emitMissionCompleted = (event) => {
  if (io) {
    io.emit("mission_completed", {
      eventId: event._id,
      eventTitle: event.title,
    });
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

// GET /api/events/current-mission
exports.getCurrentMission = async (req, res) => {
  try {
    const ongoingEvent = await Event.findOne({
      status: "Ongoing",
    })
      .populate("createdBy", "name email role")
      .populate("participants.userId", "name email role");

    res.status(200).json({
      ok: true,
      data: {
        event: ongoingEvent || null,
        hasOngoingMission: !!ongoingEvent,
      },
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Failed to fetch current mission",
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
      latitude,
      longitude,
      googleMapsUrl,
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

    if (status === "Ongoing") {
      const existingOngoingEvent = await checkOngoingEventConflict();

      if (existingOngoingEvent) {
        return res.status(400).json({
          ok: false,
          message:
            "Another event is already ongoing. Complete it first before starting a new one.",
        });
      }
    }

    const event = await Event.create({
      title,
      description,
      location,

      latitude:
        latitude !== null && latitude !== undefined && latitude !== ""
          ? Number(latitude)
          : null,

      longitude:
        longitude !== null && longitude !== undefined && longitude !== ""
          ? Number(longitude)
          : null,

      googleMapsUrl: googleMapsUrl || "",

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

    if (event.status === "Ongoing") {
      emitMissionStarted(event);
    }
    await logAudit(req, {
      module: "Events",
      action: "Create Event",
      description: `Created event ${event.title}.`,
      targetId: event._id,
      targetName: event.title,
      location: event.location,
      eventId: event._id,
      eventTitle: event.title,
      metadata: {
        type: event.type,
        status: event.status,
        date: event.date,
      },
    });

    res.status(201).json({
      ok: true,
      message: "Event created successfully",
      data: event,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        ok: false,
        message:
          "Another event is already ongoing. Complete it first before starting a new one.",
      });
    }

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
    const previousEvent = await Event.findById(req.params.id);

    if (!previousEvent) {
      return res.status(404).json({
        ok: false,
        message: "Event not found",
      });
    }

    if (req.body.status === "Ongoing") {
      const existingOngoingEvent = await checkOngoingEventConflict(
        req.params.id,
      );

      if (existingOngoingEvent) {
        return res.status(400).json({
          ok: false,
          message:
            "Another event is already ongoing. Complete it first before starting a new one.",
        });
      }
    }

    const event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("createdBy", "name email role")
      .populate("participants.userId", "name email role");

    emitEventsUpdated(event._id);

    if (req.body.status === "Ongoing" && previousEvent.status !== "Ongoing") {
      emitMissionStarted(event);
    }

    if (
      req.body.status === "Completed" &&
      previousEvent.status !== "Completed"
    ) {
      emitMissionCompleted(event);
    }
    await logAudit(req, {
      module: "Events",
      action: "Update Event",
      description: `Updated event ${event.title}.`,
      targetId: event._id,
      targetName: event.title,
      location: event.location,
      eventId: event._id,
      eventTitle: event.title,
      metadata: {
        updatedFields: Object.keys(req.body || {}),
        type: event.type,
        status: event.status,
      },
    });

    res.status(200).json({
      ok: true,
      message: "Event updated successfully",
      data: event,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        ok: false,
        message:
          "Another event is already ongoing. Complete it first before starting a new one.",
      });
    }

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

    await logAudit(req, {
      module: "Events",
      action: "Delete Event",
      description: `Deleted event ${event.title}.`,
      targetId: event._id,
      targetName: event.title,
      location: event.location,
      eventId: event._id,
      eventTitle: event.title,
    });

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
      (participant) => participant.userId.toString() === userId.toString(),
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

    await logAudit(req, {
      module: "Events",
      action: "Join Event",
      description: `Submitted join request for ${event.title}.`,
      targetId: event._id,
      targetName: event.title,
      location: event.location,
      eventId: event._id,
      eventTitle: event.title,
    });

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
      (participant) => participant.userId.toString() !== userId.toString(),
    );

    await event.save();

    emitEventsUpdated(event._id);

    await logAudit(req, {
      module: "Events",
      action: "Leave Event",
      description: `Cancelled join request for ${event.title}.`,
      targetId: event._id,
      targetName: event.title,
      location: event.location,
      eventId: event._id,
      eventTitle: event.title,
    });

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
      (item) => item.userId.toString() === userId.toString(),
    );

    if (!participant) {
      return res.status(404).json({
        ok: false,
        message: "Participant not found",
      });
    }

    participant.status = status;

    await event.save();

    if (status === "Approved") {
      const adminId = event.createdBy || req.user?._id || req.user?.id;

      let groupChat = await ChatThread.findOne({
        eventId: event._id,
        type: "group",
      });

      if (!groupChat) {
        groupChat = await ChatThread.create({
          type: "group",
          name: event.title,
          eventId: event._id,
          members: [userId],
          participants: [adminId, userId].filter(Boolean),
          lastMessage: `Welcome to ${event.title} group chat!`,
          lastMessageAt: new Date(),
        });
      } else {
        await ChatThread.findByIdAndUpdate(groupChat._id, {
          $addToSet: {
            members: userId,
            participants: {
              $each: [adminId, userId].filter(Boolean),
            },
          },
          lastMessageAt: new Date(),
        });
      }

      if (io) {
        io.to(userId.toString()).emit("group_chat_created", {
          eventId: event._id,
          eventTitle: event.title,
          threadId: groupChat._id,
          message: `You have been approved for ${event.title} and added to the group chat.`,
        });
      }
    }

    if (status === "Rejected") {
      const groupChat = await ChatThread.findOne({
        eventId: event._id,
        type: "group",
      });

      if (groupChat) {
        await ChatThread.findByIdAndUpdate(groupChat._id, {
          $pull: {
            members: userId,
            participants: userId,
          },
        });
      }
    }

    const updatedEvent = await Event.findById(eventId)
      .populate("createdBy", "name email role")
      .populate("participants.userId", "name email role");

    emitEventsUpdated(eventId);

    await logAudit(req, {
      module: "Events",
      action: `${status} Event Participant`,
      description: `Marked participant as ${status} for ${event.title}.`,
      targetId: event._id,
      targetName: event.title,
      location: event.location,
      eventId: event._id,
      eventTitle: event.title,
      metadata: {
        participantId: userId,
        participantStatus: status,
      },
    });

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
