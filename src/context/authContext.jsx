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
  const [cookies, setCookie, removeCookie] = useCookies(["token", "refresh"]);
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

  const Logout = () => {
    removeCookie("token");
    removeCookie("refresh");
    setUser("");
    navigate("/");
  };

  const GetProfile = async () => {
    try {
      setLoading(true)
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/api/customer/profile/`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      setUser(response.data);
    } catch (error) {
      console.error(error);
      if (error.response && error.response.status === 401) {
        await getRefreshToken();
      } else {
        Logout();
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
    let refresh = localStorage.getItem("refresh") || cookies.refresh;

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

        setCookie("token", response.data.access, {
          path: "/",
          expires: new Date(Date.now() + 7 * 60 * 60 * 1000), // 1 hour
          secure: true,
          sameSite: "strict",
        });

        setAuthToken(response.data.access);
      } catch (error) {
        console.error("Error refreshing token:", error);
        Logout();
      } finally {
        setLoading(false);
      }
    } else {
      Logout();
    }
  };

  useEffect(() => {
    const verifyToken = async () => {
      if (!cookies.token) {
        const refresh = localStorage.getItem("refresh") || cookies.refresh;
        if (refresh) {
          await getRefreshToken();
        }
      } else {
        setAuthToken(cookies.token);
      }
    };

    verifyToken();
  }, [cookies.token, cookies.refresh]);

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
