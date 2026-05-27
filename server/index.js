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

const allowedOrigins = ["http://localhost:3000"];

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

app.disable("x-powered-by");

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://ramhis-v2-2.onrender.com",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.get("/", (_req, res) => {
  return res.json({
    ok: true,
    message: "RAMHIS API Running",
  });
});

app.get("/", (_req, res) => {
  return res.json({
    ok: true,
    message: "RAMHIS API Running",
  });
});

app.get("/env-test", (_req, res) => {
  res.json({
    hasSendGridKey: !!process.env.SENDGRID_API_KEY,
    startsWithSG:
      process.env.SENDGRID_API_KEY?.startsWith("SG.") || false,
    fromEmail: process.env.SENDGRID_FROM_EMAIL || null,
    resetBase: process.env.APP_RESET_LINK_BASE || null,
  });
});

app.use(express.json({ limit: "25mb" }));

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

initEventController(io);

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/patients", require("./routes/patientRoutes"));
app.use("/api/events", require("./routes/eventRoutes"));
app.use("/api/prescriptions", require("./routes/prescriptionRoutes"));
app.use("/pharmacy", pharmacyRoutes);
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/analytics", analyticsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/predictive-analytics", predictiveAnalyticsRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/users", require("./routes/userRoutes"));

const PORT = process.env.PORT || 5000;

io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

server.listen(PORT, () =>
  console.log(`🚀 Server running with Socket.IO on port ${PORT}`),
);
