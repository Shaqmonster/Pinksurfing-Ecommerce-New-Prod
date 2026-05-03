import React, { useContext, useRef, useCallback } from "react";
import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

import { Link, useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import { authContext } from "../context/authContext";
import { dataContext } from "../context/dataContext";
import { FaWallet, FaGavel, FaBriefcase } from "react-icons/fa";

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
      {/* <CategoriesMobile /> */}
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
        className="sticky top-0 z-40 bg-[#0E0F13] w-full py-4 shadow-[0px_10px_30px_#050505]"
      >
        <div className="max-w-[1600px] mx-auto flex items-center justify-between px-6 md:px-12 lg:px-16 text-white gap-10">
          {/* Logo - Pushed Out */}
          <Link to="/" className="flex-shrink-0">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-1 bg-[#0E0F13] rounded-full shadow-[6px_6px_12px_#050505,-6px_-6px_12px_#17181c]"
            >
              <img 
                src="logo.jpg" 
                className="w-10 h-10 rounded-full" 
                alt="PinkSurfing Logo"
              />
            </motion.div>
          </Link>

          {/* Search Bar - Pressed In */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl relative group">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
              <IoSearchSharp className="text-gray-600 group-focus-within:text-purple-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search premium products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-14 pr-6 py-3 bg-[#0E0F13] shadow-[inset_6px_6px_12px_#050505,inset_-6px_-6px_12px_#17181c] rounded-2xl outline-none text-white font-bold placeholder-gray-700 focus:text-purple-400 transition-all text-sm border-none"
            />
          </form>

          {/* Right Section - Grouped Actions */}
          <div className="flex items-center gap-6">
            {/* Action Buttons - Pushed Out */}
            <div className="hidden lg:flex items-center gap-4">
              <Link
                to="/gighub"
                className="flex items-center gap-2 bg-[#0E0F13] shadow-[6px_6px_12px_#050505,-6px_-6px_12px_#17181c] active:shadow-[inset_4px_4px_8px_#050505,inset_-4px_-4px_8px_#17181c] rounded-xl px-5 py-2.5 text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:text-purple-400"
              >
                <FaBriefcase className="text-xs" />
                GigHub
              </Link>
              <Link
                to="/bids"
                className="flex items-center gap-2 bg-[#0E0F13] shadow-[6px_6px_12px_#050505,-6px_-6px_12px_#17181c] active:shadow-[inset_4px_4px_8px_#050505,inset_-4px_-4px_8px_#17181c] rounded-xl px-5 py-2.5 text-purple-500 text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:text-purple-400"
              >
                <FaGavel />
                Bids
              </Link>
            </div>

            {/* Icons Section */}
            <div className="flex items-center gap-6 border-l border-gray-800 pl-6">
              {user && (
                <>
                  <div className="relative group cursor-pointer p-2 bg-[#0E0F13] shadow-[4px_4px_8px_#050505,-4px_-4px_8px_#17181c] active:shadow-[inset_2px_2px_4px_#050505,inset_-2px_-2px_4px_#17181c] rounded-xl" onClick={() => { setIsProfileOpen(false); setIsWishlistOpen(true); }}>
                    <FaHeart className="text-lg text-gray-600 hover:text-pink-500 transition-colors" />
                  </div>
                  
                  <div 
                    className="relative group cursor-pointer p-2 bg-[#0E0F13] shadow-[4px_4px_8px_#050505,-4px_-4px_8px_#17181c] active:shadow-[inset_2px_2px_4px_#050505,inset_-2px_-2px_4px_#17181c] rounded-xl"
                    onClick={() => { setIsProfileOpen(false); setIsCartOpen(true); }}
                  >
                    <IoCart className="text-xl text-gray-600 group-hover:text-purple-400 transition-colors" />
                    {cartProducts.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-purple-600 text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full shadow-[2px_2px_4px_rgba(0,0,0,0.5)]">
                        {cartProducts.length}
                      </span>
                    )}
                  </div>
                </>
              )}

              {/* Profile - Pushed Out Chip */}
              <motion.div 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/profile")}
                className="flex items-center cursor-pointer gap-4 bg-[#0E0F13] shadow-[6px_6px_12px_#050505,-6px_-6px_12px_#17181c] p-2 rounded-[1.2rem] transition-all pl-2 pr-5"
              >
                <img
                  src="https://avatars.githubusercontent.com/u/499550?v=4"
                  alt="avatar"
                  className="w-9 h-9 rounded-xl object-cover shadow-[2px_2px_4px_rgba(0,0,0,0.3)]"
                />
                <div className="hidden sm:flex flex-col">
                  <span className="text-[10px] font-black text-white uppercase tracking-tighter">
                    {user?.first_name}
                  </span>
                  <span className="text-[8px] text-purple-500 font-bold uppercase tracking-[0.2em] leading-none">
                    Verified
                  </span>
                </div>
              </motion.div>
            </div>
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
