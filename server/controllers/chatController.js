const {
  ObjectId,
  usersCol,
  chatThreadsCol,
  chatMessagesCol,
} = require("../config/db");

// ── Helpers ──────────────────────────────────────────────────────
function safeObjectId(id) {
  if (!ObjectId.isValid(String(id || ""))) {
    return null;
  }

  return new ObjectId(id);
}

function normalizeFullName(user) {
  if (!user) return "User";

  const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();

  return fullName || user.name || "User";
}

function getCurrentUserId(req) {
  return String(req.user?._id || req.user?.id || "");
}

function formatMessage(message) {
  return {
    _id: String(message._id),
    id: String(message._id),
    thread_id: String(message.thread_id),
    threadId: String(message.thread_id),
    sender_id: String(message.sender_id || ""),
    senderId: String(message.sender_id || ""),
    message: message.message || "",
    created_at: message.created_at || new Date(),
    createdAt: message.created_at || new Date(),
  };
}

function formatThread(thread, myId) {
  const otherProfile =
    (thread.member_profiles || []).find(
      (profile) => String(profile.user_id) !== String(myId)
    ) || null;

  return {
    _id: String(thread._id),
    id: String(thread._id),
    name: otherProfile?.display_name || thread.name || "User Chat",
    type: thread.type || "direct",
    member_ids: thread.member_ids || [],
    member_profiles: thread.member_profiles || [],
    last_message: thread.last_message || "No messages yet",
    lastMessage: thread.last_message || "No messages yet",
    unread: Number(thread.unread_map?.[myId] || 0),
    updated_at: thread.updated_at || thread.created_at || new Date(),
    updatedAt: thread.updated_at || thread.created_at || new Date(),
  };
}

// ── Open or create direct thread ─────────────────────────────────
async function openDirectThread(req, res, next) {
  try {
    const otherUserId = String(req.body.userId || "").trim();
    const myId = getCurrentUserId(req);

    if (!ObjectId.isValid(otherUserId)) {
      return res.status(400).json({
        ok: false,
        message: "Valid userId is required.",
      });
    }

    if (!myId || otherUserId === myId) {
      return res.status(400).json({
        ok: false,
        message: "You cannot chat with yourself.",
      });
    }

    const otherUser = await usersCol().findOne({
      _id: new ObjectId(otherUserId),
      $or: [
        { status: "active" },
        { verificationStatus: "Approved" },
        { is_verified: true },
      ],
    });

    if (!otherUser) {
      return res.status(404).json({
        ok: false,
        message: "Approved user not found.",
      });
    }

    const theirId = String(otherUser._id);
    const sortedMemberIds = [String(myId), String(theirId)].sort();

    let thread = await chatThreadsCol().findOne({
      type: "direct",
      member_ids: sortedMemberIds,
    });

    if (!thread) {
      const insertResult = await chatThreadsCol().insertOne({
        type: "direct",
        member_ids: sortedMemberIds,
        created_by: myId,
        created_at: new Date(),
        updated_at: new Date(),
        last_message: "",
        unread_map: {
          [myId]: 0,
          [theirId]: 0,
        },
        member_profiles: [
          {
            user_id: myId,
            display_name: normalizeFullName(req.user),
            account_type: req.user.account_type || req.user.role || "user",
          },
          {
            user_id: theirId,
            display_name: normalizeFullName(otherUser),
            account_type: otherUser.account_type || otherUser.role || "user",
          },
        ],
      });

      thread = await chatThreadsCol().findOne({
        _id: insertResult.insertedId,
      });
    }

    const formattedThread = formatThread(thread, myId);

    return res.json({
      ok: true,
      id: formattedThread.id,
      name: formattedThread.name,
      thread: formattedThread,
    });
  } catch (error) {
    next(error);
  }
}

// ── Get all threads ──────────────────────────────────────────────
async function getThreads(req, res, next) {
  try {
    const myId = getCurrentUserId(req);

    const threads = await chatThreadsCol()
      .find({
        member_ids: myId,
      })
      .sort({
        updated_at: -1,
      })
      .toArray();

    return res.json({
      ok: true,
      threads: threads.map((thread) => formatThread(thread, myId)),
    });
  } catch (error) {
    next(error);
  }
}

// ── Get messages for a thread ────────────────────────────────────
async function getMessages(req, res, next) {
  try {
    const threadObjectId = safeObjectId(req.params.threadId);
    const myId = getCurrentUserId(req);

    if (!threadObjectId) {
      return res.status(400).json({
        ok: false,
        message: "Invalid thread id.",
      });
    }

    const thread = await chatThreadsCol().findOne({
      _id: threadObjectId,
      member_ids: myId,
    });

    if (!thread) {
      return res.status(404).json({
        ok: false,
        message: "Thread not found.",
      });
    }

    const messages = await chatMessagesCol()
      .find({
        thread_id: threadObjectId,
      })
      .sort({
        created_at: 1,
      })
      .toArray();

    await chatThreadsCol().updateOne(
      {
        _id: threadObjectId,
      },
      {
        $set: {
          [`unread_map.${myId}`]: 0,
        },
      }
    );

    return res.json({
      ok: true,
      messages: messages.map(formatMessage),
    });
  } catch (error) {
    next(error);
  }
}

// ── Send message ─────────────────────────────────────────────────
async function sendMessage(req, res, next) {
  try {
    const threadObjectId = safeObjectId(req.params.threadId);
    const message = String(req.body.message || "").trim();
    const myId = getCurrentUserId(req);

    if (!threadObjectId) {
      return res.status(400).json({
        ok: false,
        message: "Invalid thread id.",
      });
    }

    if (!message) {
      return res.status(400).json({
        ok: false,
        message: "Message is required.",
      });
    }

    const thread = await chatThreadsCol().findOne({
      _id: threadObjectId,
      member_ids: myId,
    });

    if (!thread) {
      return res.status(404).json({
        ok: false,
        message: "Thread not found.",
      });
    }

    const now = new Date();

    const messageDoc = {
      thread_id: threadObjectId,
      sender_id: myId,
      message,
      created_at: now,
    };

    const insertResult = await chatMessagesCol().insertOne(messageDoc);

    const unreadMap = {
      ...(thread.unread_map || {}),
    };

    for (const memberId of thread.member_ids || []) {
      const memberKey = String(memberId);

      unreadMap[memberKey] =
        memberKey === myId ? 0 : Number(unreadMap[memberKey] || 0) + 1;
    }

    await chatThreadsCol().updateOne(
      {
        _id: threadObjectId,
      },
      {
        $set: {
          last_message: message,
          updated_at: now,
          unread_map: unreadMap,
        },
      }
    );

    const savedMessage = {
      _id: insertResult.insertedId,
      ...messageDoc,
    };

    return res.status(201).json({
      ok: true,
      message: formatMessage(savedMessage),
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  openDirectThread,
  getThreads,
  getMessages,
  sendMessage,
};