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

// PUT /api/users/:id
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const currentUserId = (req.user?.id || req.user?._id || "").toString();
    const targetUserId = req.params.id.toString();

    if (!currentUserId) {
      return res.status(401).json({
        ok: false,
        message: "Unauthorized",
      });
    }

    const isAdmin =
      (req.user?.role || "").toLowerCase() === "admin" ||
      (req.user?.account_type || "").toLowerCase() === "admin";

    if (currentUserId !== targetUserId && !isAdmin) {
      return res.status(403).json({
        ok: false,
        message: "You are not allowed to update this account",
      });
    }

    const fullName =
      req.body.full_name ??
      req.body.name ??
      req.body.fullName;

    const contactNumber =
      req.body.contact_number ??
      req.body.contactNumber ??
      req.body.phone ??
      req.body.phoneNumber;

    const birthdate =
      req.body.birthdate ??
      req.body.birthday ??
      req.body.bdate;

    const updates = {};

    if (fullName !== undefined) {
      updates.name = fullName;
      updates.full_name = fullName;
    }

    if (req.body.email !== undefined) {
      updates.email = req.body.email;
    }

    if (contactNumber !== undefined) {
      updates.contact_number = contactNumber;
      updates.contactNumber = contactNumber;
    }

    if (birthdate !== undefined) {
      updates.birthdate = birthdate;
      updates.birthday = birthdate;
      updates.bdate = birthdate;
    }

    if (req.body.profileImage !== undefined) {
      updates.profileImage = req.body.profileImage;
    }

    if (req.body.avatar !== undefined) {
      updates.avatar = req.body.avatar;
    }

    const updatedUser = await User.findByIdAndUpdate(
      targetUserId,
      updates,
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        ok: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Profile updated successfully",
      user: updatedUser,
      data: updatedUser,
    });
  } catch (error) {
    console.error("Update user profile error:", error);

    return res.status(500).json({
      ok: false,
      message: "Failed to update profile",
      error: error.message,
    });
  }
});

module.exports = router;