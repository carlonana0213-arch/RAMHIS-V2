const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sgMail = require("@sendgrid/mail");
const logAudit = require("../utils/auditLogger");

exports.register = async (req, res) => {
  const {
    name,
    full_name,
    email,
    password,
    role,
    account_type,
    volunteerType,
    doctorInfo,
    department,
    contact_number,
    birthdate,
    accepted_terms,
    organization,
    skills,
    prc_license_number,
    specialty,
    hospital_clinic,
  } = req.body;

  // Normalize mobile/web fields
  const normalizedName = name || full_name;

  const rawRole = role || account_type || "User";

  const normalizedRole =
    rawRole.charAt(0).toUpperCase() + rawRole.slice(1).toLowerCase();

  const normalizedVolunteerType = volunteerType || organization || skills || "";

  const buildUploadPath = (file) => {
    if (!file || !file.filename) return "";

    return `/uploads/verification/${file.filename}`;
  };

  const getUploadedFile = (...fieldNames) => {
    for (const fieldName of fieldNames) {
      if (req.files?.[fieldName]?.[0]) {
        return req.files[fieldName][0];
      }
    }

    return null;
  };

  let parsedDoctorInfo = doctorInfo;

  if (typeof doctorInfo === "string") {
    try {
      parsedDoctorInfo = JSON.parse(doctorInfo);
    } catch {
      parsedDoctorInfo = {};
    }
  }

  const licenseFile = getUploadedFile(
    "proofOfLicense",
    "licenseProof",
    "license_file",
    "license",
  );

  const doctorateFile = getUploadedFile(
    "proofOfDoctorate",
    "doctorateProof",
    "doctorate_file",
    "doctorate",
  );

  const licensePath = buildUploadPath(licenseFile);
  const doctoratePath = buildUploadPath(doctorateFile);
  const validIdPath = licensePath;

  const normalizedDoctorInfo =
    normalizedRole.toLowerCase() === "doctor"
      ? {
          ...(parsedDoctorInfo || {}),

          specialization: parsedDoctorInfo?.specialization || specialty || "",

          licenseNumber:
            parsedDoctorInfo?.licenseNumber || prc_license_number || "",

          hospitalClinic:
            parsedDoctorInfo?.hospitalClinic || hospital_clinic || "",

          proofOfLicense: licensePath || parsedDoctorInfo?.proofOfLicense || "",

          proofOfDoctorate:
            doctoratePath ||
            licensePath ||
            parsedDoctorInfo?.proofOfDoctorate ||
            parsedDoctorInfo?.proofOfLicense ||
            "",
        }
      : undefined;

  const normalizedVolunteerInfo =
    normalizedRole.toLowerCase() === "volunteer"
      ? {
          organization: organization || "",
          skills: skills || "",
          proofOfId: validIdPath || "",
        }
      : undefined;

  const normalizedAcceptedTerms =
    accepted_terms === true || accepted_terms === "true";

  try {
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({
        ok: false,
        msg: "User already exists",
        message: "User already exists",
      });
    }

    const generateTempPassword = () => {
      return Math.random().toString(36).slice(-8);
    };

    const tempPassword = password || generateTempPassword();

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    user = new User({
      name: normalizedName,
      full_name: normalizedName,

      email,
      password: hashedPassword,

      role: normalizedRole,
      account_type: normalizedRole,

      department:
        normalizedRole.toLowerCase() === "doctor" ? department : undefined,

      volunteerType: normalizedVolunteerType,
      volunteerInfo: normalizedVolunteerInfo,
      doctorInfo: normalizedDoctorInfo,

      contact_number,
      birthdate,
      birthday: birthdate,
      bdate: birthdate,
      accepted_terms: normalizedAcceptedTerms,

      tempPassword: password ? undefined : tempPassword,
      mustChangePassword: password ? false : true,
    });

    await user.save();

    const logAudit = require("../utils/auditLogger");
    await logAudit(req, {
      userId: user._id,
      userName: user.name || user.full_name || user.email,
      userRole: user.role,
      module: "Authentication",
      action: "Sign Up",
      description: `${user.name || user.email} signed up and is awaiting admin approval.`,
      targetId: user._id,
      targetName: user.name || user.email,
      location: "System",
      metadata: {
        email: user.email,
        role: user.role,
        verificationStatus: user.verificationStatus,
      },
    });

    return res.json({
      ok: true,
      userId: user._id,
      msg: "Registration successful. Await admin approval.",
      message: "Registration successful. Await admin approval.",
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return res.status(500).json({
      ok: false,
      msg: error.message,
      message: error.message,
    });
  }
};

// Records a rejected sign-in attempt. Passwords are never logged.
const logFailedLogin = (req, { attemptedEmail, user, reason }) =>
  logAudit(req, {
    userId: user?._id,
    userName: user ? user.name || user.full_name || user.email : attemptedEmail,
    userRole: user?.role,
    userEmail: user?.email || attemptedEmail,
    module: "Authentication",
    action: "Failed Login",
    status: "Failed",
    reason,
    description: `Sign-in attempt for ${attemptedEmail || "an unknown account"} was rejected: ${reason}.`,
    targetType: "User",
    targetId: user?._id,
    targetName: user ? user.name || user.email : attemptedEmail,
    location: "System",
    metadata: {
      attemptedEmail,
      accountFound: Boolean(user),
      verificationStatus: user?.verificationStatus,
    },
  });

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      await logFailedLogin(req, {
        attemptedEmail: String(email || ""),
        reason: "no account matches that email",
      });

      return res.status(400).json({ msg: "Invalid credentials" });
    }

    if (user.verificationStatus === "Pending") {
      await logFailedLogin(req, {
        attemptedEmail: user.email,
        user,
        reason: "the account is still awaiting admin approval",
      });

      return res.status(403).json({
        msg: "Your account is awaiting admin approval",
      });
    }

    if (
      user.verificationStatus === "Rejected" ||
      user.verificationStatus === "Deactivated" ||
      user.status === "deactivated"
    ) {
      await logFailedLogin(req, {
        attemptedEmail: user.email,
        user,
        reason: `the account is ${String(
          user.verificationStatus || user.status,
        ).toLowerCase()}`,
      });

      return res.status(403).json({
        msg: "Your account is deactivated, please contact administrator",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

console.log("LOGIN DEBUG");
console.log("Email:", user.email);
console.log("Password field exists:", !!user.password);
console.log("Password match:", isMatch);

if (!isMatch) {
  await logFailedLogin(req, {
    attemptedEmail: user.email,
    user,
    reason: "incorrect password",
  });

  return res.status(400).json({ msg: "Invalid credentials" });
}

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "30d" },
    );

    await logAudit(req, {
      userId: user._id,
      userName: user.name || user.full_name || user.email,
      userRole: user.role,
      module: "Authentication",
      action: "Login",
      description: `${user.name || user.email} (${user.role}${
        user.department ? `, ${user.department}` : ""
      }) logged in.`,
      targetType: "User",
      targetId: user._id,
      targetName: user.name || user.email,
      location: "System",
      metadata: {
        email: user.email,
        role: user.role,
      },
    });

    res.json({
      ok: true,
      msg: "Login successful",
      message: "Login successful",
      token,
      accessToken: token,
      user: {
        id: user._id,
        _id: user._id,

        name: user.name || user.full_name,
        full_name: user.full_name || user.name,

        email: user.email,

        role: user.role || user.account_type,
        account_type: user.account_type || user.role,

        verificationStatus: user.verificationStatus,
        department: user.department,
        doctorInfo: user.doctorInfo,

        birthdate: user.birthdate || user.birthday || user.bdate || "",
        birthday: user.birthday || user.birthdate || user.bdate || "",
        bdate: user.bdate || user.birthdate || user.birthday || "",

        contact_number:
          user.contact_number ||
          user.contactNumber ||
          user.phone ||
          user.phoneNumber ||
          "",

        contactNumber:
          user.contactNumber ||
          user.contact_number ||
          user.phone ||
          user.phoneNumber ||
          "",

        phone: user.phone || user.contact_number || user.contactNumber || "",

        profileImage:
          user.profileImage ||
          user.profileImageUrl ||
          user.profile_image_url ||
          user.avatar ||
          user.imageUrl ||
          "",

        profileImageUrl:
          user.profileImageUrl ||
          user.profileImage ||
          user.profile_image_url ||
          user.avatar ||
          user.imageUrl ||
          "",

        profile_image_url:
          user.profile_image_url ||
          user.profileImageUrl ||
          user.profileImage ||
          user.avatar ||
          user.imageUrl ||
          "",

        avatar:
          user.avatar ||
          user.profileImage ||
          user.profileImageUrl ||
          user.profile_image_url ||
          user.imageUrl ||
          "",

        imageUrl:
          user.imageUrl ||
          user.profileImage ||
          user.profileImageUrl ||
          user.profile_image_url ||
          user.avatar ||
          "",
      },
      mustChangePassword: user.mustChangePassword,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.logout = async (req, res) => {
  try {
    const user = await User.findById(req.user?.id).select(
      "name full_name email role department",
    );

    const timedOut = req.body?.reason === "timeout";

    await logAudit(req, {
      module: "Authentication",
      action: timedOut ? "Session Timed Out" : "Logout",
      description: timedOut
        ? `${user?.name || user?.email || "A user"} was signed out after the session timed out.`
        : `${user?.name || user?.email || "A user"} logged out.`,
      targetType: "User",
      targetId: req.user?.id,
      targetName: user?.name || user?.email || "",
      location: "System",
      metadata: { reason: timedOut ? "timeout" : "manual" },
    });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, msg: "Logout logging failed" });
  }
};

exports.updateMe = async (req, res) => {
  try {
    const updates = {
      name: req.body.name,
      email: req.body.email,
      age: req.body.age,
      birthday: req.body.birthday,
    };

    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(req.body.password, salt);
    }

    const userBefore = await User.findById(req.user.id)
      .select("-password")
      .lean();

    const updatedUser = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
    });

    const changes = logAudit.diffObjects(userBefore, updatedUser?.toObject(), {
      fields: ["name", "email", "age", "birthday"],
    });

    await logAudit(req, {
      module: "Accounts",
      action: "Update Own Account",
      description: `${updatedUser?.name || updatedUser?.email} updated their own account${
        req.body.password ? " and changed their password" : ""
      }.${changes.length ? ` ${logAudit.summarizeChanges(changes)}.` : ""}`,
      targetType: "User",
      targetId: req.user.id,
      targetName: updatedUser?.name || updatedUser?.email,
      location: "Account Settings",
      changes,
      metadata: { passwordChanged: Boolean(req.body.password) },
    });

    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ msg: "Failed to update account" });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({
      email,
    });

    // SECURITY:
    // NEVER reveal whether email exists
    if (!user) {
      return res.json({
        ok: true,
        message: "If an account exists, a reset link has been sent.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const resetPasswordExpire =
  Date.now() + 1000 * 60 * 15;

await User.updateOne(
  { _id: user._id },
  {
    $set: {
      resetPasswordToken: hashedToken,
      resetPasswordExpire: resetPasswordExpire,
    },
  },
);

    // MOBILE DEEP LINK
    const resetLink = `https://ramhis-v2-1.onrender.com/api/auth/reset-password?token=${resetToken}`;

    console.log("Sending reset email to:", user.email);

    // Set API key inside the function so env var is guaranteed to be loaded
    if (!process.env.SENDGRID_API_KEY) {
      console.error("SENDGRID_API_KEY is missing in runtime env.");
      return res.status(500).json({
        ok: false,
        message: "Email service not configured.",
      });
    }

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    console.log("ABOUT TO SEND EMAIL via SendGrid");
    await sgMail.send({
      to: user.email,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || "aldentolosa11@gmail.com",
        name: "RAMHIS",
      },
      subject: "RAMHIS Password Reset",
      html: `
      <div style="font-family: Arial;">

        <h2>RAMHIS Password Reset</h2>

        <p>
          You requested to reset your RAMHIS password.
        </p>

        <p>
          Click the button below to reset your password:
        </p>

        <a
          href="${resetLink}"
          style="
            display:inline-block;
            padding:12px 20px;
            background:#4F46E5;
            color:white;
            text-decoration:none;
            border-radius:8px;
            font-weight:bold;
          "
        >
          Reset Password
        </a>

        <p style="margin-top:20px;">
          This link expires in 15 minutes.
        </p>

      </div>
      `,
    });

    console.log("EMAIL SENT SUCCESSFULLY");

    await logAudit(req, {
      userId: user._id,
      userName: user.name || user.full_name || user.email,
      userRole: user.role,
      module: "Authentication",
      action: "Password Reset Requested",
      description: `A password reset link was emailed to ${user.email}. It expires in 15 minutes.`,
      targetType: "User",
      targetId: user._id,
      targetName: user.name || user.email,
      location: "System",
    });

    res.json({
      ok: true,
      message: "If an account exists, a reset link has been sent.",
    });
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);

    res.status(500).json({
      ok: false,
      message: error.message,
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password, newPassword } = req.body;

    const finalPassword = newPassword || password;

    if (!finalPassword) {
      return res.status(400).json({
        ok: false,
        message: "Password is required",
      });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: {
        $gt: Date.now(),
      },
    });

    if (!user) {
      return res.status(400).json({
        ok: false,
        message: "Invalid or expired token",
      });
    }

    const hashedPassword = await bcrypt.hash(finalPassword, 10);

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          mustChangePassword: false,
        },
        $unset: {
          resetPasswordToken: 1,
          resetPasswordExpire: 1,
        },
      }
    );

    await logAudit(req, {
      userId: user._id,
      userName: user.name || user.full_name || user.email,
      userRole: user.role,
      module: "Authentication",
      action: "Password Reset Completed",
      description: `${user.name || user.email} set a new password using a reset link.`,
      targetType: "User",
      targetId: user._id,
      targetName: user.name || user.email,
      location: "System",
    });

    res.json({
      ok: true,
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);

    res.status(500).json({
      ok: false,
      message: "Server error",
    });
  }
};
