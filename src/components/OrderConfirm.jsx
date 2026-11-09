import { CheckCircleIcon } from "@heroicons/react/24/outline";
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

const REDIRECT_DELAY = 8;

/**
 * OrderConfirm — shown at /success after a successful payment capture.
 * Auto-redirect can be paused (WCAG 2.2.1).
 */
const OrderConfirm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const vendorId = searchParams.get("vendorId");
  const [countdown, setCountdown] = useState(REDIRECT_DELAY);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return undefined;
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
  }, [navigate, paused]);

  return (
    <div className="min-h-screen bg-[var(--ps-bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center mb-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--ps-green)_20%,transparent)]">
            <CheckCircleIcon className="h-14 w-14 text-[var(--ps-green)]" strokeWidth={1.5} />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">
          {vendorId ? "Vendor payment successful" : "Payment successful"}
        </h1>
        <p className="text-[var(--ps-muted)] text-base mb-6 leading-relaxed">
          {vendorId
            ? "Your payment for this vendor's items has been confirmed. If your cart has items from other vendors, please complete those payments as well."
            : "Thank you for shopping at PinkSurfing. Your order has been placed and is being prepared for shipment."}
        </p>

        {(orderId || vendorId) && (
          <div className="mb-6 rounded-xl bg-[var(--ps-card)] border border-[var(--ps-brd)] px-5 py-4">
            {orderId && (
              <div className="mb-2">
                <p className="text-xs font-medium text-[var(--ps-dim)] mb-1.5">
                  Order reference
                </p>
                <p className="text-sm font-mono font-semibold text-white break-all">
                  {orderId}
                </p>
              </div>
            )}
            {vendorId && (
              <div>
                <p className="text-xs font-medium text-[var(--ps-dim)] mb-1.5">
                  Vendor reference
                </p>
                <p className="text-sm font-mono font-semibold text-white break-all">
                  {vendorId}
                </p>
              </div>
            )}
          </div>
        )}

        <Link
          to="/orders"
          className="inline-flex w-full items-center justify-center min-h-[44px] rounded-[14px] bg-gradient-to-r from-[var(--ps-primary)] to-[var(--ps-purple-dark)] px-6 py-3.5 text-base font-semibold text-white mb-3"
        >
          View my orders
        </Link>
        <Link
          to="/"
          className="inline-flex w-full items-center justify-center min-h-[44px] rounded-[14px] border border-[var(--ps-brd)] px-6 py-3.5 text-base font-medium text-[var(--ps-muted)] hover:text-white mb-4"
        >
          Return home
        </Link>

        <div className="flex items-center justify-center gap-3 text-sm text-[var(--ps-dim)]">
          {!paused ? (
            <>
              <span>Redirecting to orders in {countdown}s</span>
              <button
                type="button"
                onClick={() => setPaused(true)}
                className="min-h-[44px] px-3 text-[var(--ps-purple-light)] underline"
              >
                Stay on this page
              </button>
            </>
          ) : (
            <span>Auto-redirect paused</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderConfirm;
