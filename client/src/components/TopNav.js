import { useNavigate } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import "../styles/topnav.css";

function TopNav() {
  const navigate = useNavigate();

  return (
    <div className="top-nav">
      <div className="top-nav-right">
        <button
          className="account-button"
          onClick={() => navigate("/account")}
          data-tooltip="Open account settings"
        >
          <span className="account-name">
            {JSON.parse(localStorage.getItem("user"))?.name || "Account"}
          </span>

          <FaUserCircle className="account-icon" />
        </button>
      </div>
    </div>
  );
}

export default TopNav;
 