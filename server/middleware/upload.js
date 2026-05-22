const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ── Directory setup ──────────────────────────────────────────────
const uploadsDir = path.join(__dirname, "..", "uploads");
const verificationDir = path.join(uploadsDir, "verification");
const profileDir = path.join(uploadsDir, "profiles");

[uploadsDir, verificationDir, profileDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// ── File filter ──────────────────────────────────────────────────
function fileFilter(req, file, cb) {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error("Only image and PDF files are allowed."));
  }

  cb(null, true);
}

// ── Storage ──────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination(req, file, cb) {
    const fieldName = file.fieldname;

    if (
      fieldName === "profile_image" ||
      fieldName === "profileImage" ||
      fieldName === "avatar"
    ) {
      return cb(null, profileDir);
    }

    return cb(null, verificationDir);
  },

  filename(req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const safeExt = path.extname(file.originalname).toLowerCase();

    cb(null, `${file.fieldname}-${uniqueSuffix}${safeExt}`);
  },
});

// ── Upload middleware ────────────────────────────────────────────
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: Number(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024,
  },
});

module.exports = upload;
module.exports.upload = upload;
module.exports.uploadsDir = uploadsDir;
module.exports.verificationDir = verificationDir;
module.exports.profileDir = profileDir;