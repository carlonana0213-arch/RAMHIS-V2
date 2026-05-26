// controllers/chatController.js
const ChatThread = require("../models/ChatThread");
const ChatMessage = require("../models/ChatMessage");
const User = require("../models/user");

const getUserId = (req) => {
  return req.user?._id || req.user?.id || req.userId;
};

const formatMessage = (msg, userId) => {
  const senderId = msg.sender?._id || msg.sender;

  return {
    id: msg._id,
    _id: msg._id,
    threadId: msg.thread,
    senderId,
    senderName:
      msg.sender?.full_name ||
      msg.sender?.name ||
      msg.sender?.email ||
      "User",
    message: msg.message || "",
    text: msg.message || "",
    messageType: msg.messageType || "text",
    fileUrl: msg.fileUrl || "",
    fileName: msg.fileName || "",
    fileType: msg.fileType || "",
    fileSize: msg.fileSize || 0,
    createdAt: msg.createdAt,
    updatedAt: msg.updatedAt,
    isMine: senderId?.toString() === userId.toString(),
  };
};

exports.getThreads = async (req, res) => {
  try {
    const userId = getUserId(req);

    const threads = await ChatThread.find({
      $or: [
        { participants: userId },
        { members: userId },
      ],
    })
      .populate("participants", "full_name name email role account_type")
      .populate("members", "full_name name email role account_type")
      .populate("eventId", "title date status")
      .sort({ lastMessageAt: -1, updatedAt: -1 });

    const formatted = threads.map((thread) => {
      const isGroup = thread.type === "group";

      if (isGroup) {
        const groupParticipants =
          thread.members?.length > 0
            ? thread.members
            : thread.participants || [];

        return {
          id: thread._id,
          _id: thread._id,
          type: "group",
          isGroup: true,
          name:
            thread.name ||
            thread.eventId?.title ||
            "Group Chat",
          eventId: thread.eventId?._id || thread.eventId || "",
          eventTitle:
            thread.eventId?.title ||
            thread.name ||
            "Group Chat",
          memberCount: groupParticipants.length,
          participants: groupParticipants,
          lastMessage: thread.lastMessage || "",
          updatedAt: thread.lastMessageAt || thread.updatedAt,
          unread: 0,
        };
      }

      const otherUser =
        thread.participants.find(
          (user) =>
            user._id.toString() !== userId.toString()
        ) || thread.participants[0];

      return {
        id: thread._id,
        _id: thread._id,
        type: "direct",
        isGroup: false,
        name:
          otherUser?.full_name ||
          otherUser?.name ||
          otherUser?.email ||
          "User",
        email: otherUser?.email || "",
        role:
          otherUser?.role ||
          otherUser?.account_type ||
          "User",
        lastMessage: thread.lastMessage || "",
        updatedAt: thread.lastMessageAt || thread.updatedAt,
        unread: 0,
      };
    });

    res.status(200).json({ threads: formatted });
  } catch (error) {
    console.error("getThreads error:", error);
    res.status(500).json({
      message: "Failed to load chat threads",
    });
  }
};

exports.createOrOpenDirectThread = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { userId: otherUserId } = req.body;

    if (!otherUserId) {
      return res.status(400).json({
        message: "userId is required",
      });
    }

    if (userId.toString() === otherUserId.toString()) {
      return res.status(400).json({
        message: "Cannot chat with yourself",
      });
    }

    const otherUser = await User.findById(otherUserId).select(
      "full_name name email role account_type"
    );

    if (!otherUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    let thread = await ChatThread.findOne({
      participants: {
        $all: [userId, otherUserId],
        $size: 2,
      },
    });

    if (!thread) {
      thread = await ChatThread.create({
        participants: [userId, otherUserId],
      });
    }

    res.status(200).json({
      id: thread._id,
      _id: thread._id,
      name:
        otherUser.full_name ||
        otherUser.name ||
        otherUser.email ||
        "User",
      email: otherUser.email || "",
      role:
        otherUser.role ||
        otherUser.account_type ||
        "User",
    });
  } catch (error) {
    console.error("createOrOpenDirectThread error:", error);
    res.status(500).json({
      message: "Failed to open chat",
    });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { threadId } = req.params;

    const thread = await ChatThread.findOne({
      _id: threadId,
      $or: [
        { participants: userId },
        { members: userId },
      ],
    });

    if (!thread) {
      return res.status(404).json({
        message: "Thread not found",
      });
    }

    const messages = await ChatMessage.find({
      thread: threadId,
    })
      .populate("sender", "full_name name email")
      .sort({ createdAt: 1 });

    const formatted = messages.map((msg) =>
      formatMessage(msg, userId)
    );

    res.status(200).json({ messages: formatted });
  } catch (error) {
    console.error("getMessages error:", error);
    res.status(500).json({
      message: "Failed to load messages",
    });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { threadId } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        message: "Message is required",
      });
    }

    const thread = await ChatThread.findOne({
      _id: threadId,
      $or: [
        { participants: userId },
        { members: userId },
      ],
    });

    if (!thread) {
      return res.status(404).json({
        message: "Thread not found",
      });
    }

    const newMessage = await ChatMessage.create({
      thread: threadId,
      sender: userId,
      message: message.trim(),
      messageType: "text",
      readBy: [userId],
    });

    thread.lastMessage = message.trim();
    thread.lastMessageAt = new Date();
    await thread.save();

    const populatedMessage = await ChatMessage.findById(newMessage._id)
      .populate("sender", "full_name name email");

    res.status(201).json(formatMessage(populatedMessage, userId));
  } catch (error) {
    console.error("sendMessage error:", error);
    res.status(500).json({
      message: "Failed to send message",
    });
  }
};

exports.sendFileMessage = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { threadId } = req.params;
    const { message = "" } = req.body;

    if (!req.file) {
      return res.status(400).json({
        message: "File is required",
      });
    }

    const thread = await ChatThread.findOne({
      _id: threadId,
      $or: [
        { participants: userId },
        { members: userId },
      ],
    });

    if (!thread) {
      return res.status(404).json({
        message: "Thread not found",
      });
    }

    const normalizedPath = req.file.path
      .replace(/\\/g, "/")
      .replace(/^.*uploads\//, "uploads/");

    const fileUrl = `${req.protocol}://${req.get("host")}/${normalizedPath}`;

    const originalName = (req.file.originalname || "").toLowerCase();

const isImage =
  req.file.mimetype?.startsWith("image/") ||
  originalName.endsWith(".jpg") ||
  originalName.endsWith(".jpeg") ||
  originalName.endsWith(".png") ||
  originalName.endsWith(".gif") ||
  originalName.endsWith(".webp");

    const newMessage = await ChatMessage.create({
      thread: threadId,
      sender: userId,
      message: message.trim(),
      messageType: isImage ? "image" : "file",
      fileUrl,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      readBy: [userId],
    });

    thread.lastMessage = isImage
      ? `📷 ${req.file.originalname}`
      : `📎 ${req.file.originalname}`;

    thread.lastMessageAt = new Date();
    await thread.save();

    const populatedMessage = await ChatMessage.findById(newMessage._id)
      .populate("sender", "full_name name email");

    res.status(201).json(formatMessage(populatedMessage, userId));
  } catch (error) {
    console.error("sendFileMessage error:", error);
    res.status(500).json({
      message: "Failed to send file",
    });
  }
};