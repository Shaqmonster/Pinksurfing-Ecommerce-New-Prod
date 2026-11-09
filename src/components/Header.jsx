import React, { useContext, useCallback, useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { PS_MOTION, sheetTransition } from "../lib/motion-tokens";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useCookies } from "react-cookie";
import { authContext } from "../context/authContext";
import { dataContext } from "../context/dataContext";
import { FaHeart, FaGavel } from "react-icons/fa";
import {
  IoCart,
  IoMenuOutline,
  IoSearchSharp,
  IoClose,
  IoChatbubbleOutline,
  IoLogOutOutline,
  IoPersonOutline,
  IoChevronDown,
} from "react-icons/io5";

import Cart from "./Cart";
import Wishlist from "./Wishlist";
import SingleOrderForm from "./SingleOrderForm";
import VendorDetailsForm from "./VendorDetailsForm";
import ProfilePopup from "./ProfilePopup";
import ChatFloatingPanel from "./ChatFloatingPanel";
import IconTip from "./ui/IconTip";
import { getCustomerDisplayName } from "../utils/userDisplay";
import { getConversations } from "../api/gigs";
import { sumUnreadCount, resolveChatAccessToken } from "../utils/chatHelpers";
import { useAccessToken } from "../hooks/useAccessToken";

const enableAuthWallet = import.meta.env.VITE_ENABLE_AUTH_WALLET === "true";
const BRAND_LOGO = "/brand/logo.jpeg";

/** Slim primary nav — mall / GigHub / deals / contact live on the homepage & footer. */
const NAV_ITEMS = [{ to: "/bids", label: "Bids", Icon: FaGavel }];

