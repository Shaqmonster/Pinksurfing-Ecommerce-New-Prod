import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import { dataContext } from "../context/dataContext.jsx";
import { IoEyeSharp } from "react-icons/io5";
import { IoIosEyeOff } from "react-icons/io";
import { authContext } from "../context/authContext";
import axios from "axios";
import AuthLayout from "../components/auth/AuthLayout";
import {
  authBtnPrimary,
  authInputClass,
  authLabelClass,
  authLinkClass,
} from "../components/auth/authTheme";

const Signin = () => {
  const navigate = useNavigate();
  const { login, setIsProfileOpen } = useContext(authContext);
  const [passwordHidden, setPasswordHidden] = useState(true);
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);
  const { handleError, handleSuccess } = useContext(dataContext);
  const [inputValue, setInputValue] = useState({
    email: "",
    password: "",
  });
  const { email, password } = inputValue;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleOnChange = (e) => {
    const { name, value } = e.target;
    setInputValue((prevState) => ({
      ...prevState,
      [name]: value,
    }));
    if (name === "email") {
      if (!emailRegex.test(value)) {
        setEmailError("Invalid email address");
      } else {
        setEmailError("");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(
        "https://auth.pinksurfing.com/api/token/",
        { email, password },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );

      if (response.status !== 200) {
        handleError(response.data.message || "Failed to sign in");
        return;
      }

      const data = response.data;
      const ok = await login(data.access, data.refresh);
      if (!ok) {
        handleError("Sign in failed. Please try again.");
        return;
      }
      setIsProfileOpen(false);
      handleSuccess("Signed In Successfully");
      setInputValue({ email: "", password: "" });

      const redirectPath = sessionStorage.getItem("redirectAfterLogin");
      if (redirectPath) {
        sessionStorage.removeItem("redirectAfterLogin");
        window.location.href = redirectPath;
      } else {
        navigate("/", { replace: true });
      }
    } catch (error) {
      console.error("Sign in failed:", error?.response?.data || error);
      const authFailed = error?.config?.url?.includes("auth.pinksurfing.com");
      if (authFailed) {
        handleError("Invalid email or password");
      } else {
        handleError(
          error?.response?.data?.detail ||
            error?.response?.data?.message ||
            "Sign in failed. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AuthLayout
        title="Welcome back"
        subtitle="Sign in to your PinkSurfing account"
        footer={
          <>
            Don&apos;t have an account?{" "}
            <Link to="/signup" className={authLinkClass}>
              Sign up
            </Link>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className={authLabelClass}>
              Email
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              name="email"
              id="email"
              value={email}
              onChange={handleOnChange}
              className={authInputClass}
              required
            />
            {emailError && (
              <p className="text-red-500 text-sm mt-2">{emailError}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className={authLabelClass}>
              Password
            </label>
            <div className="relative">
              <input
                type={passwordHidden ? "password" : "text"}
                placeholder="Enter your password"
                name="password"
                id="password"
                value={password}
                onChange={handleOnChange}
                className={`${authInputClass} pr-11`}
                required
              />
              <button
                type="button"
                onClick={() => setPasswordHidden(!passwordHidden)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label={passwordHidden ? "Show password" : "Hide password"}
              >
                {passwordHidden ? (
                  <IoEyeSharp size={20} />
                ) : (
                  <IoIosEyeOff size={20} />
                )}
              </button>
            </div>
            <div className="flex justify-end mt-2">
              <Link to="/forgotPassword" className={`text-sm ${authLinkClass}`}>
                Forgot password?
              </Link>
            </div>
          </div>

          <button
            disabled={!email || !password || loading}
            type="submit"
            className={authBtnPrimary}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </AuthLayout>

      {loading && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <img src="/loading.svg" alt="Loading..." className="w-16 h-16" />
        </div>
      )}
    </>
  );
};

export default Signin;
