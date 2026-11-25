import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { PS_MOTION } from "../lib/motion-tokens";
import { useIsAuthenticated } from "../hooks/useAccessToken";

const KEY = "ps-welcome";

/** Call after a real signup so the first signed-in visit gets one quiet welcome. */
export function markWelcomePending() {
  try {
    localStorage.setItem(KEY, "pending");
  } catch {
    /* storage unavailable: no welcome, nothing breaks */
  }
}

/**
 * One calm, dismissible welcome for a brand-new account — shown once, only after
 * signup actually succeeded and the person is signed in. No confetti.
 */
export default function WelcomeNote({ firstName }) {
  const signedIn = useIsAuthenticated();
  const reduce = useReducedMotion();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!signedIn) return;
    try {
      if (localStorage.getItem(KEY) === "pending") setShow(true);
    } catch {
      /* ignore */
    }
  }, [signedIn]);

  const dismiss = () => {
    setShow(false);
    try {
      localStorage.setItem(KEY, "seen");
    } catch {
      /* ignore */
    }
  };

  if (!show) return null;

  return (
    <motion.section
      role="status"
      aria-label="Welcome"
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: PS_MOTION.duration.celebration ?? 0.8, ease: PS_MOTION.easing.standard }}
      className="relative mx-auto mb-8 max-w-2xl rounded-2xl border border-ps-border bg-ps-surface px-6 py-5 text-left shadow-[var(--ps-shadow-2)]"
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss welcome"
        className="absolute right-2 top-2 inline-flex h-10 w-10 items-center justify-center rounded-full text-ps-fg2 hover:bg-ps-hover hover:text-ink"
      >
        <XMarkIcon className="h-5 w-5" />
      </button>
      <h2 className="text-lg font-semibold tracking-tight text-ink">
        Welcome to PinkSurfing{firstName ? `, ${firstName}` : ""}
      </h2>
      <p className="mt-1 text-sm text-ps-fg2">Your account is set up. A few good places to start:</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link onClick={dismiss} to="/shoppingMall" className="min-h-[40px] inline-flex items-center rounded-xl bg-ps-action px-4 text-sm font-semibold text-white">
          Browse stores
        </Link>
        <Link onClick={dismiss} to="/request-product" className="min-h-[40px] inline-flex items-center rounded-xl border border-ps-border px-4 text-sm font-medium text-ink hover:bg-ps-hover">
          Request a product
        </Link>
        <Link onClick={dismiss} to="/profile" className="min-h-[40px] inline-flex items-center rounded-xl border border-ps-border px-4 text-sm font-medium text-ink hover:bg-ps-hover">
          Add a shipping address
        </Link>
      </div>
    </motion.section>
  );
}
