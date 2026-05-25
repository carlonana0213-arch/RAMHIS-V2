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
    const user = await User.findByIdAndUpdate(
  req.params.id,
  {
    verificationStatus: "Approved",
    status: "active",
    is_verified: true,
    isActive: true,
  },
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

exports.updateUserStatus = async (req, res) => {
  try {
    const { verificationStatus } = req.body;

    if (
  !["Pending", "Approved", "Rejected", "Deactivated"].includes(
    verificationStatus
  )
) {
  return res.status(400).json({
    ok: false,
    message: "Invalid verification status",
  });
}

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { verificationStatus },
      { new: true },
    );

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
      to: user.email,
      subject: "Password Reset - RAMHIS",
      html: `
        <h3>Your password has been reset</h3>
        <p><b>Email:</b> ${user.email}</p>
        <p><b>New Temporary Password:</b> ${tempPassword}</p>
      `,
    });

    res.json({
  ok: true,
  msg: "Password reset successful",
  message: "Password reset successful",
});
} catch (err) {
  res.status(500).json({ msg: "Reset failed" });
}
};
