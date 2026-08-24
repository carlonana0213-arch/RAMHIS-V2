require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const pharmacyRoutes = require("./routes/pharmacyRoutes");
const analyticsRoutes = require("./routes/analytics");
const dashboardRoutes = require("./routes/dashboardRoutes");
const predictiveAnalyticsRoutes = require("./routes/predictiveAnalyticsRoutes");
const eventRoutes = require("./routes/eventRoutes");
const chatRoutes = require("./routes/chatRoutes");
const User = require("./models/user");

const { initEventController } = require("./controllers/eventController");

connectDB();

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.set("io", io);

app.disable("x-powered-by");

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:5173",
      "https://ramhis-v2-2.onrender.com",
      "https://ramhis-v3.onrender.com",

    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: true }));

// Serve uploaded files
const uploadRoot = process.env.UPLOAD_ROOT || path.join(__dirname, "uploads");

app.use("/uploads", express.static(uploadRoot));

app.get("/", (_req, res) => {
  return res.json({
    ok: true,
    message: "RAMHIS API Running",
  });
});

app.get("/env-test", (_req, res) => {
  res.json({
    hasSendGridKey: !!process.env.SENDGRID_API_KEY,
    startsWithSG: process.env.SENDGRID_API_KEY?.startsWith("SG.") || false,
    fromEmail: process.env.SENDGRID_FROM_EMAIL || null,
    resetBase: process.env.APP_RESET_LINK_BASE || null,
  });
});

initEventController(io);

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/patients", require("./routes/patientRoutes"));
app.use("/api/events", eventRoutes);
app.use("/api/prescriptions", require("./routes/prescriptionRoutes"));
app.use("/pharmacy", pharmacyRoutes);
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/audit-logs", require("./routes/auditLogRoutes"));
app.use("/api/analytics", analyticsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/predictive-analytics", predictiveAnalyticsRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/users", require("./routes/userRoutes"));


const PORT = process.env.PORT || 5000;

io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  socket.on("user_online", async (userId) => {
    try {
      if (!userId) return;

      await User.findByIdAndUpdate(userId, {
        isOnline: true,
        lastSeen: null,
        socketId: socket.id,
      });

      socket.userId = userId;

      socket.broadcast.emit("user_status_changed", {
        userId,
        isOnline: true,
        lastSeen: null,
      });

      console.log(`✅ User ${userId} online`);
    } catch (error) {
      console.error("user_online error:", error);
    }
  });

  socket.on("disconnect", async () => {
    console.log("❌ Client disconnected:", socket.id);

    if (!socket.userId) return;

    try {
      const lastSeen = new Date();

      await User.findByIdAndUpdate(socket.userId, {
        isOnline: false,
        lastSeen,
        socketId: null,
      });

      io.emit("user_status_changed", {
        userId: socket.userId,
        isOnline: false,
        lastSeen,
      });

      console.log(`❌ User ${socket.userId} offline`);
    } catch (error) {
      console.error("disconnect error:", error);
    }
  });
});

server.listen(PORT, () =>
  console.log(`🚀 Server running with Socket.IO on port ${PORT}`),
);
