// controllers/userController.js

const User = require("../models/User");

exports.searchApprovedUsers = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();

    if (!q) {
      return res.json({ users: [] });
    }

    const users = await User.find({
      $and: [
        {
          $or: [
            { full_name: { $regex: q, $options: "i" } },
            { name: { $regex: q, $options: "i" } },
            { email: { $regex: q, $options: "i" } },
          ],
        },
        {
          $or: [
            { status: "approved" },
            { approved: true },
            { isApproved: true },
          ],
        },
      ],
    })
      .select(
        "full_name name email role account_type"
      )
      .limit(20);

    res.json({ users });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to search users",
    });
  }
};