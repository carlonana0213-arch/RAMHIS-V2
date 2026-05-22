const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const { usersCol } = require("../config/db");

let sendResetPasswordEmail = null;

try {
  ({ sendResetPasswordEmail } = require("../config/email"));
} catch (error) {
  console.warn("⚠️ sendgrid config not found, reset email may fail.");
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET;

if (!JWT_SECRET) {
  console.error("❌ JWT_SECRET is not set in .env");
  process.exit(1);
}

function sanitizeUser(user) {
  if (!user) return null;

  const clean = user.toObject ? user.toObject() : { ...user };

  delete clean.password;
  delete clean.password_hash;
  delete clean.refresh_token;
  delete clean.reset_token;
  delete clean.reset_token_expiry;
  delete clean.tempPassword;

  return clean;
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function createAccessToken(user) {
  return jwt.sign(
    {
      id: user._id,
      role: String(user.role || "").toLowerCase(),
    },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
}

function createRefreshToken(user) {
  return jwt.sign(
    {
      id: user._id,
      role: String(user.role || "").toLowerCase(),
    },
    JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );
}

function isBcryptHash(value) {
  const hash = String(value || "");

  return (
    hash.startsWith("$2a$") ||
    hash.startsWith("$2b$") ||
    hash.startsWith("$2y$")
  );
}

async function findUserByEmail(email) {
  let user = await User.findOne({ email }).select(
    "+password +password_hash +tempPassword +refresh_token"
  );

  if (user) {
    return {
      user,
      userType: "mongoose",
    };
  }

  user = await usersCol().findOne({ email });

  return {
    user,
    userType: user ? "native" : null,
  };
}

async function findUserById(userId) {
  let user = await User.findById(userId).select(
    "+password +password_hash +tempPassword +refresh_token"
  );

  if (user) {
    return {
      user,
      userType: "mongoose",
    };
  }

  user = await usersCol().findOne({ _id: userId });

  return {
    user,
    userType: user ? "native" : null,
  };
}

async function passwordMatches(inputPassword, user) {
  const plainPassword = String(inputPassword || "").trim();

  const storedHash = String(
    user?.password || user?.password_hash || ""
  );

  let isMatch = false;

  if (storedHash && isBcryptHash(storedHash)) {
    isMatch = await bcrypt.compare(plainPassword, storedHash);
  }

  if (!isMatch && user?.mustChangePassword && user?.tempPassword) {
    isMatch = plainPassword === String(user.tempPassword).trim();
  }

  return isMatch;
}

async function saveRefreshToken(user, userType, refreshToken) {
  if (userType === "mongoose") {
    await User.findByIdAndUpdate(
      user._id,
      {
        $set: {
          refresh_token: refreshToken,
          updated_at: new Date(),
        },
      },
      { runValidators: false }
    );

    return;
  }

  await usersCol().updateOne(
    { _id: user._id },
    {
      $set: {
        refresh_token: refreshToken,
        updated_at: new Date(),
      },
    }
  );
}

async function updateUserPassword(user, userType, newHash) {
  const update = {
    $set: {
      password: newHash,
      password_hash: newHash,
      mustChangePassword: false,
      tempPassword: "",
      updated_at: new Date(),
    },
  };

  if (userType === "mongoose") {
    await User.findByIdAndUpdate(user._id, update, {
      runValidators: false,
    });

    return;
  }

  await usersCol().updateOne({ _id: user._id }, update);
}

exports.resetPasswordPage = (req, res) => {
  const token = String(req.query.token || "");

  if (!token) {
    return res.status(400).send("<h2>Missing token.</h2>");
  }

  const appLink =
    process.env.APP_RESET_LINK_BASE || "myapp://reset-password";

  const webLink =
    process.env.WEB_RESET_LINK_BASE ||
    "http://localhost:3000/reset-password";

  return res.send(`
    <h2>Password Reset</h2>
    <p>Choose where to continue:</p>
    <a href="${appLink}?token=${encodeURIComponent(token)}">Open in Mobile App</a>
    <br /><br />
    <a href="${webLink}?token=${encodeURIComponent(token)}">Open in Web App</a>
  `);
};

exports.register = async (req, res, next) => {
  console.log("REGISTER CALLED WITH:", req.body);
  try {
    const {
      name,
      email,
      password,
      role,
      volunteerType,
      doctorInfo,
    } = req.body;

    const normalizedEmail = String(email || "").toLowerCase().trim();

    if (!name || !normalizedEmail) {
      return res.status(400).json({
        ok: false,
        msg: "Name and email are required.",
      });
    }

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        ok: false,
        msg: "A user with this email already exists.",
      });
    }

    const tempPassword =
      password || Math.random().toString(36).slice(-8);

    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const normalizedRole = String(role || "user")
      .toLowerCase()
      .trim();

    const user = new User({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      password_hash: hashedPassword,
      role: normalizedRole,
      volunteerType: volunteerType || undefined,
      doctorInfo: doctorInfo || undefined,
      verificationStatus:
        normalizedRole === "admin" ? "Approved" : "Pending",
      status: normalizedRole === "admin" ? "active" : "pending",
      is_verified: normalizedRole === "admin",
      tempPassword: password ? undefined : tempPassword,
      mustChangePassword: !password,
    });

    await user.save();

    return res.status(201).json({
      ok: true,
      msg: "Registration successful. Await admin approval.",
    });
  } catch (error) {
    // Duplicate key error (email already exists at DB level)
    if (error.code === 11000) {
      return res.status(409).json({
        ok: false,
        msg: "A user with this email already exists.",
      });
    }

    // Mongoose validation error
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors)
        .map((e) => e.message)
        .join(", ");

      return res.status(400).json({
        ok: false,
        msg: `Validation error: ${messages}`,
      });
    }

    console.error("REGISTER ERROR:", error);
    next(error);
  }
};

