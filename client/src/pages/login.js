import { useState } from "react";
import { loginUser } from "../services/authService";
import { Link, useNavigate } from "react-router-dom";
import ramlogo from "../resources/ramhislogo.png";
import "../styles/form.css";
import "../styles/auth.css";
import * as yup from "yup";

function Login() {
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
        navigate("/patient");
      }
    } catch (err) {
      // Yup validation error
      if (err.name === "ValidationError") {
        const formattedErrors = {};
        err.inner.forEach((error) => {
          formattedErrors[error.path] = error.message;
        });
        setErrors(formattedErrors);
      }
      // Backend invalid credentials
      else {
        setServerError(err.message);
      }
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* LEFT PANEL */}
        <div className="auth-left">
          <h1>Welcome Back!</h1>
          <p>To keep connected with us please login with your personal info</p>
        </div>

        {/* RIGHT PANEL */}
        <div className="auth-right">
          <form className="auth-form" onSubmit={handleSubmit}>
            <img src={ramlogo} width="80" />

            <h2>Sign In</h2>

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
              SIGN IN
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
