const mongoose = require("mongoose");

const { ObjectId } = mongoose.Types;

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME || "test";

if (!MONGO_URI) {
  console.error("❌ MONGO_URI is not set in .env");
  process.exit(1);
}

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      dbName: DB_NAME,
    });

    console.log("✅ MongoDB connected successfully");
    console.log("📦 Connected database:", mongoose.connection.name);

    try {
      await usersCol().createIndex(
        { email: 1 },
        { unique: true }
      );

      await usersCol().createIndex({ reset_token: 1 });
      await usersCol().createIndex({ reset_token_expiry: 1 });

      await chatThreadsCol().createIndex({
        member_ids: 1,
        type: 1,
      });

      await chatMessagesCol().createIndex({
        thread_id: 1,
        created_at: 1,
      });

      await eventsCol().createIndex({
        created_at: -1,
      });

      await contentCol().createIndex(
        { slug: 1 },
        { unique: true }
      );

      console.log("✅ MongoDB indexes initialized");
    } catch (indexError) {
      console.warn(
        "⚠️ MongoDB index setup warning:",
        indexError.message
      );
    }
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
};

function usersCol() {
  return mongoose.connection.collection("users");
}

function chatThreadsCol() {
  return mongoose.connection.collection("chat_threads");
}

function chatMessagesCol() {
  return mongoose.connection.collection("chat_messages");
}

function eventsCol() {
  return mongoose.connection.collection("events");
}

function contentCol() {
  return mongoose.connection.collection("content");
}

module.exports = connectDB;

module.exports.connectDB = connectDB;
module.exports.connectDb = connectDB;

module.exports.usersCol = usersCol;
module.exports.chatThreadsCol = chatThreadsCol;
module.exports.chatMessagesCol = chatMessagesCol;
module.exports.eventsCol = eventsCol;
module.exports.contentCol = contentCol;

module.exports.ObjectId = ObjectId;
module.exports.mongoose = mongoose;