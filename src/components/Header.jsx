import React, { useContext, useRef, useCallback } from "react";
import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

import { Link, useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import { authContext } from "../context/authContext";
import { dataContext } from "../context/dataContext";
import { FaWallet, FaGavel, FaBriefcase, FaFileContract } from "react-icons/fa";

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
import { IoCart, IoMenuOutline, IoPersonCircleOutline, IoSearchSharp, IoClose, IoChatbubbleOutline } from "react-icons/io5";
import { FaHeart } from "react-icons/fa";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import { currencyOptions } from "../utils/CurrencyList";
import ProfilePopup from "./ProfilePopup";
import ChatFloatingPanel from "./ChatFloatingPanel";
import { useBuyerHasNdas } from "../hooks/useBuyerHasNdas";
import { getConversations } from "../api/gigs";
import { sumUnreadCount } from "../utils/chatHelpers";

const enableAuthWallet = import.meta.env.VITE_ENABLE_AUTH_WALLET === "true";

const Header = () => {
  const hasBuyerNdas = useBuyerHasNdas();
  const [cookies] = useCookies(["token", "refresh", "access_token"]);
  const [chatUnread, setChatUnread] = useState(0);
  const {
    user,
    authToken,
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
    Logout,
    isChatOpen,
    setIsChatOpen,
    pendingChatConversation,
    setPendingChatConversation,
    closeChat,
    openChatInbox,
    pendingChatParticipantEmail,
    setPendingChatParticipantEmail,
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const searchInputRef = React.useRef(null);

  const pathParts = window.location.pathname.split("/");
  const lastPart = pathParts[pathParts.length - 1];

  const updateWalletBalance = useCallback(async () => {
    if (!enableAuthWallet || !cookies.access_token) return;
    try {
      const addresses = await fetchWalletAddresses();
      if (addresses.length > 0) {
        const balance = await fetchWalletBalance(addresses[0]);
        setWalletBalance(balance);
      }
    } catch (error) {
      const status = error?.response?.status;
      // Local/dev often has no auth-wallet profile yet; avoid console spam.
      if (status !== 400) {
        console.error("Failed to update wallet balance:", error);
      }
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

  useEffect(() => {
    if (!user || !cookies.access_token) {
      setChatUnread(0);
      return;
    }
    const load = async () => {
      try {
        const res = await getConversations(cookies.access_token);
        const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
        setChatUnread(sumUnreadCount(data));
      } catch {
        /* ignore */
      }
    };
    load();
    const id = setInterval(load, 25000);
    return () => clearInterval(id);
  }, [user, cookies.access_token, isChatOpen]);

  const getCartProducts = async () => {
    if (!authToken || !cookies.access_token) return;
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
    }
  };

  const getWishlist = async () => {
    if (!authToken || !cookies.access_token) return;
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
    }
  };

  useEffect(() => {
    if (!enableAuthWallet) return;
    updateWalletBalance();
  }, [updateWalletBalance]);

  useEffect(() => {
    if (!authToken || !cookies.access_token) return;

    const fetchData = async () => {
      await getAllProducts();
      await getCartProducts();
      await getWishlist();
    };

    fetchData();
  }, [authToken, cookies.access_token]);

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
          <ChatFloatingPanel
            isOpen={isChatOpen}
            onClose={closeChat}
            pendingConversation={pendingChatConversation}
            clearPendingConversation={() => setPendingChatConversation(null)}
            pendingParticipantEmail={pendingChatParticipantEmail}
            clearPendingParticipantEmail={() => setPendingChatParticipantEmail(null)}
          />
        </>
      )}
      
      {/* Unified Compact Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-40 bg-[#0E0F13]/60 backdrop-blur-3xl w-full py-5 border-b border-white/5 shadow-[0_8px_32px_0_rgba(0,0,0,0.8)]"
      >
        <div className="max-w-[1800px] mx-auto flex items-center justify-between px-8 md:px-16 text-white gap-10">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center"
            >
              <img 
                src="/logo.jpg" 
                className="w-12 h-12 rounded-full ring-2 ring-white/10 shadow-2xl transition-all duration-500 hover:ring-purple-500/50" 
                alt="PinkSurfing Logo"
              />
            </motion.div>
          </Link>

          {/* Search Bar - Stealth Integrated */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl relative group">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
              <IoSearchSharp className="text-gray-500 group-focus-within:text-purple-400 transition-colors text-lg" />
            </div>
            <input
              type="text"
              placeholder="Search the marketplace..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-14 pr-6 py-3.5 bg-white/[0.03] border border-white/5 rounded-2xl outline-none text-white placeholder-gray-600 focus:bg-white/[0.07] focus:border-purple-500/30 transition-all duration-500 text-sm font-medium tracking-tight"
            />
          </form>

          {/* Right Section - Unified Premium Actions */}
          <div className="flex items-center gap-8">
            <div className="hidden xl:flex items-center gap-3">
              <Link
                to="/gighub"
                className="px-6 py-3 bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-white/10 rounded-2xl text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300"
              >
                GigHub
              </Link>
              <Link
                to="/bids"
                className="px-6 py-3 bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-white/10 rounded-2xl text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300"
              >
                Bids
              </Link>
              <Link
                to="/contact"
                className="px-6 py-3 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/20 hover:border-purple-500/40 rounded-2xl text-purple-300 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300"
              >
                Help & Support
              </Link>
            </div>

            <div className="flex items-center gap-6 border-l border-white/10 pl-8">
              {user && (
                <div className="flex items-center gap-6">
                  <div className="relative group cursor-pointer" onClick={() => { setIsProfileOpen(false); setIsWishlistOpen(true); }}>
                    <FaHeart className="text-xl text-gray-500 hover:text-pink-500 transition-all duration-300 transform group-hover:scale-110" />
                  </div>
                  
                  <div 
                    className="relative group cursor-pointer"
                    onClick={() => { setIsProfileOpen(false); setIsCartOpen(true); }}
                  >
                    <IoCart className="text-2xl text-gray-500 group-hover:text-purple-400 transition-all duration-300 transform group-hover:scale-110" />
                    {cartProducts.length > 0 && (
                      <span className="absolute -top-2 -right-2 bg-purple-600 text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full ring-2 ring-[#0E0F13]">
                        {cartProducts.length}
                      </span>
                    )}
                  </div>

                  <div
                    className="relative group cursor-pointer"
                    onClick={() => { setIsProfileOpen(false); setIsChatOpen(!isChatOpen); }}
                    title="Messages"
                  >
                    <IoChatbubbleOutline className="text-2xl text-gray-500 hover:text-purple-400 transition-all duration-300 transform group-hover:scale-110" />
                    {chatUnread > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-[9px] font-black min-w-[18px] h-[18px] flex items-center justify-center rounded-full ring-2 ring-[#0E0F13] px-1">
                        {chatUnread > 9 ? "9+" : chatUnread}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4">
                {/* Mobile Search & Menu Triggers */}
                <div className="flex md:hidden items-center gap-4 border-l border-white/10 pl-4">
                  <IoSearchSharp 
                    className="text-2xl text-gray-400 cursor-pointer hover:text-white transition-colors" 
                    onClick={() => setShowMobileSearch(true)} 
                  />
                  <IoMenuOutline 
                    className="text-3xl text-white cursor-pointer hover:text-purple-400 transition-colors" 
                    onClick={() => setIsMobileMenuOpen(true)} 
                  />
                </div>

                <div className="hidden md:flex items-center gap-4">
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate("/profile")}
                    className="flex items-center cursor-pointer gap-4 bg-white/[0.03] p-1.5 rounded-2xl border border-white/5 hover:bg-white/[0.08] transition-all pl-1.5 pr-5"
                  >
                    <img
                      src={user?.customer_profile_picture || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQIf4R5qPKHPNMyAqV-FjS_OTBB8pfUV29Phg&s"}
                      alt="avatar"
                      className="w-9 h-9 rounded-xl object-cover ring-1 ring-white/10"
                    />
                    <div className="hidden sm:flex flex-col">
                      <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none mb-1">
                        {user?.first_name}
                      </span>
                      <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest leading-none opacity-50">
                        Account
                      </span>
                    </div>
                  </motion.div>

                  {user && hasBuyerNdas && (
                    <Link
                      to="/my-ndas"
                      title="Business listing confidentiality agreements"
                      className="hidden md:flex items-center gap-2 px-4 py-3 rounded-2xl border border-purple-500/25 bg-purple-500/10 hover:bg-purple-500/15 transition-colors text-[10px] font-black uppercase tracking-[0.18em] text-purple-200"
                    >
                      <FaFileContract className="text-sm opacity-90" />
                      My NDAs
                    </Link>
                  )}

                  {user && (
                    <button
                      onClick={Logout}
                      className="px-6 py-3 text-[10px] font-black text-white/40 hover:text-white uppercase tracking-[0.2em] border border-white/5 hover:border-white/20 rounded-2xl transition-all duration-300 bg-white/[0.02] hover:bg-white/[0.05]"
                    >
                      Logout
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-[100] bg-[#0E0F13]/95 backdrop-blur-2xl md:hidden flex flex-col"
          >
            <div className="flex justify-between items-center p-8 border-b border-white/5">
              <img src="/logo.jpg" className="w-10 h-10 rounded-full ring-2 ring-white/10" alt="Logo" />
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10"
              >
                <IoClose className="text-2xl text-white" />
              </button>
            </div>

            <nav className="flex-1 flex flex-col p-8 gap-6 overflow-y-auto">
              <Link 
                to="/gighub" 
                onClick={() => setIsMobileMenuOpen(false)} 
                className="text-4xl font-black uppercase tracking-tighter text-white/90 hover:text-white transition-colors"
              >
                GigHub
              </Link>
              <Link 
                to="/bids" 
                onClick={() => setIsMobileMenuOpen(false)} 
                className="text-4xl font-black uppercase tracking-tighter text-white/90 hover:text-white transition-colors"
              >
                Bids
              </Link>
              <Link 
                to="/contact" 
                onClick={() => setIsMobileMenuOpen(false)} 
                className="text-4xl font-black uppercase tracking-tighter text-purple-400 hover:text-purple-300 transition-colors"
              >
                Support
              </Link>
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  openChatInbox();
                }}
                className="text-4xl font-black uppercase tracking-tighter text-white/90 hover:text-white transition-colors text-left"
              >
                Messages
              </button>
              
              <div className="mt-auto flex flex-col gap-4">
                <Link 
                  to="/profile" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-4 p-4 rounded-3xl bg-white/[0.03] border border-white/10"
                >
                  <img
                    src={user?.customer_profile_picture || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQIf4R5qPKHPNMyAqV-FjS_OTBB8pfUV29Phg&s"}
                    alt="avatar"
                    className="w-12 h-12 rounded-2xl object-cover ring-1 ring-white/10"
                  />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white">{user?.first_name}</p>
                    <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-gray-500">View Profile</p>
                  </div>
                </Link>

                {user && hasBuyerNdas && (
                  <Link
                    to="/my-ndas"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 p-4 rounded-3xl bg-purple-500/15 border border-purple-500/30 text-purple-200 text-xs font-black uppercase tracking-widest"
                  >
                    <FaFileContract className="text-lg shrink-0" />
                    <span>My NDAs — business listings</span>
                  </Link>
                )}

                {user && (
                  <button
                    onClick={() => { Logout(); setIsMobileMenuOpen(false); }}
                    className="w-full py-6 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-3xl text-red-400 text-[10px] font-black uppercase tracking-[0.3em] transition-all"
                  >
                    Logout Session
                  </button>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

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
