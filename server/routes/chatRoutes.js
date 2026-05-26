// routes/chatRoutes.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

const chatController = require("../controllers/chatController");
const authMiddleware = require("../middleware/authMiddleware");

const uploadDir = path.join(__dirname, "../uploads/chat");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${path.extname(file.originalname)}`;

    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

router.get(
  "/threads",
  authMiddleware,
  chatController.getThreads
);

router.post(
  "/direct",
  authMiddleware,
  chatController.createOrOpenDirectThread
);

router.post(
  "/threads",
  authMiddleware,
  chatController.createOrOpenDirectThread
);

router.get(
  "/threads/:threadId/messages",
  authMiddleware,
  chatController.getMessages
);

router.post(
  "/threads/:threadId/messages",
  authMiddleware,
  chatController.sendMessage
);

router.post(
  "/threads/:threadId/files",
  authMiddleware,
  upload.single("file"),
  chatController.sendFileMessage
);

router.get(
  "/threads/:id/messages",
  authMiddleware,
  (req, res, next) => {
    req.params.threadId = req.params.id;
    next();
  },
  chatController.getMessages
);

router.post(
  "/threads/:id/messages",
  authMiddleware,
  (req, res, next) => {
    req.params.threadId = req.params.id;
    next();
  },
  chatController.sendMessage
);

router.post(
  "/threads/:id/files",
  authMiddleware,
  (req, res, next) => {
    req.params.threadId = req.params.id;
    next();
  },
  upload.single("file"),
  chatController.sendFileMessage
);

module.exports = router;