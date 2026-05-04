const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const uri =
      "mongodb+srv://carlonana0213_db_user:LikhaNU2026@cluster0.jucnt4q.mongodb.net/?appName=Cluster0";

    await mongoose.connect(uri);

    console.log("MongoDB connected securely");
    console.log("Connected to DB:", mongoose.connection.name);
  } catch (error) {
    console.error("DB connection error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
