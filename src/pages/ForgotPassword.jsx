import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Cookies from "js-cookie";
import { dataContext } from "../context/dataContext.jsx";
import OtpInput from "react-otp-input";

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
      const response = await fetch("https://auth.pinksurfing.com/api/send-otp/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      console.log(response)
      if (response.ok) {
        handleSuccess("Email Sent Successfully");
        setOtpHidden(false);
      } else {
        handleError("Failed to send OTP");
      }
    } catch (error) {
      console.log(error)
      handleError("Error sending OTP");
    }
  };

  const verifyOtp = async () => {
    try {
      const response = await fetch("https://auth.pinksurfing.com/api/password_reset/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, entered_otp: otp, new_password: password }),
      });
      if (response.ok) {
        handleSuccess("Password reset successfully");
        navigate("/signin");
      } else {
        handleError("Failed to reset password");
      }
    } catch (error) {
      handleError("Error resetting password");
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
                  className="border-none text-black outline-none py-2 px-3 rounded-md"
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
                      color: "black",
                      display: "flex",
                      justifyContent: "space-evenly",
                    }}
                    inputStyle={{
                      width: "40px",
                    }}
                    shouldAutoFocus={true}
                    renderSeparator={<span className="  "> </span>}
                    renderInput={(props) => <input {...props} />}
                  />
                  <div className="flex flex-col mt-2">
                    <label
                      htmlFor="password"
                      className="text-[13px] sm:text-[14.9px] text-white mb-1"
                    >
                      New Password
                    </label>
                    <input
                      type="password"
                      placeholder="Enter New Password"
                      name="password"
                      id="password"
                      value={password}
                      onChange={handleOnChange}
                      className="border-none text-black outline-none py-2 px-3 rounded-md"
                    />
                  </div>
                </>
              )}
              <button
                disabled={!email || (!otpHidden && (!otp || !password))}
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
