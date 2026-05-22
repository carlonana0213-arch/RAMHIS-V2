const jwt = require("jsonwebtoken");

// ── JWT secret guard ─────────────────────────────────────────────
if (!process.env.JWT_SECRET) {
  console.error("❌ JWT_SECRET is not set");
  process.exit(1);
}

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Missing token
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      ok: false,
      message: "Not authorized.",
    });
  }

  try {
    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ⚠️ This only stores token payload, not full DB user.
    // Use authMiddleware.js if the route needs req.user.email, req.user.name, etc.
    req.user = decoded;

    return next();
  } catch (err) {
    return res.status(401).json({
      ok: false,
      message: "Token invalid.",
    });
  }
};

module.exports = protect;