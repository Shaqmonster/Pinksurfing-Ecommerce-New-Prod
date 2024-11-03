import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Cookies from "js-cookie";
import { dataContext } from "../context/dataContext.jsx";
import { IoEyeSharp } from "react-icons/io5";
import { IoIosEyeOff } from "react-icons/io";
import { useCookies } from "react-cookie";
import { authContext } from "../context/authContext";
import axios from "axios";

const Signin = () => {
  const navigate = useNavigate();
  const { setUser } = useContext(authContext);
  const [passwordHidden, setPasswordHidden] = useState(true);
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const { handleError, handleSuccess } = useContext(dataContext);
  const { setIsProfileOpen } = useContext(authContext);
  const [cookies, setCookie] = useCookies(["token", "refresh"]);
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
    if (name === "password") {
      if (!passwordRegex.test(value)) {
        setPasswordError(
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
        );
      } else {
        setPasswordError("");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
  
    try {
      // First API request to get tokens
      const response = await axios.post(
        "https://auth.pinksurfing.com/api/token/",
        { email, password },
        { headers: { "Content-Type": "application/json" } }
      );
  
      if (response.status !== 200) {
        handleError(response.data.detail || "Failed to sign in");
        return;
      }
  
      const data = response.data;
  
      // Second API request to create a customer
      const customerResponse = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/customer/create-customer-from-sso/`,
        {},
        { headers: { Authorization: `Bearer ${data.access}` } }
      );
  
      if (customerResponse.status === 200 || customerResponse.status === 201) {
        const expirationDateAccessToken = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        const expirationDateRefreshToken = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  
        setCookie("token", data.access, {
          path: "/",
          expires: expirationDateAccessToken,
        });
        setCookie("refresh", data.refresh, {
          path: "/",
          expires: expirationDateRefreshToken,
        });
        localStorage.setItem("refresh", data.refresh);
  
        setUser(data);
        setIsProfileOpen(false);
        handleSuccess("Signed In Successfully");
        setInputValue({ email: "", password: "" });
  
        setTimeout(() => {
          navigate("/");
        }, 1000);
      } else if (customerResponse.status === 400) {
        handleError("Phone number exists");
      } else {
        handleError("Failed to create customer");
      }
    } catch (error) {
      // Enhanced error handling here
      if (error.response) {
        // API responded with a status code outside of the 2xx range
        if (error.response.status === 400) {
          const errorData = error.response.data;
          if (errorData.non_field_errors) {
            // Handle specific error for invalid credentials
            handleError("Invalid email or password.");
          } else if (errorData.email) {
            // Handle specific error for invalid email
            setEmailError(errorData.email[0]);
          } else if (errorData.password) {
            // Handle specific error for invalid password
            setPasswordError(errorData.password[0]);
          } else {
            // Generic error handling for other cases
            handleError("An error occurred. Please check your details and try again.");
          }
        } else if (error.response.status === 404) {
          // Handle not found error (e.g., email not found)
          handleError("Email does not exist.");
        } else if (error.response.status === 401) {
          // Unauthorized (incorrect credentials)
          handleError("Incorrect password. Please try again.");
        } else if (error.response.status === 403) {
          handleError("Email does not exist or password is incorrect.");
        }
      } else if (error.request) {
        // Network error or no response was received
        handleError("Network error. Please check your internet connection.");
      } else {
        // Some other error occurred
        console.error("Unexpected error during sign-in:", error);
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