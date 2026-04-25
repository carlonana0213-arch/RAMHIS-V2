import { permissions } from "../config/permissions";

export const hasAccess = (module) => {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) return false;

  const allowedRoles = permissions[module];

  if (!allowedRoles) return false;

  return allowedRoles.includes(user.role);
};
