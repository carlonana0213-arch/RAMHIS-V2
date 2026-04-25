const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const dbUser = process.env.DB_USER;
    const dbPass = process.env.DB_PASS;
    const dbHost = process.env.DB_HOST;
    const dbName = process.env.DB_NAME;

    const uri = "mongodb://127.0.0.1:27017/medical_app";

    await mongoose.connect(uri);

    console.log("MongoDB connected securely");
    console.log("Connected to DB:", mongoose.connection.name);
  } catch (error) {
    console.error("DB connection error:", error.message);
    process.exit(1); // stop server if DB fails
  }
};

module.exports = connectDB;
