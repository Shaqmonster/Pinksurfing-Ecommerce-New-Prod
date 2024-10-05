import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authContext } from "../context/authContext";
import { useCookies } from "react-cookie";

const Footer = () => {
  const [cookies] = useCookies([]);
  const FooterLinks = [
    {
      id: 1,
      heading: "My Account",
      list: [
        {
          id: "1.1",
          name: cookies.token ? "My Account" : "Login",
          link: cookies.token ? "/" : "/signin",
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
          name: "Privacy-policy",
          link: "/",
        },
      ],
    },
    {
      id: 2,
      heading: "About Us",
      list: [
        {
          id: "2.1",
          name: "About Us",
          link: "/about",
        },
        {
          id: "2.2",
          name: "Register",
          link: "/signup",
        },
        {
          id: "2.3",
          name: "Shopping Guide",
          link: "/about",
        },
        {
          id: "2.4",
          name: "Register as Vendor",
          link: "/",
        },
        {
          id: "2.5",
          name: "FAQs",
          link: "/",
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
      <footer className="bg-[#F6F6F6]  dark:text-gray-400 dark:bg-black dark:border-t dark:border-gray-400 min-h-[360px] flex flex-col justify-between pt-5 px-[8%]  ">
        <div className=" grid grid-cols-1 md:grid-cols-6 gap-6 pt-5">
          <div className=" col-span-2">
            <img
              src="/pinksurfingLogo.png"
              className=" w-[120px] md:w-[150px]"
              alt="Pink Surfing"
            />
            <p className=" my-5 md:mb-7 text-[13.5px] text-[#929292] dark:text-gray-400 ">
            A multidimensional chat and ecommerce for trading goods, selling services, and networking that pays you for your network… for life. What if the billions you - the people - made for social websites could be recreated and redistributed to the users. And you get a piece of that pie.
</p>
            <p className=" dark:text-gray-400 text-[#292929] mb-2 font-[600]  text-[15px] ">
              Follow Us On Social:
            </p>
            <div className=" flex items-center gap-5 mb-4 md:mb-0">
              <Link to={social?.facebook ? social?.facebook : "/"}>
                <img className=" h-[17px]  " src="/social/fb.svg" alt="logo" />
              </Link>
              <Link to={social?.twitter ? social?.twitter : "/"}>
                <img
                  className=" h-[17px]  "
                  src="/social/twitter.svg"
                  alt="logo"
                />
              </Link>
              <Link to={social?.instagram ? social?.instagram : "/"}>
                <img
                  className=" h-[17px]  "
                  src="/social/insta.svg"
                  alt="logo"
                />
              </Link>
              <Link to={social?.linkedin ? social?.linkedin : "/"}>
                <img
                  className=" h-[17px]  "
                  src="/social/linkedin.svg"
                  alt="logo"
                />
              </Link>
              <Link to={social?.youtube ? social?.youtube : "/"}>
                <img
                  className=" h-[17px]  "
                  src="/social/youtube.svg"
                  alt="logo"
                />
              </Link>
            </div>
          </div>

          {/* <div className=" col-span-3 md:col-span-1 flex flex-col text-left ">
            <h2 className="mb-3 ml-2 font-[600]  dark:text-gray-400 text-[#292929] capitalize">
              Opening Time{" "}
            </h2>
            <ul className="dark:text-gray-400 text-[#727272] flex flex-col  text-[13.3px] ">
              <li className="mb-4">Mon – Fri: 8AM – 10PM</li>
              <li className="mb-4">Sat: 9AM-8PM</li>
              <li className="mb-4">Sun: Closed</li>
            </ul>
          </div> */}

          {FooterLinks.map((item, index) => {
            return (
              <div key={index} className="col-span-1 flex flex-col text-left">
                <h2 className="mb-3 font-[600] ml-2  dark:text-gray-400 text-[#292929] capitalize">
                  {item.heading}
                </h2>
                <ul className="dark:text-gray-400 text-[#727272] flex flex-col text-[13.5px]">
                  {item.list
                    .filter((e) => !(user.is_vendor && e.id === "2.4"))
                    .map((e, index) => {
                      let link = e.link;

                      if (e.id === "2.2" && cookies.token) {
                        link = "#";
                      }
                      return (
                        <Link
                          to={link}
                          key={index}
                          className="mb-4"
                          onClick={(event) => {
                            if (e.id == "2.2") {
                              if (!cookies.token) {
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
                              if (cookies.token) {
                                setIsProfilePopupOpen(true);
                              }
                            }
                            if (e.id === "1.2") {
                              event.preventDefault();
                              setIsWishlistOpen(true);
                            }
                          }}
                        >
                          <li className="hover:underline">{e.name}</li>
                        </Link>
                      );
                    })}
                </ul>
              </div>
            );
          })}

          <div className=" col-span-3 md:col-span-2 flex flex-col text-left ">
            <h2 className="mb-3 ml-2 font-[600]  dark:text-gray-400 text-[#292929] capitalize">
              Newsletter
            </h2>
            <p className=" text-[14px] text-left px-1 md:text-[14px] text-[#929292] dark:text-gray-400 pb-[20px]">
              Signup for exclusive offers, original stories, events and more.
            </p>
            <input
              className=" w-[100%] text-[15px] p-[15px] dark:bg-transparent"
              type="text"
              name="email"
              placeholder=" Enter Your Email"
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              className=" uppercase bg-[#222] py-[10px] mt-[10px] w-auto border-gray-400 px-3 uppercase text-[14px] text-[#fff] font-[700] "
              onClick={handleSubscribe}
            >
              Sign Up
            </button>
          </div>
        </div>
        <div className=" py-4 md:py-6 border-t border-gray-400 text-[12.2px] md:text-[13.4px] dark:text-gray-400 text-[#292929] ">
          <p className=" mt-3 md:mt-0 text-center">
            Copyright ©2024{" "}
            <span className=" text-[#fff]">Pinksurfing</span> All rights
            reserved.
          </p>
          {/* <div className="flex items-center gap-6">
            <Link to="/privacy-policy">Policy</Link>
            <Link to="/faqs">Questions</Link>
            <Link to="/contact">Affiliate</Link>
            <Link to="/contact">Help</Link>
          </div> */}
        </div>
      </footer>
    </>
  );
};

export default Footer;