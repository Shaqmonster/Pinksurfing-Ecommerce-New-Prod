import React, { useContext, useRef, useCallback } from "react";
import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

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
import { IoCart, IoMenuOutline, IoPersonCircleOutline, IoSearchSharp, IoClose } from "react-icons/io5";
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
    search,
    setSearch,
    isMobileCategoryOpen,
    setIsMobileCategoryOpen,
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
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const navigate = useNavigate();
  const searchInputRef = React.useRef(null);

  const pathParts = window.location.pathname.split("/");
  const lastPart = pathParts[pathParts.length - 1];

  const updateWalletBalance = useCallback(async () => {
    if (!cookies.access_token) return;
    try {
      const addresses = await fetchWalletAddresses();
      if (addresses.length > 0) {
        const balance = await fetchWalletBalance(addresses[0]);
        setWalletBalance(balance);
      }
    } catch (error) {
      console.error("Failed to update wallet balance:", error);
    }
  }, [cookies.access_token]);

  const fetchWalletAddresses = async () => {
    const response = await axios.get(
      "https://auth.pinksurfing.com/api/crypto/wallet/",
      {
        headers: {
          Authorization: `Bearer ${cookies.access_token}`,
        },
      }
    );
    setWalletDetails(response.data.data);
    setIsWalletOpen(true);
    return response.data;
  };

  const fetchWalletBalance = async (address) => {
    const response = await axios.get(
      `https://auth.pinksurfing.com/api/crypto/balance/${address}`
    );
    return response.data.balance;
  };

  const getCartProducts = async () => {
    if (!cookies.access_token) return;
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/api/customer/cart/view/`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.access_token}`,
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
    if (!cookies.access_token) return;
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/api/customer/wishlist/view/`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.access_token}`,
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
      if (cookies.access_token) {
        await getAllProducts();
        await getCartProducts();
        await getWishlist();
      }
    };

    fetchData();
  }, [cookies.access_token]);

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

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate("/search");
      setShowMobileSearch(false);
    }
  };

  return (
    <>
      <CategoriesMobile />
      {user && (
        <>
          <Cart />
          <Wishlist />
          <SingleOrderForm />
          <VendorDetailsForm />
          <ProfilePopup />
        </>
      )}
      
      {/* Unified Compact Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-40 glass bg-gradient-to-r from-purple-900/95 via-purple-800/95 to-pink-600/95 backdrop-blur-xl w-full py-3 sm:py-4 shadow-xl border-b border-white/10"
      >
        <div className="flex items-center justify-between px-[2%] sm:px-[3%] text-white">
          {/* Logo */}
          <Link to="/">
            <motion.div 
              whileTap={{ scale: 0.95 }}
              className="flex items-center"
            >
              <motion.img 
                src="logo.jpg" 
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full shadow-lg ring-2 ring-white/20" 
                alt="PinkSurfing Logo"
                transition={{ duration: 0.6 }}
              />
            </motion.div>
          </Link>

          {/* Right Section - All Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Search Bar - Desktop */}
            <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-xl mx-4">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg outline-none text-white placeholder-gray-300 focus:ring-2 focus:ring-purple-400 transition-all text-sm"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:text-purple-300 transition-colors"
                >
                  <IoSearchSharp className="text-xl" />
                </button>
              </div>
            </form>

            {/* Mobile Search Icon */}
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="md:hidden"
            >
              <IoSearchSharp
                onClick={() => setShowMobileSearch(true)}
                className="text-2xl text-white cursor-pointer"
              />
            </motion.div>

            {/* Language & Currency - Compact */}
            <div className="hidden sm:flex items-center gap-2">
              <select className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg outline-none text-xs px-2 py-1.5 hover:bg-white/20 transition-all cursor-pointer">
                <option className="bg-purple-900 text-white">EN</option>
              </select>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg outline-none text-xs px-2 py-1.5 hover:bg-white/20 transition-all cursor-pointer"
              >
                {Object.keys(currencyOptions).map((code) => (
                  <option key={code} value={currencyOptions[code].symbol} className="bg-purple-900 text-white">
                    {code}
                  </option>
                ))}
              </select>
            </div>
            {/* Wallet Section */}
            <AnimatePresence>
              {isWalletOpen && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-lg px-2 sm:px-3 py-1.5 border border-white/20"
                >
                  <p className="text-white text-xs font-semibold">
                    {selectedCurrency === "MYBIZ" ? "MYBIZ" : selectedCurrency}
                  </p>
                  <motion.p 
                    key={walletBalance}
                    initial={{ scale: 1.2, color: "#fbbf24" }}
                    animate={{ scale: 1, color: "#ffffff" }}
                    className="text-white font-bold text-xs sm:text-sm"
                  >
                    ${walletBalance}
                  </motion.p>
                  
                  <select
                    className="bg-black/30 text-white text-[10px] sm:text-xs px-1.5 py-0.5 rounded border border-white/20 outline-none cursor-pointer"
                    value={selectedCurrency}
                    onChange={(e) => setSelectedCurrency(e.target.value)}
                  >
                    <option value="BTC">BTC</option>
                    <option value="ETH">ETH</option>
                    <option value="USDT">USDT</option>
                    <option value="MYBIZ">MYBIZ</option>
                  </select>
                  
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <QRCode
                      value={getWalletAddress()}
                      className="cursor-pointer rounded"
                      size={24}
                      onClick={handleWalletClick}
                    />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* QR Code Modal */}
            <AnimatePresence>
              {showQRCode && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50"
                  onClick={closeQRCode}
                >
                  <motion.div 
                    initial={{ scale: 0.8, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.8, y: 20 }}
                    className="glass bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20 shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="bg-white p-4 rounded-2xl shadow-inner">
                      <QRCode value={getWalletAddress()} size={256} />
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={closeQRCode}
                      className="mt-6 w-full py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-red-500/50 transition-all"
                    >
                      Close
                    </motion.button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* User Actions */}
            {user && (
              <div className="flex items-center gap-2 sm:gap-3">
                <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
                  <FaHeart
                    onClick={() => {
                      setIsProfileOpen(false);
                      setIsWishlistOpen(true);
                    }}
                    className="cursor-pointer text-lg sm:text-xl text-pink-300 hover:text-pink-400 transition-colors"
                  />
                </motion.div>
                
                <motion.div 
                  whileHover={{ scale: 1.1 }} 
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setIsProfileOpen(false);
                    setIsCartOpen(true);
                  }}
                  className="relative cursor-pointer"
                >
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="bg-gradient-to-r from-pink-500 to-purple-500 px-1.5 py-0.5 absolute -top-2 -right-2 text-white text-[9px] sm:text-[10px] font-bold rounded-full shadow-lg"
                  >
                    {cartProducts.length}
                  </motion.span>
                  <IoCart className="cursor-pointer text-xl sm:text-2xl text-purple-200 hover:text-purple-300 transition-colors" />
                </motion.div>
              </div>
            )}

            {/* Profile Section */}
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/profile")}
              className="flex items-center cursor-pointer gap-2 bg-white/10 backdrop-blur-md px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-white/20 hover:bg-white/20 transition-all"
            >
              {user.img ? (
                <motion.img
                  whileHover={{ scale: 1.1 }}
                  src="https://avatars.githubusercontent.com/u/499550?v=4"
                  alt="avatar"
                  className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 rounded-full ring-2 ring-white/30 shadow-lg"
                />
              ) : (
                <IoPersonCircleOutline className="text-2xl sm:text-3xl text-purple-200" />
              )}
              {user && (
                <div className="hidden sm:flex flex-col">
                  <p className="text-[10px] text-white/60 leading-tight">Hello</p>
                  <span className="text-xs font-semibold text-white leading-tight">
                    {user?.first_name}
                  </span>
                </div>
              )}
            </motion.div>

            {/* Shop by Categories Button */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsMobileCategoryOpen(!isMobileCategoryOpen)}
              className="flex items-center justify-center cursor-pointer bg-white/10 backdrop-blur-md p-2 sm:p-2.5 rounded-lg border border-white/20 hover:bg-white/20 transition-all"
              title="Shop by Categories"
            >
              <IoMenuOutline className="text-xl sm:text-2xl text-purple-200 hover:text-white transition-colors" />
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Mobile Search Overlay */}
      <AnimatePresence>
        {showMobileSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-start justify-center pt-4 px-4"
          >
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              className="w-full max-w-2xl"
            >
              <form onSubmit={handleSearch} className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                  className="w-full px-5 py-4 bg-white/10 backdrop-blur-md border-2 border-white/30 rounded-2xl outline-none text-white placeholder-gray-300 text-lg focus:ring-2 focus:ring-purple-400 transition-all"
                />
                <button
                  type="submit"
                  className="absolute right-16 top-1/2 -translate-y-1/2 text-white hover:text-purple-300 transition-colors"
                >
                  <IoSearchSharp className="text-2xl" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowMobileSearch(false)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-red-400 transition-colors"
                >
                  <IoClose className="text-3xl" />
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
