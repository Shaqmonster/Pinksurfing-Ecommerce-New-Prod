import { XCircleIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import React from "react";
import { Link, useSearchParams } from "react-router-dom";

/**
 * OrderFailed — shown at /payment_failed when a PayPal payment is cancelled or fails.
 * Accepts an optional `orderId` query param to display the reference.
 * Cart items are preserved; the user can retry from /checkout.
 */
const OrderFailed = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <div className="min-h-screen bg-white dark:bg-[#0E0F13] flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        {/* Failure icon */}
        <div className="flex justify-center mb-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <XCircleIcon className="h-14 w-14 text-red-500" strokeWidth={1.5} />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Payment Failed
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-base mb-6 leading-relaxed">
          We couldn't process your payment. Your cart items are still saved —
          you can try again whenever you're ready.
        </p>

        {/* Order reference (if available) */}
        {orderId && (
          <div className="mb-6 rounded-xl bg-gray-50 dark:bg-[#1a1b21] border border-gray-200 dark:border-gray-700 px-5 py-4">
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">
              Order Reference
            </p>
            <p className="text-sm font-mono font-semibold text-gray-700 dark:text-gray-200 break-all">
              {orderId}
            </p>
          </div>
        )}

        {/* Common failure reasons */}
        <div className="mb-6 rounded-xl bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/50 px-5 py-4 text-left">
          <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400 uppercase tracking-wider mb-2">
            Common Reasons
          </p>
          <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
            <li>· Payment was cancelled by you</li>
            <li>· Insufficient funds in your PayPal account</li>
            <li>· Card / payment method was declined</li>
            <li>· Session timed out — please try again</li>
          </ul>
        </div>

        {/* CTAs */}
        <Link
          to="/checkout"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#9747FF] px-6 py-3.5 text-base font-semibold text-white hover:bg-[#8533EE] active:bg-[#7B2FBE] transition-colors mb-3"
        >
          <ArrowPathIcon className="h-5 w-5" />
          Try Again
        </Link>
        <Link
          to="/orders"
          className="inline-flex w-full items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 px-6 py-3.5 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors mb-3"
        >
          View My Orders
        </Link>
        <Link
          to="/"
          className="inline-flex w-full items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 px-6 py-3.5 text-base font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Return to Home
        </Link>

        {/* Support link */}
        <p className="mt-5 text-xs text-gray-400 dark:text-gray-500">
          Still having issues?{" "}
          <Link to="/contact" className="text-[#9747FF] hover:underline">
            Contact support
          </Link>
        </p>
      </div>
    </div>
  );
};

export default OrderFailed;
