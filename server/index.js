require("dotenv").config();

const fs = require("fs");
const https = require("https");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const protect = require("./middleware/protect");

const connectDB = require("./config/db");
const pharmacyRoutes = require("./routes/pharmacyRoutes");
const analyticsRoutes = require("./routes/analytics");
const dashboardRoutes = require("./routes/dashboardRoutes");
const allowedOrigins = ["http://localhost:3000"];

connectDB();

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json({ limit: "10kb" }));

/*app.use(
  helmet({
    hsts: {
      maxAge: process.env.NODE_ENV === "production" ? 31536000 : 0,
      includeSubDomains: true,
      preload: true,
    },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],

        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        fontSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],

        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameSrc: ["'none'"],
        mediaSrc: ["'self'"],
        workerSrc: ["'self'"],
        manifestSrc: ["'self'"],

        upgradeInsecureRequests: [],
      },
    },
  }),
);*/

const path = require("path");

app.disable("x-powered-by");

/*app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self' http://localhost:3000 http://localhost:5173; connect-src 'self' http://localhost:5000 http://localhost:3000 http://localhost:5173; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;",
  );
  next();
});*/

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/patients", require("./routes/patientRoutes"));
app.use("/api/prescriptions", require("./routes/prescriptionRoutes"));
app.use("/pharmacy", pharmacyRoutes);
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/analytics", analyticsRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/", (req, res) => {
  res.send("RAMHIS API Running");
});
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
