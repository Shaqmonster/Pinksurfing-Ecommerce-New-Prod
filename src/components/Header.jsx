import React, { useContext, useRef, useCallback } from "react";
import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { PS_MOTION, sheetTransition } from "../lib/motion-tokens";

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
import { getCustomerDisplayName } from "../utils/userDisplay";
import { toast } from "react-toastify";
import { currencyOptions } from "../utils/CurrencyList";
import ProfilePopup from "./ProfilePopup";
import ChatFloatingPanel from "./ChatFloatingPanel";
import { useBuyerHasNdas } from "../hooks/useBuyerHasNdas";
import { getConversations } from "../api/gigs";
import { sumUnreadCount, resolveChatAccessToken } from "../utils/chatHelpers";
import { useAccessToken } from "../hooks/useAccessToken";

const enableAuthWallet = import.meta.env.VITE_ENABLE_AUTH_WALLET === "true";

const Header = () => {
  const accessToken = useAccessToken();
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
    isCartOpen,
    isWishlistOpen,
    isVendorFormOpen,
    isProfilePopupOpen,
    isSingleOrderFormOpen,
    isChatOpen,
    setIsChatOpen,
    pendingChatConversation,
    setPendingChatConversation,
    closeChat,
    openChatInbox,
    pendingChatParticipantEmail,
    setPendingChatParticipantEmail,
  } = useContext(authContext);
    const chatAccessToken = resolveChatAccessToken(authToken, accessToken);
  const { cartProducts, setCartProducts, setWishlistProducts } =
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
  const reducedMotion = useReducedMotion();
  const headerNavLinks = [
    { to: "/gighub", label: "GigHub" },
    { to: "/bids", label: "Bids" },
    { to: "/deals", label: "Deals" },
    { to: "/shoppingMall", label: "Shopping mall" },
    { to: "/contact", label: "Help & support" },
  ];

  const pathParts = window.location.pathname.split("/");
  const lastPart = pathParts[pathParts.length - 1];

  const updateWalletBalance = useCallback(async () => {
    if (!enableAuthWallet || !accessToken) return;
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
  }, [accessToken]);

  const fetchWalletAddresses = async () => {
    const response = await axios.get(
      "https://auth.pinksurfing.com/api/crypto/wallet/",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
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
    if (!accessToken) {
      setChatUnread(0);
      return;
    }
    const load = async () => {
      try {
        const res = await getConversations(chatAccessToken);
        const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
        setChatUnread(sumUnreadCount(data));
      } catch {
        /* ignore */
      }
    };
    load();
    const id = setInterval(load, 25000);
    return () => clearInterval(id);
  }, [accessToken, chatAccessToken, isChatOpen]);

  const getCartProducts = async () => {
    if (!accessToken) return;
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/api/customer/cart/view/`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      const payload = response.data;
      setCartProducts(Array.isArray(payload) ? payload : payload?.items || []);
    } catch (error) {
      console.error("Failed to fetch cart products:", error);
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        setCartProducts([]);
        return;
      }
    }
  };

  const getWishlist = async () => {
    if (!accessToken) return;
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/api/customer/wishlist/view/`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
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
    if (!accessToken) return;

    const fetchData = async () => {
      await getCartProducts();
      await getWishlist();
    };

    fetchData();
  }, [accessToken]);

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
      {authToken && isCartOpen && <Cart />}
      {authToken && isWishlistOpen && <Wishlist />}
      {authToken && isSingleOrderFormOpen && <SingleOrderForm />}
      {authToken && isVendorFormOpen && <VendorDetailsForm />}
      {authToken && isProfilePopupOpen && <ProfilePopup />}
      {authToken && (
        <ChatFloatingPanel
          isOpen={isChatOpen}
          onClose={closeChat}
          pendingConversation={pendingChatConversation}
          clearPendingConversation={() => setPendingChatConversation(null)}
          pendingParticipantEmail={pendingChatParticipantEmail}
          clearPendingParticipantEmail={() => setPendingChatParticipantEmail(null)}
        />
      )}
      
      {/* Unified Compact Header */}
      <header
        className="sticky top-0 z-40 bg-[var(--ps-bg)]/95 backdrop-blur-xl w-full py-3 border-b border-[var(--ps-brd)]"
      >
        <div className="max-w-[1800px] mx-auto flex items-center justify-between px-4 sm:px-8 lg:px-12 text-white gap-4 lg:gap-8">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0" aria-label="PinkSurfing home">
            <img 
              src="/logo.jpg" 
              className="w-11 h-11 rounded-full ring-2 ring-white/10" 
              alt="PinkSurfing"
            />
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl relative group" role="search">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <IoSearchSharp className="text-[var(--ps-dim)] group-focus-within:text-[var(--ps-cyan)] transition-colors text-lg" aria-hidden="true" />
            </div>
            <label htmlFor="header-search" className="sr-only">Search the marketplace</label>
            <input
              id="header-search"
              type="search"
              placeholder="Search the marketplace..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full min-h-[44px] pl-12 pr-4 py-2.5 bg-[var(--ps-surf)] border border-[var(--ps-brd)] rounded-xl outline-none text-white placeholder-[var(--ps-dim)] focus:border-[var(--ps-cyan)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--ps-cyan)_30%,transparent)] transition-colors text-sm font-medium"
            />
          </form>

          {/* Right Section */}
          <div className="flex items-center gap-3 sm:gap-4">
            <nav className="hidden lg:flex items-center gap-2" aria-label="Primary">
              {headerNavLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="min-h-[44px] px-4 py-2 flex items-center rounded-xl bg-[var(--ps-surf)] hover:bg-[var(--ps-card2)] border border-[var(--ps-brd)] text-white text-sm font-medium transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2 sm:gap-3 sm:border-l sm:border-[var(--ps-brd)] sm:pl-4">
              {authToken && user && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Open wishlist"
                    className="relative min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[var(--ps-muted)] hover:text-[var(--ps-purple-light)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ps-cyan)]"
                    onClick={() => { setIsProfileOpen(false); setIsWishlistOpen(true); }}
                  >
                    <FaHeart className="text-xl" aria-hidden="true" />
                  </button>
                  
                  <button
                    type="button"
                    aria-label={`Open cart${cartProducts.length ? `, ${cartProducts.length} items` : ""}`}
                    className="relative min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[var(--ps-muted)] hover:text-[var(--ps-purple-light)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ps-cyan)]"
                    onClick={() => { setIsProfileOpen(false); setIsCartOpen(true); }}
                  >
                    <IoCart className="text-2xl" aria-hidden="true" />
                    {cartProducts.length > 0 && (
                      <span className="absolute top-1 right-1 bg-[var(--ps-primary)] text-[10px] font-bold min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full ring-2 ring-[var(--ps-bg)]">
                        {cartProducts.length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    aria-label={`Messages${chatUnread ? `, ${chatUnread} unread` : ""}`}
                    className="relative min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[var(--ps-muted)] hover:text-[var(--ps-purple-light)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ps-cyan)]"
                    onClick={() => { setIsProfileOpen(false); setIsChatOpen(!isChatOpen); }}
                  >
                    <IoChatbubbleOutline className="text-2xl" aria-hidden="true" />
                    {chatUnread > 0 && (
                      <span className="absolute top-1 right-1 bg-[var(--ps-red)] text-[10px] font-bold min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full ring-2 ring-[var(--ps-bg)]">
                        {chatUnread > 9 ? "9+" : chatUnread}
                      </span>
                    )}
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <div className="flex lg:hidden items-center gap-1">
                  <button
                    type="button"
                    aria-label="Open search"
                    className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[var(--ps-muted)] hover:text-white"
                    onClick={() => setShowMobileSearch(true)}
                  >
                    <IoSearchSharp className="text-2xl" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label="Open menu"
                    aria-expanded={isMobileMenuOpen}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-white hover:text-[var(--ps-purple-light)]"
                    onClick={() => setIsMobileMenuOpen(true)}
                  >
                    <IoMenuOutline className="text-3xl" aria-hidden="true" />
                  </button>
                </div>

                <div className="hidden md:flex items-center gap-2">
                  {authToken ? (
                    <>
                      <button
                        type="button"
                        onClick={() => navigate("/profile")}
                        className="flex items-center gap-3 min-h-[44px] bg-[var(--ps-surf)] p-1.5 rounded-xl border border-[var(--ps-brd)] hover:bg-[var(--ps-card2)] transition-colors pl-1.5 pr-4"
                      >
                        <img
                          src={user?.customer_profile_picture || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQIf4R5qPKHPNMyAqV-FjS_OTBB8pfUV29Phg&s"}
                          alt=""
                          className="w-9 h-9 rounded-lg object-cover ring-1 ring-white/10"
                        />
                        <div className="hidden sm:flex flex-col min-w-0 max-w-[160px] text-left">
                          <span
                            className="text-sm font-semibold text-white leading-tight line-clamp-1"
                            title={getCustomerDisplayName(user)}
                          >
                            {getCustomerDisplayName(user)}
                          </span>
                          <span className="text-xs text-[var(--ps-dim)]">
                            Account
                          </span>
                        </div>
                      </button>

                      {user && hasBuyerNdas && (
                        <Link
                          to="/my-ndas"
                          title="Business listing confidentiality agreements"
                          className="hidden xl:flex items-center gap-2 min-h-[44px] px-3 py-2 rounded-xl border border-[var(--ps-brd)] bg-[var(--ps-surf)] hover:bg-[var(--ps-card2)] transition-colors text-sm font-medium text-[var(--ps-purple-light)]"
                        >
                          <FaFileContract className="text-sm opacity-90" aria-hidden="true" />
                          Financials
                        </Link>
                      )}

                      <button
                        type="button"
                        onClick={Logout}
                        className="min-h-[44px] px-4 py-2 text-sm font-medium text-[var(--ps-muted)] hover:text-white border border-[var(--ps-brd)] rounded-xl transition-colors bg-[var(--ps-surf)] hover:bg-[var(--ps-card2)]"
                      >
                        Log out
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Link
                        to="/signin"
                        className="min-h-[44px] px-4 py-2 flex items-center bg-gradient-to-r from-[var(--ps-primary)] to-[var(--ps-purple-dark)] rounded-xl text-white text-sm font-semibold transition-transform active:scale-[0.97]"
                      >
                        Sign in
                      </Link>
                      <Link
                        to="/signup"
                        className="min-h-[44px] px-4 py-2 flex items-center bg-[var(--ps-surf)] border border-[var(--ps-brd)] rounded-xl text-white text-sm font-medium"
                      >
                        Sign up
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile / tablet Navigation Drawer (visible below lg — closes the 768–1279 gap) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Main menu"
            initial={reducedMotion ? false : { x: "100%" }}
            animate={{ x: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { x: "100%" }}
            transition={reducedMotion ? { duration: PS_MOTION.duration.fast } : sheetTransition}
            className="fixed inset-0 z-[100] bg-[var(--ps-bg)]/98 backdrop-blur-xl lg:hidden flex flex-col"
            onKeyDown={(e) => {
              if (e.key === "Escape") setIsMobileMenuOpen(false);
            }}
          >
            <div className="flex justify-between items-center p-6 border-b border-[var(--ps-brd)]">
              <img src="/logo.jpg" className="w-10 h-10 rounded-full ring-2 ring-white/10" alt="PinkSurfing" />
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setIsMobileMenuOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-[var(--ps-surf)] border border-[var(--ps-brd)]"
              >
                <IoClose className="text-2xl text-white" aria-hidden="true" />
              </button>
            </div>

            <nav className="flex-1 flex flex-col p-6 gap-2 overflow-y-auto" aria-label="Mobile">
              {headerNavLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="min-h-[44px] flex items-center text-xl font-semibold text-white/90 hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  openChatInbox();
                }}
                className="min-h-[44px] flex items-center text-xl font-semibold text-white/90 hover:text-white transition-colors text-left"
              >
                Messages
              </button>
              
              <div className="mt-auto flex flex-col gap-4">
                {authToken ? (
                  <>
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
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white truncate">
                          {getCustomerDisplayName(user)}
                        </p>
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
                        <span>My Business Financials — unlocked listings</span>
                      </Link>
                    )}

                    <button
                      onClick={() => { Logout(); setIsMobileMenuOpen(false); }}
                      className="w-full py-6 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-3xl text-red-400 text-[10px] font-black uppercase tracking-[0.3em] transition-all"
                    >
                      Logout Session
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Link
                      to="/signin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full py-6 text-center bg-purple-600 hover:bg-purple-500 rounded-3xl text-white text-[10px] font-black uppercase tracking-[0.3em] transition-all"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full py-6 text-center bg-white/[0.03] border border-white/10 rounded-3xl text-white text-[10px] font-black uppercase tracking-[0.3em] transition-all"
                    >
                      Sign Up
                    </Link>
                  </div>
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
