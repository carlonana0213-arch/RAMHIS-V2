import { useState } from "react";
import ramhislogo from "../../resources/ramhislogo.png";

const Contact = () => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  const handleContinue = () => {
    setShowConfirm(false);
    setShowSuccess(true);
  };

return (
  <div className="hero-center">
    <div className="hero-banner">
      <img
        src={ramhislogo}
        className="hero-image-small"
        alt="RAMHIS Logo"
      />

      <h1 className="hero-title-main">Contact Us</h1>

      <p className="hero-description">
        Reach out to RAM Philippines for inquiries, partnerships, volunteer
        opportunities, and healthcare mission coordination.
      </p>
    </div>

    {/* NEW BACKGROUND WRAPPER */}
    <div className="contact-page-background">
      <div className="contact-single-card">
        <h2>Send Us A Message</h2>

        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="contact-field">
            <label>Subject:</label>

            <select required>
              <option value="">Select subject</option>

              <option value="volunteer">
                Would you like to volunteer
              </option>

              <option value="donation">
                Would you like to make a donation
              </option>

              <option value="others">
                Others
              </option>
            </select>
          </div>

          <div className="contact-row">
            <div className="contact-field">
              <label>Name:</label>

              <input
                type="text"
                placeholder="Enter your name"
                required
              />
            </div>

            <div className="contact-field">
              <label>Email:</label>

              <input
                type="email"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div className="contact-field">
            <label>
              Organization: <span>(Optional)</span>
            </label>

            <input
              type="text"
              placeholder="Enter your organization"
            />
          </div>

          <div className="contact-field">
            <label>Message:</label>

            <textarea
              rows="6"
              placeholder="Write your message here..."
              required
            ></textarea>
          </div>

          <button type="submit">Send</button>
        </form>
      </div>
    </div>

    {showConfirm && (
      <div className="contact-modal-overlay">
        <div className="contact-modal">
          <h3>Confirm Message</h3>

          <p>
            By sending this message, you agree that RAM Philippines
            may review your submitted information and contact you
            regarding your inquiry.
          </p>

          <div className="contact-modal-actions">
            <button
              className="cancel-btn"
              onClick={() => setShowConfirm(false)}
            >
              Cancel
            </button>

            <button
              className="continue-btn"
              onClick={handleContinue}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    )}

    {showSuccess && (
      <div className="contact-modal-overlay">
        <div className="contact-modal">
          <h3>Message Received</h3>

          <p>
            Your message has been received. Our staff will contact
            you shortly.
          </p>

          <div className="contact-modal-actions">
            <button
              className="continue-btn"
              onClick={() => setShowSuccess(false)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);
};

export default Contact;