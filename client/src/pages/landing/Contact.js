import ramhislogo from "../../resources/ramhislogo.png";

const Contact = () => {
  return (
    <div className="hero-center">
      {/* HERO */}

      {/* CONTACT SECTION */}
      <div className="contact-single-card">
        <h2>Send Us A Message</h2>

        <form className="contact-form">
          {/* FULL NAME */}
          <div className="contact-field">
            <label>Full Name:</label>
            <input type="text" placeholder="Enter your full name" />
          </div>

          {/* EMAIL + CONTACT */}
          <div className="contact-row">
            <div className="contact-field">
              <label>Email:</label>
              <input type="email" placeholder="Enter your email" />
            </div>

            <div className="contact-field">
              <label>Contact Number:</label>
              <input type="text" placeholder="Enter your contact number" />
            </div>
          </div>

          {/* SUBJECT */}
          <div className="contact-field">
            <label>Subject:</label>
            <input type="text" placeholder="Enter subject" />
          </div>

          {/* MESSAGE */}
          <div className="contact-field">
            <label>Message:</label>

            <textarea
              rows="6"
              placeholder="Write your message here..."
            ></textarea>
          </div>

          <button type="submit">Send Message</button>
        </form>
      </div>
    </div>
  );
};

export default Contact;
