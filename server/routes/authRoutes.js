const express = require("express");
const router = express.Router();
const {
  register,
  login,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");const auth = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const { updateMe } = require("../controllers/authController");
const { getMe } = require("../controllers/authController");
const bcrypt = require("bcryptjs");

router.get("/someProtectedRoute", auth, (req, res) => {
  res.json({
    msg: "Protected route working",
    user: req.user,
  });
});
router.put("/me", auth, updateMe);
router.post("/register", register);
router.post("/signup", register);
router.post("/login", login);
router.post(
  "/forgot-password",
  forgotPassword,
);

router.post(
  "/reset-password",
  resetPassword,
);
router.get("/me", auth, getMe);
router.post("/change-password", auth, async (req, res) => {
  try {
    const { newPassword } = req.body;

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);

    const user = await require("../models/user").findById(req.user.id);

    user.password = hashed;
    user.mustChangePassword = false;
    user.tempPassword = undefined;

    await user.save();

    res.json({ msg: "Password updated" });
  } catch (err) {
    res.status(500).json({ msg: "Failed to update password" });
  }
});

module.exports = router;




