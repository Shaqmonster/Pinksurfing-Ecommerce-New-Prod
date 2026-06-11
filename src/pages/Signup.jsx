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
import PasswordRequirementsFeedback from "../components/PasswordRequirementsFeedback";
import { isPasswordValid } from "../utils/djangoPasswordValidation";
import AuthLayout from "../components/auth/AuthLayout";
import GoogleSignInButton from "../components/auth/GoogleSignInButton";
import AuthDivider from "../components/auth/AuthDivider";
import {
  authBtnPrimary,
  authBtnSecondary,
  authInputClass,
  authLabelClass,
  authLinkClass,
  authRequiredMark,
  otpContainerStyle,
  pinInputStyle,
} from "../components/auth/authTheme";

const Signup = () => {
  const navigate = useNavigate();
  const [passwordHidden, setPasswordHidden] = useState(true);
  const [emailError, setEmailError] = useState("");
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState([]);
  const [countrySearch, setCountrySearch] = useState("");
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState("bottom");
  const countryDropdownRef = useRef(null);
  const [isCountriesLoaded, setIsCountriesLoaded] = useState(false);
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

  useEffect(() => {
    const token = Cookies.get("token");
    if (token) {
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    const fetchCountries = async () => {
      // Hardcoded US country as fallback
      const usCountry = {
        name: "United States of America",
        cca2: "US",
        phonecode: "+1",
        currency: [{ name: "United States Dollar", symbol: "$" }],
        latitude: 37.09024,
        longitude: -95.712891,
        timezones: ["UTC-12:00", "UTC-11:00", "UTC-10:00", "UTC-09:00", "UTC-08:00", "UTC-07:00", "UTC-06:00", "UTC-05:00", "UTC-04:00"]
      };

      try {
        const response = await fetch(
          "https://restcountries.com/v3.1/all?fields=name,cca2,idd,currencies,latlng,timezones"
        );
        const data = await response.json();

        // Transform the data to match the desired structure
        const transformedData = data.map((country) => {
          // Special handling for United States to ensure +1 code
          if (country.cca2 === "US") {
            return usCountry;
          }
          
          return {
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
          };
        });
        
        // Sort countries alphabetically by name
        const sortedData = transformedData.sort((a, b) => 
          a.name.localeCompare(b.name)
        );
        
        console.log(transformedData[0]);
        setCountries(sortedData);
        setIsCountriesLoaded(true);
      } catch (error) {
        console.error("Error fetching country data:", error);
        // If API fails, set US as the only country
        setCountries([usCountry]);
        setIsCountriesLoaded(true);
      }
    };

    fetchCountries();
  }, []);

  // Set US as default country code after countries are loaded
  useEffect(() => {
    if (isCountriesLoaded && countries.length > 0 && !selectedCountry) {
      // Check if US already exists in the list
      let usCountry = countries.find((country) => country.cca2 === "US");
      
      // If US doesn't exist, add it manually
      if (!usCountry) {
        usCountry = {
          name: "United States of America",
          cca2: "US",
          phonecode: "+1",
          currency: [{ name: "United States Dollar", symbol: "$" }],
          latitude: 37.09024,
          longitude: -95.712891,
          timezones: ["UTC-12:00", "UTC-11:00", "UTC-10:00", "UTC-09:00", "UTC-08:00", "UTC-07:00", "UTC-06:00", "UTC-05:00", "UTC-04:00"]
        };
        setCountries((prev) => [usCountry, ...prev]);
      }
      console.log("Defaulting to US country code",usCountry);
      setSelectedCountry(usCountry);
      setInputValue((prev) => ({
        ...prev,
        country_code: usCountry.phonecode,
      }));
    }
  }, [isCountriesLoaded, countries]);

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

    if (
      !isPasswordValid(inputValue.password, {
        email: inputValue.email,
        username: inputValue.email,
        first_name: inputValue.first_name,
        last_name: inputValue.last_name,
      })
    ) {
      toast.error("Please meet all password requirements before signing up.");
      setLoading(false);
      return;
    }

    try {
      const fullPhoneNumber = `${
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
      toast.error(error?.response?.data?.message || "Failed to send OTP. Please try again later.");
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
      <AuthLayout
        wide
        title="Create your account"
        subtitle="Join PinkSurfing to shop, sell, and grow"
        footer={
          <>
            Already have an account?{" "}
            <Link to="/signin" className={authLinkClass}>
              Sign in
            </Link>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
            <GoogleSignInButton
              disabled={loading}
              label="Sign up with Google"
            />
            <AuthDivider label="or sign up with email" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className={authLabelClass}>
                  First name<span className={authRequiredMark}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Your first name"
                  name="first_name"
                  id="first_name"
                  value={first_name}
                  className={authInputClass}
                  onChange={handleOnChange}
                  required
                />
              </div>

              <div>
                <label htmlFor="last_name" className={authLabelClass}>
                  Last name<span className={authRequiredMark}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Your last name"
                  name="last_name"
                  id="last_name"
                  value={last_name}
                  className={authInputClass}
                  onChange={handleOnChange}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className={authLabelClass}>
                Email<span className={authRequiredMark}>*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  placeholder="you@example.com"
                  name="email"
                  id="email"
                  value={email}
                  className={`${authInputClass} flex-1`}
                  onChange={handleOnChange}
                  required
                />
                <button
                  type="button"
                  onClick={sendOtp}
                  className={authBtnSecondary}
                  disabled={timer > 0 || email.length === 0 || emailError}
                >
                  {timer > 0 ? `${timer}s` : "Verify"}
                </button>
              </div>
              {emailError && (
                <p className="text-red-500 text-sm mt-2">{emailError}</p>
              )}
            </div>

            <div>
              <label htmlFor="entered_otp" className={authLabelClass}>
                Enter OTP<span className={authRequiredMark}>*</span>
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
                  containerStyle={otpContainerStyle}
                  inputStyle={pinInputStyle}
                />
              </div>
              <p className="text-slate-400 text-xs mt-2">
                Check your spam folder if you don&apos;t see the email
              </p>
            </div>

            <div>
              <label htmlFor="password" className={authLabelClass}>
                Password<span className={authRequiredMark}>*</span>
              </label>
              <div className="relative">
                <input
                  type={passwordHidden ? "password" : "text"}
                  placeholder="Create a password"
                  name="password"
                  id="password"
                  value={password}
                  className={`${authInputClass} pr-11`}
                  onChange={handleOnChange}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
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
              <PasswordRequirementsFeedback
                password={password}
                userContext={{
                  email,
                  username: email,
                  first_name,
                  last_name,
                }}
                visible={passwordFocused || password.length > 0}
              />
            </div>

            <div>
              <label htmlFor="phone_number" className={authLabelClass}>
                Phone number<span className={authRequiredMark}>*</span>
              </label>
              <div className="flex items-center gap-2">
                <div className="relative w-[35%] sm:w-[30%]" ref={countryDropdownRef}>
                  <button
                    type="button"
                    onClick={toggleDropdown}
                    className={`${authInputClass} flex items-center justify-between text-sm py-3`}
                  >
                    <span className="truncate">
                      {selectedCountry ? `${selectedCountry.phonecode}` : "Code"}
                    </span>
                    <IoChevronDown className={`transition-transform ${isCountryDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isCountryDropdownOpen && (
                    <div
                      className={`absolute z-50 w-[280px] sm:w-[320px] bg-white border border-slate-200 rounded-xl shadow-xl max-h-[300px] flex flex-col ${
                        dropdownPosition === "top"
                          ? "bottom-full mb-1"
                          : "top-full mt-1"
                      }`}
                    >
                      <div className="p-2 border-b border-slate-100">
                        <div className="relative">
                          <IoSearch className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search country..."
                            value={countrySearch}
                            onChange={(e) => setCountrySearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 bg-slate-50 text-slate-900 rounded-lg outline-none text-sm placeholder-slate-400 border border-slate-200"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>

                      <div className="overflow-y-auto max-h-[240px]">
                        {filteredCountries.length > 0 ? (
                          filteredCountries.map((country) => (
                            <button
                              key={country.cca2}
                              type="button"
                              onClick={() => handleCountrySelect(country)}
                              className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700 text-sm transition-colors"
                            >
                              <span className="font-semibold">
                                {country.phonecode}
                              </span>
                              <span className="text-slate-500 ml-2">
                                ({country.name})
                              </span>
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-slate-400 text-sm">
                            No countries found
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <input
                  type="text"
                  placeholder="Your phone number"
                  name="phone_number"
                  id="phone_number"
                  value={inputValue.phone_number}
                  className={`${authInputClass} flex-1`}
                  onChange={handleOnChange}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={authBtnPrimary}
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>
      </AuthLayout>
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <img src="/loading.svg" alt="Loading..." className="w-16 h-16" />
        </div>
      )}
    </>
  );
};

export default Signup;
