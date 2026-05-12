import { useState } from "react";
import "../styles/landing.css";
import AboutSystem from "./landing/About";
import AboutClient from "./landing/Client";
import LoginPage from "./landing/Login";
import ramlogo from "../resources/ramlogo.png";

const LandingPage = () => {
  const [activeTab, setActiveTab] = useState("about");

  const renderContent = () => {
    switch (activeTab) {
      case "about":
        return <AboutSystem />;
      case "client":
        return <AboutClient />;
      case "login":
        return <LoginPage />;
      default:
        return <AboutClient />;
    }
  };

  return (
    <div className="landing-container">
      {/* NAV */}
      <div className="landing-nav">
        <button
          className={activeTab === "client" ? "active" : ""}
          onClick={() => setActiveTab("client")}
        >
          About
        </button>

        <button
          className={activeTab === "about" ? "active" : ""}
          onClick={() => setActiveTab("about")}
        >
          RAMHIS
        </button>

        <button
          className={activeTab === "login" ? "active" : ""}
          onClick={() => setActiveTab("login")}
        >
          Log In
        </button>
      </div>

      {/* CONTENT */}
      <div className="landing-content">{renderContent()}</div>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="landing-footer-content">
          <div className="footer-brand">
            <img
              src={ramlogo}
              alt="RAM Philippines Logo"
              className="footer-logo"
            />

            <h2>RAM Philippines</h2>
          </div>

          <p className="footer-address">
            Unit 2507 25th Floor Medical Plaza Ortigas Condominium San Miguel
            Ave. Ortigas Center Brgy. San Antonio Pasig City <br />
            0917 582 3301
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
