const express = require("express");

const router = express.Router();

const {
  openDirectThread,
  getThreads,
  getMessages,
  sendMessage,
} = require("../controllers/chatController");

const authMiddleware = require("../middleware/authMiddleware");

// ── All chat routes protected ────────────────────────────────────
router.use(authMiddleware);

// ── Thread routes ────────────────────────────────────────────────

// POST /api/chat/direct
router.post("/direct", openDirectThread);

// GET /api/chat/threads
router.get("/threads", getThreads);

// ── Message routes ───────────────────────────────────────────────

// GET /api/chat/threads/:threadId/messages
router.get("/threads/:threadId/messages", getMessages);

// POST /api/chat/threads/:threadId/messages
router.post("/threads/:threadId/messages", sendMessage);

module.exports = router;