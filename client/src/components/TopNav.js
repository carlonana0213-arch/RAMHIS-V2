import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import "../styles/topnav.css";

function TopNav() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="top-nav">
      <div className="top-nav-right">
        <div className="user-icon" onClick={() => setOpen(!open)}>
          <FaUserCircle size={28} />
        </div>

        {open && (
          <div className="user-dropdown">
            <div onClick={() => navigate("/account")}>Account Settings</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TopNav;
