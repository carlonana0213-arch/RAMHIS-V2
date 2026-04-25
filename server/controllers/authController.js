const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  const { name, email, password, role, volunteerType, doctorInfo } = req.body;

  try {
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ msg: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      volunteerType,
      doctorInfo,
    });

    await user.save();

    res.json({ msg: "Registration successful. Await admin approval." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    if (user.verificationStatus !== "Approved") {
      return res.status(403).json({
        msg: "Your account is awaiting admin approval",
      });
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
      msg: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
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
