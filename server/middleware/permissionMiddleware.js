const permissions = require("../config/permissions");

module.exports = function checkPermission(moduleName) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        ok: false,
        message: "Not authenticated.",
      });
    }

    const userRole = String(req.user.role || "")
      .toLowerCase()
      .trim();

    const allowedRoles = permissions[moduleName];

    if (!allowedRoles) {
      return res.status(500).json({
        ok: false,
        message: `Permission configuration missing for ${moduleName}.`,
      });
    }

    const normalizedAllowedRoles = allowedRoles.map((role) =>
      String(role).toLowerCase().trim()
    );

    if (!normalizedAllowedRoles.includes(userRole)) {
      return res.status(403).json({
        ok: false,
        message: "Access denied.",
      });
    }

    next();
  };
};