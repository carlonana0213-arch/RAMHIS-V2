import { useState } from "react";
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
import { MdOutlineAnalytics } from "react-icons/md";

import { HiMenu } from "react-icons/hi";

function Header({ collapsed, toggleSidebar }) {
  const [openPharmacy, setOpenPharmacy] = useState(false);
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
        {hasAccess("admin") && (
          <NavLink
            to="/users"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            <span className="nav-item">
              <FaUserShield className="nav-icon" />
              {!collapsed && "  User Management"}
            </span>
          </NavLink>
        )}

        {hasAccess("analytics") && (
          <NavLink
            to="/analytics"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            <span className="nav-item">
              <MdOutlineAnalytics className="nav-icon" />
              {!collapsed && "  Analytics"}
            </span>
          </NavLink>
        )}

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
          <div className="nav-group">
            <div
              className="nav-link nav-parent"
              onClick={() => setOpenPharmacy(!openPharmacy)}
            >
              <span className="nav-item">
                <FaPills className="nav-icon" />
                {!collapsed && "  Pharmacy"}
              </span>
              {!collapsed && <span>{openPharmacy ? "▾" : "▸"}</span>}
            </div>

            {!collapsed && openPharmacy && (
              <div className="nav-submenu">
                <NavLink
                  to="/pharmacy/queue"
                  className={({ isActive }) =>
                    isActive ? "nav-sublink active" : "nav-sublink"
                  }
                >
                  Queue
                </NavLink>

                <NavLink
                  to="/pharmacy/inventory"
                  className={({ isActive }) =>
                    isActive ? "nav-sublink active" : "nav-sublink"
                  }
                >
                  Inventory
                </NavLink>
              </div>
            )}
          </div>
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
      </nav>
    </aside>
  );
}

export default Header;
