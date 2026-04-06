import React, { useState, useCallback } from "react";
import { useCookies } from "react-cookie";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { XMarkIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID;
const SERVER_URL = import.meta.env.VITE_SERVER_URL;

/**
 * PaymentOptionsModal
 *
 * Shows a PayPal payment button for a given order.
 * Flow:
 *   1. PayPal SDK renders a Pay button inside this modal.
 *   2. createOrder  → POST /api/payments/paypal/create-order/{order_id}/
 *                     Returns paypal_order_id; SDK opens PayPal approval popup.
 *   3. onApprove    → POST /api/payments/paypal/capture-order/{order_id}/
 *                     Marks order as paid, navigates to /success.
 *   4. onCancel     → closes modal (order stays pending, cart intact).
 *   5. onError      → shows toast, navigates to /payment_failed.
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
  const [capturingPayment, setCapturingPayment] = useState(false);
  const [captureError, setCaptureError] = useState(null);

  // Compute the displayed total from cart or single-order product
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
      return Number(singleOrderProduct.total_price ?? 0);
    }
    return 0;
  })();

  const itemCount = cartProducts?.length ?? (singleOrderProduct ? 1 : 0);

  // -------------------------------------------------------------------------
  // PayPal SDK callbacks
  // -------------------------------------------------------------------------

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
      const message = data.error || "Failed to initialise PayPal order.";
      toast.error(message, { position: "top-center" });
      throw new Error(message);
    }
    return data.paypal_order_id;
  }, [order_id, cookies.access_token, navigate]);

  const onApprove = useCallback(async () => {
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
        navigate(`/payment_failed?orderId=${order_id}`);
      }
    } catch (err) {
      const msg = "Network error during payment. Please try again.";
      setCaptureError(msg);
      toast.error(msg, { position: "top-center" });
      navigate(`/payment_failed?orderId=${order_id}`);
    } finally {
      setCapturingPayment(false);
    }
  }, [order_id, cookies.access_token, onClose, navigate]);

  const onCancel = useCallback(() => {
    toast.info("Payment cancelled.", { position: "top-center", autoClose: 2000 });
    onClose();
  }, [onClose]);

  const onError = useCallback(
    (err) => {
      console.error("PayPal error:", err);
      const msg = "PayPal encountered an error. Please try again.";
      setCaptureError(msg);
      toast.error(msg, { position: "top-center" });
    },
    []
  );

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#1a1b21] shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-modal-title"
      >
        {/* ---- Header ---- */}
        <div className="flex items-start justify-between bg-gradient-to-r from-[#9747FF] to-[#7B2FBE] px-6 py-5">
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

        {/* ---- Body ---- */}
        <div className="px-6 py-5">
          {/* Order total */}
          <div className="mb-5 rounded-xl bg-gray-50 dark:bg-[#2a2b31] border border-gray-100 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {itemCount} item{itemCount !== 1 ? "s" : ""}
              </span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                ${subTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Capture spinner */}
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
              {/* Error state */}
              {captureError && (
                <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {captureError}
                  </p>
                </div>
              )}

              {/* PayPal SDK provider + buttons */}
              <PayPalScriptProvider
                options={{
                  "client-id": PAYPAL_CLIENT_ID,
                  currency: "USD",
                  intent: "capture",
                }}
              >
                <PayPalButtons
                  style={{
                    layout: "vertical",
                    color: "gold",
                    shape: "rect",
                    label: "pay",
                    height: 48,
                  }}
                  fundingSource={undefined}
                  createOrder={createOrder}
                  onApprove={onApprove}
                  onCancel={onCancel}
                  onError={onError}
                />
              </PayPalScriptProvider>

              {/* Security note */}
              <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                <ShieldCheckIcon className="h-3.5 w-3.5" />
                <span>256-bit SSL encrypted · PayPal buyer protection</span>
              </div>

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
