import React, { createContext, useState, useEffect, useRef, useCallback } from "react";
import { useCookies } from "react-cookie";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  clearClientAuthStorage,
  decodeJwt,
  ensureSession,
  fetchCustomerProfile,
  getAccessToken,
  getRefreshToken,
  isSsoLoggedOutGlobally,
  persistAuthSession,
  refreshAccessToken,
  signOut,
  syncReactAuthCookies,
} from "../utils/authSession";
import { toast } from "react-toastify";

export const authContext = createContext();

const Loader = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <img
      src="/loading.svg"
      alt="loading"
      className="w-[50px] h-[50px] sm:w-[70px] sm:h-[70px] object-contain"
    />
  </div>
);

export const AuthProvider = ({ children }) => {
  const [cookies, setCookie] = useCookies(["access_token", "refresh_token"]);
  const navigate = useNavigate();
  const [authToken, setAuthToken] = useState("");
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState(null);
  const [currency, setCurrency] = useState("$");
  const [shopHeading, setShopHeading] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem("theme") === "dark" || !localStorage.getItem("theme")
  );
  const [isRatingFormOpen, setIsRatingFormOpen] = useState(false);
  const [openDrawer, setOpenDrawer] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isFirstSearch, setIsFirstSearch] = useState(true);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isMobileCategoryOpen, setIsMobileCategoryOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSingleOrderFormOpen, setIsSingleOrderFormOpen] = useState(false);
  const [singleOrderProduct, setSingleOrderProduct] = useState({});
  const [isVendorFormOpen, setIsVendorFormOpen] = useState(false);
  const [isProfilePopupOpen, setIsProfilePopupOpen] = useState(false);
  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);
  const [isUserWalletOpen, setIsUserWalletOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [pendingChatConversation, setPendingChatConversation] = useState(null);
  const [pendingChatParticipantEmail, setPendingChatParticipantEmail] = useState(null);

  const bootstrappedRef = useRef(false);
  const profileLoadRef = useRef(null);
  const lastProfileTokenRef = useRef("");

  const clearSession = useCallback(() => {
    clearClientAuthStorage(setCookie);
    setAuthToken("");
    setUser(null);
    lastProfileTokenRef.current = "";
  }, [setCookie]);

  const applyJwtFallbackUser = useCallback((token) => {
    const payload = decodeJwt(token);
    if (!payload?.email) return null;
    return {
      email: payload.email,
      first_name: payload.first_name || payload.email.split("@")[0],
      last_name: payload.last_name || "",
      is_vendor: false,
    };
  }, []);

  const loadProfile = useCallback(
    async (token) => {
      if (!token) return null;
      try {
        return await fetchCustomerProfile(token);
      } catch (error) {
        console.error("Profile load failed:", error?.response?.status || error);
        return null;
      }
    },
    []
  );

  const hydrateUser = useCallback(
    async (access) => {
      if (lastProfileTokenRef.current === access) return null;
      lastProfileTokenRef.current = access;

      const profile = await loadProfile(access);
      if (profile) {
        setUser(profile);
        return profile;
      }
      const fallback = applyJwtFallbackUser(access);
      if (fallback) setUser(fallback);
      return fallback;
    },
    [applyJwtFallbackUser, loadProfile]
  );

  const establishSession = useCallback(
    async (access, refresh) => {
      if (!access) {
        clearSession();
        return false;
      }

      if (profileLoadRef.current) return profileLoadRef.current;

      profileLoadRef.current = (async () => {
        persistAuthSession(access, refresh);
        syncReactAuthCookies(access, refresh, setCookie);
        setAuthToken(access);
        await hydrateUser(access);
        profileLoadRef.current = null;
        return true;
      })();

      return profileLoadRef.current;
    },
    [clearSession, hydrateUser, setCookie]
  );

  const login = useCallback(
    async (access, refresh) => establishSession(access, refresh),
    [establishSession]
  );

  const Logout = async () => {
    try {
      const token = getAccessToken() || cookies.access_token;
      await signOut(token, setCookie);
      clearSession();
      toast.success("Logged out successfully", {
        position: "top-right",
        autoClose: 2500,
      });
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      clearSession();
      navigate("/");
    }
  };

  const openChatWithConversation = (conversation) => {
    setPendingChatParticipantEmail(null);
    if (conversation) setPendingChatConversation(conversation);
    setIsChatOpen(true);
  };

  const openChatWithParticipantEmail = (email) => {
    if (!email) return;
    setPendingChatConversation(null);
    setPendingChatParticipantEmail(String(email).trim());
    setIsChatOpen(true);
  };

  const openChatInbox = () => {
    setPendingChatConversation(null);
    setPendingChatParticipantEmail(null);
    setIsChatOpen(true);
  };

  const closeChat = () => {
    setIsChatOpen(false);
    setPendingChatConversation(null);
    setPendingChatParticipantEmail(null);
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        const status = error.response?.status;

        if (status !== 401 || originalRequest._retry) {
          return Promise.reject(error);
        }
        originalRequest._retry = true;
        try {
          const newAccess = await refreshAccessToken();
          syncReactAuthCookies(newAccess, getRefreshToken(), setCookie);
          setAuthToken(newAccess);
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return axios(originalRequest);
        } catch {
          clearSession();
          return Promise.reject(error);
        }
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, [clearSession, setCookie]);

  useEffect(() => {
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;

    void (async () => {
      try {
        if (isSsoLoggedOutGlobally()) {
          clearSession();
          return;
        }
        const session = await ensureSession();
        if (session?.access) {
          await establishSession(session.access, session.refresh);
        }
      } finally {
        setAuthReady(true);
      }
    })();
  }, [clearSession, establishSession]);

  useEffect(() => {
    if (!authReady) return undefined;

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (isSsoLoggedOutGlobally()) {
        if (authToken) clearSession();
        return;
      }
      if (authToken) return;
      const token = getAccessToken();
      if (token) {
        void establishSession(token, getRefreshToken() || undefined);
      }
    };

    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [authReady, authToken, clearSession, establishSession]);

  if (!authReady) {
    return <Loader />;
  }

  return (
    <authContext.Provider
      value={{
        authToken,
        authReady,
        isAuthenticated: Boolean(authToken),
        setAuthToken,
        login,
        isDarkMode,
        openDrawer,
        currency,
        setCurrency,
        setOpenDrawer,
        setIsDarkMode,
        isFirstSearch,
        setIsFirstSearch,
        category,
        setCategory,
        user,
        setUser,
        search,
        setSearch,
        shopHeading,
        setShopHeading,
        isRatingFormOpen,
        setIsRatingFormOpen,
        isVendorFormOpen,
        setIsVendorFormOpen,
        isProfilePopupOpen,
        setIsProfilePopupOpen,
        isCartOpen,
        setIsCartOpen,
        isWishlistOpen,
        setIsWishlistOpen,
        setIsUserWalletOpen,
        isAddressFormOpen,
        setIsAddressFormOpen,
        isProfileOpen,
        setIsProfileOpen,
        isMobileCategoryOpen,
        setIsMobileCategoryOpen,
        isOrdersOpen,
        setIsOrdersOpen,
        isSingleOrderFormOpen,
        setIsSingleOrderFormOpen,
        singleOrderProduct,
        setSingleOrderProduct,
        Logout,
        isChatOpen,
        setIsChatOpen,
        pendingChatConversation,
        setPendingChatConversation,
        pendingChatParticipantEmail,
        setPendingChatParticipantEmail,
        openChatWithConversation,
        openChatWithParticipantEmail,
        openChatInbox,
        closeChat,
      }}
    >
      {children}
    </authContext.Provider>
  );
};
