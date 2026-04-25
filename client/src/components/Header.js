import { NavLink } from "react-router-dom";
import "../styles/header.css";
import ramlogo from "../resources/ramhislogo.png";
import { hasAccess } from "../utils/hasAccess";
import {
  FaUserShield,
  FaClipboardList,
  FaUserMd,
  FaPills,
  FaUsers,
  FaUserCircle,
} from "react-icons/fa";

import { HiMenu } from "react-icons/hi";

function Header({ collapsed, toggleSidebar }) {
  return (
    <aside className="app-sidebar">
      <div className="sidebar-top">
        <button className="toggle-btn" onClick={toggleSidebar}>
          <HiMenu size={22} />
        </button>

        {!collapsed && (
          <div className="logo-group">
            <img src={ramlogo} alt="Logo" className="logo" />
          </div>
        )}
      </div>

      <nav className="nav-links">
        {hasAccess("patient") && (
          <NavLink
            to="/patient"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            <span className="nav-item">
              <FaClipboardList className="nav-icon" />
              {!collapsed && "  Patient"}
            </span>
          </NavLink>
        )}
        {hasAccess("admin") && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            <span className="nav-item">
              <FaUserShield className="nav-icon" />
              {!collapsed && "  Admin Dashboard"}
            </span>
          </NavLink>
        )}

        {/*   {hasAccess("registry") && (
          <NavLink
            to="/registry"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            <span className="nav-item">
              <FaClipboardList className="nav-icon" />
              {!collapsed && "  Registry"}
            </span>
          </NavLink>
        )}*/}

        {hasAccess("doctorSheet") && (
          <NavLink
            to="/doctor-sheet"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            <span className="nav-item">
              <FaUserMd className="nav-icon" />
              {!collapsed && "  Doctor’s Sheet"}
            </span>
          </NavLink>
        )}

        {hasAccess("pharmacy") && (
          <NavLink
            to="/pharmacy"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            <span className="nav-item">
              <FaPills className="nav-icon" />
              {!collapsed && "  Pharmacy"}
            </span>
          </NavLink>
        )}

        {/*   {hasAccess("queue") && (
          <NavLink
            to="/patient-queue"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            <span className="nav-item">
              <FaUsers className="nav-icon" />
              {!collapsed && "  Patient Queue"}
            </span>
          </NavLink>
        )}
*/}
        {hasAccess("accounts") && (
          <NavLink
            to="/account"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            <span className="nav-item">
              <FaUserCircle className="nav-icon" />
              {!collapsed && "  Account"}
            </span>
          </NavLink>
        )}
      </nav>
    </aside>
  );
}

export default Header;
