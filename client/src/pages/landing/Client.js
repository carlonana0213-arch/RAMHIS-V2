import rambg from "../../resources/rambnr.png"; // same location as your other banner
import docH from "../../resources/docH.jpg"; // same location as your other banner
import { FaClinicMedical, FaUsers, FaHandHoldingHeart } from "react-icons/fa";
const AboutClient = () => {
  return (
    <div>
      {/* 🔥 NEW HERO BANNER */}
      <div
        className="client-banner-full"
        style={{ backgroundImage: `url(${rambg})` }}
      >
        <div className="client-banner-content">
          <h1>Remote Area Medical Philippines</h1>

          <p>
            Remote Area Medical Philippines is a non-profit organization
            providing free medical, dental, and surgical services to underserved
            communities across the country.
          </p>
        </div>
      </div>

      {/* CONTENT */}
      <div className="client-content-section">
        {/* LEFT SIDE - STORY + CONTACT */}
        <div className="client-info">
          <h2>Our Story</h2>

          <p>
            RAM’s journey in the Philippines began in 2013, when it stepped in
            to assist in the aftermath of Typhoon Yolanda. Among the volunteers
            was Dr. Heidi Sampanga, a pediatrician trained in New York, whose
            experience on the ground sparked a deep desire to make a lasting
            impact.
          </p>

          <p>
            Witnessing the urgent need for better healthcare, Dr. Sampanga
            returned to the Philippines with a mission: to address disparities
            in healthcare access across the country’s most remote and
            conflict-affected regions.
          </p>

          <p>
            Today, RAM Philippines continues to expand its reach, improving
            health outcomes for underserved communities nationwide.
          </p>

          {/* CONTACT CARD */}
        </div>

        {/* RIGHT SIDE - VISION */}
        <div className="client-vision-card">
          <img src={docH} className="doc-img" />
        </div>
        {/* STATS CARDS */}
      </div>
      <div className="client-stats-section">
        <div className="client-stat-card">
          <div className="stat-icon">
            <FaClinicMedical />
          </div>

          <div className="stat-content">
            <h2>633</h2>
            <p>remote and disaster relief clinics held</p>
          </div>
        </div>

        <div className="client-stat-card">
          <div className="stat-icon">
            <FaUsers />
          </div>

          <div className="stat-content">
            <h2>45,000</h2>
            <p>patients served nationwide</p>
          </div>
        </div>

        <div className="client-stat-card">
          <div className="stat-icon">
            <FaHandHoldingHeart />
          </div>

          <div className="stat-content">
            <h2>₱60M</h2>
            <p>worth of free medical care provided</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutClient;
