import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import "../styles/topnav.css";
import ConfirmModal from "../components/ConfirmModal";

function TopNav() {
  const [open, setOpen] = useState(false);
  const [confirmState, setConfirmState] = useState(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="top-nav">
      <div className="top-nav-right">
        <div className="user-icon" onClick={() => setOpen(!open)}>
          <FaUserCircle size={28} />
        </div>

        {open && (
          <div className="user-dropdown">
            <div onClick={() => navigate("/account")}>Account Settings</div>

            <div
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
              Logout
            </div>
          </div>
        )}
      </div>
      {confirmState && (
        <ConfirmModal
          message={confirmState.message}
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}
    </div>
  );
}

export default TopNav;
