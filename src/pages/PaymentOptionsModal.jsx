import React, { useState, useCallback, useEffect, useRef } from "react";
import { useCookies } from "react-cookie";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { XMarkIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

import { formatMoney } from "../utils/formatMoney";

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID;
const SERVER_URL = import.meta.env.VITE_SERVER_URL;

/**
 * PaymentOptionsModal
 *
 * Loads the PayPal JS SDK dynamically (imperative approach — more reliable
 * than the React wrapper in a modal context) and renders the PayPal button.
 *
 * Flow:
 *   1. Modal opens → SDK script injected, spinner shown.
 *   2. SDK ready → window.paypal.Buttons().render() called.
 *   3. createOrder  → POST /api/payments/paypal/create-order/{order_id}/
 *   4. onApprove    → POST /api/payments/paypal/capture-order/{order_id}/
 *                     Navigate to /success on success.
 *   5. onCancel     → close modal (order stays pending).
 *   6. onError      → toast + navigate to /payment_failed.
 */
const PaymentOptionsModal = ({
  isOpen,
  onClose,
  order_id,
  cartProducts,
  singleOrderProduct,
}) => {
  const [cookies] = useCookies([]);
  const navigate = useNavigate();
  const paypalContainerRef = useRef(null);

  const [sdkState, setSdkState] = useState("idle"); // idle | loading | ready | error
  const [capturingPayment, setCapturingPayment] = useState(false);
  const [captureError, setCaptureError] = useState(null);

  // ── Compute total to display ──────────────────────────────────────────────
  const subTotal = (() => {
    if (cartProducts && cartProducts.length > 0) {
      return cartProducts.reduce((acc, p) => {
        const price =
          p.additional_price > 0
            ? Number(p.product.unit_price) + Number(p.additional_price)
            : Number(p.product.unit_price);
        return acc + price * p.quantity;
      }, 0);
    }
    if (singleOrderProduct) {
      // product detail "Buy Now" — uses unit_price + additional_price
      const base = Number(
        singleOrderProduct.unit_price ?? singleOrderProduct.total_price ?? 0
      );
      const extra = Number(singleOrderProduct.additional_price ?? 0);
      const qty   = Number(singleOrderProduct.quantity ?? 1);
      return (base + extra) * qty;
    }
    return 0;
  })();

  const itemCount = cartProducts?.length ?? (singleOrderProduct ? 1 : 0);

  // ── PayPal API helpers ────────────────────────────────────────────────────

  const createOrder = useCallback(async () => {
    if (!cookies.access_token) {
      navigate("/signin");
      return;
    }
    const res = await fetch(
      `${SERVER_URL}/api/payments/paypal/create-order/${order_id}/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.access_token}`,
        },
      }
    );
    const data = await res.json();
    if (!res.ok) {
      const msg = data.error || "Failed to initialise PayPal order.";
      toast.error(msg, { position: "top-center" });
      throw new Error(msg);
    }
    return data.paypal_order_id;
  }, [order_id, cookies.access_token, navigate]);

  const captureOrder = useCallback(async () => {
    setCapturingPayment(true);
    setCaptureError(null);
    try {
      const res = await fetch(
        `${SERVER_URL}/api/payments/paypal/capture-order/${order_id}/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.access_token}`,
          },
        }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        onClose();
        navigate(`/success?orderId=${order_id}`);
      } else {
        const msg = data.error || "Payment capture failed. Please contact support.";
        setCaptureError(msg);
        toast.error(msg, { position: "top-center" });
        onClose();
        navigate(`/payment_failed?orderId=${order_id}`);
      }
    } catch {
      const msg = "Network error during payment. Please try again.";
      setCaptureError(msg);
      toast.error(msg, { position: "top-center" });
      onClose();
      navigate(`/payment_failed?orderId=${order_id}`);
    } finally {
      setCapturingPayment(false);
    }
  }, [order_id, cookies.access_token, onClose, navigate]);

  // ── Load PayPal SDK script dynamically ───────────────────────────────────
  useEffect(() => {
    if (!isOpen || !order_id) return;

    setSdkState("loading");
    setCaptureError(null);

    if (!PAYPAL_CLIENT_ID) {
      setSdkState("error");
      console.error("PayPal: VITE_PAYPAL_CLIENT_ID is not set.");
      return;
    }

    const SCRIPT_ID = "paypal-sdk-script";

    const initButtons = () => {
      setSdkState("ready");
    };

    // If script is already on the page and paypal is available, just render
    if (window.paypal) {
      setSdkState("ready");
      return;
    }

    // Remove stale script if there is one (e.g. from a previous failed load)
    const stale = document.getElementById(SCRIPT_ID);
    if (stale) stale.remove();

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&intent=capture`;
    script.async = true;
    script.onload = initButtons;
    script.onerror = () => {
      console.error("PayPal SDK script failed to load.");
      setSdkState("error");
    };
    document.body.appendChild(script);

    // Cleanup: reset state when modal closes
    return () => {
      setSdkState("idle");
    };
  }, [isOpen, order_id]);

  // ── Render PayPal buttons once SDK is ready ───────────────────────────────
  useEffect(() => {
    if (
      sdkState !== "ready" ||
      !window.paypal ||
      !paypalContainerRef.current ||
      !order_id ||
      capturingPayment
    )
      return;

    // Clear old buttons before re-rendering
    paypalContainerRef.current.innerHTML = "";

    window.paypal
      .Buttons({
        style: {
          layout: "vertical",
          color: "gold",
          shape: "rect",
          label: "pay",
          height: 48,
        },
        createOrder: createOrder,
        onApprove: async (_data, _actions) => {
          await captureOrder();
        },
        onCancel: () => {
          toast.info("Payment cancelled.", {
            position: "top-center",
            autoClose: 2000,
          });
          onClose();
        },
        onError: (err) => {
          console.error("PayPal button error:", err);
          const msg = "PayPal encountered an error. Please try again.";
          setCaptureError(msg);
          toast.error(msg, { position: "top-center" });
        },
      })
      .render(paypalContainerRef.current);
  }, [sdkState, order_id, capturingPayment, createOrder, captureOrder, onClose]);

  // ── Render ────────────────────────────────────────────────────────────────
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#1a1b21] shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-modal-title"
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between bg-gradient-to-r from-[#9747FF] to-[#7B2FBE] rounded-t-2xl px-6 py-5">
          <div>
            <h2
              id="payment-modal-title"
              className="text-xl font-bold text-white"
            >
              Complete Payment
            </h2>
            <p className="mt-0.5 text-sm text-purple-200">
              Secure checkout powered by PayPal
            </p>
          </div>
          {!capturingPayment && (
            <button
              onClick={onClose}
              className="ml-4 mt-0.5 rounded-full p-1 text-purple-200 hover:bg-white/20 hover:text-white transition-colors"
              aria-label="Close payment modal"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* ── Body ── */}
        <div className="px-6 py-5">
          {/* Order total */}
          <div className="mb-5 rounded-xl bg-gray-50 dark:bg-[#2a2b31] border border-gray-100 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {itemCount} item{itemCount !== 1 ? "s" : ""}
              </span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                ${formatMoney(subTotal)}
              </span>
            </div>
          </div>

          {/* Capture in-progress */}
          {capturingPayment ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="h-10 w-10 rounded-full border-4 border-[#9747FF] border-t-transparent animate-spin" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Processing your payment…
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Please do not close this window.
              </p>
            </div>
          ) : (
            <>
              {/* Error banner */}
              {captureError && (
                <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {captureError}
                  </p>
                </div>
              )}

              {/* SDK loading spinner */}
              {sdkState === "loading" && (
                <div className="flex flex-col items-center gap-3 py-6">
                  <div className="h-8 w-8 rounded-full border-4 border-[#9747FF] border-t-transparent animate-spin" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Loading PayPal…
                  </p>
                </div>
              )}

              {/* SDK error */}
              {sdkState === "error" && (
                <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-5 text-center">
                  <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-1">
                    Unable to load PayPal
                  </p>
                  <p className="text-xs text-red-500 dark:text-red-500 mb-3">
                    Please check your internet connection and try again.
                  </p>
                  <button
                    onClick={() => {
                      // Delete cached script so it reloads on retry
                      const s = document.getElementById("paypal-sdk-script");
                      if (s) s.remove();
                      if (window.paypal) delete window.paypal;
                      setSdkState("idle");
                      setTimeout(() => setSdkState("loading"), 50);
                    }}
                    className="px-4 py-2 rounded-lg bg-[#9747FF] text-white text-sm font-semibold hover:bg-[#8533EE] transition-colors"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* PayPal button container — always in DOM so SDK can render into it */}
              <div
                ref={paypalContainerRef}
                className={sdkState === "ready" ? "block" : "hidden"}
                style={{ minHeight: 48 }}
              />

              {/* Security note */}
              {sdkState === "ready" && (
                <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                  <ShieldCheckIcon className="h-3.5 w-3.5" />
                  <span>256-bit SSL encrypted · PayPal buyer protection</span>
                </div>
              )}

              {/* Cancel link */}
              <button
                onClick={onClose}
                className="mt-3 w-full text-center text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                Cancel and return
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentOptionsModal;
