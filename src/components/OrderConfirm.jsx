import { CheckCircleIcon } from "@heroicons/react/24/outline";
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

const REDIRECT_DELAY = 5; // seconds before auto-redirecting to /orders

/**
 * OrderConfirm — shown at /success after a successful PayPal capture.
 * Accepts an optional `orderId` query param to display the reference.
 * Auto-redirects to /orders after REDIRECT_DELAY seconds.
 */
const OrderConfirm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [countdown, setCountdown] = useState(REDIRECT_DELAY);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/orders");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0E0F13] flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        {/* Animated success icon */}
        <div className="flex justify-center mb-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 animate-bounce-once">
            <CheckCircleIcon className="h-14 w-14 text-green-500" strokeWidth={1.5} />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Payment Successful!
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-base mb-6 leading-relaxed">
          Thank you for shopping at PinkSurfing.{" "}
          Your order has been placed and is being prepared for shipment.
          A confirmation email has been sent to you.
        </p>

        {/* Order reference */}
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

        {/* CTAs */}
        <Link
          to="/orders"
          className="inline-flex w-full items-center justify-center rounded-xl bg-[#9747FF] px-6 py-3.5 text-base font-semibold text-white hover:bg-[#8533EE] active:bg-[#7B2FBE] transition-colors mb-3"
        >
          View My Orders
        </Link>
        <Link
          to="/"
          className="inline-flex w-full items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 px-6 py-3.5 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Continue Shopping
        </Link>

        {/* Countdown */}
        <p className="mt-5 text-sm text-gray-400 dark:text-gray-500">
          Redirecting to your orders in{" "}
          <span className="font-semibold text-[#9747FF]">{countdown}s</span>
        </p>
      </div>
    </div>
  );
};

export default OrderConfirm;
