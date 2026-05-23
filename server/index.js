require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const pharmacyRoutes = require("./routes/pharmacyRoutes");
const analyticsRoutes = require("./routes/analytics");
const dashboardRoutes = require("./routes/dashboardRoutes");
const predictiveAnalyticsRoutes = require("./routes/predictiveAnalyticsRoutes");
const eventRoutes = require("./routes/eventRoutes");

const allowedOrigins = ["http://localhost:3000"];

connectDB();

const app = express();

app.disable("x-powered-by");

app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
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

app.use(express.json({ limit: "10kb" }));

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

app.get("/", (req, res) => {
  res.send("RAMHIS API Running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
