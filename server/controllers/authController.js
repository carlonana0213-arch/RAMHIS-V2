const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sgMail = require("@sendgrid/mail");
const logAudit = require("../utils/auditLogger");
const admin = require("../config/firebaseAdmin");

exports.register = async (req, res) => {
  const {
    name,
    full_name,
    email,
    password,
    role,
    account_type,
    firebaseUid,
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

  const normalizedVolunteerType =
    volunteerType || organization || skills || "";

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

          specialization:
            parsedDoctorInfo?.specialization || specialty || "",

          licenseNumber:
            parsedDoctorInfo?.licenseNumber ||
            prc_license_number ||
            "",

          hospitalClinic:
            parsedDoctorInfo?.hospitalClinic ||
            hospital_clinic ||
            "",

          proofOfLicense:
            licensePath ||
            parsedDoctorInfo?.proofOfLicense ||
            "",

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
    // ============================================================
    // FIREBASE UID VALIDATION
    // ============================================================

    if (!firebaseUid || firebaseUid.trim() === "") {
      return res.status(400).json({
        success: false,
        ok: false,
        message: "Firebase UID is required.",
        msg: "Firebase UID is required.",
      });
    }

    // ============================================================
    // CHECK IF EMAIL ALREADY EXISTS
    // ============================================================

    const existingEmailUser = await User.findOne({ email });

    if (existingEmailUser) {
      return res.status(400).json({
        success: false,
        ok: false,
        msg: "User already exists",
        message: "User already exists",
      });
    }

    // ============================================================
    // CHECK IF FIREBASE UID IS ALREADY LINKED
    // ============================================================

    const existingFirebaseUser = await User.findOne({
      firebaseUid,
    });

    if (existingFirebaseUser) {
      return res.status(409).json({
        success: false,
        ok: false,
        message:
          "This Firebase account is already linked to a RAMHIS account.",
        msg:
          "This Firebase account is already linked to a RAMHIS account.",
      });
    }

    // ============================================================
    // PASSWORD
    // ============================================================

    const generateTempPassword = () => {
      return Math.random().toString(36).slice(-8);
    };

    const tempPassword = password || generateTempPassword();

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    // ============================================================
    // CREATE USER
    // ============================================================

    const user = new User({
      name: normalizedName,
      full_name: normalizedName,

      email,
      password: hashedPassword,

      // Firebase account linked to this MongoDB user
      firebaseUid: firebaseUid,

      role: normalizedRole,
      account_type: normalizedRole,

      department:
        normalizedRole.toLowerCase() === "doctor"
          ? department
          : undefined,

      volunteerType: normalizedVolunteerType,
      volunteerInfo: normalizedVolunteerInfo,
      doctorInfo: normalizedDoctorInfo,

      contact_number,
      birthdate,
      birthday: birthdate,
      bdate: birthdate,
      accepted_terms: normalizedAcceptedTerms,

      // New accounts still require admin approval
      verificationStatus: "Pending",

      tempPassword: password ? undefined : tempPassword,
      mustChangePassword: password ? false : true,
    });

    // ============================================================
    // SAVE USER
    // ============================================================

    await user.save();

    // ============================================================
    // AUDIT LOG
    // ============================================================

    await logAudit(req, {
      userId: user._id,
      userName: user.name || user.full_name || user.email,
      userRole: user.role,
      module: "Authentication",
      action: "Sign Up",
      description:
        `${user.name || user.email} signed up and is awaiting admin approval.`,
      targetId: user._id,
      targetName: user.name || user.email,
      location: "System",
      metadata: {
        email: user.email,
        role: user.role,
        firebaseUid: user.firebaseUid,
        verificationStatus: user.verificationStatus,
      },
    });

    // ============================================================
    // SUCCESS RESPONSE
    // ============================================================

    return res.json({
      ok: true,
      success: true,
      userId: user._id,
      firebaseUid: user.firebaseUid,
      verificationStatus: user.verificationStatus,
      msg: "Registration successful. Await admin approval.",
      message: "Registration successful. Await admin approval.",
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return res.status(500).json({
      ok: false,
      success: false,
      msg: error.message,
      message: error.message,
    });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    if (user.verificationStatus === "Pending") {
      return res.status(403).json({
        msg: "Your account is awaiting admin approval",
      });
    }

    if (
      user.verificationStatus === "Rejected" ||
      user.verificationStatus === "Deactivated" ||
      user.status === "deactivated"
    ) {
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
      description: `${user.name || user.email} logged in.`,
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

    const updatedUser = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
    });

    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ msg: "Failed to update account" });
  }
};

exports.firebaseLogin = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Firebase authentication token is required.",
      });
    }

    const idToken = authHeader.split("Bearer ")[1];

    const decodedToken = await admin.auth().verifyIdToken(idToken);

    const firebaseUid = decodedToken.uid;

    const user = await User.findOne({ firebaseUid });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Firebase account is not linked to a RAMHIS account.",
      });
    }

    if (user.verificationStatus === "Pending") {
      return res.status(403).json({
        success: false,
        message: "Your account is pending approval.",
      });
    }

    if (
      user.verificationStatus === "Rejected" ||
      user.verificationStatus === "Deactivated"
    ) {
      return res.status(403).json({
        success: false,
        message: `Your account is ${user.verificationStatus.toLowerCase()}.`,
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "30d",
      },
    );

    return res.status(200).json({
      success: true,
      message: "Firebase login successful.",
      accessToken: token,
      token: token,
      refreshToken: "",
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        account_type: user.account_type,
        verificationStatus: user.verificationStatus,
        firebaseUid: user.firebaseUid,
      },
    });
  } catch (error) {
    console.error("Firebase login error:", error);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired Firebase authentication token.",
    });
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
