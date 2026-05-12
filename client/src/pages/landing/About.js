import ramhislogo from "../../resources/ramhislogo.png";
import ramlogo from "../../resources/ramlogo.png";
import hr from "../../resources/hr.png";
import anl from "../../resources/anl.png";
import ol from "../../resources/ol.png";

const AboutSystem = () => {
  return (
    <div className="hero-center">
      <div className="hero-banner">
        <img src={ramhislogo} className="hero-image-small" alt="RAMHIS Logo" />
        {/* <img src={ramlogo} className="hero-image-small" />*/}

        <h1 className="hero-title-main">RAMHIS</h1>

        <p className="hero-description">
          A centralized health information system designed to support medical
          missions and improve patient care in remote areas.
        </p>
      </div>
      {/* 🔥 FEATURE CARDS SECTION */}
      <div className="features-section">
        <div className="features-grid">
          {/* CARD 1 */}
          <div className="feature-card">
            <div className="feature-image">
              <img src={hr} className="feature-img" alt="feature" />
            </div>
            <div className="feature-text">
              <h3>Patient Record Management</h3>
              <p>
                Efficiently capture and manage patient information, consultation
                details, and treatment records during medical missions. Designed
                to replace paper-based systems and reduce data loss or
                duplication.
              </p>
            </div>
          </div>

          {/* CARD 2 */}
          <div className="feature-card">
            <div className="feature-image">
              <img src={ol} className="feature-img" alt="feature" />
            </div>
            <div className="feature-text">
              <h3>Offline-Capable System</h3>
              <p>
                Operates even without internet connectivity by storing data
                locally. Automatically synchronizes records to the cloud once a
                connection becomes available, ensuring uninterrupted workflows.
              </p>
            </div>
          </div>

          {/* CARD 3 */}
          <div className="feature-card">
            <div className="feature-image">
              <img src={anl} className="feature-img" alt="feature" />
            </div>
            <div className="feature-text">
              <h3>Predictive Analytics</h3>
              <p>
                Analyzes historical mission data to identify common health
                conditions and trends. Supports better planning, resource
                allocation, and data-driven decision-making for future medical
                missions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutSystem;
