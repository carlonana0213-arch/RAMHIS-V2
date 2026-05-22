const User = require("../models/user");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");

// ── Email transporter ─────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ── Helpers ──────────────────────────────────────────────────────
const generateTempPassword = () => {
  return Math.random().toString(36).slice(-8);
};

const sanitizeUser = (user) => {
  if (!user) return null;

  const clean = user.toObject ? user.toObject() : { ...user };

  delete clean.password;
  delete clean.password_hash;
  delete clean.tempPassword;
  delete clean.refresh_token;
  delete clean.reset_token;
  delete clean.reset_token_expiry;

  return clean;
};

// ── Get pending users ─────────────────────────────────────────────
exports.getPendingUsers = async (req, res, next) => {
  try {
    const users = await User.find({
      $or: [
        { verificationStatus: "Pending" },
        { status: "pending" },
      ],
    }).select(
      "-password -password_hash -tempPassword -refresh_token -reset_token -reset_token_expiry"
    );

    return res.json({
      ok: true,
      users,
    });
  } catch (err) {
    next(err);
  }
};

// ── Approve user ─────────────────────────────────────────────────
exports.approveUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select(
      "+tempPassword"
    );

    if (!user) {
      return res.status(404).json({
        ok: false,
        msg: "User not found",
      });
    }

    user.verificationStatus = "Approved";
    user.status = "active";
    user.is_verified = true;

    await user.save();

    // Send approval email only if email credentials exist
    if (
      process.env.EMAIL_USER &&
      process.env.EMAIL_PASS
    ) {
      await transporter.sendMail({
        to: user.email,
        subject: "RAMHIS Account Approved",
        html: `
          <h3>Your account has been approved</h3>
          <p><b>Email:</b> ${user.email}</p>

          ${
            user.tempPassword
              ? `<p><b>Temporary Password:</b> ${user.tempPassword}</p>`
              : ""
          }

          <p>Please log in and change your password immediately.</p>

          <p>
            RAMHIS WEBAPP:
            ${process.env.CLIENT_URL || "http://localhost:3000"}
          </p>
        `,
      });
    }

    return res.json({
      ok: true,
      msg: "User approved successfully",
      user: sanitizeUser(user),
    });
  } catch (err) {
    next(err);
  }
};

// ── Reject user ──────────────────────────────────────────────────
exports.rejectUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        verificationStatus: "Rejected",
        status: "rejected",
        is_verified: false,
      },
      {
        new: true,
        runValidators: true,
      }
    ).select(
      "-password -password_hash -tempPassword -refresh_token -reset_token -reset_token_expiry"
    );

    if (!user) {
      return res.status(404).json({
        ok: false,
        msg: "User not found",
      });
    }

    return res.json({
      ok: true,
      msg: "User rejected",
      user,
    });
  } catch (err) {
    next(err);
  }
};

// ── Get all users ────────────────────────────────────────────────
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select(
      "-password -password_hash -tempPassword -refresh_token -reset_token -reset_token_expiry"
    );

    return res.json({
      ok: true,
      users,
    });
  } catch (err) {
    next(err);
  }
};

// ── Update user ──────────────────────────────────────────────────
exports.updateUser = async (req, res, next) => {
  try {
    const updates = { ...req.body };

    // Prevent protected fields from being overwritten
    delete updates.createdAt;
    delete updates.created_at;
    delete updates.password;
    delete updates.password_hash;
    delete updates.tempPassword;
    delete updates.refresh_token;
    delete updates.reset_token;
    delete updates.reset_token_expiry;
    delete updates._id;

    updates.updated_at = new Date();

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true,
        runValidators: true,
      }
    ).select(
      "-password -password_hash -tempPassword -refresh_token -reset_token -reset_token_expiry"
    );

    if (!user) {
      return res.status(404).json({
        ok: false,
        msg: "User not found",
      });
    }

    return res.json({
      ok: true,
      msg: "User updated successfully",
      user,
    });
  } catch (err) {
    next(err);
  }
};

