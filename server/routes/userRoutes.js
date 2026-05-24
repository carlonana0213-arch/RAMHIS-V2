const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/user");

router.get("/approved", authMiddleware, async (req, res) => {
  try {
    const q = (req.query.q || "").trim();

    if (!q) {
      return res.json({ users: [] });
    }

    const users = await User.find({
      $or: [
        { full_name: { $regex: q, $options: "i" } },
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ],
    })
      .select("full_name name email role account_type verificationStatus")
      .limit(20);

    res.json({ users });
  } catch (error) {
    console.error("Search approved users error:", error);

    res.status(500).json({
      message: "Failed to search users",
    });
  }
});

module.exports = router;