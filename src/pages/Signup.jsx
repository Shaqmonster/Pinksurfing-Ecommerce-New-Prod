import React, { useContext, useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { dataContext } from "../context/dataContext";
import { IoEyeSharp } from "react-icons/io5";
import { IoIosEyeOff } from "react-icons/io";
import { IoSearch } from "react-icons/io5";
import { IoChevronDown } from "react-icons/io5";
import axios from "axios";
import PinInput from "react-pin-input";
import Cookies from "js-cookie";
import { Country } from "country-state-city";

const Signup = () => {
  const navigate = useNavigate();
  const [passwordHidden, setPasswordHidden] = useState(true);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState([]);
  const [countrySearch, setCountrySearch] = useState("");
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState("bottom");
  const countryDropdownRef = useRef(null);
  const [inputValue, setInputValue] = useState({
    first_name: "",
    last_name: "",
    email: "",
    entered_otp: "",
    password: "",
    phone_number: "",
    country_code: "",
  });
  const { email, password, first_name, entered_otp, last_name, phone_number,country_code } =
    inputValue;
  const pinInputRef = useRef(null);
  const [timer, setTimer] = useState(0);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  useEffect(() => {
    const token = Cookies.get("token");
    if (token) {
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch(
          "https://restcountries.com/v3.1/all?fields=name,cca2,idd,currencies,latlng,timezones"
        );
        const data = await response.json();

        // Transform the data to match the desired structure
        const transformedData = data.map((country) => ({
          name: country.name.common,
          cca2: country.cca2,
          phonecode: country.idd?.root
            ? country.idd.root + (country.idd.suffixes?.[0] || "")
            : null,
          currency: country.currencies
            ? Object.keys(country.currencies).map((code) => ({
                name: country.currencies[code].name,
                symbol: country.currencies[code].symbol,
              }))
            : [],
          latitude: country.latlng?.[0] || null,
          longitude: country.latlng?.[1] || null,
          timezones: country.timezones || [],
        }));
        console.log(transformedData[0]);
        setCountries(transformedData);
      } catch (error) {
        console.error("Error fetching country data:", error);
      }
    };

    fetchCountries();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target)) {
        setIsCountryDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter countries based on search
  const filteredCountries = countries.filter((country) =>
    country.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    (country.phonecode && country.phonecode.includes(countrySearch))
  );

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setInputValue((prev) => ({
      ...prev,
      country_code: country.phonecode,
    }));
    setIsCountryDropdownOpen(false);
    setCountrySearch("");
  };

  const toggleDropdown = () => {
    if (!isCountryDropdownOpen && countryDropdownRef.current) {
      const rect = countryDropdownRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      // If there's less than 320px below, open upward
      if (spaceBelow < 320 && spaceAbove > spaceBelow) {
        setDropdownPosition("top");
      } else {
        setDropdownPosition("bottom");
      }
    }
    setIsCountryDropdownOpen(!isCountryDropdownOpen);
  };


  const handlePaste = (event) => {
    const pasteData = event.clipboardData.getData("text");
    if (pasteData.length === 6 && /^[0-9]+$/.test(pasteData)) {
      setInputValue((prev) => ({
        ...prev,
        entered_otp: pasteData,
      }));
      if (pinInputRef.current) {
        pasteData.split("").forEach((char, index) => {
          pinInputRef.current[`input${index}`].value = char;
        });
      }
    }
    event.preventDefault();
  };

  const handleOnChange = (e) => {
    const { name, value } = e.target;
    let updatedPhoneNumber = inputValue.phone_number;

    if (name === "country_code") {
      setInputValue((prev) => ({
        ...prev,
        country_code: value,
      }));
    } else if (name === "phone_number") {
      updatedPhoneNumber = value;
      setInputValue((prev) => ({
        ...prev,
        phone_number: updatedPhoneNumber,
      }));
    } else {
      setInputValue((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    if (name === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      setEmailError(emailRegex.test(value) ? "" : "Invalid email address");
    }

    if (name === "password") {
      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      setPasswordError(
        passwordRegex.test(value)
          ? ""
          : "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      );
    }

    console.log(inputValue);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!inputValue.entered_otp || inputValue.entered_otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP.");
      setLoading(false);
      return;
    }

    try {
      const fullPhoneNumber = `+${
        inputValue.country_code
      }${inputValue.phone_number.replace(/^\+\d+/, "")}`;

      console.log("Signup Data:", {
        password: inputValue.password,
        email: inputValue.email,
        first_name: inputValue.first_name,
        last_name: inputValue.last_name,
        phone_number: fullPhoneNumber,
        entered_otp: entered_otp,
        countries: inputValue.country_code
      });

      const createResult = await CustomerCreate({
        ...inputValue,
        phone_number: fullPhoneNumber,
      });

      if (createResult.success) {
        toast.success("Signup successful! Redirecting to sign-in page.");
        navigate("/signin");
      } else {
        toast.error(
          createResult.message || "Signup failed. Please try again later."
        );
      }
    } catch (error) {
      console.log(error);
      toast.error("Signup failed. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const CustomerCreate = async (inputValue) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/customer/create-account/`,
        {
          password: inputValue.password,
          email: inputValue.email,
          first_name: inputValue.first_name,
          last_name: inputValue.last_name,
          entered_otp: inputValue.entered_otp,
          phone_number: inputValue.phone_number,
          country_code: inputValue.country_code,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
  
      if (response.status === 200) {
        console.log("Signup successful:", response.data);
        localStorage.setItem("phone_number", inputValue.phone_number);
        return { success: true };
      } else {
        console.error("Unexpected status:", response.status);
  
        // Handle error from response if available in 'status' or 'error'
        let errorMessage = "Signup failed. Please try again later.";
        if (response.data) {
          if (response.data.error) {
            try {
              const errorData = JSON.parse(response.data.error);
              if (errorData && errorData.message) {
                errorMessage = errorData.message;
              }
            } catch (parseError) {
              console.error("Error parsing error message:", parseError);
            }
          } else if (response.data.status) {
            errorMessage = response.data.status;
          }
        }
  
        return {
          success: false,
          message: errorMessage,
        };
      }
    } catch (err) {
      console.error("Signup request failed:", err);
  
      // Default error message
      let errorMessage = "Signup failed. Please try again later.";
  
      // Handle error from catch block response if available in 'status' or 'error'
      if (err.response && err.response.data) {
        if (err.response.data.error) {
          try {
            const errorData = JSON.parse(err.response.data.error);
            if (errorData && errorData.message) {
              errorMessage = errorData.message;
            }
          } catch (parseError) {
            console.error("Error parsing error message:", parseError);
          }
        } else if (err.response.data.status) {
          errorMessage = err.response.data.status;
        }
      }
      return {
        success: false,
        message: errorMessage,
      };
    }
  };
  
  

  const sendOtp = async () => {
    console.log(email);
    try {
      const response = await axios.post(
        "https://auth.pinksurfing.com/api/send-otp/",
        {
          email: email,
          new_register:"yes"
        }
      );
      console.log(response.data);
      if (response.status === 200) {
        toast.success("OTP sent successfully, please check your email");
        setTimer(60); // Start the timer
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to send OTP. Please try again later.");
    }
  };

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [timer]);

  return (
    <>
      <div className="w-full h-screen flex items-center justify-center overflow-hidden">
        <div className="hidden lg:block w-full h-screen relative">
          <img src="/signin.jpg" className="w-full h-full" />
          <div className="absolute top-0 left-0 w-full h-screen bg-[#2d1e5f]/60"></div>
        </div>
        <div className="z-40 w-full lg:w-fit lg:min-w-[500px] h-full flex items-center justify-center bg-[#2d1e5f] py-2 sm:py-4 px-10 flex-col overflow-y-auto">
          <p
            className="text-white sm:relative sm:top-0 font-bold text-[23px] sm:text-[24px] lg:text-[27px] mb-2 mt-4 sm:mt-0 text-center cursor-pointer"
            onClick={() => navigate("/")}
          >
            PinkSurfing
          </p>
          <form
            onSubmit={handleSubmit}
            className="w-[90%] lg:w-full flex flex-col gap-2 pb-4"
          >
            <p className="text-white font-bold text-[22px] sm:text-[24px] mb-3">
              Sign Up
            </p>
            <div className="flex w-full flex-col col-span-1">
              <label
                htmlFor="name"
                className="text-[13px] sm:text-[14.9px] text-white mb-1 flex items-center gap-1"
              >
                First Name
                <span className="text-red-500 font-bold text-lg">*</span>
              </label>
              <input
                type="text"
                placeholder="Your First Name"
                name="first_name"
                id="first_name"
                value={first_name}
                className="border-none outline-none text-white py-2 px-3 rounded-md placeholder-white bg-[#24194b]"
                onChange={handleOnChange}
                required
              />
            </div>

            <div className="flex w-full flex-col col-span-1">
              <label
                htmlFor="name"
                className="text-[13px] sm:text-[14.9px] text-white mb-1"
              >
                Last Name
                <span className="text-red-500 font-bold text-lg">*</span>
              </label>
              <input
                type="text"
                placeholder="Your Last Name"
                name="last_name"
                id="last_name"
                value={last_name}
                className="border-none outline-none text-white py-2 px-3 rounded-md placeholder-white bg-[#24194b]"
                onChange={handleOnChange}
                required
              />
            </div>

            <div className="flex flex-col">
              <label
                htmlFor="email"
                className="text-[13px] sm:text-[14.9px] text-white mb-1"
              >
                Email
                <span className="text-red-500 font-bold text-lg">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  placeholder="Your Email"
                  name="email"
                  id="email"
                  value={email}
                  className="flex-1 border-none outline-none text-white py-2 px-3 rounded-md placeholder-white bg-[#24194b]"
                  onChange={handleOnChange}
                  required
                />
                <button
                  type="button"
                  onClick={sendOtp}
                  className={`text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 ${
                    timer > 0 || email.length === 0 || emailError
                      ? "bg-gray-600 cursor-not-allowed"
                      : "bg-black hover:bg-gray-800"
                  }`}
                  disabled={timer > 0 || email.length === 0 || emailError}
                >
                  {timer > 0 ? `Wait for ${timer} sec` : "Verify"}
                </button>
              </div>
              {emailError && (
                <p className="text-red-500 text-sm mt-1">{emailError}</p>
              )}
            </div>

            <div className="flex flex-col">
              <label
                htmlFor="entered_otp"
                className="text-[13px] sm:text-[14.9px] text-white mb-1"
              >
                Enter OTP
                <span className="text-red-500 font-bold text-lg">*</span>
              </label>
              <div onPaste={handlePaste}>
                <PinInput
                  ref={pinInputRef}
                  length={6}
                  focus
                  value={inputValue.entered_otp}
                  onChange={(value) =>
                    setInputValue((prev) => ({ ...prev, entered_otp: value }))
                  }
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
                    color: "white",
                  }}
                />
              </div>
            </div>

            <div className="flex flex-col col-span-1">
              <label
                htmlFor="password"
                className="text-[13px] sm:text-[14.9px] text-white mb-1"
              >
                Password
                <span className="text-red-500 font-bold text-lg">*</span>
              </label>
              <div className="relative">
                <input
                  type={passwordHidden ? "password" : "text"}
                  placeholder="Your Password"
                  name="password"
                  id="password"
                  value={password}
                  className="border-none outline-none w-full text-white py-2 px-3 rounded-md placeholder-white bg-[#24194b]"
                  onChange={handleOnChange}
                  required
                />
                <button
                  type="button"
                  onClick={() => setPasswordHidden(!passwordHidden)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white"
                >
                  {passwordHidden ? (
                    <IoEyeSharp size={20} />
                  ) : (
                    <IoIosEyeOff size={20} />
                  )}
                </button>
              </div>
              {passwordError && (
                <p className="text-red-500 text-sm mt-1">{passwordError}</p>
              )}
            </div>

            <div className="flex flex-col col-span-1">
              <label
                htmlFor="phone_number"
                className="text-[13px] sm:text-[14.9px] text-white mb-1"
              >
                Phone Number
                <span className="text-red-500 font-bold text-lg">*</span>
              </label>
              <div className="flex items-center gap-2">
                {/* Searchable Country Code Dropdown */}
                <div className="relative w-[35%] sm:w-[30%]" ref={countryDropdownRef}>
                  <button
                    type="button"
                    onClick={toggleDropdown}
                    className="w-full border-none outline-none text-white py-2 px-2 sm:px-3 rounded-md bg-[#24194b] flex items-center justify-between text-sm"
                  >
                    <span className="truncate">
                      {selectedCountry ? `${selectedCountry.phonecode}` : "Code"}
                    </span>
                    <IoChevronDown className={`transition-transform ${isCountryDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isCountryDropdownOpen && (
                    <div 
                      className={`absolute z-50 w-[280px] sm:w-[320px] bg-[#24194b] rounded-md shadow-lg max-h-[300px] flex flex-col ${
                        dropdownPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'
                      }`}
                      style={{
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)'
                      }}
                    >
                      {/* Search Input */}
                      <div className="p-2 border-b border-gray-600">
                        <div className="relative">
                          <IoSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search country..."
                            value={countrySearch}
                            onChange={(e) => setCountrySearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 bg-[#1a0f3a] text-white rounded-md outline-none text-sm placeholder-gray-400"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>

                      {/* Countries List */}
                      <div className="overflow-y-auto max-h-[240px]">
                        {filteredCountries.length > 0 ? (
                          filteredCountries.map((country) => (
                            <button
                              key={country.cca2}
                              type="button"
                              onClick={() => handleCountrySelect(country)}
                              className="w-full text-left px-3 py-2 hover:bg-[#1a0f3a] text-white text-sm transition-colors"
                            >
                              <span className="font-semibold">{country.phonecode}</span>
                              <span className="text-gray-300 ml-2">({country.name})</span>
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-gray-400 text-sm">
                            No countries found
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <input
                  type="text"
                  placeholder="Your Phone Number"
                  name="phone_number"
                  id="phone_number"
                  value={inputValue.phone_number}
                  className="flex-1 border-none outline-none text-white py-2 px-3 rounded-md placeholder-white bg-[#24194b]"
                  onChange={handleOnChange}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="text-white bg-black py-2 px-4 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
            >
              {loading ? "Signing Up..." : "Sign Up"}
            </button>
          </form>
          <p className="text-[13px] sm:text-[15px] mt-2 mb-4 text-gray-200">
            Already have an account?{" "}
            <Link
              to="/signin"
              className="underline text-gray-300 hover:text-white"
            >
              Sign In
            </Link>
          </p>
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

export default Signup;
