import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authContext } from "../context/authContext";
import { useCookies } from "react-cookie";
import { FaAppStore , FaGooglePlay } from "react-icons/fa";

const Footer = () => {
  const [cookies] = useCookies([]);
  const FooterLinks = [
    {
      id: 1,
      heading: "My Account",
      list: [
        {
          id: "1.1",
          name: cookies.access_token ? "My Account" : "Login",
          link: cookies.access_token ? "/" : "/signin",
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
      <footer className="relative bg-[#F6F6F6]  dark:text-gray-400 dark:bg-[#191C1F] dark:border-t dark:border-gray-400 min-h-[360px] flex flex-col justify-between pt-5 px-[8%]  ">
        <div className=" grid grid-cols-1 md:grid-cols-6 gap-6 pt-5">
          <div className=" col-span-2 flex justify-center items-center flex-col">
            <img
              src="/logo.jpg"
              className=" w-[120px] md:w-[150px] bg-white border-none"
              alt="Pink Surfing"
            />
            <p className=" my-5 md:mb-7 text-[13.5px] text-[#929292] dark:text-gray-400 ">
              A multidimensional chat and ecommerce for trading goods, selling services, and networking that pays you for your network… for life. What if the billions you - the people - made for social websites could be recreated and redistributed to the users. And you get a piece of that pie.
            </p>
            <p className=" dark:text-gray-400 text-[#292929] mb-2 font-[600]  text-[15px] ">
              Follow Us On Social:
            </p>
            <div className="absolute inset-0 bottom-0 left-0 z-0 pointer-events-none">
              <svg
                width="329"
                height="500"
                viewBox="0 0 329 500"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="absolute left-0 bottom-0 pointer-events-none"
              >
                <g opacity="0.09">
                  <path
                    d="M199.103 250.21L170.377 195.944C129.009 217.835 95.401 231.145 69.9124 235.719C99.6149 215.42 126.594 180.476 151.157 130.578L96.0691 103.394C79.3165 137.361 63.643 159.15 49.4598 173.025C57.5278 135.768 47.2501 83.2492 3.15881 0L-51.1073 28.7262C-29.2159 70.0939 -15.9063 103.702 -11.3327 129.139C-31.6311 99.4366 -66.5753 72.5091 -116.422 47.894L-143.607 102.982C-109.639 119.735 -87.8501 135.408 -73.9752 149.592C-111.232 141.524 -163.751 151.801 -247 195.841L-218.274 250.107C-176.958 228.216 -143.401 214.958 -117.912 210.333C-147.666 230.888 -174.594 265.781 -199.055 315.422L-143.966 342.607C-127.316 308.793 -111.592 286.953 -97.3569 272.975C-105.425 310.232 -95.1472 362.751 -51.056 446L3.21022 417.274C-18.6812 375.958 -31.9395 342.401 -36.5644 316.912C-16.0091 346.666 18.8837 373.594 68.5249 398.055L95.7094 342.966C61.8958 326.316 40.0557 310.643 26.078 296.408C33.6321 298.053 41.7515 298.926 50.6931 298.926C85.8428 298.926 132.76 285.257 199.154 250.107L199.103 250.21Z"
                    fill="#D5C1EE"
                  />
                </g>
              </svg>
            </div>

            <div className=" flex items-center gap-5 mb-4 md:mb-6">
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
              <div key={index} className="md:col-span-1 col-span-2  flex flex-col text-left">
                <h2 className="mb-3 font-[600]  dark:text-white text-[#292929] capitalize">
                  {item.heading}
                </h2>
                <ul className="dark:text-gray-400 text-[#727272] flex flex-col text-[13.5px]">
                  {item.list
                    .filter((e) => !(user.is_vendor && e.id === "2.4"))
                    .map((e, index) => {
                      let link = e.link;

                      if (e.id === "2.2" && cookies.access_token) {
                        link = "#";
                      }
                      return (
                        <Link
                          to={link}
                          key={index}
                          className="mb-4"
                          onClick={(event) => {
                            if (e.id == "2.2") {
                              if (!cookies.access_token) {
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
                              if (cookies.access_token) {
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
          <div className="col-span-3 md:col-span-2 flex flex-col text-left mb-4">
            <h2 className="mb-3 ml-2 font-[600] dark:text-white text-[#292929] capitalize">
              Download
            </h2>
            <div className="flex flex-col gap-3 ml-2">
              <a
                href="https://play.google.com"
                className="flex items-center justify-center gap-2 bg-[#303639] text-white rounded-md p-3 w-40 hover:bg-[#363a3d]"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaGooglePlay size={20}/>
                <span>{"  "}Google Play</span>
              </a>
              <a
                href="https://www.apple.com/app-store/"
                className="flex items-center justify-center gap-4 bg-[#303639] text-white rounded-md p-3 w-40 hover:bg-[#363a3d]"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaAppStore size={20}/>
                <span>App Store</span>
              </a>
            </div>
          </div>

        </div>
        <div className=" py-4 md:py-6 border-t border-gray-400 text-[12.2px] md:text-[13.4px] dark:text-gray-400 text-[#292929] ">
          <p className=" mt-3 md:mt-0 text-center">
            Copyright ©2024{" "}
            <span className=" text-[#fff]">Pinksurfing LLC</span> All rights
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