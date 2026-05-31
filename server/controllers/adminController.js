const User = require("../models/user");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const logAudit = require("../utils/auditLogger");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const generateTempPassword = () => {
  return Math.random().toString(36).slice(-8);
};

exports.getPendingUsers = async (req, res) => {
  try {
    const users = await User.find({ verificationStatus: "Pending" }).select(
      "-password",
    );

    res.json({
      ok: true,
      data: users,
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

exports.approveUser = async (req, res) => {
  try {
    const tempPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        verificationStatus: "Approved",
        status: "active",
        is_verified: true,
        isActive: true,

        password: hashedPassword,
        tempPassword,
        mustChangePassword: true,
      },
      { new: true },
    );

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "RAMHIS Account Approved",
      html: `
        <h3>Your account has been approved</h3>
        <p><b>Email:</b> ${user.email}</p>
        <p><b>Temporary Password:</b> ${tempPassword}</p>
        <p>Please log in and change your password immediately.</p>
        <p>RAMHIS: https://ramhis-v2-2.onrender.com </P>
      `,
    });

    res.json({
      ok: true,
      msg: "User approved and email sent",
      user,
    });
  } catch (err) {
    console.error("APPROVE EMAIL ERROR:", err);

    res.status(500).json({
      ok: false,
      msg: err.message,
    });
  }
};

exports.rejectUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        verificationStatus: "Rejected",
        status: "deactivated",
        is_verified: false,
        isActive: false,
      },
      { new: true },
    );

    if (!user) {
      return res.status(404).json({
        ok: false,
        msg: "User not found",
      });
    }

    await logAudit(req, {
      module: "Accounts",
      action: "Reject User",
      description: `Rejected user ${user.name || user.email}.`,
      targetId: user._id,
      targetName: user.name || user.email,
      location: "Account Management",
      metadata: {
        email: user.email,
        role: user.role,
        verificationStatus: user.verificationStatus,
      },
    });

    res.json({
      ok: true,
      msg: "User rejected and moved to deactivated list",
      user,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      ok: false,
      msg: "Server error",
    });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");

    res.json({
      ok: true,
      data: users,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      ok: false,
      msg: "Server error",
    });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const updates = { ...req.body };

    delete updates.createdAt;

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    });

    await logAudit(req, {
      module: "Accounts",
      action: "Reject User",
      description: `Rejected user ${user.name || user.email}.`,
      targetId: user._id,
      targetName: user.name || user.email,
      location: "Account Management",
      metadata: {
        email: user.email,
        role: user.role,
        verificationStatus: user.verificationStatus,
      },
    });

    res.json({
      ok: true,
      data: user,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      ok: false,
      message: "Update failed",
      error: err.message,
    });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { verificationStatus } = req.body;

    if (
      !["Pending", "Approved", "Rejected", "Deactivated"].includes(
        verificationStatus,
      )
    ) {
      return res.status(400).json({
        ok: false,
        message: "Invalid verification status",
      });
    }

    let status = "pending";
    let is_verified = false;
    let isActive = false;

    if (verificationStatus === "Approved") {
      status = "active";
      is_verified = true;
      isActive = true;
    }

    if (
      verificationStatus === "Rejected" ||
      verificationStatus === "Deactivated"
    ) {
      status = "deactivated";
      is_verified = false;
      isActive = false;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        verificationStatus,
        status,
        is_verified,
        isActive,
      },
      { new: true },
    );

    if (user) {
      await logAudit(req, {
        module: "Accounts",
        action:
          verificationStatus === "Approved"
            ? "Reactivate User"
            : verificationStatus === "Deactivated"
              ? "Deactivate User"
              : "Update User Status",
        description: `Changed ${user.name || user.email} status to ${verificationStatus}.`,
        targetId: user._id,
        targetName: user.name || user.email,
        location: "Account Management",
        metadata: {
          verificationStatus,
          status,
          is_verified,
          isActive,
        },
      });
    }

    res.json({
      ok: true,
      data: user,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.resetUserPassword = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    const tempPassword = generateTempPassword();
    const hashed = await bcrypt.hash(tempPassword, 10);

    user.password = hashed;
    user.tempPassword = tempPassword;
    user.mustChangePassword = true;
    await user.save();

    // SEND EMAIL AGAIN
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Password Reset - RAMHIS",
      html: `
        <h3>Your password has been reset</h3>
        <p><b>Email:</b> ${user.email}</p>
        <p><b>New Temporary Password:</b> ${tempPassword}</p>
      `,
    });

    await logAudit(req, {
      module: "Accounts",
      action: "Reset User Password",
      description: `Reset password for ${user.name || user.email}.`,
      targetId: user._id,
      targetName: user.name || user.email,
      location: "Account Management",
      metadata: {
        email: user.email,
        role: user.role,
      },
    });

    res.json({
      ok: true,
      msg: "Password reset successful",
      message: "Password reset successful",
    });
  } catch (err) {
    console.error("RESET EMAIL ERROR:", err);

    res.status(500).json({
      ok: false,
      msg: err.message,
    });
  }
};
