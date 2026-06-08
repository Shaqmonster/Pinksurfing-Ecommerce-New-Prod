import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Cookies from "js-cookie";
import { dataContext } from "../context/dataContext.jsx";
import OtpInput from "react-otp-input";
import axios from "axios";
import { IoEyeSharp } from "react-icons/io5";
import { IoIosEyeOff } from "react-icons/io";
import PasswordRequirementsFeedback from "../components/PasswordRequirementsFeedback";
import { isPasswordValid } from "../utils/djangoPasswordValidation";

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
      const response = await axios.post("https://auth.pinksurfing.com/api/send-otp/", 
        { email },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      console.log(response)
      if (response.status === 200) {
        handleSuccess("Email Sent Successfully");
        setOtpHidden(false);
      }
    } catch (error) {
      console.log(error)
      if(error.response?.status === 404){
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
      const response = await axios.post("https://auth.pinksurfing.com/api/password_reset/",
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
    <>
      <div className="w-full h-screen flex items-center justify-center overflow-hidden">
        <div className="hidden lg:block w-full h-screen relative">
          <img src="/signin.jpg" className="w-full h-full" />
          <div className="absolute top-0 left-0 w-full h-screen bg-[#2d1e5f]/60"></div>
        </div>
        <div className="z-40 w-full lg:w-fit lg:min-w-[500px] h-full flex items-center justify-center bg-[#2d1e5f] py-4 px-10 flex-col">
          <p className="text-white absolute top-[3.5%] font-bold text-[23px] sm:text-[24px] lg:text-[27px] mb-2 text-center">
            PinkSurfing
          </p>
          <div className="w-[400px] h-fit bg-[#2d1e5f] py-7 px-10 flex flex-col items-center rounded-md">
            <form
              onSubmit={ChangePassword}
              className="flex flex-col gap-2 w-[90%]"
            >
              <p className="text-white font-bold text-[22px] sm:text-[24px] mb-3">
                Forgot Password
              </p>
              <div className="flex flex-col">
                <label
                  htmlFor="email"
                  className="text-[13px] sm:text-[14.9px] text-white mb-1"
                >
                  Enter Email To Receive OTP
                </label>
                <input
                  type="email"
                  placeholder="Enter Email To Receive OTP"
                  name="email"
                  id="email"
                  value={email}
                  onChange={handleOnChange}
                  disabled={!otpHidden}
                  className="border-none text-black outline-none py-2 px-3 rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed"
                />
              </div>
              {!otpHidden && (
                <>
                  <p className="text-[13px] mt-2 sm:text-[14.9px] text-white mb-1">
                    Enter OTP
                  </p>
                  <OtpInput
                    value={otp}
                    onChange={setOtp}
                    numInputs={6}
                    containerStyle={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "10px",
                    }}
                    inputStyle={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "4px",
                      backgroundColor: "#24194b",
                      border: "none",
                      outline: "none",
                      color: "#ffffff",
                      fontSize: "18px",
                      fontWeight: "600",
                      textAlign: "center",
                    }}
                    shouldAutoFocus={true}
                    renderSeparator={<span className="text-white/40">-</span>}
                    renderInput={(props) => (
                      <input
                        {...props}
                        style={{
                          ...props.style,
                          color: "#ffffff",
                          WebkitTextFillColor: "#ffffff",
                          caretColor: "#ffffff",
                        }}
                      />
                    )}
                  />
                  <div className="flex flex-col mt-2">
                    <label
                      htmlFor="password"
                      className="text-[13px] sm:text-[14.9px] text-white mb-1"
                    >
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={passwordHidden ? "password" : "text"}
                        placeholder="Enter New Password"
                        name="password"
                        id="password"
                        value={password}
                        onChange={handleOnChange}
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => setPasswordFocused(false)}
                        className="border-none text-black outline-none w-full py-2 px-3 pr-10 rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => setPasswordHidden(!passwordHidden)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-700"
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
                className="border-none disabled:bg-white/50 disabled:text-gray-900 outline-none bg-white text-black font-semibold mt-3 py-3 px-3 rounded-md"
              >
                {otpHidden ? "Send OTP" : "Verify OTP"}
              </button>
            </form>

            <Link className="text-white mt-5 underline" to="/signin">
              Return to Sign In
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;
