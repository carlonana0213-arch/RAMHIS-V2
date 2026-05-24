const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/user");

router.get("/approved", authMiddleware, async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const currentUserId = req.user?.id || req.user?._id;

    console.log("SEARCH USERS QUERY:", q);
    console.log("CURRENT USER:", currentUserId);

    if (!q) {
      return res.json({ users: [] });
    }

    const users = await User.find({
      _id: { $ne: currentUserId },
      $or: [
        { full_name: { $regex: q, $options: "i" } },
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { role: { $regex: q, $options: "i" } },
        { account_type: { $regex: q, $options: "i" } },
      ],
    })
      .select("full_name name email role account_type verificationStatus")
      .limit(30);

    console.log("FOUND USERS:", users.length);

    res.json({ users });
  } catch (error) {
    console.error("Search approved users error:", error);

    res.status(500).json({
      message: "Failed to search users",
    });
  }
});

module.exports = router;