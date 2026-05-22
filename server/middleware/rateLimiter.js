// server/middleware/rateLimiter.js

const rateLimit = require("express-rate-limit");

// ── Helpers ────────────────────────────────────────────────────────────────
const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const limitResponse = {
  ok: false,
  message: "Too many requests. Try again later.",
};

// ── Limiters ───────────────────────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: toNumber(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  max: toNumber(process.env.RATE_LIMIT_MAX, 100),
  standardHeaders: true,
  legacyHeaders: false,
  message: limitResponse,
});

const authLimiter = rateLimit({
  windowMs: toNumber(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  max: toNumber(process.env.AUTH_RATE_LIMIT_MAX, 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: limitResponse,
});

const forgotPasswordLimiter = rateLimit({
  windowMs: toNumber(
    process.env.FORGOT_PASSWORD_RATE_LIMIT_WINDOW_MS,
    60 * 60 * 1000
  ),
  max: toNumber(process.env.FORGOT_PASSWORD_RATE_LIMIT_MAX, 5),
  standardHeaders: true,
  legacyHeaders: false,
  message: limitResponse,
});

module.exports = {
  generalLimiter,
  authLimiter,
  forgotPasswordLimiter,
};

module.exports.default = module.exports;