// ── Update user status ───────────────────────────────────────────
exports.updateUserStatus = async (req, res, next) => {
  try {
    const { verificationStatus, status } = req.body;

    const updates = {
      updated_at: new Date(),
    };

    // Sync verificationStatus -> status
    if (verificationStatus) {
      updates.verificationStatus = verificationStatus;

      if (verificationStatus === "Approved") {
        updates.status = "active";
        updates.is_verified = true;
      }

      if (verificationStatus === "Rejected") {
        updates.status = "rejected";
        updates.is_verified = false;
      }

      if (verificationStatus === "Pending") {
        updates.status = "pending";
        updates.is_verified = false;
      }

      if (verificationStatus === "Deactivated") {
        updates.status = "deactivated";
        updates.is_verified = false;
      }
    }

    // Sync status -> verificationStatus
    if (status) {
      updates.status = status;

      if (status === "active") {
        updates.verificationStatus = "Approved";
        updates.is_verified = true;
      }

      if (status === "pending") {
        updates.verificationStatus = "Pending";
        updates.is_verified = false;
      }

      if (status === "rejected") {
        updates.verificationStatus = "Rejected";
        updates.is_verified = false;
      }

      if (status === "deactivated") {
        updates.verificationStatus = "Deactivated";
        updates.is_verified = false;
      }
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true,
        runValidators: true,
      }
    ).select(
      "-password -password_hash -tempPassword -refresh_token -reset_token -reset_token_expiry"
    );

    if (!user) {
      return res.status(404).json({
        ok: false,
        msg: "User not found",
      });
    }

    return res.json({
      ok: true,
      msg: "User status updated",
      user,
    });
  } catch (err) {
    next(err);
  }
};

// ── Reset user password by admin ─────────────────────────────────
exports.resetUserPassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select(
      "+tempPassword"
    );

    if (!user) {
      return res.status(404).json({
        ok: false,
        msg: "User not found",
      });
    }

    const tempPassword = generateTempPassword();

    const hashed = await bcrypt.hash(
      tempPassword,
      10
    );

    // Update BOTH password fields for compatibility
    user.password = hashed;
    user.password_hash = hashed;

    user.tempPassword = tempPassword;

    // User must change password on login
    user.mustChangePassword = true;

    user.updated_at = new Date();

    await user.save();

    // Send email only if configured
    if (
      process.env.EMAIL_USER &&
      process.env.EMAIL_PASS
    ) {
      await transporter.sendMail({
        to: user.email,
        subject: "Password Reset - RAMHIS",
        html: `
          <h3>Your password has been reset</h3>

          <p><b>Email:</b> ${user.email}</p>

          <p>
            <b>New Temporary Password:</b>
            ${tempPassword}
          </p>

          <p>
            Please log in and change your password immediately.
          </p>

          <p>
            RAMHIS WEBAPP:
            ${process.env.CLIENT_URL || "http://localhost:3000"}
          </p>
        `,
      });
    }

    return res.json({
      ok: true,
      msg: "Password reset successful",
    });
  } catch (err) {
    next(err);
  }
};

// ── OLD mobile doctor routes compatibility ───────────────────────
exports.getDoctors = async (req, res, next) => {
  try {
    const doctors = await User.find({
      $or: [
        { role: "Doctor" },
        { role: "doctor" },
        { account_type: "doctor" },
      ],
    }).select(
      "-password -password_hash -tempPassword -refresh_token -reset_token -reset_token_expiry"
    );

    return res.json({
      ok: true,
      doctors,
    });
  } catch (err) {
    next(err);
  }
};

exports.approveDoctor = async (req, res, next) => {
  try {
    req.body.verificationStatus = "Approved";
    req.body.status = "active";

    return exports.updateUserStatus(
      req,
      res,
      next
    );
  } catch (err) {
    next(err);
  }
};

exports.rejectDoctor = async (req, res, next) => {
  try {
    req.body.verificationStatus = "Rejected";
    req.body.status = "rejected";

    return exports.updateUserStatus(
      req,
      res,
      next
    );
  } catch (err) {
    next(err);
  }
};

// ── OLD mobile volunteer routes compatibility ────────────────────
exports.getVolunteers = async (
  req,
  res,
  next
) => {
  try {
    const volunteers = await User.find({
      $or: [
        { role: "Volunteer" },
        { role: "volunteer" },
        { account_type: "volunteer" },
      ],
    }).select(
      "-password -password_hash -tempPassword -refresh_token -reset_token -reset_token_expiry"
    );

    return res.json({
      ok: true,
      volunteers,
    });
  } catch (err) {
    next(err);
  }
};

exports.updateVolunteerStatus = async (
  req,
  res,
  next
) => {
  try {
    return exports.updateUserStatus(
      req,
      res,
      next
    );
  } catch (err) {
    next(err);
  }
};