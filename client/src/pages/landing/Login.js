import { useState } from "react";
import { loginUser } from "../../services/authService";
import { Link, useNavigate } from "react-router-dom";
import ramlogo from "../../resources/ramhislogo.png";
import "../../styles/login.css";
import * as yup from "yup";

const LoginPage = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const loginSchema = yup.object().shape({
    email: yup
      .string()
      .email("Invalid email format")
      .required("Email is required"),

    password: yup
      .string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
  });

  const [serverError, setServerError] = useState("");
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setServerError(""); // clear previous backend error

      await loginSchema.validate(form, { abortEarly: false });
      setErrors({});

      const res = await loginUser(form);

      if (res.msg === "Login successful") {
        localStorage.setItem("token", res.token);
        localStorage.setItem("user", JSON.stringify(res.user));
        localStorage.setItem("userName", res.user.name);

        // ROLE-BASED REDIRECT
        if (res.user.role === "Admin") {
          navigate("/dashboard");
        } else {
          navigate("/patient");
        }
      }
    } catch (err) {
      // Yup validation error
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
    <div className="center-page">
      <div className="auth-form-wrapper">
        <img src={ramlogo} alt="RAMHIS Logo" className="auth-logo" />
        <p className="login-subtitle">
          RAMHIS
          <br />
          Remote Area Medical Health Information System
        </p>
        <h2>Enter Your Credentials to Continue</h2>
        <form className="auth-form" onSubmit={handleSubmit}>
          {errors.email && <p className="error">{errors.email}</p>}
          <input name="email" placeholder="Email" onChange={handleChange} />

          {serverError && <p className="error">{serverError}</p>}

          {errors.password && <p className="error">{errors.password}</p>}
          <input
            name="password"
            type="password"
            placeholder="Password"
            onChange={handleChange}
          />

          <button type="submit" className="primary-btn">
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
