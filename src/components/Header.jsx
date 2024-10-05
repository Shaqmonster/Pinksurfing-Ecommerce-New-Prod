import React, { useContext, useRef, useCallback } from "react";
import { useState, useEffect } from "react";
import axios from "axios";

import { Link, useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import { authContext } from "../context/authContext";
import { dataContext } from "../context/dataContext";
import { FaWallet } from "react-icons/fa";

import Profile from "./Profile";
import Category from "./Category";
import CategoriesMobile from "./CategoriesMobile";
import Cart from "./Cart";
import Wishlist from "./Wishlist";
import SingleOrderForm from "./SingleOrderForm";
import VendorDetailsForm from "./VendorDetailsForm";
import QRCode from "qrcode.react";
// icons-------------------------------------------------------------
import { MdOutlineWbSunny } from "react-icons/md";
import { IoIosMoon } from "react-icons/io";
import { IoCart, IoMenuOutline, IoPersonCircleOutline } from "react-icons/io5";
import { FaHeart } from "react-icons/fa";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import { currencyOptions } from "../utils/CurrencyList";
import ProfilePopup from "./ProfilePopup";

const Header = () => {
  const [cookies] = useCookies(["token", "refresh"]);
  const {
    user,
    isDarkMode,
    setIsDarkMode,
    currency,
    setCurrency,
    setIsCartOpen,
    setIsWishlistOpen,
    setIsProfileOpen,
    isProfileOpen,
  } = useContext(authContext);
  const { cartProducts, setCartProducts, setWishlistProducts, getAllProducts } =
    useContext(dataContext);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState("MYBIZ");
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletDetails, setWalletDetails] = useState();
  const [showQRCode, setShowQRCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const pathParts = window.location.pathname.split("/");
  const lastPart = pathParts[pathParts.length - 1];

  const updateWalletBalance = useCallback(async () => {
    if (!cookies.token) return;
    try {
      const addresses = await fetchWalletAddresses();
      if (addresses.length > 0) {
        const balance = await fetchWalletBalance(addresses[0]);
        setWalletBalance(balance);
      }
    } catch (error) {
      console.error("Failed to update wallet balance:", error);
    }
  }, [cookies.token]);

  const fetchWalletAddresses = async () => {
    setLoading(true);
    const response = await axios.get(
      "https://auth.pinksurfing.com/api/crypto/wallet/",
      {
        headers: {
          Authorization: `Bearer ${cookies.token}`,
        },
      }
    );
    setWalletDetails(response.data.data);
    setIsWalletOpen(true);
    setLoading(false);
    return response.data;
  };

  const fetchWalletBalance = async (address) => {
    setLoading(true);
    const response = await axios.get(
      `https://auth.pinksurfing.com/api/crypto/balance/${address}`
    );
    setLoading(false);
    return response.data.balance;
  };

  const getCartProducts = async () => {
    if (!cookies.token) return;
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/api/customer/cart/view/`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.token}`,
          },
        }
      );
      setCartProducts(response.data);
    } catch (error) {
      console.error("Failed to fetch cart products:", error);
      navigate("/signin");
    }
  };

  const getWishlist = async () => {
    if (!cookies.token) return;
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/api/customer/wishlist/view/`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.token}`,
          },
        }
      );
      setWishlistProducts(response.data.items);
    } catch (error) {
      console.error("Failed to fetch wishlist:", error);
      navigate("/signin");
    }
  };

  useEffect(() => {
    updateWalletBalance();
  }, [updateWalletBalance]);

  useEffect(() => {
    const fetchData = async () => {
      if (cookies.token) {
        await getAllProducts();
        await getCartProducts();
        await getWishlist();
      }
    };

    fetchData();
  }, [cookies.token]);

  const handleWalletClick = () => {
    setShowQRCode(true);
  };

  const closeQRCode = () => {
    setShowQRCode(false);
  };

  const getWalletAddress = () => {
    switch (selectedCurrency) {
      case "BTC":
        return walletDetails?.btc_deposit || "";
      case "ETH":
      case "USDT":
        return walletDetails?.eth_deposit || "";
      case "MYBIZ":
        return walletDetails?.ps_wallet || "";
      default:
        return "";
    }
  };

  return (
    <>
      <CategoriesMobile />
      {user && (
        <>
          {" "}
          <Cart />
          <Wishlist />
          <SingleOrderForm />
          <VendorDetailsForm />
          <ProfilePopup />
        </>
      )}
      <div className="bg-black w-full py-1 flex items-center justify-between px-[2%] text-white overflow-hidden">
        <div className="flex items-center w-3/4 sm:w-auto overflow-hidden sm:overflow-visible">
          <div className="animate-marquee whitespace-nowrap">
            <p className="text-[11px] sm:text-[14.3px]">
              Want to explore Upcoming Deals on Weekends?
            </p>
          </div>
        </div>
        <div className="flex items-center bg-black">
          <select className=" bg-black border-none outline-none text-[11px] sm:text-[14px] mr-3">
            <option>English</option>
          </select>
          <select
            value={currency}
            onChange={(e) => {
              setCurrency(e.target.value);
            }}
            className=" bg-black border-none outline-none text-[11px] sm:text-[14px]"
          >
            {Object.keys(currencyOptions).map((code) => (
              <option key={code} value={currencyOptions[code].symbol}>
                {code}
              </option>
            ))}

            {/* <option value="$">USD</option> */}
            {/* <option value="Rs.">INR</option> */}
          </select>
        </div>
      </div>
      <div className="bg-[#2d1e5f] w-full py-3 flex items-center justify-between px-[2.4%] sm:px-[2%] text-white">
        <Link to="/">
          <div className="flex items-center gap-1 sm:gap-2">
            <p className="text-black font-bold text-[17px] sm:text-[19px] bg-white w-[24px] h-[24px] sm:w-[25px] sm:h-[25px] flex items-center justify-center rounded-full ">
              P
            </p>
            <p className="hidden sm:block sm:text-[23.8px] sm:font-[600]">
              PinkSurfing
            </p>
          </div>
        </Link>

        <div className="  flex items-center gap-5">
          {isWalletOpen && (
            <div className="flex items-center">
              <p className="text-white mr-2 flex">
                {selectedCurrency === "MYBIZ" ? "MYBIZ" : selectedCurrency}{" "}
                <span className="hidden sm:block sm:text-white ml-1">
                  Balance:
                </span>
              </p>
              <p className=" text-white mr-1 sm:mr-3">${walletBalance}</p>
              <FaWallet className="hidden sm:block sm:text-2xl cursor-pointer" />
              <select
                className="ml-2 p-1 bg-black text-white"
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
              >
                <option value="BTC">BTC</option>
                <option value="ETH">ETH</option>
                <option value="USDT">USDT</option>
                <option value="MYBIZ">MYBIZ</option>
              </select>
              <QRCode
                value={getWalletAddress()}
                className={`ml-2 ${!showQRCode && "cursor-pointer"}`}
                size={32}
                onClick={handleWalletClick}
              />
            </div>
          )}

          {showQRCode && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
              <div className="bg-white p-4 rounded">
                <QRCode value={getWalletAddress()} size={256} />
                <button
                  onClick={closeQRCode}
                  className="mt-4 p-2 bg-red-500 text-white rounded"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {isDarkMode ? (
            <MdOutlineWbSunny
              onClick={() => {
                setIsDarkMode(false);
              }}
              className=" cursor-pointer -mr-2 text-[24px]"
            />
          ) : (
            <IoIosMoon
              onClick={() => {
                setIsDarkMode(true);
              }}
              className=" cursor-pointer -mr-2 text-[24px]"
            />
          )}

          {user && (
            <div className=" relative">
              <div className=" -mr-2 sm:mr-0 flex items-center gap-3">
                <FaHeart
                  onClick={() => {
                    setIsProfileOpen(false);
                    setIsWishlistOpen(true);
                  }}
                  className=" cursor-pointer text-[19px] sm:text-[20px]"
                />
                <div
                  onClick={() => {
                    setIsProfileOpen(false);
                    setIsCartOpen(true);
                  }}
                  className=" relative cursor-pointer "
                >
                  <span className=" bg-purple-200 px-[5px] sm:px-1.5 sm:py-[1px] absolute -top-2 sm:-top-3 -right-2 text-black text-[11px] font-bold rounded-full">
                    {cartProducts.length}
                  </span>
                  <IoCart className=" cursor-pointer text-[22px] " />
                </div>
              </div>
            </div>
          )}

          <div className=" relative ">
            <div
              onClick={() => {
                setIsProfileOpen(isProfileOpen === true ? false : true);
              }}
              aria-label="avatar"
              className="flex items-center cursor-pointer space-x-2 p-1 rounded-md"
            >
              {user.img ? (
                <img
                  src="https://avatars.githubusercontent.com/u/499550?v=4"
                  alt="avatar Evan You"
                  className=" w-8  h-8 sm:w-10 sm:h-10 shrink-0 rounded-full"
                />
              ) : (
                <IoPersonCircleOutline className=" -ml-2 text-[29px] cursor-pointer" />
              )}
              {user && (
                <div className="space-y-2 hidden sm:flex flex-col flex-1 truncate">
                  <div className="font-medium relative text-lg  leading-tight text-white">
                    <span className="flex flex-col">
                      <p className=" text-[12.5px] text-white/70 -mb-1">
                        Hello
                      </p>
                      <span className=" relative pr-1">
                        {user?.first_name}
                        <span
                          aria-label="verified"
                          className="absolute top-1/2 -translate-y-1/2 right-0 inline-block rounded-full"
                        ></span>
                      </span>
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="absolute top-14 right-0 z-50">
              {isProfileOpen && <Profile user={user} />}
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <img
            src="/loading.svg"
            alt="loading"
            className="w-[50px] h-[50px] sm:w-[70px] sm:h-[70px] object-contain"
          />
        </div>
      )}

      {/* {isCategoryOpen && (
        <div className=" hidden lg:block relative">
          <Category />
        </div>
      )} */}
    </>
  );
};

export default Header;
