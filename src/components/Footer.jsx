import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { authContext } from "../context/authContext";
import { useCookies } from "react-cookie";
import { FaAppStore , FaGooglePlay } from "react-icons/fa";
import { useAccessToken } from "../hooks/useAccessToken";

const Footer = () => {
  const accessToken = useAccessToken();
  const [cookies] = useCookies([]);
  const FooterLinks = [
    {
      id: 1,
      heading: "My Account",
      list: [
        {
          id: "1.1",
          name: accessToken ? "My Account" : "Login",
          link: accessToken ? "/" : "/signin",
        },
        {
          id: "1.2",
          name: "Wishlist",
          link: "/",
        },
        {
          id: "1.3",
          name: "Order Tracking",
          link: "/orders",
        },
        {
          id: "1.4",
          name: "Contact Us",
          link: "/contact",
        },
        {
          id: "1.5",
          name: "Contact",
          link: "/contact",
        },
      ],
    },
    {
      id: 2,
      heading: "Explore",
      list: [
        {
          id: "2.1",
          name: "Shopping mall",
          link: "/shoppingMall",
        },
        {
          id: "2.2",
          name: "Register",
          link: "/signup",
        },
        {
          id: "2.3",
          name: "Shop by category",
          link: "/shopByCategory",
        },
        {
          id: "2.4",
          name: "GigHub",
          link: "/gighub",
        },
        {
          id: "2.5",
          name: "Bids",
          link: "/bids",
        },
      ],
    },
  ];


  const [email, setEmail] = useState("");
  const {
    setIsVendorFormOpen,
    setIsWishlistOpen,
    setIsProfilePopupOpen,
    user,
  } = useContext(authContext);
  const navigate = useNavigate();

  const handleSubscribe = async (e) => {
    e.preventDefault();
    // try {
    //   const response = await axios.post("/subscribe", { email });
    //   toast.success(response.data.message);
    //   setEmail("");
    // } catch (err) {
    //   console.error("Failed to subscribe:", err);
    // }
  };

  const [social, setSocial] = useState({});

  return (
    <>
      <footer className="relative bg-gradient-to-b from-[#13131a] to-[#0a0a0f] text-gray-300 border-t border-purple-500/20 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-600/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 px-[8%] pt-12 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-8">
            {/* Brand Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="col-span-2 flex justify-center items-center flex-col"
            >
              <motion.img
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
                src="/logo.jpg"
                className="w-[120px] md:w-[150px] rounded-full ring-4 ring-purple-500/30 shadow-xl shadow-purple-500/20"
                alt="Pink Surfing"
              />
              
              <motion.p 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="my-5 md:mb-7 text-[13.5px] text-gray-400 text-center leading-relaxed"
              >
                PinkSurfing is a marketplace for products, businesses for sale, services, and networking — built for clear discovery and trusted commerce.
              </motion.p>
              
              <motion.p 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-white mb-4 font-semibold text-[15px] bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
              >
                Follow Us On Social:
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex items-center gap-4 mb-6"
              >
                {[
                  { icon: "/social/fb.svg", link: social?.facebook || "/" },
                  { icon: "/social/twitter.svg", link: social?.twitter || "/" },
                  { icon: "/social/insta.svg", link: social?.instagram || "/" },
                  { icon: "/social/linkedin.svg", link: social?.linkedin || "/" },
                  { icon: "/social/youtube.svg", link: social?.youtube || "/" }
                ].map((item, index) => (
                  <Link key={index} to={item.link}>
                    <motion.div
                      whileHover={{ scale: 1.2, rotate: 5 }}
                      whileTap={{ scale: 0.9 }}
                      className="bg-white/5 backdrop-blur-md p-3 rounded-full border border-white/10 hover:border-purple-500/50 transition-all"
                    >
                      <img className="h-[17px]" src={item.icon} alt="social" />
                    </motion.div>
                  </Link>
                ))}
              </motion.div>
            </motion.div>

            {/* Footer Links */}
            {FooterLinks.map((item, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="md:col-span-1 col-span-2 flex flex-col text-left"
              >
                <h2 className="mb-4 font-bold text-white text-[16px] relative inline-block">
                  {item.heading}
                  <span className="absolute bottom-0 left-0 w-12 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></span>
                </h2>
                <ul className="text-gray-400 flex flex-col text-[13.5px] space-y-3">
                  {item.list
                    .filter((e) => !(user?.is_vendor && e.id === "2.4"))
                    .map((e, idx) => {
                      let link = e.link;
                      if (e.id === "2.2" && accessToken) {
                        link = "#";
                      }
                      return (
                        <li key={idx}>
                          <Link
                            to={link}
                            onClick={(event) => {
                              if (e.id == "2.2") {
                                if (!accessToken) {
                                  navigate("/signup");
                                } else {
                                  event.preventDefault();
                                  return;
                                }
                              }
                              if (e.id === "2.4") {
                                event.preventDefault();
                                setIsVendorFormOpen(true);
                              }
                              if (e.id === "1.1") {
                                event.preventDefault();
                                if (accessToken) {
                                  setIsProfilePopupOpen(true);
                                }
                              }
                              if (e.id === "1.2") {
                                event.preventDefault();
                                setIsWishlistOpen(true);
                              }
                            }}
                            className="block transition-colors cursor-pointer hover:text-[#a855f7]"
                          >
                            <motion.span whileHover={{ x: 5 }}>
                              {e.name}
                            </motion.span>
                          </Link>
                        </li>
                      );
                    })}
                </ul>
              </motion.div>
            ))}

            {/* Download Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="col-span-3 md:col-span-2 flex flex-col text-left"
            >
              <h2 className="mb-4 font-bold text-white text-[16px] relative inline-block">
                Download App
                <span className="absolute bottom-0 left-0 w-12 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></span>
              </h2>
              <div className="flex flex-col gap-3">
                <motion.a
                  whileHover={{ scale: 1.05, x: 5 }}
                  whileTap={{ scale: 0.95 }}
                  href="https://play.google.com"
                  className="flex items-center gap-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl p-4 w-48 hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg hover:shadow-purple-500/50 border border-purple-500/30"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaGooglePlay size={24}/>
                  <div className="flex flex-col items-start">
                    <span className="text-xs text-purple-200">Get it on</span>
                    <span className="text-sm font-semibold">Google Play</span>
                  </div>
                </motion.a>
                <motion.a
                  whileHover={{ scale: 1.05, x: 5 }}
                  whileTap={{ scale: 0.95 }}
                  href="https://www.apple.com/app-store/"
                  className="flex items-center gap-3 bg-gradient-to-r from-pink-600 to-pink-700 text-white rounded-xl p-4 w-48 hover:from-pink-700 hover:to-pink-800 transition-all shadow-lg hover:shadow-pink-500/50 border border-pink-500/30"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaAppStore size={24}/>
                  <div className="flex flex-col items-start">
                    <span className="text-xs text-pink-200">Download on</span>
                    <span className="text-sm font-semibold">App Store</span>
                  </div>
                </motion.a>
              </div>
            </motion.div>
          </div>

          {/* Bottom Section */}
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="py-6 mt-8 border-t border-purple-500/20 text-[13px] text-gray-400"
          >
            <p className="text-center">
              Copyright ©{new Date().getFullYear()}{" "}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-semibold">
                Pinksurfing LLC
              </span>{" "}
              All rights reserved.
            </p>
          </motion.div>
        </div>
      </footer>
    </>
  );
};

export default Footer;