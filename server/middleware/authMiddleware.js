const jwt = require("jsonwebtoken");
const User = require("../models/user");

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("❌ JWT_SECRET is missing");
  process.exit(1);
}

async function authMiddleware(req, res, next) {
  try {
    const authHeader = String(
      req.headers.authorization || ""
    );

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;

    if (!token) {
      return res.status(401).json({
        ok: false,
        message: "No token, authorization denied",
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return res.status(401).json({
        ok: false,
        message: "Invalid or expired token",
      });
    }

    const userId =
      decoded.id ||
      decoded._id ||
      decoded.userId;

    if (!userId) {
      return res.status(401).json({
        ok: false,
        message: "Invalid token payload",
      });
    }

    // ── USE MONGOOSE MODEL ─────────────────────
    const user = await User.findById(userId).select(
      "-password -password_hash -tempPassword -refresh_token -reset_token -reset_token_expiry"
    );

    if (!user) {
      return res.status(401).json({
        ok: false,
        message: "User not found",
      });
    }

    // Normalize role
    if (user.role) {
      user.role = String(user.role)
        .toLowerCase()
        .trim();
    }

    req.user = user;
    req.auth = decoded;

    return next();
  } catch (error) {
    return next(error);
  }
}

// ── Admin guard ───────────────────────────────
function adminOnly(req, res, next) {
  const role = String(
    req.user?.role || ""
  ).toLowerCase();

  if (role !== "admin") {
    return res.status(403).json({
      ok: false,
      message: "Admin access only",
    });
  }

  return next();
}

module.exports = authMiddleware;
module.exports.authMiddleware = authMiddleware;
module.exports.adminOnly = adminOnly;