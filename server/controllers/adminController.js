const User = require("../models/user");
const nodemailer = require("nodemailer");
const sgMail = require("@sendgrid/mail");
const bcrypt = require("bcryptjs");
const logAudit = require("../utils/auditLogger");

const { diffObjects, summarizeChanges } = logAudit;

const generateTempPassword = () => {
  return Math.random().toString(36).slice(-8);
};

const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.SENDGRID_API_KEY) {
    throw new Error("SENDGRID_API_KEY is missing in runtime environment.");
  }

  if (!process.env.SENDGRID_FROM_EMAIL) {
    throw new Error("SENDGRID_FROM_EMAIL is missing in runtime environment.");
  }

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  await sgMail.send({
    to,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL,
      name: "RAMHIS",
    },
    subject,
    html,
  });
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

    await sendEmail({
      to: user.email,
      subject: "RAMHIS Account Approved",
      html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>RAMHIS Account Approved</h2>

      <p>Hello ${user.name || "User"},</p>

      <p>
        Your RAMHIS account has been approved by an administrator.
      </p>

      <p><strong>Login Email:</strong> ${user.email}</p>

      <p><strong>Temporary Password:</strong> ${tempPassword}</p>

      <p>
        Please log in using the temporary password above and change your
        password immediately.
      </p>

      <p>
        <strong>RAMHIS:</strong>
        https://ramhis-v3.onrender.com
      </p>

      <p>
        If you did not expect this account approval, please contact the
        RAMHIS administrator.
      </p>
    </div>
  `,
    });

    await logAudit(req, {
      module: "Accounts",
      action: "Approve User",
      description: `Approved the account of ${user.name || user.email} (${
        user.role || "no role"
      }) and emailed temporary login details to ${user.email}.`,
      targetType: "User",
      targetId: user._id,
      targetName: user.name || user.email,
      location: "Account Management",
      metadata: {
        email: user.email,
        role: user.role,
        department: user.department,
        verificationStatus: user.verificationStatus,
        credentialsEmailed: true,
      },
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
    const previousUser = await User.findById(req.params.id)
      .select("verificationStatus status")
      .lean();

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
      description: `Rejected the account of ${user.name || user.email} (${
        user.role || "no role"
      }). Status changed from ${
        previousUser?.verificationStatus || "unknown"
      } to ${user.verificationStatus}.`,
      targetType: "User",
      targetId: user._id,
      targetName: user.name || user.email,
      location: "Account Management",
      changes: [
        {
          field: "verificationStatus",
          label: "Verification Status",
          before: previousUser?.verificationStatus || null,
          after: user.verificationStatus,
        },
      ],
      metadata: {
        email: user.email,
        role: user.role,
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
    const {
      name,
      email,
      role,
      age,
      birthday,
      birthdate,
      verificationStatus,
      department,
      doctorInfo,
      volunteerType,
      volunteerInfo,
    } = req.body;

    const updates = {
      name,
      email,
      role,
      age,
      birthday,
      birthdate,
      verificationStatus,
    };

    if (role === "Doctor") {
      if (!department) {
        return res.status(400).json({
          ok: false,
          message: "Department is required for doctors.",
        });
      }

      updates.department = department;
      updates.doctorInfo = doctorInfo;
    } else {
      // Remove department/doctor information when
      // the account is no longer a doctor.
      updates.department = undefined;
      updates.doctorInfo = undefined;
    }

    if (role === "Volunteer") {
      updates.volunteerType = volunteerType;
      updates.volunteerInfo = volunteerInfo;
    }

    const userBefore = await User.findById(req.params.id)
      .select("-password")
      .lean();

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!user) {
      return res.status(404).json({
        ok: false,
        message: "User not found",
      });
    }

    const changes = diffObjects(userBefore, user.toObject(), {
      fields: Object.keys(updates),
    });

    await logAudit(req, {
      module: "Accounts",
      action: "Update User",
      description: changes.length
        ? `Updated the account of ${user.name || user.email}. ${summarizeChanges(changes)}.`
        : `Saved the account of ${user.name || user.email} with no field changes.`,
      targetType: "User",
      targetId: user._id,
      targetName: user.name || user.email,
      location: "Account Management",
      changes,
      metadata: {
        email: user.email,
        role: user.role,
        department: user.department,
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
exports.updateUser = async (req, res) => {
  try {
    const {
      name,
      email,
      role,
      age,
      birthday,
      birthdate,
      verificationStatus,
      department,
      doctorInfo,
      volunteerType,
      volunteerInfo,
    } = req.body;

    const updates = {
      name,
      email,
      role,
      age,
      birthday,
      birthdate,
      verificationStatus,
    };

    if (role === "Doctor") {
      if (!department) {
        return res.status(400).json({
          ok: false,
          message: "Department is required for doctors.",
        });
      }

      updates.department = department;
      updates.doctorInfo = doctorInfo;
    } else {
      // Remove department/doctor information when
      // the account is no longer a doctor.
      updates.department = undefined;
      updates.doctorInfo = undefined;
    }

    if (role === "Volunteer") {
      updates.volunteerType = volunteerType;
      updates.volunteerInfo = volunteerInfo;
    }

    const userBefore = await User.findById(req.params.id)
      .select("-password")
      .lean();

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!user) {
      return res.status(404).json({
        ok: false,
        message: "User not found",
      });
    }

    const changes = diffObjects(userBefore, user.toObject(), {
      fields: Object.keys(updates),
    });

    await logAudit(req, {
      module: "Accounts",
      action: "Update User",
      description: changes.length
        ? `Updated the account of ${user.name || user.email}. ${summarizeChanges(changes)}.`
        : `Saved the account of ${user.name || user.email} with no field changes.`,
      targetType: "User",
      targetId: user._id,
      targetName: user.name || user.email,
      location: "Account Management",
      changes,
      metadata: {
        email: user.email,
        role: user.role,
        department: user.department,
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

    const previousUser = await User.findById(req.params.id)
      .select("verificationStatus")
      .lean();

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
        description: `Changed the account status of ${user.name || user.email} (${
          user.role || "no role"
        }) from ${previousUser?.verificationStatus || "unknown"} to ${verificationStatus}.`,
        targetType: "User",
        targetId: user._id,
        targetName: user.name || user.email,
        location: "Account Management",
        changes: [
          {
            field: "verificationStatus",
            label: "Verification Status",
            before: previousUser?.verificationStatus || null,
            after: verificationStatus,
          },
        ],
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

    if (!user) {
      return res.status(404).json({
        ok: false,
        message: "User not found",
      });
    }

    const tempPassword = generateTempPassword();
    const hashed = await bcrypt.hash(tempPassword, 10);

    await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          password: hashed,
          tempPassword,
          mustChangePassword: true,
        },
      },
      {
        new: true,
        runValidators: false,
      },
    );

    await sendEmail({
      to: user.email,
      subject: "RAMHIS Password Reset",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>RAMHIS Password Reset</h2>

          <p>Hello ${user.name || "User"},</p>

          <p>
            An administrator has reset your RAMHIS password.
          </p>

          <p><strong>Login Email:</strong> ${user.email}</p>

          <p><strong>Temporary Password:</strong> ${tempPassword}</p>

          <p>
            Please log in using this temporary password and change your
            password immediately.
          </p>

          <p>
            If you did not request this password reset, please contact
            the RAMHIS administrator.
          </p>
        </div>
      `,
    });

    await logAudit(req, {
      module: "Accounts",
      action: "Reset User Password",
      description: `Reset the password of ${user.name || user.email} (${
        user.role || "no role"
      }) and emailed a temporary password to ${user.email}.`,
      targetType: "User",
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
      msg: "Password reset successful and email sent",
      message: "Password reset successful and email sent",
    });
  } catch (err) {
    console.error("RESET EMAIL ERROR:", err);

    res.status(500).json({
      ok: false,
      msg: err.message,
      message: err.message,
    });
  }
};
