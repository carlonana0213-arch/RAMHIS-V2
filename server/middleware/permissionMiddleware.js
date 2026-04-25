const permissions = require("../config/permissions");

module.exports = function checkPermission(moduleName) {
  return (req, res, next) => {
    const userRole = req.user.role;

    const allowedRoles = permissions[moduleName];

    if (!allowedRoles) {
      return res.status(500).json({
        msg: "Permission configuration missing",
      });
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        msg: "Access denied",
      });
    }

    next();
  };
};
