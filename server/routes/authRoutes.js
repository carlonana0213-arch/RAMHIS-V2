const express = require("express");
const router = express.Router();

const {
  register,
  login,
  forgotPassword,
  resetPassword,
  updateMe,
  getMe,
} = require("../controllers/authController");

const auth = require("../middleware/authMiddleware");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadRoot = process.env.UPLOAD_ROOT || path.join(__dirname, "../uploads");
const uploadDir = path.join(uploadRoot, "verification");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, "-");
    const uniqueName = `${Date.now()}-${Math.round(
      Math.random() * 1e9,
    )}-${safeName}`;

    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
});

const proofUpload = upload.fields([
  { name: "proofOfLicense", maxCount: 1 },
  { name: "proofOfDoctorate", maxCount: 1 },
  { name: "licenseProof", maxCount: 1 },
  { name: "doctorateProof", maxCount: 1 },
  { name: "license_file", maxCount: 1 },
  { name: "doctorate_file", maxCount: 1 },
  { name: "license", maxCount: 1 },
  { name: "doctorate", maxCount: 1 },
]);

router.get("/someProtectedRoute", auth, (req, res) => {
  res.json({
    msg: "Protected route working",
    user: req.user,
  });
});

router.put("/me", auth, updateMe);

router.post("/register", proofUpload, register);

router.post("/signup", proofUpload, register);

router.post("/login", login);

router.post("/forgot-password", forgotPassword);

router.post("/reset-password", resetPassword);

router.get("/reset-password", (req, res) => {
  const { token } = req.query;

  return res.redirect(`ramhis://reset-password?token=${token}`);
});

router.get("/me", auth, getMe);

router.post("/change-password", auth, async (req, res) => {
  try {
    const { newPassword } = req.body;

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);

    const user = await require("../models/user").findById(req.user.id);

    user.password = hashed;
    user.password_hash = hashed;
    user.mustChangePassword = false;
    user.tempPassword = undefined;

    await user.save();

    res.json({ msg: "Password updated" });
  } catch (err) {
    res.status(500).json({ msg: "Failed to update password" });
  }
});

module.exports = router;