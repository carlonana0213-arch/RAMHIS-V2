const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/user");

const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

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


// PUT /api/users/change-password
router.put("/change-password", authMiddleware, async (req, res) => {
  console.log("✅ HIT CHANGE PASSWORD ROUTE");
  try {
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({
        ok: false,
        message: "Unauthorized",
      });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        ok: false,
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        ok: false,
        message: "New password must be at least 8 characters",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        ok: false,
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        ok: false,
        message: "Current password is incorrect",
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.mustChangePassword = false;

    await user.save();

    return res.status(200).json({
      ok: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);

    return res.status(500).json({
      ok: false,
      message: "Failed to change password",
      error: error.message,
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
  updates.phone = contactNumber;
  updates.phoneNumber = contactNumber;
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

if (req.body.imageBase64) {
  const uploadDir = path.join(__dirname, "../uploads/profile");

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const rawBase64 = req.body.imageBase64.includes(",")
    ? req.body.imageBase64.split(",")[1]
    : req.body.imageBase64;

  const fileName = `${targetUserId}-${Date.now()}.jpg`;
  const filePath = path.join(uploadDir, fileName);

  fs.writeFileSync(filePath, Buffer.from(rawBase64, "base64"));

  const imageUrl = `/uploads/profile/${fileName}`;

  updates.profileImage = imageUrl;
  updates.profileImageUrl = imageUrl;
  updates.profile_image_url = imageUrl;
  updates.avatar = imageUrl;
  updates.imageUrl = imageUrl;
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