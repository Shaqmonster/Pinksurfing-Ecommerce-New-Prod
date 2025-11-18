import React, { createContext, useState, useEffect } from "react";
import { useCookies } from "react-cookie";
import { useNavigate } from "react-router-dom";
import axios from "axios";

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
  const [cookies, setCookie, removeCookie] = useCookies(["access_token", "refresh_token"]);
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

  const Logout = async () => {
    try {
      // Get the token before clearing
      const token = authToken || cookies.access_token || localStorage.getItem("access_token");
      
      // Call server logout API if token exists
      if (token) {
        try {
          await axios.post(
            "https://auth.pinksurfing.com/logout/",
            {},
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              withCredentials: true,
            }
          );
        } catch (error) {
          console.error("Server logout error:", error);
          // Continue with client-side cleanup even if server logout fails
        }
      }

      // Clear all cookies
      const allCookies = Object.keys(cookies);
      allCookies.forEach((cookieName) => {
        removeCookie(cookieName, { path: "/" });
      });

      // Clear all localStorage
      localStorage.clear();

      setUser("");
      setAuthToken("");
      navigate("/signin");
    } catch (error) {
      console.error("Logout error:", error);
      
      // Still clear local data even if there's an error
      const allCookies = Object.keys(cookies);
      allCookies.forEach((cookieName) => {
        removeCookie(cookieName, { path: "/" });
      });
      localStorage.clear();
      setUser("");
      setAuthToken("");
      navigate("/signin");
    }
  };

  const GetProfile = async (token = authToken) => {
    try {
      setLoading(true)
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/api/customer/profile/`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setUser(response.data);
      return true;
    } catch (error) {
      console.error("GetProfile error:", error);
      if (error.response && error.response.status === 401) {
        // Access token expired, try to refresh
        const refreshSuccess = await getRefreshToken();
        if (!refreshSuccess) {
          Logout();
          return false;
        }
        return true;
      } else {
        Logout();
        return false;
      }
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
    let refresh = localStorage.getItem("refresh_token") || cookies.refresh_token;

    if (refresh) {
      try {
        setLoading(true)
        const response = await axios.post(
          "https://auth.pinksurfing.com/api/token/refresh/",
          { refresh: refresh },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const newAccessToken = response.data.access;
        
        // Store new access token in both cookie and localStorage
        setCookie("access_token", newAccessToken, {
          path: "/",
          expires: new Date(Date.now() + 7 * 60 * 60 * 1000),
          secure: true,
          sameSite: "strict",
        });
        localStorage.setItem("access_token", newAccessToken);

        setAuthToken(newAccessToken);
        
        // Retry getting profile with new token
        await GetProfile(newAccessToken);
        
        return true;
      } catch (error) {
        console.error("Error refreshing token:", error);
        // Refresh token is invalid or expired
        Logout();
        return false;
      } finally {
        setLoading(false);
      }
    } else {
      // No refresh token available
      Logout();
      return false;
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
    const verifyToken = async () => {
      if (!cookies.access_token) {
        const refresh = localStorage.getItem("refresh_token") || cookies.refresh_token;
        if (refresh) {
          await getRefreshToken();
        }
      } else {
        setAuthToken(cookies.access_token);
      }
    };

    verifyToken();
  }, [cookies.access_token, cookies.refresh_token]);


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
      }}
    >
      {children}
    </authContext.Provider>
  );
};
