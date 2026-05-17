import { useState } from "react";
import { FaFacebookF, FaInstagram } from "react-icons/fa";

import "../styles/landing.css";
import AboutSystem from "./landing/About";
import AboutClient from "./landing/Client";
import LoginPage from "./landing/Login";
import Contact from "./landing/Contact";

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
      case "contact":
        return <Contact />;
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
          className={activeTab === "contact" ? "active" : ""}
          onClick={() => setActiveTab("contact")}
        >
          Contact Us
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

          <div className="footer-right">
            <p className="footer-address">
              Unit 2507 25th Floor Medical Plaza Ortigas Condominium San Miguel
              Ave. Ortigas Center Brgy. San Antonio Pasig City <br />
              0917 582 3301
            </p>

            <div className="footer-socials">
              <a
                href="https://www.facebook.com/RemoteAreaMedicalPhilippines"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaFacebookF />
              </a>

              <a
                href="https://www.instagram.com/remoteareamedicalph/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaInstagram />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
