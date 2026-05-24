// routes/chatRoutes.js
const express = require("express");
const router = express.Router();

const chatController = require("../controllers/chatController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/threads", authMiddleware, chatController.getThreads);
router.post("/direct", authMiddleware, chatController.createOrOpenDirectThread);
router.get("/threads/:threadId/messages", authMiddleware, chatController.getMessages);
router.post("/threads/:threadId/messages", authMiddleware, chatController.sendMessage);

module.exports = router;