module.exports = function authorize(roles = []) {
  return (req, res, next) => {

    // ✅ Not authenticated
    if (!req.user) {
      return res.status(401).json({
        ok: false,
        message: "Not authenticated.",
      });
    }

    // ✅ Normalize current user role
    const userRole = (req.user.role || "")
      .toLowerCase();

    // ✅ Normalize allowed roles
    const normalizedRoles = roles.map((r) =>
      String(r).toLowerCase()
    );

    // ✅ Access denied
    if (!normalizedRoles.includes(userRole)) {
      return res.status(403).json({
        ok: false,
        message: "Access denied.",
      });
    }

    next();
  };
};