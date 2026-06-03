import React, { createContext, useState, useEffect, useRef, useCallback } from "react";
import { useCookies } from "react-cookie";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  attachSharedSsoSync,
  ensureSession,
  fetchCustomerProfile,
  getAccessToken,
  invalidateLocalSession,
  isSsoLoggedOutGlobally,
  reconcileSharedSession,
  refreshAccessToken,
  signOut,
  syncReactAuthCookies,
} from "../utils/authSession";
export const authContext = createContext();
import { toast } from "react-toastify";

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
  const [currency, setCurrency] = useState("$");
  const [user, setUser] = useState("");
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
  const authInitRef = useRef(false);
  const lastSyncedAccessRef = useRef("");
  const profileInflightRef = useRef(null);
  const ssoSyncInflightRef = useRef(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [pendingChatConversation, setPendingChatConversation] = useState(null);
  const [pendingChatParticipantEmail, setPendingChatParticipantEmail] = useState(null);

  const clearSessionState = useCallback(() => {
    setUser("");
    setAuthToken("");
  }, []);

  const invalidateSession = useCallback(() => {
    invalidateLocalSession(setCookie);
    clearSessionState();
  }, [setCookie, clearSessionState]);

  const openChatWithConversation = (conversation) => {
    setPendingChatParticipantEmail(null);
    if (conversation) setPendingChatConversation(conversation);
    setIsChatOpen(true);
  };

  /** Opens floating chat and jumps straight into a 1:1 thread with this email */
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

  const Logout = async () => {
    try {
      const token = getAccessToken() || cookies.access_token;
      await signOut(token, setCookie);
      clearSessionState();
      toast.success("Logged out successfully", {
        position: "top-right",
        autoClose: 2500,
      });
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      invalidateSession();
      navigate("/");
    }
  };

  const loadProfile = useCallback(
    async (token) => {
      if (!token) return false;
      if (profileInflightRef.current) return profileInflightRef.current;

      profileInflightRef.current = (async () => {
        try {
          const profile = await fetchCustomerProfile(token);
          setUser(profile);
          return true;
        } catch (error) {
          console.error("GetProfile error:", error);
          const status = error?.response?.status;
          if (status === 401 || status === 403) {
            try {
              const newAccessToken = await refreshAccessToken();
              syncReactAuthCookies(
                newAccessToken,
                cookies.refresh_token,
                setCookie
              );
              setAuthToken(newAccessToken);
              const profile = await fetchCustomerProfile(newAccessToken);
              setUser(profile);
              return true;
            } catch (refreshError) {
              console.error("Profile auth recovery failed:", refreshError);
              invalidateSession();
              return false;
            }
          }
          return false;
        } finally {
          profileInflightRef.current = null;
        }
      })();

      return profileInflightRef.current;
    },
    [cookies.refresh_token, invalidateSession, setCookie]
  );

  const applySession = useCallback(
    async (session) => {
      if (session?.access) {
        if (lastSyncedAccessRef.current !== session.access) {
          syncReactAuthCookies(session.access, session.refresh, setCookie);
          lastSyncedAccessRef.current = session.access;
        }
        setAuthToken(session.access);
        await loadProfile(session.access);
        return true;
      }
      clearSessionState();
      return false;
    },
    [clearSessionState, loadProfile, setCookie]
  );

  const syncFromSharedSession = useCallback(async () => {
    if (ssoSyncInflightRef.current) return;
    ssoSyncInflightRef.current = true;
    try {
      if (isSsoLoggedOutGlobally()) {
        if (user || authToken) invalidateSession();
        return;
      }

      const session = await reconcileSharedSession();
      if (session?.access) {
        if (session.access !== authToken || !user) {
          await applySession(session);
        }
        return;
      }

      if (user || authToken) invalidateSession();
    } finally {
      ssoSyncInflightRef.current = false;
    }
  }, [applySession, authToken, invalidateSession, user]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  const getRefreshToken = async () => {
    try {
      const newAccessToken = await refreshAccessToken();
      syncReactAuthCookies(newAccessToken, cookies.refresh_token, setCookie);
      setAuthToken(newAccessToken);
      await loadProfile(newAccessToken);
      return true;
    } catch (error) {
      console.error("Error refreshing token:", error);
      invalidateSession();
      return false;
    }
  };

  // Setup axios interceptor for automatic token refresh
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshSuccess = await getRefreshToken();
            const latestToken = getAccessToken();

            if (refreshSuccess && latestToken) {
              originalRequest.headers.Authorization = `Bearer ${latestToken}`;
              return axios(originalRequest);
            }

            invalidateSession();
            return Promise.reject(error);
          } catch (refreshError) {
            invalidateSession();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [cookies.refresh_token, invalidateSession, loadProfile, setCookie]);

  useEffect(() => {
    if (authInitRef.current) return;
    authInitRef.current = true;

    void (async () => {
      try {
        const session = await ensureSession();
        await applySession(session);
      } finally {
        setAuthReady(true);
      }
    })();
  }, [applySession]);

  useEffect(() => {
    if (!authReady) return undefined;
    return attachSharedSsoSync(() => {
      void syncFromSharedSession();
    });
  }, [authReady, syncFromSharedSession]);

  useEffect(() => {
    if (!authToken) return;
    if (user) return;
    void loadProfile(authToken);
  }, [authToken, user, loadProfile]);

  if (!authReady) {
    return <Loader />;
  }

  return (
    <authContext.Provider
      value={{
        authToken,
        authReady,
        setAuthToken,
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
        invalidateSession,
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
