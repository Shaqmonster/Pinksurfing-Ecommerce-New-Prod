import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import { dataContext } from "../context/dataContext.jsx";
import OtpInput from "react-otp-input";
import axios from "axios";
import { IoEyeSharp } from "react-icons/io5";
import { IoIosEyeOff } from "react-icons/io";
import PasswordRequirementsFeedback from "../components/PasswordRequirementsFeedback";
import { isPasswordValid } from "../utils/djangoPasswordValidation";
import AuthLayout from "../components/auth/AuthLayout";
import {
  authBtnPrimary,
  authInputClass,
  authLabelClass,
  authLinkClass,
  otpContainerStyle,
  otpInputStyle,
} from "../components/auth/authTheme";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [passwordHidden, setPasswordHidden] = useState(true);
  const [otpHidden, setOtpHidden] = useState(true);
  const { handleError, handleSuccess } = useContext(dataContext);
  const [inputValue, setInputValue] = useState({
    email: "",
    password: "",
  });
  const [otp, setOtp] = useState("");
  const [passwordFocused, setPasswordFocused] = useState(false);

  const { email, password } = inputValue;

  const handleOnChange = (e) => {
    const { name, value } = e.target;
    setInputValue({
      ...inputValue,
      [name]: value,
    });
  };

  const sendOtp = async () => {
    try {
      const response = await axios.post(
        "https://auth.pinksurfing.com/api/send-otp/",
        { email },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (response.status === 200) {
        handleSuccess("Email Sent Successfully");
        setOtpHidden(false);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        handleError("Email not found");
        return;
      }
      handleError(error.response?.data?.message || "Failed to send OTP");
    }
  };

  const verifyOtp = async () => {
    if (
      !isPasswordValid(password, {
        email,
        username: email,
      })
    ) {
      handleError("Please meet all password requirements before continuing.");
      return;
    }

    try {
      const response = await axios.post(
        "https://auth.pinksurfing.com/api/password_reset/",
        { email, entered_otp: otp, new_password: password },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (response.status === 200) {
        handleSuccess("Password reset successfully");
        navigate("/signin");
      }
    } catch (error) {
      handleError(error.response?.data?.message || "Failed to reset password");
    }
  };

  const ChangePassword = (e) => {
    e.preventDefault();
    if (otpHidden) {
      sendOtp();
    } else {
      verifyOtp();
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="We'll send a one-time code to your email"
      footer={
        <Link to="/signin" className={authLinkClass}>
          Return to sign in
        </Link>
      }
    >
      <form onSubmit={ChangePassword} className="space-y-5">
        <div>
          <label htmlFor="email" className={authLabelClass}>
            Email address
          </label>
          <input
            type="email"
            placeholder="you@example.com"
            name="email"
            id="email"
            value={email}
            onChange={handleOnChange}
            disabled={!otpHidden}
            className={authInputClass}
            required
          />
        </div>

        {!otpHidden && (
          <>
            <div>
              <label className={authLabelClass}>Enter OTP</label>
              <OtpInput
                value={otp}
                onChange={setOtp}
                numInputs={6}
                containerStyle={otpContainerStyle}
                inputStyle={otpInputStyle}
                shouldAutoFocus={true}
                renderSeparator={<span className="text-slate-300">-</span>}
                renderInput={(props) => (
                  <input
                    {...props}
                    style={{
                      ...props.style,
                      ...otpInputStyle,
                      color: "#0f172a",
                      WebkitTextFillColor: "#0f172a",
                      caretColor: "#0f172a",
                    }}
                  />
                )}
              />
            </div>

            <div>
              <label htmlFor="password" className={authLabelClass}>
                New password
              </label>
              <div className="relative">
                <input
                  type={passwordHidden ? "password" : "text"}
                  placeholder="Create a new password"
                  name="password"
                  id="password"
                  value={password}
                  onChange={handleOnChange}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  className={`${authInputClass} pr-11`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setPasswordHidden(!passwordHidden)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={
                    passwordHidden ? "Show password" : "Hide password"
                  }
                >
                  {passwordHidden ? (
                    <IoEyeSharp size={20} />
                  ) : (
                    <IoIosEyeOff size={20} />
                  )}
                </button>
              </div>
              <PasswordRequirementsFeedback
                password={password}
                userContext={{
                  email,
                  username: email,
                }}
                visible={passwordFocused || password.length > 0}
              />
            </div>
          </>
        )}

        <button
          disabled={
            !email ||
            (!otpHidden &&
              (!otp ||
                !password ||
                !isPasswordValid(password, {
                  email,
                  username: email,
                })))
          }
          type="submit"
          className={authBtnPrimary}
        >
          {otpHidden ? "Send OTP" : "Reset password"}
        </button>
      </form>
    </AuthLayout>
  );
};

export default ForgotPassword;
