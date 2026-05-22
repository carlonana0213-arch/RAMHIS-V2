import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import ConfirmModal from "../components/ConfirmModal";
import "../styles/header.css";
import ramlogo from "../resources/ramhislogo.png";
import { FaCalendarAlt } from "react-icons/fa";
import { hasAccess } from "../utils/hasAccess";
import {
  FaChartLine,
  FaSignOutAlt,
  FaUserShield,
  FaClipboardList,
  FaUserMd,
  FaPills,
  FaUsers,
  FaUserCircle,
  FaClock,
  FaBoxes,
} from "react-icons/fa";
import { MdOutlineAnalytics } from "react-icons/md";

import { HiMenu } from "react-icons/hi";

function Header({ collapsed, toggleSidebar }) {
  const [openPharmacy, setOpenPharmacy] = useState(false);
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/");
  };
  const [open, setOpen] = useState(false);
  const [confirmState, setConfirmState] = useState(null);
  const navigate = useNavigate();

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
        {hasAccess("dashboard") && (
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            <span className="nav-item">
              <FaChartLine className="nav-icon" />
              {!collapsed && "  Dashboard"}
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
            to="/doctor"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            <span className="nav-item">
              <FaUserMd className="nav-icon" />
              {!collapsed && "  Doctor"}
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
                  <span className="nav-subitem">
                    <FaClock className="nav-subicon" />
                    Queue
                  </span>
                </NavLink>

                <NavLink
                  to="/pharmacy/inventory"
                  className={({ isActive }) =>
                    isActive ? "nav-sublink active" : "nav-sublink"
                  }
                >
                  <span className="nav-subitem">
                    <FaBoxes className="nav-subicon" />
                    Inventory
                  </span>
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

<NavLink
  to="/event"
  className={({ isActive }) =>
    isActive ? "nav-link active" : "nav-link"
  }
>
  <span className="nav-item">
    <FaCalendarAlt className="nav-icon" />
    {!collapsed && " Event"}
  </span>
</NavLink>

        <div
          className="logout-section"
          onClick={() => {
            setConfirmState({
              message: "Are you sure you want to log out?",
              onConfirm: () => {
                handleLogout();
                setConfirmState(null);
              },
            });
          }}
        >
          <div className="nav-link logout-link">
            <span className="nav-item">
              <FaSignOutAlt className="nav-icon" />
              {!collapsed && "  Logout"}
            </span>
          </div>
        </div>
      </nav>
      {confirmState && (
        <ConfirmModal
          message={confirmState.message}
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}
    </aside>
  );
}

export default Header;