exports.signup = async (req, res, next) => {
  try {
    const {
      full_name,
      email,
      password,
      account_type,
      contact_number,
      birthdate,
      accepted_terms,
      prc_license_number,
      specialty,
      hospital_clinic,
      organization,
      skills,
    } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({
        ok: false,
        message: "Missing required fields.",
      });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const existing = await usersCol().findOne({
      email: normalizedEmail,
    });

    if (existing) {
      return res.status(400).json({
        ok: false,
        message: "Email already registered.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const parts = String(full_name).trim().split(" ");
    const first_name = parts[0] || "";
    const last_name = parts.slice(1).join(" ") || "";

    const filePath = req.file
      ? `/uploads/verification/${req.file.filename}`
      : "";

    const role =
      account_type === "doctor"
        ? "doctor"
        : account_type === "volunteer"
        ? "volunteer"
        : "user";

    const verificationStatus =
      role === "doctor" ? "Pending" : "Approved";

    const result = await usersCol().insertOne({
      first_name,
      last_name,
      name: full_name,
      email: normalizedEmail,
      password_hash: passwordHash,
      password: passwordHash,
      account_type: account_type || "user",
      contact_number: contact_number || "",
      birthdate: birthdate || "",
      accepted_terms: accepted_terms === true,
      prc_license_number: prc_license_number || "",
      specialty: specialty || "",
      hospital_clinic: hospital_clinic || "",
      organization: organization || "",
      skills: skills || "",
      license_proof_url: filePath,
      profile_image_url: "",
      role,
      status: "active",
      verificationStatus,
      is_verified: role !== "doctor",
      mustChangePassword: false,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return res.status(201).json({
      ok: true,
      message: "Signup successful.",
      userId: result.insertedId,
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    console.log("LOGIN BODY:", req.body);

    const email = String(req.body.email || "").toLowerCase().trim();
    const password = String(req.body.password || "").trim();

    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        msg: "Email and password are required.",
      });
    }

    const { user, userType } = await findUserByEmail(email);

    if (!user) {
      return res.status(400).json({
        ok: false,
        msg: "Invalid credentials",
      });
    }

    const role = String(user.role || "").toLowerCase().trim();

    const verificationStatus = String(
      user.verificationStatus || ""
    )
      .toLowerCase()
      .trim();

    if (role !== "admin" && verificationStatus === "pending") {
      return res.status(403).json({
        ok: false,
        msg: "Your account is awaiting admin approval",
      });
    }

    if (
      verificationStatus === "deactivated" ||
      String(user.status || "").toLowerCase().trim() === "deactivated"
    ) {
      return res.status(403).json({
        ok: false,
        msg: "Your account is deactivated, please contact administrator",
      });
    }

    const isMatch = await passwordMatches(password, user);

    console.log("FOUND USER:", user.email);
    console.log("ROLE:", role);
    console.log("STATUS:", user.verificationStatus);
    console.log("PASSWORD MATCH:", isMatch);

    if (!isMatch) {
      return res.status(400).json({
        ok: false,
        msg: "Invalid credentials",
      });
    }

    const normalizedUser = user.toObject ? user.toObject() : { ...user };
    normalizedUser.role = role;

    const accessToken = createAccessToken(normalizedUser);
    const refreshToken = createRefreshToken(normalizedUser);

    await saveRefreshToken(user, userType, refreshToken);

    return res.json({
      ok: true,
      msg: "Login successful",
      message: "Login successful.",
      token: accessToken,
      accessToken,
      refreshToken,
      user: sanitizeUser(normalizedUser),
      mustChangePassword: Boolean(user.mustChangePassword),
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    next(error);
  }
};

exports.refreshToken = async (req, res, next) => {
  try {
    const refreshToken = String(req.body.refreshToken || "");

    if (!refreshToken) {
      return res.status(400).json({
        ok: false,
        message: "Refresh token is required.",
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    } catch (error) {
      return res.status(401).json({
        ok: false,
        message: "Invalid refresh token.",
      });
    }

    const { user, userType } = await findUserById(decoded.id);

    if (!user || user.refresh_token !== refreshToken) {
      return res.status(401).json({
        ok: false,
        message: "Refresh token not recognized.",
      });
    }

    const normalizedUser = user.toObject ? user.toObject() : { ...user };
    normalizedUser.role = String(normalizedUser.role || "")
      .toLowerCase()
      .trim();

    const newAccessToken = createAccessToken(normalizedUser);
    const newRefreshToken = createRefreshToken(normalizedUser);

    await saveRefreshToken(user, userType, newRefreshToken);

    return res.json({
      ok: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    next(error);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const email = String(req.body.email || "").toLowerCase().trim();

    if (!email) {
      return res.status(400).json({
        ok: false,
        message: "Email is required.",
      });
    }

    const { user } = await findUserByEmail(email);

    if (!user) {
      return res.json({
        ok: true,
        message: "If the email exists, a reset link has been sent.",
      });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = hashToken(rawToken);

    await usersCol().updateOne(
      { _id: user._id },
      {
        $set: {
          reset_token: hashedToken,
          reset_token_expiry: new Date(Date.now() + 15 * 60 * 1000),
          updated_at: new Date(),
        },
      }
    );

    if (typeof sendResetPasswordEmail !== "function") {
      return res.status(500).json({
        ok: false,
        message: "Reset email service is not configured.",
      });
    }

    const emailResult = await sendResetPasswordEmail(user.email, rawToken);

    return res.json({
      ok: true,
      message: "Reset email sent successfully.",
      ...emailResult,
    });
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const token = String(req.body.token || "");
    const newPassword = String(req.body.newPassword || "");

    if (!token || !newPassword) {
      return res.status(400).json({
        ok: false,
        message: "Missing fields.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        ok: false,
        message: "Password must be at least 6 characters.",
      });
    }

    const hashedToken = hashToken(token);

    const user = await usersCol().findOne({
      reset_token: hashedToken,
      reset_token_expiry: {
        $gt: new Date(),
      },
    });

    if (!user) {
      return res.status(400).json({
        ok: false,
        message: "Invalid or expired token.",
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await usersCol().updateOne(
      { _id: user._id },
      {
        $set: {
          password_hash: passwordHash,
          password: passwordHash,
          mustChangePassword: false,
          tempPassword: "",
          updated_at: new Date(),
        },
        $unset: {
          reset_token: "",
          reset_token_expiry: "",
        },
      }
    );

    return res.json({
      ok: true,
      message: "Password reset successful.",
    });
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.user?.id;

    await usersCol().updateOne(
      { _id: userId },
      {
        $unset: {
          refresh_token: "",
        },
        $set: {
          updated_at: new Date(),
        },
      }
    );

    return res.json({
      ok: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.user?.id;

    const { user } = await findUserById(userId);

    return res.json({
      ok: true,
      user: sanitizeUser(user || req.user),
    });
  } catch (error) {
    next(error);
  }
};

exports.getCurrentUser = exports.getMe;

exports.updateMe = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.user?.id;

    const updates = {
      name: req.body.name,
      email: req.body.email
        ? String(req.body.email).toLowerCase().trim()
        : undefined,
      age: req.body.age,
      birthday: req.body.birthday,
      updated_at: new Date(),
    };

    Object.keys(updates).forEach((key) => {
      if (updates[key] === undefined) {
        delete updates[key];
      }
    });

    if (req.body.password) {
      const hashed = await bcrypt.hash(String(req.body.password), 10);

      updates.password = hashed;
      updates.password_hash = hashed;
      updates.mustChangePassword = false;
      updates.tempPassword = "";
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: false,
    }).select("-password -password_hash -refresh_token -tempPassword");

    if (updatedUser) {
      return res.json({
        ok: true,
        user: updatedUser,
      });
    }

    await usersCol().updateOne(
      { _id: userId },
      {
        $set: updates,
      }
    );

    const updatedNativeUser = await usersCol().findOne({ _id: userId });

    return res.json({
      ok: true,
      user: sanitizeUser(updatedNativeUser),
    });
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        ok: false,
        message: "Current and new password are required.",
      });
    }

    if (String(newPassword).length < 8) {
      return res.status(400).json({
        ok: false,
        message: "New password must be at least 8 characters.",
      });
    }

    const userId = req.user?._id || req.user?.id;

    const { user, userType } = await findUserById(userId);

    if (!user) {
      return res.status(404).json({
        ok: false,
        message: "User not found.",
      });
    }

    const isMatch = await passwordMatches(currentPassword, user);

    if (!isMatch) {
      return res.status(400).json({
        ok: false,
        message: "Current password is incorrect.",
      });
    }

    const newHash = await bcrypt.hash(String(newPassword).trim(), 10);

    await updateUserPassword(user, userType, newHash);

    return res.json({
      ok: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error);
    next(error);
  }
};