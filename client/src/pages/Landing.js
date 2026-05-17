import { useState } from "react";
import "../styles/landing.css";
import AboutSystem from "./landing/About";
import AboutClient from "./landing/Client";
import LoginPage from "./landing/Login";
import Contact from "./landing/Contact";
import { FaFacebookF, FaInstagram } from "react-icons/fa";
import ramlogo from "../resources/ramlogo.png";
import ramhislogo from "../resources/ramhislogo.png";

const LandingPage = () => {
  const [activeTab, setActiveTab] = useState("about");

    const renderContent = () => {
      switch (activeTab) {
        case "about":
          return <AboutSystem />;

        case "client":
          return <AboutClient />;

        case "contact":
          return <Contact />;

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
    {/* 1ST COLUMN: RAM PH LOGO */}
    <div className="footer-col footer-ram-logo">
      <img
        src={ramlogo}
        alt="RAM Philippines Logo"
        className="footer-logo"
      />
    </div>

    {/* 2ND COLUMN: RAM PH INFO */}
    <div className="footer-col footer-ram-info">
      <h2>RAM Philippines</h2>

      <p className="footer-address">
        Unit 2507 25th Floor Medical Plaza Ortigas Condominium <br /> San Miguel Ave.
        Ortigas Center Brgy. San Antonio Pasig City <br />
        0917 582 3301
      </p>
    </div>

    {/* 3RD COLUMN: SOCIAL MEDIA */}
    <div className="footer-col footer-socials">
      <a
        href="https://www.facebook.com/RemoteAreaMedicalPhilippines"
        target="_blank"
        rel="noopener noreferrer"
      >
        <i className="fab fa-facebook-f"></i>
      </a>

      <a
        href="https://www.instagram.com/remoteareamedicalph/"
        target="_blank"
        rel="noopener noreferrer"
      >
        <i className="fab fa-instagram"></i>
      </a>
    </div>

    {/* 4TH COLUMN: BLANK */}
    <div className="footer-col footer-blank"></div>

    {/* 5TH COLUMN: RAMHIS TEXT */}
    <div className="footer-col footer-ramhis-text">
      <h2>RAMHIS</h2>
    </div>

    {/* 6TH COLUMN: RAMHIS LOGO */}
    <div className="footer-col footer-ramhis-logo-wrap">
      <img
        src={ramhislogo}
        alt="RAMHIS Logo"
        className="footer-ramhis-logo"
      />
    </div>
  </div>
</footer>
    </div>
  );
};

export default LandingPage;