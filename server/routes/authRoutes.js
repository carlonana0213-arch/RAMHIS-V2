const express = require("express");

const router = express.Router();

const {
  resetPasswordPage,
  register,
  signup,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  updateMe,
  getMe,
  changePassword,
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");

let forgotPasswordLimiter = (req, res, next) => next();

try {
  const rateLimiter = require("../middleware/rateLimiter");

  forgotPasswordLimiter =
    rateLimiter.forgotPasswordLimiter ||
    forgotPasswordLimiter;
} catch (error) {
  console.warn("⚠️ rateLimiter not found, skipped.");
}

let upload = {
  single: () => (req, res, next) => next(),
};

try {
  const uploadMiddleware = require("../middleware/upload");

  upload = uploadMiddleware.upload || uploadMiddleware;
} catch (error) {
  console.warn("⚠️ upload middleware not found, skipped.");
}

router.get("/reset-password", resetPasswordPage);
router.post("/register", register);
router.post("/signup", upload.single("license_file"), signup);
router.post("/login", login);
router.post("/refresh", refreshToken);
router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);
router.post("/reset-password", resetPassword);

router.get("/me", authMiddleware, getMe);
router.put("/me", authMiddleware, updateMe);
router.post("/logout", authMiddleware, logout);
router.post("/change-password", authMiddleware, changePassword);

module.exports = router;