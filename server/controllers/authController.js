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
    const apiKey = process.env.SENDGRID_API_KEY;
    const fromEmail =
      process.env.SENDGRID_FROM_EMAIL || "aldentolosa11@gmail.com";

    console.log("SENDGRID_API_KEY EXISTS:", !!apiKey);
    console.log(
      "SENDGRID_API_KEY STARTS WITH SG:",
      apiKey?.startsWith("SG.")
    );
    console.log("SENDGRID_FROM_EMAIL:", fromEmail);
    console.log("APP_RESET_LINK_BASE:", process.env.APP_RESET_LINK_BASE);

    if (!apiKey) {
      return res.status(500).json({
        ok: false,
        message: "SENDGRID_API_KEY is missing in runtime env.",
      });
    }

    sgMail.setApiKey(apiKey.trim());

    const { email } = req.body;

    const user = await User.findOne({ email });

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
    user.resetPasswordExpire = Date.now() + 1000 * 60 * 15;

    await user.save();

    const resetLink =
      `${process.env.APP_RESET_LINK_BASE}?token=${resetToken}`;

    console.log("Sending reset email to:", user.email);

    await sgMail.send({
      to: user.email,
      from: {
        email: fromEmail,
        name: "RAMHIS",
      },
      subject: "RAMHIS Password Reset",
      html: `
        <div style="font-family: Arial; max-width: 480px; margin: 0 auto;">
          <h2>RAMHIS Password Reset</h2>
          <p>You requested to reset your RAMHIS password.</p>
          <p>Click the link below to reset your password:</p>
          <p>
            <a href="${resetLink}">
              Reset Password
            </a>
          </p>
          <p>This link expires in 15 minutes.</p>
        </div>
      `,
    });

    console.log("SendGrid email sent successfully.");

    return res.json({
      ok: true,
      message: "If an account exists, a reset link has been sent.",
    });
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR MESSAGE:", error.message);
    console.error("SENDGRID STATUS CODE:", error.code);

    if (error.response) {
      console.error("SENDGRID RESPONSE STATUS:", error.response.statusCode);
      console.error(
        "SENDGRID RESPONSE BODY:",
        JSON.stringify(error.response.body, null, 2)
      );
      console.error("SENDGRID RESPONSE HEADERS:", error.response.headers);
    }

    return res.status(500).json({
      ok: false,
      message:
        error.response?.body?.errors?.[0]?.message ||
        error.message ||
        "Failed to send reset email.",
      sendgridStatus:
        error.response?.statusCode || error.code || null,
      sendgridErrors:
        error.response?.body?.errors || null,
    });
  }
};
