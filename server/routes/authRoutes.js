const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/authController");
const auth = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const { updateMe } = require("../controllers/authController");
const { getMe } = require("../controllers/authController");

router.get("/someProtectedRoute", auth, (req, res) => {
  res.json({
    msg: "Protected route working",
    user: req.user,
  });
});
router.put("/me", auth, updateMe);
router.post("/register", register);
router.post("/login", login);
router.get("/me", auth, getMe);
module.exports = router;
