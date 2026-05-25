const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


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
  rawRole.charAt(0).toUpperCase() +
  rawRole.slice(1).toLowerCase();

  const normalizedVolunteerType =
    volunteerType || organization || skills || "";

  const uploadedFileName =
  req.file?.filename ||
  req.file?.originalname ||
  "";

const normalizedDoctorInfo =
  doctorInfo ||
  (
    normalizedRole.toLowerCase() === "doctor"
      ? {
          specialization: specialty || "",
          licenseNumber: prc_license_number || "",
          hospitalClinic: hospital_clinic || "",
          proofOfLicense: uploadedFileName || "Submitted via mobile",
          proofOfDoctorate: uploadedFileName || "Submitted via mobile",
        }
      : undefined
  );

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

      volunteerType: normalizedVolunteerType,
      doctorInfo: normalizedDoctorInfo,

      contact_number,
      birthdate,
      accepted_terms: normalizedAcceptedTerms,

      tempPassword: password ? undefined : tempPassword,
      mustChangePassword: password ? false : true,
    });

    await user.save();

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

    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    res.json({
  ok: true,
  msg: "Login successful",
  message: "Login successful",
  token,
  accessToken: token,
  user: {
    id: user._id,
    name: user.name || user.full_name,
    full_name: user.full_name || user.name,
    email: user.email,
    role: user.role || user.account_type,
    account_type: user.account_type || user.role,
    verificationStatus: user.verificationStatus,
    doctorInfo: user.doctorInfo,
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

    if (!user) {
      return res.status(404).json({
        ok: false,
        message: "User not found",
      });
    }

    const resetToken =
      crypto.randomBytes(32).toString(
        "hex",
      );

    user.resetPasswordToken =
      resetToken;

    user.resetPasswordExpire =
      Date.now() + 1000 * 60 * 30;

    await user.save();

const resetLink =
  `https://ramhis-v2-1.onrender.com/reset-password?token=${resetToken}`;

await transporter.sendMail({
  to: user.email,
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
      This link expires in 30 minutes.
    </p>

  </div>
`,
});

res.json({
  ok: true,
  message:
    "Password reset link sent to your email.",
});
  } catch (error) {
    console.error(error);

    res.status(500).json({
      ok: false,
      message: "Server error",
    });
  }
};

exports.resetPassword = async (
  req,
  res,
) => {
  try {
    const { token, password } =
      req.body;

    const user =
      await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpire: {
          $gt: Date.now(),
        },
      });

    if (!user) {
      return res.status(400).json({
        ok: false,
        message:
          "Invalid or expired token",
      });
    }

    const salt =
      await bcrypt.genSalt(10);

    user.password =
      await bcrypt.hash(
        password,
        salt,
      );

    user.resetPasswordToken =
      undefined;

    user.resetPasswordExpire =
      undefined;

    user.mustChangePassword =
      false;

    await user.save();

    res.json({
      ok: true,
      message:
        "Password reset successful",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      ok: false,
      message: "Server error",
    });
  }
};
