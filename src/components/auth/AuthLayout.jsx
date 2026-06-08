import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiShoppingBag, FiTrendingUp, FiUsers } from "react-icons/fi";

const features = [
  {
    icon: FiShoppingBag,
    title: "Marketplace",
    description: "Discover products, gigs, and business listings in one place.",
  },
  {
    icon: FiTrendingUp,
    title: "Grow your business",
    description: "List, sell, and manage deals with built-in tools.",
  },
  {
    icon: FiUsers,
    title: "Trusted community",
    description: "Connect with buyers and sellers across the platform.",
  },
];

const AuthLayout = ({
  title,
  subtitle,
  children,
  footer,
  wide = false,
}) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex bg-[#f8f9fc]">
      <div className="hidden lg:flex lg:w-[46%] xl:w-[50%] relative overflow-hidden bg-[#0f0f14] text-white">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-purple-600/25 blur-3xl" />
          <div className="absolute top-1/3 -right-20 h-80 w-80 rounded-full bg-pink-500/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-fuchsia-500/15 blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14 w-full">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-3 w-fit text-left"
          >
            <img
              src="/logo.jpg"
              alt="PinkSurfing"
              className="h-11 w-11 rounded-xl object-cover ring-2 ring-white/10"
            />
            <span className="text-xl font-bold tracking-tight">PinkSurfing</span>
          </button>

          <div className="max-w-md">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-pink-400">
              Modern commerce platform
            </p>
            <h2 className="text-3xl xl:text-4xl font-bold leading-tight mb-4">
              Shop, sell &amp; hire — all in one place
            </h2>
            <p className="text-white/60 text-base leading-relaxed">
              Join thousands of buyers and sellers on a platform built for speed,
              trust, and growth.
            </p>
          </div>

          <ul className="space-y-4 max-w-md">
            {features.map(({ icon: Icon, title: featureTitle, description }) => (
              <li key={featureTitle} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-pink-300">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-semibold text-sm">{featureTitle}</p>
                  <p className="text-sm text-white/50">{description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-10 overflow-y-auto">
        <div className="fixed inset-0 pointer-events-none lg:hidden">
          <div className="absolute -top-24 right-0 h-64 w-64 rounded-full bg-pink-500/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-purple-600/10 blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={`relative w-full ${wide ? "max-w-lg" : "max-w-md"}`}
        >
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <button type="button" onClick={() => navigate("/")}>
              <img
                src="/logo.jpg"
                alt="PinkSurfing"
                className="h-10 w-10 rounded-xl object-cover"
              />
            </button>
            <span className="text-lg font-bold text-slate-900">PinkSurfing</span>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-7 sm:p-9 shadow-xl shadow-slate-200/50">
            <div className="mb-7">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                {title}
              </h1>
              {subtitle && (
                <p className="text-slate-500 text-sm sm:text-base">{subtitle}</p>
              )}
            </div>

            {children}

            {footer && (
              <div className="mt-6 pt-6 border-t border-slate-100 text-center text-sm text-slate-500">
                {footer}
              </div>
            )}
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} PinkSurfing. All rights reserved.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthLayout;
