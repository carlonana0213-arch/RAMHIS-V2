const User = require("../models/user");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");

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

    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

exports.approveUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { verificationStatus: "Approved" },
      { new: true },
    );

    await transporter.sendMail({
      to: user.email,
      subject: "RAMHIS Account Approved",
      html: `
    <h3>Your account has been approved</h3>
    <p><b>Email:</b> ${user.email}</p>
    <p><b>Temporary Password:</b> ${user.tempPassword}</p>
    <p>Please log in and change your password immediately.</p>
    <p>RAMHIS WEBAPP:  .</p>
  `,
    });

    res.json({ msg: "User approved and email sent", user });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

exports.rejectUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { verificationStatus: "Rejected" },
      { new: true },
    );

    res.json({ msg: "User rejected", user });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

exports.updateUser = async (req, res) => {
  delete updates.createdAt;
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: "Update failed" });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { verificationStatus } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { verificationStatus },
      { new: true },
    );

    res.json(user);
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
    user.mustChangePassword = false;

    await user.save();

    // SEND EMAIL AGAIN
    await transporter.sendMail({
      to: user.email,
      subject: "Password Reset - RAMHIS",
      html: `
        <h3>Your password has been reset</h3>
        <p><b>Email:</b> ${user.email}</p>
        <p><b>New Temporary Password:</b> ${tempPassword}</p>
      `,
    });

    res.json({ msg: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ msg: "Reset failed" });
  }
};
