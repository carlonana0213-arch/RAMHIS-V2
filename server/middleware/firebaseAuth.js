const admin = require("../config/firebaseAdmin");
const User = require("../models/user");

const firebaseAuth = async (req, res, next) => {
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
        message: "Firebase account is not linked to a RAMHIS user.",
      });
    }

    if (user.verificationStatus !== "Approved") {
      return res.status(403).json({
        success: false,
        message: `Account is ${user.verificationStatus}.`,
      });
    }

    req.user = {
      id: user._id.toString(),
      firebaseUid: firebaseUid,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error("Firebase authentication error:", error);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired Firebase authentication token.",
    });
  }
};

module.exports = firebaseAuth;