const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sgMail = require("@sendgrid/mail");

// ── SendGrid client ──────────────────────────────────────────
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// ── Register ─────────────────────────────────────────────────

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

  const normalizedName = name || full_name;
  const rawRole = role || account_type || "User";
  const normalizedRole =
    rawRole.charAt(0).toUpperCase() + rawRole.slice(1).toLowerCase();
  const normalizedVolunteerType = volunteerType || organization || skills || "";
  const uploadedFileName =
    req.file?.filename || req.file?.originalname || "";

  const normalizedDoctorInfo =
    doctorInfo ||
    (normalizedRole.toLowerCase() === "doctor"
      ? {
          specialization: specialty || "",
          licenseNumber: prc_license_number || "",
          hospitalClinic: hospital_clinic || "",
          proofOfLicense: uploadedFileName || "Submitted via mobile",
          proofOfDoctorate: uploadedFileName || "Submitted via mobile",
        }
      : undefined);

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

    const generateTempPassword = () => Math.random().toString(36).slice(-8);
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

// ── Login ────────────────────────────────────────────────────

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
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({
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
        doctorInfo: user.doctorInfo,
        birthdate: user.birthdate || user.birthday || user.bdate || "",
        birthday: user.birthday || user.birthdate || user.bdate || "",
        bdate: user.bdate || user.birthdate || user.birthday || "",
        contact_number:
          user.contact_number || user.contactNumber || user.phone || user.phoneNumber || "",
        contactNumber:
          user.contactNumber || user.contact_number || user.phone || user.phoneNumber || "",
        phone:
          user.phone || user.contact_number || user.contactNumber || "",
        profileImage:
          user.profileImage || user.profileImageUrl || user.profile_image_url || user.avatar || user.imageUrl || "",
        profileImageUrl:
          user.profileImageUrl || user.profileImage || user.profile_image_url || user.avatar || user.imageUrl || "",
        profile_image_url:
          user.profile_image_url || user.profileImageUrl || user.profileImage || user.avatar || user.imageUrl || "",
        avatar:
          user.avatar || user.profileImage || user.profileImageUrl || user.profile_image_url || user.imageUrl || "",
        imageUrl:
          user.imageUrl || user.profileImage || user.profileImageUrl || user.profile_image_url || user.avatar || "",
      },
      mustChangePassword: user.mustChangePassword,
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return res.status(500).json({ msg: "Server error" });
  }
};

// ── Update Me ────────────────────────────────────────────────

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

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true }
    );

    return res.json(updatedUser);
  } catch (err) {
    return res.status(500).json({ msg: "Failed to update account" });
  }
};

// ── Get Me ───────────────────────────────────────────────────

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    return res.json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error" });
  }
};

// ── Forgot Password ──────────────────────────────────────────

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    // SECURITY: never reveal whether the email exists
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

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 1000 * 60 * 15; // 15 minutes
    await user.save();

    const resetLink = `${process.env.APP_RESET_LINK_BASE}?token=${resetToken}`;

    console.log("📧 Sending reset email to:", user.email);

    await sgMail.send({
      to: user.email,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || "aldentolosa11@gmail.com",
        name: "RAMHIS",
      },
      subject: "RAMHIS Password Reset",
      html: `
        <div style="font-family: Arial; max-width: 480px; margin: 0 auto;">
          <div style="background: #4F46E5; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 22px;">RAMHIS</h1>
            <p style="color: #c7d2fe; margin: 6px 0 0; font-size: 13px;">Password Reset Request</p>
          </div>
          <div style="background: #ffffff; padding: 28px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb;">
            <h2 style="color: #1e1b4b; font-size: 20px; margin-top: 0;">Reset Your Password</h2>
            <p style="color: #6b7280; font-size: 15px; line-height: 1.5;">
              You requested to reset your RAMHIS password. Click the button below to set a new password.
            </p>
            <div style="text-align: center; margin: 28px 0;">
              <a
                href="${resetLink}"
                style="
                  display: inline-block;
                  padding: 14px 28px;
                  background: #4F46E5;
                  color: white;
                  text-decoration: none;
                  border-radius: 8px;
                  font-weight: bold;
                  font-size: 15px;
                "
              >
                Reset Password
              </a>
            </div>
            <p style="color: #9ca3af; font-size: 13px; margin-bottom: 0;">
              ⏱ This link expires in <strong>15 minutes</strong>.<br/>
              If you did not request this, you can safely ignore this email.
            </p>
          </div>
        </div>
      `,
    });

    console.log("✅ Reset email sent successfully to:", user.email);

    return res.json({
      ok: true,
      message: "If an account exists, a reset link has been sent.",
    });
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);
    return res.status(500).json({
      ok: false,
      message: error.message,
    });
  }
};

// ── Reset Password ───────────────────────────────────────────

exports.resetPassword = async (req, res) => {
  try {
    const { token, password, newPassword } = req.body;

    const finalPassword = newPassword || password;

    if (!finalPassword) {
      return res.status(400).json({
        ok: false,
        message: "Password is required.",
      });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        ok: false,
        message: "Invalid or expired token.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(finalPassword, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.mustChangePassword = false;

    await user.save();

    return res.json({
      ok: true,
      message: "Password reset successful.",
    });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);
    return res.status(500).json({
      ok: false,
      message: "Server error",
    });
  }
};
