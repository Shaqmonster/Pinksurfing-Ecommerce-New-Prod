import React, { useContext } from "react";
import { FaHeart, FaStore } from "react-icons/fa";
import { IoCart, IoPerson } from "react-icons/io5";
import { MdLogout, MdSettings } from "react-icons/md";
import { Link, useNavigate } from "react-router-dom";
import { authContext } from "../context/authContext";
import { useCookies } from "react-cookie";
import { toast } from "react-toastify";
import { FaWallet } from "react-icons/fa";
import { FaBoxOpen } from "react-icons/fa";

const Profile = ({ user }) => {
  const {
    setIsCartOpen,
    setIsWishlistOpen,
    setIsVendorFormOpen,
    setIsProfilePopupOpen,
    setUser,
    isDarkMode,
    setIsProfileOpen,
  } = useContext(authContext);
  const [cookies, removeCookie] = useCookies([]);
  const navigate = useNavigate();
  const Logout = () => {
    removeCookie("token");
    removeCookie("refresh");
    localStorage.removeItem("refresh");
    localStorage.removeItem("token");
    toast.success("Logged Out Successfully", {
      position: "top-right",
      autoClose: 2500,
    });
    setUser("");
    navigate("/");
  };
  const handleStoreClick = () => {
    if (user.is_vendor) {
      setIsProfileOpen(false);
      navigate(`/store/${user.vendor.slug}`);
    } else {
      toast.info("You do not have a store. Register on our vendor page.");
      setTimeout(() => {
        window.open("https://vendors.pinksurfing.com", "_blank");
      }, 3000);
    }
  };

  return (
    <>
      <div
        className={`flex items-center ${
          isDarkMode && "dark"
        } justify-center w-max  min-h-fit shadow-md shadow-black/40 rounded-sm `}
      >
        {user ? (
          <div className="w-full max-w-sm rounded-lg bg-white  dark:bg-[#0E0F13] dark:border dark:border-white p-3 drop-shadow-xl divide-y divide-gray-200">
            <div
              aria-label="header"
              className="flex space-x-4 items-center p-4"
            >
              <div
                aria-label="avatar"
                className="flex mr-auto items-center space-x-4"
              >
                <img
                  src="/media/ic_dummy_user.png"
                  alt="avatar Evan You"
                  className=" w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-full"
                />
                <div className=" space-y-1 sm:space-y-2 flex flex-col flex-1 truncate">
                  <div className="font-medium relative text-[19px] sm:text-[21px] leading-tight  text-gray-900 dark:text-[#f5f5f5] ">
                    <span className="flex">
                      <span className=" relative pr-8">
                        {user?.user?.username}
                      </span>
                    </span>
                  </div>
                  <p className="font-normal text-[14px] sm:text-[15px] leading-tight  text-gray-500 dark:text-[#f5f5f5] truncate">
                    {user?.customer_email}
                  </p>
                </div>
              </div>
            </div>
            <div aria-label="navigation" className="py-2">
              <nav className="grid gap-1">
                <Link
                  // to="/profile"
                  onClick={() => {
                    setIsProfileOpen(false);
                    setIsProfilePopupOpen(true);
                  }}
                  className="flex items-center cursor-pointer leading-6 space-x-3 py-1.5 px-4 w-fulltext-[15px] sm:text-[15.5px]  text-gray-600 dark:text-[#f5f5f5] focus:outline-none hover:bg-gray-100 dark:hover:bg-white/20 rounded-md"
                >
                  <IoPerson className="text-[19px] sm:text-[20px]" />
                  <span>Profile</span>
                </Link>
                <div
                  onClick={() => {
                    setIsProfileOpen(false);
                    setIsCartOpen(true);
                  }}
                  className="flex items-center leading-6 cursor-pointer space-x-3 py-1.5 px-4 w-fulltext-[15px] sm:text-[15.5px]   text-gray-600 dark:text-[#f5f5f5] focus:outline-none hover:bg-gray-100 dark:hover:bg-white/20  rounded-md"
                >
                  <IoCart className="text-[19px] sm:text-[20px]" />
                  <span>My Cart</span>
                </div>
                <div
                  onClick={() => {
                    setIsProfileOpen(false);
                    setIsWishlistOpen(true);
                  }}
                  className="flex items-center leading-6 cursor-pointer space-x-3 py-1.5 px-4 w-fulltext-[15px] sm:text-[15.5px]   text-gray-600 dark:text-[#f5f5f5] focus:outline-none hover:bg-gray-100 dark:hover:bg-white/20  rounded-md"
                >
                  <FaHeart className="text-[19px] sm:text-[20px]" />
                  <span>My Wishlist</span>
                </div>

                <div
                  onClick={() => {
                    window.open("https://vendors.pinksurfing.com", "_blank");
                  }}
                  className="flex items-center leading-6 cursor-pointer space-x-3 py-1.5 px-4 w-full text-[15px] sm:text-[15.5px] text-gray-600 dark:text-[#f5f5f5] focus:outline-none hover:bg-gray-100 dark:hover:bg-white/20 rounded-md"
                >
                  <FaStore className="text-[19px] sm:text-[20px]" />
                  <span>My Store</span>
                </div>
                <Link
                  to="/orders"
                  onClick={() => {
                    setIsProfileOpen(false);
                  }}
                  className="flex items-center leading-6 space-x-3 py-1.5 px-4 w-fulltext-[15px] sm:text-[15.5px]   text-gray-600 dark:text-[#f5f5f5] focus:outline-none hover:bg-gray-100 dark:hover:bg-white/20  rounded-md"
                >
                  <FaBoxOpen className="text-[19px] sm:text-[20px]" />
                  <span>My Orders</span>
                </Link>
                <Link
                  to="/userwallet"
                  onClick={() => {
                    setIsProfileOpen(false);
                  }}
                  className="flex items-center leading-6 space-x-3 py-1.5 px-4 w-fulltext-[15px] sm:text-[15.5px]   text-gray-600 dark:text-[#f5f5f5] focus:outline-none hover:bg-gray-100 dark:hover:bg-white/20  rounded-md"
                >
                  <FaWallet className="text-[19px] sm:text-[20px]" />
                  <span>My Wallet</span>
                </Link>
              </nav>
            </div>
            <div aria-label="footer" className="pt-2">
              <button
                onClick={Logout}
                type="button"
                className="flex items-center space-x-3 py-1.5 px-4 ml-0.5 w-full leading-6 text-[15px] sm:text-[15.5px]  text-gray-600 dark:text-[#f5f5f5] focus:outline-none hover:bg-gray-100 dark:hover:bg-white/20  rounded-md"
              >
                <MdLogout className=" text-[19px] sm:text-[20px]" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="w-[200px] h-[110px] flex flex-col items-center justify-center max-w-sm rounded-lg bg-white dark:bg-black dark:border dark:border-white p-3 drop-shadow-xl ">
            <p className=" text-black dark:text-[#f5f5f5] mb-2 font-semibold text-sm ">
              You are not yet Logged in
            </p>
            <Link to="/signin">
              <button
                onClick={() => {
                  setIsVendorFormOpen(false);
                }}
                className=" bg-[#2d1e5f] px-5 py-2 rounded-md "
              >
                Login
              </button>
            </Link>
          </div>
        )}
      </div>
    </>
  );
};

export default Profile;
