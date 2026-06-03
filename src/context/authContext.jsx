import React, { createContext, useState, useEffect, useRef } from "react";
import { useCookies } from "react-cookie";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ensureSession,
  fetchCustomerProfile,
  getAccessToken,
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
  const [loading, setLoading] = useState(false);
  const authInitRef = useRef(false);
  const lastSyncedAccessRef = useRef("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [pendingChatConversation, setPendingChatConversation] = useState(null);
  const [pendingChatParticipantEmail, setPendingChatParticipantEmail] = useState(null);

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
      await signOut(token);
      setUser("");
      setAuthToken("");
      toast.success("Logged out successfully", {
        position: "top-right",
        autoClose: 2500,
      });
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      setUser("");
      setAuthToken("");
      navigate("/");
    }
  };

  const GetProfile = async (token = authToken) => {
    if (!token) return false;
    try {
      setLoading(true);
      const profile = await fetchCustomerProfile(token);
      setUser(profile);
      return true;
    } catch (error) {
      console.error("GetProfile error:", error);
      const status = error?.response?.status;
      if (status === 401) {
        const refreshSuccess = await getRefreshToken();
        if (!refreshSuccess) {
          Logout();
          return false;
        }
        return true;
      }
      if (status === 403) {
        Logout();
        return false;
      }
      return false;
    } finally {
      setLoading(false);
    }
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
  const getRefreshToken = async () => {
    try {
      setLoading(true);
      const newAccessToken = await refreshAccessToken();
      syncReactAuthCookies(
        newAccessToken,
        cookies.refresh_token,
        setCookie
      );
      setAuthToken(newAccessToken);
      await GetProfile(newAccessToken);
      return true;
    } catch (error) {
      console.error("Error refreshing token:", error);
      Logout();
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Setup axios interceptor for automatic token refresh
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // If error is 401 and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshSuccess = await getRefreshToken();

            if (refreshSuccess && authToken) {
              // Update the authorization header with new token
              originalRequest.headers.Authorization = `Bearer ${authToken}`;
              // Retry the original request
              return axios(originalRequest);
            } else {
              Logout();
              return Promise.reject(error);
            }
          } catch (refreshError) {
            Logout();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );

    // Cleanup interceptor on unmount
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [authToken]);

  useEffect(() => {
    if (authInitRef.current) return;
    authInitRef.current = true;

    void (async () => {
      const session = await ensureSession();
      if (session?.access) {
        if (lastSyncedAccessRef.current !== session.access) {
          syncReactAuthCookies(session.access, session.refresh, setCookie);
          lastSyncedAccessRef.current = session.access;
        }
        setAuthToken(session.access);
      } else {
        setAuthToken("");
        setUser("");
      }
    })();
  }, [setCookie]);


  useEffect(() => {
    if (authToken) {
      GetProfile();
    }
  }, [authToken]);

  if (loading) {
    return <Loader />;
  }

  return (
    <authContext.Provider
      value={{
        authToken,
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
