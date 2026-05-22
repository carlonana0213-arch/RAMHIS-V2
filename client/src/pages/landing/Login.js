import { useState } from "react";
import { loginUser } from "../../services/authService";
import { useNavigate } from "react-router-dom";
import ramlogo from "../../resources/ramhislogo.png";
import "../../styles/login.css";
import * as yup from "yup";

const LoginPage = () => {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [serverError, setServerError] = useState("");
  const [errors, setErrors] = useState({});

  const navigate = useNavigate();

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

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setServerError("");

      await loginSchema.validate(form, {
        abortEarly: false,
      });

      setErrors({});

      const res = await loginUser(form);

      const isSuccess =
        res?.ok === true ||
        res?.msg === "Login successful" ||
        res?.message === "Login successful.";

      if (!isSuccess) {
        setServerError(
          res?.msg || res?.message || "Login failed."
        );
        return;
      }

      const user = res.user || {};
      const role = String(user.role || "").toLowerCase();

      localStorage.setItem("token", res.token || res.accessToken);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("userName", user.name || "");

      if (role === "admin") {
        navigate("/dashboard");
      } else {
        navigate("/patient");
      }
    } catch (err) {
      if (err.name === "ValidationError") {
        const formattedErrors = {};

        err.inner.forEach((error) => {
          formattedErrors[error.path] = error.message;
        });

        setErrors(formattedErrors);
      } else {
        setServerError(
          err?.response?.data?.msg ||
            err?.response?.data?.message ||
            err.message ||
            "Login failed."
        );
      }
    }
  };

  return (
    <div className="center-page">
      <div className="auth-form-wrapper">
        <img
          src={ramlogo}
          alt="RAMHIS Logo"
          className="auth-logo"
        />

        <p className="login-subtitle">
          RAMHIS
          <br />
          Remote Area Medical Health Information System
        </p>

        <h2>Sign In</h2>

        <form className="auth-form" onSubmit={handleSubmit}>
          {errors.email && <p className="error">{errors.email}</p>}

          <input
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
          />

          {serverError && <p className="error">{serverError}</p>}

          {errors.password && (
            <p className="error">{errors.password}</p>
          )}

          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
          />

          <button type="submit" className="primary-btn">
            Log In
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;