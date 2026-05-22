// ── Chat socket handler ──────────────────────────────────────────
function registerChatSocket(io) {
  io.on("connection", (socket) => {
    console.log("⚡ User connected:", socket.id);

    // ── Join thread room ─────────────────────────────────────────
    socket.on("join_room", (threadId) => {
      if (!threadId) return;

      const roomId = String(threadId);

      socket.join(roomId);

      console.log(`👥 Joined room: ${roomId}`);
    });

    // ── Leave thread room ────────────────────────────────────────
    socket.on("leave_room", (threadId) => {
      if (!threadId) return;

      const roomId = String(threadId);

      socket.leave(roomId);

      console.log(`🚪 Left room: ${roomId}`);
    });

    // ── Send realtime message ────────────────────────────────────
    socket.on("send_message", (data) => {
      const { threadId, senderId, message } = data || {};

      if (!threadId || !message) return;

      const payload = {
        id: data.id || "",
        _id: data._id || data.id || "",
        threadId: String(threadId),
        thread_id: String(threadId),
        senderId: senderId || "",
        sender_id: senderId || "",
        message: String(message),
        createdAt: data.createdAt || new Date().toISOString(),
        created_at: data.created_at || new Date(),
      };

      socket.to(String(threadId)).emit("receive_message", payload);
      socket.to(String(threadId)).emit("message_received", payload);
    });

    // ── Typing indicator ─────────────────────────────────────────
    socket.on("typing", (data) => {
      const { threadId, userId } = data || {};

      if (!threadId) return;

      socket.to(String(threadId)).emit("typing", {
        threadId: String(threadId),
        userId: userId || "",
      });
    });

    // ── Stop typing indicator ────────────────────────────────────
    socket.on("stop_typing", (data) => {
      const { threadId, userId } = data || {};

      if (!threadId) return;

      socket.to(String(threadId)).emit("stop_typing", {
        threadId: String(threadId),
        userId: userId || "",
      });
    });

    // ── Disconnect ───────────────────────────────────────────────
    socket.on("disconnect", () => {
      console.log("❌ User disconnected:", socket.id);
    });
  });
}

module.exports = registerChatSocket;