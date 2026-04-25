import { useState } from "react";
import { registerUser } from "../services/authService";
import { Link } from "react-router-dom";
import * as yup from "yup";

import ramlogo from "../resources/ramhislogo.png";

import "../styles/form.css";
import "../styles/auth.css";

function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "Doctor",

    volunteerType: "",

    specialization: "",
    licenseNumber: "",
    proofOfLicense: "",
    proofOfDoctorate: "",
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const registerSchema = yup.object().shape({
    name: yup
      .string()
      .min(2, "Name must be at least 2 characters")
      .required("Name is required"),

    email: yup
      .string()
      .email("Invalid email format")
      .required("Email is required"),

    password: yup
      .string()
      .min(8, "Password must be at least 8 characters")
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9])/,
        "Password must include uppercase, lowercase, number, and special character",
      )
      .required("Password is required"),

    role: yup
      .string()
      .oneOf(["Doctor", "Volunteer"], "Invalid role")
      .required("Role is required"),

    volunteerType: yup.string().when("role", {
      is: "Volunteer",
      then: (schema) => schema.required("Volunteer type is required"),
    }),

    specialization: yup.string().when("role", {
      is: "Doctor",
      then: (schema) => schema.required("Specialization is required"),
    }),

    licenseNumber: yup.string().when("role", {
      is: "Doctor",
      then: (schema) => schema.required("License number is required"),
    }),

    proofOfLicense: yup.string().when("role", {
      is: "Doctor",
      then: (schema) => schema.required("Proof of license is required"),
    }),

    proofOfDoctorate: yup.string().when("role", {
      is: "Doctor",
      then: (schema) => schema.required("Proof of doctorate is required"),
    }),
  });
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!agreeTerms) {
      setServerError("You must agree to the Terms and Conditions.");
      return;
    }
    try {
      setServerError("");

      await registerSchema.validate(form, { abortEarly: false });
      setErrors({});

      const dataToSend = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
      };

      if (form.role === "Volunteer") {
        dataToSend.volunteerType = form.volunteerType;
      }

      if (form.role === "Doctor") {
        dataToSend.doctorInfo = {
          specialization: form.specialization,
          licenseNumber: form.licenseNumber,
          proofOfLicense: form.proofOfLicense,
          proofOfDoctorate: form.proofOfDoctorate,
        };
      }

      const res = await registerUser(dataToSend);

      alert(res.msg);
    } catch (err) {
      if (err.name === "ValidationError") {
        const formattedErrors = {};
        err.inner.forEach((error) => {
          formattedErrors[error.path] = error.message;
        });
        setErrors(formattedErrors);
      } else {
        setServerError(err.message);
      }
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* LEFT PANEL */}
        <div className="auth-left">
          <h1>Hello, Friend!</h1>
          <p>Enter your details and start your journey with us</p>

          <Link to="/">
            <button className="ghost-btn">SIGN IN</button>
          </Link>
        </div>

        {/* RIGHT PANEL */}
        <div className="auth-right">
          <form className="auth-form" onSubmit={handleSubmit}>
            <img src={ramlogo} width="80" alt="logo" />

            <h2>Create Account</h2>

            {serverError && <p className="error">{serverError}</p>}

            {errors.name && <p className="error">{errors.name}</p>}
            <input name="name" placeholder="Name" onChange={handleChange} />

            {errors.email && <p className="error">{errors.email}</p>}
            <input name="email" placeholder="Email" onChange={handleChange} />

            {errors.password && <p className="error">{errors.password}</p>}
            <input
              name="password"
              type="password"
              placeholder="Password"
              onChange={handleChange}
            />

            {errors.role && <p className="error">{errors.role}</p>}
            <select name="role" value={form.role} onChange={handleChange}>
              <option value="Doctor">Doctor</option>
              <option value="Volunteer">Volunteer</option>
            </select>

            {/* VOLUNTEER FIELDS */}
            {form.role === "Volunteer" && (
              <>
                {errors.volunteerType && (
                  <p className="error">{errors.volunteerType}</p>
                )}
                <input
                  name="volunteerType"
                  placeholder="Type of Volunteer Work"
                  onChange={handleChange}
                />
              </>
            )}

            {/* DOCTOR FIELDS */}
            {form.role === "Doctor" && (
              <>
                {errors.specialization && (
                  <p className="error">{errors.specialization}</p>
                )}
                <input
                  name="specialization"
                  placeholder="Medical Specialization"
                  onChange={handleChange}
                />

                {errors.licenseNumber && (
                  <p className="error">{errors.licenseNumber}</p>
                )}
                <input
                  name="licenseNumber"
                  placeholder="Medical License Number"
                  onChange={handleChange}
                />

                {errors.proofOfLicense && (
                  <p className="error">{errors.proofOfLicense}</p>
                )}
                <input
                  name="proofOfLicense"
                  placeholder="Proof of License (file link)"
                  onChange={handleChange}
                />

                {errors.proofOfDoctorate && (
                  <p className="error">{errors.proofOfDoctorate}</p>
                )}
                <input
                  name="proofOfDoctorate"
                  placeholder="Proof of Doctorate (file link)"
                  onChange={handleChange}
                />
              </>
            )}
            <div className="terms-container">
              <input
                type="checkbox"
                id="terms"
                checked={agreeTerms}
                onChange={() => setAgreeTerms(!agreeTerms)}
              />

              <label htmlFor="terms">
                I agree to the{" "}
                <span className="terms-link" onClick={() => setShowTerms(true)}>
                  Terms and Conditions
                </span>
              </label>
            </div>

            {showTerms && (
              <div className="terms-modal">
                <div className="terms-content">
                  <h2>Terms and Conditions</h2>

                  <p>
                    By registering to this system, you agree that all medical
                    information entered is accurate and handled responsibly.
                    Unauthorized sharing of patient information is strictly
                    prohibited.
                  </p>

                  <p>
                    Users must follow ethical medical practices and respect data
                    privacy regulations.
                  </p>

                  <button onClick={() => setShowTerms(false)}>Close</button>
                </div>
              </div>
            )}
            <button type="submit" className="primary-btn">
              SIGN UP
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;
