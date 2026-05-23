import ramhislogo from "../../resources/ramhislogo.png";
import hr from "../../resources/hr.png";
import anl from "../../resources/anl.png";
import ol from "../../resources/ol.png";
import mock from "../../resources/mockup.png";
import mbbg from "../../resources/mobilebg.png";

const AboutSystem = () => {
  return (
    <div className="hero-center">
      {/* HERO SECTION */}
      <div className="hero-banner">
        <img src={ramhislogo} className="hero-image-small" alt="RAMHIS Logo" />

        <h1 className="hero-title-main">RAMHIS</h1>

        <p className="hero-description">
          A Progressive Web and Mobile Application for Health Record Management
          with Predictive Analytics for Remote Area Medical Philippines.
        </p>
      </div>

      {/* ABOUT MODERN SECTION */}
      <div className="about-modern-section">
        {/* MOBILE APP SECTION */}
        <div
          className="about-modern-top"
          style={{ "--mobile-bg": `url(${mbbg})` }}
        >
          <div className="about-modern-image-card">
            <img src={mock} alt="Mobile App Feature" />
          </div>

          <div className="about-modern-text">
            <h2>About Mobile App</h2>

            <p>
              The RAMHIS Mobile Application is designed for authorized RAM
              personnel to access mission reports, communication tools, event
              schedules, and summarized healthcare analytics anytime and
              anywhere. It improves coordination between volunteers and
              administrators while providing secure access to mission-related
              information.
            </p>

            <div className="benefits-modern-list">
              <div className="benefit-modern-item">
                <div className="benefit-content">
                  <h3>Real-Time Chat & Messaging</h3>

                  <p>
                    Enables authorized personnel to communicate instantly for
                    mission coordination, updates, and team collaboration.
                  </p>
                </div>
              </div>

              <div className="benefit-modern-item">
                <div className="benefit-content">
                  <h3>Mission Event Tracker</h3>

                  <p>
                    Provides schedules, announcements, and updates for upcoming
                    and completed medical missions.
                  </p>
                </div>
              </div>

              <div className="benefit-modern-item">
                <div className="benefit-content">
                  <h3>Dashboard & Reports</h3>

                  <p>
                    Displays summarized mission reports, healthcare trends,
                    analytics, and patient-related information.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* WEB SYSTEM SECTION */}
        <div className="about-web-section">
          <div className="about-web-header">
            <h2>About Web System</h2>

            <p>
              RAMHIS Web System is a Progressive Web Application designed to
              support on-site medical missions conducted by Remote Area Medical
              Philippines. It enables patient registration, consultation
              recording, queue management, pharmacy documentation, offline data
              capture, and predictive analytics.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-image">
                <img src={hr} className="feature-img" alt="Patient Records" />
              </div>

              <div className="feature-text">
                <h3>Patient Record Management</h3>

                <p>
                  Efficiently capture and organize patient information,
                  consultation details, and medical history during medical
                  missions.
                </p>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-image">
                <img src={ol} className="feature-img" alt="Offline System" />
              </div>

              <div className="feature-text">
                <h3>Offline-Capable System</h3>

                <p>
                  Allows healthcare volunteers to continue operations even
                  without internet connectivity through offline data storage and
                  synchronization.
                </p>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-image">
                <img src={anl} className="feature-img" alt="Analytics" />
              </div>

              <div className="feature-text">
                <h3>Predictive Analytics</h3>

                <p>
                  Analyzes historical mission data to identify recurring health
                  conditions and support data-driven mission planning.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutSystem;
