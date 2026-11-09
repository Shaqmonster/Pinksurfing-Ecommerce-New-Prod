import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authContext } from "../context/authContext";
import { FaAppStore, FaGooglePlay } from "react-icons/fa";
import { useAccessToken } from "../hooks/useAccessToken";

const BRAND_LOGO = "/brand/logo.jpeg";

const Footer = () => {
  const accessToken = useAccessToken();
  const { setIsWishlistOpen, user } = useContext(authContext);
  const navigate = useNavigate();

  const accountLinks = [
    {
      name: accessToken ? "My account" : "Sign in",
      link: accessToken ? "/profile" : "/signin",
    },
    {
      name: "Wishlist",
      action: () => {
        if (!accessToken) navigate("/signin");
        else setIsWishlistOpen(true);
      },
    },
    { name: "Orders", link: accessToken ? "/profile" : "/signin" },
    { name: "Help", link: "/contact" },
  ];

  const exploreLinks = [
    { name: "Shopping mall", link: "/shoppingMall" },
    { name: "GigHub", link: "/gighub" },
    { name: "Deals", link: "/deals" },
    { name: "Bids", link: "/bids" },
    { name: "Shop by category", link: "/shopByCategory" },
    ...(!accessToken ? [{ name: "Register", link: "/signup" }] : []),
  ];

  return (
    <footer className="relative bg-[var(--ps-bg)] text-[var(--ps-muted)] border-t border-[var(--ps-brd)]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 pt-12 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4 flex flex-col items-start gap-4">
            <Link to="/" className="inline-flex items-center gap-3 group" aria-label="PinkSurfing home">
              <img
                src={BRAND_LOGO}
                alt="PinkSurfing"
                className="w-14 h-14 rounded-2xl object-cover ring-1 ring-[var(--ps-brd)] group-hover:ring-white/25 transition-all"
              />
              <div>
                <span className="block text-lg font-semibold text-white tracking-tight">PinkSurfing</span>
                <span className="block text-xs text-[var(--ps-dim)]">Marketplace</span>
              </div>
            </Link>
            <p className="text-sm leading-relaxed max-w-sm">
              Shop products, list a store, hire on GigHub, or close deals — clear discovery and trusted commerce.
            </p>
            <div className="flex items-center gap-2 pt-1">
              {[
                { icon: "/social/fb.svg", label: "Facebook" },
                { icon: "/social/twitter.svg", label: "X" },
                { icon: "/social/insta.svg", label: "Instagram" },
                { icon: "/social/linkedin.svg", label: "LinkedIn" },
                { icon: "/social/youtube.svg", label: "YouTube" },
              ].map((item) => (
                <a
                  key={item.label}
                  href="/"
                  aria-label={item.label}
                  className="inline-flex items-center justify-center min-h-[40px] min-w-[40px] rounded-xl border border-[var(--ps-brd)] bg-[var(--ps-surf)] hover:border-[var(--ps-primary)]/40 transition-colors"
                >
                  <img className="h-4 w-4 opacity-80" src={item.icon} alt="" />
                </a>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            <h2 className="text-sm font-semibold text-white mb-4">Account</h2>
            <ul className="space-y-2.5 text-sm">
              {accountLinks.map((item) => (
                <li key={item.name}>
                  {item.action ? (
                    <button
                      type="button"
                      onClick={item.action}
                      className="hover:text-white transition-colors"
                    >
                      {item.name}
                    </button>
                  ) : (
                    <Link to={item.link} className="hover:text-white transition-colors">
                      {item.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h2 className="text-sm font-semibold text-white mb-4">Explore</h2>
            <ul className="space-y-2.5 text-sm">
              {exploreLinks.map((item) => (
                <li key={item.name}>
                  <Link to={item.link} className="hover:text-white transition-colors">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h2 className="text-sm font-semibold text-white mb-4">Get the app</h2>
            <div className="flex flex-col gap-2.5 max-w-xs">
              <a
                href="/"
                className="inline-flex items-center gap-3 min-h-[48px] px-4 rounded-xl bg-gradient-to-r from-[var(--ps-primary)] to-[var(--ps-purple-dark)] text-white text-sm font-medium"
              >
                <FaGooglePlay aria-hidden="true" />
                Google Play
              </a>
              <a
                href="/"
                className="inline-flex items-center gap-3 min-h-[48px] px-4 rounded-xl border border-[var(--ps-brd)] bg-[var(--ps-surf)] text-white text-sm font-medium"
              >
                <FaAppStore aria-hidden="true" />
                App Store
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[var(--ps-brd)] flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between text-xs text-[var(--ps-dim)]">
          <p>
            Copyright © {new Date().getFullYear()}{" "}
            <span className="text-[var(--ps-purple-light)]">Pinksurfing LLC</span>. All rights reserved.
          </p>
          {!user?.is_vendor && (
            <Link to="/contact" className="hover:text-white transition-colors">
              Contact support
            </Link>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