const Header = () => {
  const accessToken = useAccessToken();
  const [cookies] = useCookies(["token", "refresh", "access_token"]);
  const [chatUnread, setChatUnread] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const location = useLocation();
  const {
    user,
    authToken,
    search,
    setSearch,
    setIsCartOpen,
    setIsWishlistOpen,
    setIsProfileOpen,
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
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const searchInputRef = React.useRef(null);
  const reducedMotion = useReducedMotion();

  const updateWalletBalance = useCallback(async () => {
    if (!enableAuthWallet || !accessToken) return;
    try {
      await axios.get("https://auth.pinksurfing.com/api/crypto/wallet/", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch (error) {
      if (error?.response?.status !== 400) {
        console.error("Failed to update wallet balance:", error);
      }
    }
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) {
      setChatUnread(0);
      return undefined;
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

  useEffect(() => {
    if (!enableAuthWallet) return;
    updateWalletBalance();
  }, [updateWalletBalance]);

  useEffect(() => {
    if (!accessToken) return undefined;
    const fetchData = async () => {
      try {
        const [cartRes, wishRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_SERVER_URL}/api/customer/cart/view/`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
          }),
          axios.get(`${import.meta.env.VITE_SERVER_URL}/api/customer/wishlist/view/`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
          }),
        ]);
        const payload = cartRes.data;
        setCartProducts(Array.isArray(payload) ? payload : payload?.items || []);
        setWishlistProducts(wishRes.data.items);
      } catch (error) {
        console.error("Failed to fetch cart/wishlist:", error);
      }
    };
    fetchData();
  }, [accessToken, setCartProducts, setWishlistProducts]);

  useEffect(() => {
    if (!isMobileMenuOpen) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setIsMobileMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!profileOpen) return undefined;
    const onDoc = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") setProfileOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [profileOpen]);

  useEffect(() => {
    setProfileOpen(false);
  }, [location.pathname]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/search?q=${encodeURIComponent(search.trim())}`);
      setShowMobileSearch(false);
    }
  };

  const isActive = (to) =>
    location.pathname === to || location.pathname.startsWith(`${to}/`);

  const openWishlist = () => {
    setProfileOpen(false);
    setIsProfileOpen(false);
    if (!authToken) {
      navigate("/signin");
      return;
    }
    setIsWishlistOpen(true);
  };

  const openCart = () => {
    setProfileOpen(false);
    setIsProfileOpen(false);
    if (!authToken) {
      navigate("/signin");
      return;
    }
    setIsCartOpen(true);
  };

  return (
    <>
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

      <header className="sticky top-0 z-40 bg-[var(--ps-bg)]/95 backdrop-blur-xl border-b border-[var(--ps-brd)]">
        <div className="max-w-[1400px] mx-auto flex items-center gap-3 px-4 sm:px-6 py-2.5 text-white">
          <Link to="/" className="flex-shrink-0" aria-label="PinkSurfing home">
            <img
              src={BRAND_LOGO}
              className="w-10 h-10 rounded-xl object-cover ring-1 ring-[var(--ps-brd)]"
              alt="PinkSurfing"
            />
          </Link>

          <form
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-md relative"
            role="search"
          >
            <IoSearchSharp
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ps-dim)] text-lg pointer-events-none"
              aria-hidden="true"
            />
            <label htmlFor="header-search" className="sr-only">
              Search the marketplace
            </label>
            <input
              id="header-search"
              type="search"
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full min-h-[44px] pl-10 pr-3 rounded-xl bg-[var(--ps-surf)] border border-[var(--ps-brd)] text-sm text-white placeholder-[var(--ps-dim)] outline-none focus:border-[var(--ps-cyan)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--ps-cyan)_28%,transparent)]"
            />
          </form>

          <nav className="hidden lg:flex items-center gap-1 ml-auto" aria-label="Primary">
            {NAV_ITEMS.map(({ to, label, Icon }) => (
              <IconTip
                key={to}
                as={Link}
                to={to}
                label={label}
                className={
                  isActive(to)
                    ? "text-[var(--ps-purple-light)] bg-[var(--ps-surf)] border-[var(--ps-brd)]"
                    : ""
                }
              >
                <Icon className="text-lg" aria-hidden="true" />
              </IconTip>
            ))}
          </nav>

          <div className="flex items-center gap-0.5 ml-auto lg:ml-2">
            <IconTip
              label="Search"
              className="md:hidden"
              onClick={() => setShowMobileSearch(true)}
            >
              <IoSearchSharp className="text-xl" aria-hidden="true" />
            </IconTip>

            {authToken && (
              <IconTip
                label={`Messages${chatUnread ? ` (${chatUnread} unread)` : ""}`}
                onClick={() => {
                  setProfileOpen(false);
                  setIsProfileOpen(false);
                  setIsChatOpen(!isChatOpen);
                }}
              >
                <span className="relative inline-flex">
                  <IoChatbubbleOutline className="text-xl" aria-hidden="true" />
                  {chatUnread > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-[var(--ps-red)] text-[10px] font-bold flex items-center justify-center">
                      {chatUnread > 9 ? "9+" : chatUnread}
                    </span>
                  )}
                </span>
              </IconTip>
            )}

            <div className="relative" ref={profileRef}>
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={profileOpen}
                aria-label="Account menu"
                onClick={() => setProfileOpen((o) => !o)}
                className="inline-flex items-center gap-1 min-h-[44px] min-w-[44px] px-2 rounded-xl text-[var(--ps-muted)] hover:text-white hover:bg-[var(--ps-surf)] border border-transparent hover:border-[var(--ps-brd)] transition-colors"
              >
                {authToken && user?.customer_profile_picture ? (
                  <img
                    src={user.customer_profile_picture}
                    alt=""
                    className="w-7 h-7 rounded-lg object-cover"
                  />
                ) : (
                  <IoPersonOutline className="text-xl" aria-hidden="true" />
                )}
                <IoChevronDown
                  className={`text-xs transition-transform ${profileOpen ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    role="menu"
                    initial={reducedMotion ? false : { opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: PS_MOTION.duration.fast, ease: PS_MOTION.easing.standard }}
                    className="absolute right-0 mt-2 w-56 rounded-2xl border border-[var(--ps-brd)] bg-[var(--ps-card)] shadow-xl shadow-black/40 overflow-hidden z-50"
                  >
                    {authToken ? (
                      <>
                        <div className="px-3 py-2.5 border-b border-[var(--ps-brd)]">
                          <p className="text-xs text-[var(--ps-dim)]">Signed in</p>
                          <p className="text-sm font-medium text-white truncate">
                            {getCustomerDisplayName(user)}
                          </p>
                        </div>
                        <Link
                          role="menuitem"
                          to="/profile"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 min-h-[44px] px-3 text-sm text-white hover:bg-[var(--ps-surf)]"
                        >
                          <IoPersonOutline aria-hidden="true" />
                          View profile
                        </Link>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={openWishlist}
                          className="w-full flex items-center gap-3 min-h-[44px] px-3 text-sm text-white hover:bg-[var(--ps-surf)] text-left"
                        >
                          <FaHeart aria-hidden="true" />
                          Wishlist
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={openCart}
                          className="w-full flex items-center gap-3 min-h-[44px] px-3 text-sm text-white hover:bg-[var(--ps-surf)] text-left"
                        >
                          <IoCart aria-hidden="true" />
                          Cart
                          {cartProducts.length > 0 && (
                            <span className="ml-auto text-xs text-[var(--ps-purple-light)]">
                              {cartProducts.length}
                            </span>
                          )}
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setProfileOpen(false);
                            Logout();
                          }}
                          className="w-full flex items-center gap-3 min-h-[44px] px-3 text-sm text-[var(--ps-red)] hover:bg-[var(--ps-surf)] text-left border-t border-[var(--ps-brd)]"
                        >
                          <IoLogOutOutline aria-hidden="true" />
                          Log out
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          role="menuitem"
                          to="/signin"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 min-h-[44px] px-3 text-sm text-white hover:bg-[var(--ps-surf)]"
                        >
                          <IoPersonOutline aria-hidden="true" />
                          Sign in
                        </Link>
                        <Link
                          role="menuitem"
                          to="/signup"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 min-h-[44px] px-3 text-sm text-white hover:bg-[var(--ps-surf)] border-t border-[var(--ps-brd)]"
                        >
                          Sign up
                        </Link>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={openWishlist}
                          className="w-full flex items-center gap-3 min-h-[44px] px-3 text-sm text-[var(--ps-muted)] hover:bg-[var(--ps-surf)] text-left"
                        >
                          <FaHeart aria-hidden="true" />
                          Wishlist
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={openCart}
                          className="w-full flex items-center gap-3 min-h-[44px] px-3 text-sm text-[var(--ps-muted)] hover:bg-[var(--ps-surf)] text-left"
                        >
                          <IoCart aria-hidden="true" />
                          Cart
                        </button>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <IconTip
              label="Open menu"
              className="lg:hidden"
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <IoMenuOutline className="text-2xl" aria-hidden="true" />
            </IconTip>
          </div>
        </div>
      </header>

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
            className="fixed inset-0 z-[100] bg-[var(--ps-bg)] lg:hidden flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--ps-brd)]">
              <img src={BRAND_LOGO} alt="PinkSurfing" className="w-9 h-9 rounded-xl object-cover" />
              <IconTip label="Close menu" onClick={() => setIsMobileMenuOpen(false)}>
                <IoClose className="text-2xl" aria-hidden="true" />
              </IconTip>
            </div>
            <nav className="flex-1 overflow-y-auto p-4 flex flex-col gap-1" aria-label="Mobile">
              {NAV_ITEMS.map(({ to, label, Icon }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 min-h-[48px] px-3 rounded-xl text-white hover:bg-[var(--ps-surf)]"
                >
                  <Icon className="text-lg text-[var(--ps-purple-light)]" aria-hidden="true" />
                  <span className="text-base font-medium">{label}</span>
                </Link>
              ))}
              {authToken && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    openChatInbox();
                  }}
                  className="flex items-center gap-3 min-h-[48px] px-3 rounded-xl text-white hover:bg-[var(--ps-surf)] text-left"
                >
                  <IoChatbubbleOutline className="text-lg text-[var(--ps-purple-light)]" aria-hidden="true" />
                  <span className="text-base font-medium">Messages</span>
                </button>
              )}
              <div className="mt-auto pt-4 border-t border-[var(--ps-brd)] space-y-2">
                {authToken ? (
                  <>
                    <Link
                      to="/profile"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 min-h-[48px] px-3 rounded-xl bg-[var(--ps-surf)]"
                    >
                      <IoPersonOutline className="text-lg" aria-hidden="true" />
                      <span className="text-sm font-medium truncate">
                        {getCustomerDisplayName(user)}
                      </span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        openWishlist();
                      }}
                      className="w-full flex items-center gap-3 min-h-[48px] px-3 rounded-xl text-white"
                    >
                      <FaHeart aria-hidden="true" />
                      Wishlist
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        openCart();
                      }}
                      className="w-full flex items-center gap-3 min-h-[48px] px-3 rounded-xl text-white"
                    >
                      <IoCart aria-hidden="true" />
                      Cart
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        Logout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 min-h-[48px] px-3 rounded-xl text-[var(--ps-red)]"
                    >
                      <IoLogOutOutline className="text-lg" aria-hidden="true" />
                      <span className="text-base font-medium">Log out</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/signin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center min-h-[48px] rounded-[14px] bg-gradient-to-r from-[var(--ps-primary)] to-[var(--ps-purple-dark)] font-semibold"
                    >
                      Sign in
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center min-h-[48px] rounded-[14px] border border-[var(--ps-brd)]"
                    >
                      Sign up
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMobileSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: PS_MOTION.duration.fast }}
            className="fixed inset-0 z-50 bg-black/80 flex items-start justify-center pt-6 px-4"
          >
            <form onSubmit={handleSearch} className="w-full max-w-lg relative">
              <label htmlFor="mobile-search" className="sr-only">
                Search
              </label>
              <input
                id="mobile-search"
                ref={searchInputRef}
                type="search"
                placeholder="Search the marketplace…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                className="w-full min-h-[48px] px-4 pr-24 rounded-xl bg-[var(--ps-surf)] border border-[var(--ps-brd)] text-white outline-none focus:ring-2 focus:ring-[var(--ps-cyan)]"
              />
              <button
                type="submit"
                className="absolute right-12 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--ps-purple-light)]"
                aria-label="Submit search"
              >
                <IoSearchSharp className="text-xl" />
              </button>
              <button
                type="button"
                onClick={() => setShowMobileSearch(false)}
                className="absolute right-2 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close search"
              >
                <IoClose className="text-2xl" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
