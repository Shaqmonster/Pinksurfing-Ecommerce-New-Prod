import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { dataContext } from "../context/dataContext.jsx";
import { IoEyeSharp } from "react-icons/io5";
import { IoIosEyeOff } from "react-icons/io";
import { authContext } from "../context/authContext";
import axios from "axios";

const Signin = () => {
  const navigate = useNavigate();
  const { login, setIsProfileOpen } = useContext(authContext);
  const [passwordHidden, setPasswordHidden] = useState(true);
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const { handleError, handleSuccess } = useContext(dataContext);
  const [inputValue, setInputValue] = useState({
    email: "",
    password: "",
  });
  const { email, password } = inputValue;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

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
    // if (name === "password") {
    //   if (!passwordRegex.test(value)) {
    //     setPasswordError(
    //       "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    //     );
    //   } else {
    //     setPasswordError("");
    //   }
    // }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
  
    try {
      // First API request to get tokens
      const response = await axios.post(
        "https://auth.pinksurfing.com/api/token/",
        { email, password },
        { 
          headers: { "Content-Type": "application/json" },
          withCredentials: true
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
      <div className="w-full h-screen flex items-center justify-center overflow-hidden">
        <div className="hidden lg:block w-full h-screen relative">
          <img
            src="/signin.jpg"
            className="w-full h-full"
            alt="Sign In Background"
          />
          <div className="absolute top-0 left-0 w-full h-screen bg-[#2d1e5f]/60"></div>
        </div>
        <div className="z-40 w-full lg:w-fit lg:min-w-[500px] h-full flex items-center justify-center bg-[#2d1e5f] py-4 px-10 flex-col">
          <p
            className="text-white absolute top-[3.5%] font-bold text-[23px] sm:text-[24px] lg:text-[27px] mb-2 text-center cursor-pointer"
            onClick={() => navigate("/")}
          >
            PinkSurfing
          </p>
          <div className="w-[400px] h-fit bg-[#2d1e5f] py-7 px-10 flex flex-col items-center rounded-md">
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-2 w-[90%]"
            >
              <p className="text-white font-bold text-[22px] sm:text-[24px] mb-3">
                Sign In
              </p>
              <div className="flex flex-col">
                <label
                  htmlFor="email"
                  className="text-[13px] sm:text-[14.9px] text-white mb-1"
                >
                  Email
                </label>
                <input
                  type="text"
                  placeholder="Your email"
                  name="email"
                  id="email"
                  value={email}
                  onChange={handleOnChange}
                  className="border-none outline-none text-black py-2 px-3 rounded-md"
                />
              </div>
              {emailError && (
                <p className="text-red-500 text-sm mt-1">{emailError}</p>
              )}
              <div className="relative flex flex-col">
                <label
                  htmlFor="password"
                  className="text-[13px] sm:text-[14.9px] text-white mb-1"
                >
                  Password
                </label>
                <input
                  type={passwordHidden ? "password" : "text"}
                  placeholder="Your Password"
                  name="password"
                  id="password"
                  value={password}
                  onChange={handleOnChange}
                  className="border-none outline-none text-black py-2 px-3 rounded-md"
                />
                {passwordHidden ? (
                  <IoEyeSharp
                    onClick={() => setPasswordHidden(false)}
                    className="text-gray-700 sm:mt-0.5 text-[18px] absolute right-3 top-9 cursor-pointer"
                  />
                ) : (
                  <IoIosEyeOff
                    onClick={() => setPasswordHidden(true)}
                    className="text-gray-700 sm:mt-0.5 text-[18px] absolute right-3 top-9 cursor-pointer"
                  />
                )}
                <Link
                  to="/forgotPassword"
                  className="place-self-end mt-0.5 w-fit text-[14px] text-right text-white"
                >
                  Forgot password?
                </Link>
              </div>
              {passwordError && (
                <p className="text-red-500 text-sm mt-1">{passwordError}</p>
              )}
              <button
                disabled={!email || !password}
                type="submit"
                className="border-none disabled:bg-white/50 disabled:text-gray-900 outline-none bg-white text-black font-semibold mt-3 py-3 px-3 rounded-md"
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>
            </form>
            <p className="text-[14.9px] text-center mt-5 text-white">
              Don't have an account?
              <Link className="ml-1 underline" to="/signup">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <img src="/loading.svg" alt="Loading..." className="w-16 h-16" />
        </div>
      )}
    </>
  );
};

export default Signin;