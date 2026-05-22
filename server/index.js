require("dotenv").config();

const http = require("http");
const path = require("path");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { Server } = require("socket.io");

const connectDB = require("./config/db");


const app = express();
const PORT = process.env.PORT || 5000;

// ── Allowed frontend origins ──────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:3000",
  "http://localhost:5173",
].filter(Boolean);

// ── Core middleware ───────────────────────────────────────────────
app.disable("x-powered-by");

app.use(
  helmet({
    contentSecurityPolicy: false,
    hsts: {
      maxAge: process.env.NODE_ENV === "production" ? 31536000 : 0,
      includeSubDomains: true,
      preload: true,
    },
  })
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Static uploads ────────────────────────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── Rate limiting ────────────────────────────────────────────────
app.use(
  rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    max: Number(process.env.RATE_LIMIT_MAX) || 100,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// ── Logger middleware (from old backend) ─────────────────────────
try {
  const logger = require("./middleware/logger");
  app.use(logger);
} catch (error) {
  console.warn("⚠️ logger middleware not found, skipped.");
}

// ── Health check ─────────────────────────────────────────────────
app.get("/", (_req, res) => {
  return res.json({
    ok: true,
    message: "RAMHIS API Running",
  });
});

// ── Safe route loader ────────────────────────────────────────────
function mountRoute(basePath, routePath) {
  try {
    require.resolve(routePath);

    const router = require(routePath);

    app.use(basePath, router);

    console.log(`✅ Mounted ${basePath} -> ${routePath}`);
  } catch (error) {
    if (
      error.code === "MODULE_NOT_FOUND" &&
      error.message.includes(routePath)
    ) {
      console.warn(`⚠️ Route file not found, skipped: ${routePath}`);
      return;
    }

    throw error;
  }
}

// ── NEW web routes ───────────────────────────────────────────────
mountRoute("/api/auth", "./routes/authRoutes");
mountRoute("/api/patients", "./routes/patientRoutes");
mountRoute("/api/chat", "./routes/chatRoutes");
mountRoute("/api/events", "./routes/eventRoutes");
mountRoute("/api/users", "./routes/userRoutes");
mountRoute("/api/prescriptions", "./routes/prescriptionRoutes");
mountRoute("/api/pharmacy", "./routes/pharmacyRoutes");
mountRoute("/api/admin", "./routes/adminRoutes");
mountRoute("/api/analytics", "./routes/analytics");
mountRoute("/api/dashboard", "./routes/dashboardRoutes");

// ── HTTP + Socket.IO server ──────────────────────────────────────
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins.length ? allowedOrigins : "*",
    credentials: true,
  },
});

// ── OLD chat socket support ──────────────────────────────────────
try {
  require.resolve("./sockets/chat.socket");

  const registerChatSocket = require("./sockets/chat.socket");

  registerChatSocket(io);
} catch (error) {
  if (error.code === "MODULE_NOT_FOUND") {
    console.warn("⚠️ chat.socket not found, skipped.");
  } else {
    throw error;
  }
}

// ── OLD event controller socket init ─────────────────────────────
try {
  require.resolve("./controllers/eventController");

  const {
    initEventController,
  } = require("./controllers/eventController");

  if (typeof initEventController === "function") {
    initEventController(io);
  }
} catch (error) {
  if (error.code === "MODULE_NOT_FOUND") {
    console.warn("⚠️ eventController not found, skipped.");
  } else {
    throw error;
  }
}


// ── 404 handler ──────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    ok: false,
    message: "Route not found",
  });
});

// ── Global error handler ─────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.stack);

  // Prevent headers already sent issue
  if (res.headersSent) {
    return next(err);
  }

  res.status(err.status || 500).json({
    ok: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : err.message || "Internal Server Error",

    // Show stack only in development
    stack:
      process.env.NODE_ENV === "development"
        ? err.stack
        : undefined,
  });
});

// ── Start server ─────────────────────────────────────────────────
async function startServer() {
  try {
    await connectDB();

    server.listen(PORT, () => {
      console.log(
        `🚀 Server running with Socket.IO on port ${PORT}`
      );
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

module.exports = { app, server, io };