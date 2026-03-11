import React, { useEffect, useState } from "react";
import axios from "axios";
import { useCookies } from "react-cookie";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { loadDots } from "@dots.dev/dots-js";
import { Elements, PaymentElement, useDots, useElements } from "@dots.dev/react-dots-js";

// Initialize Dots with the publishable key (safe to expose on the frontend)
const dotsPromise = loadDots(import.meta.env.VITE_DOTS_PUBLISHABLE_KEY);

// Inner form — must be rendered inside <Elements> to access Dots context
const DotsPaymentForm = ({ clientSecret, onClose, onSuccess }) => {
  const dots = useDots();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [name, setName] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dots || !elements) return;

    setProcessing(true);
    setError(null);

    try {
      const paymentElement = elements.getElement("payment");
      const result = await dots.confirmCardPayment(clientSecret, {
        payment_method: {
          element: paymentElement,
          billing_details: {
            name: name.trim() || "Customer",
            address: {
              country: "US",
              zip: "00000",
            },
          },
        },
      });

      if (result?.error) {
        setError(result.error.message);
      } else {
        onSuccess();
      }
    } catch (err) {
      setError(err?.message || "An unexpected error occurred.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Name on Card
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full Name"
          className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9747FF]"
          required
        />
      </div>

      <div className="mb-4">
        <PaymentElement />
      </div>

      {error && (
        <div className="text-red-500 text-sm mb-3 p-2 bg-red-50 dark:bg-red-900/20 rounded-md">
          {error}
        </div>
      )}

      <div className="flex gap-3 mt-4">
        <button
          type="button"
          onClick={onClose}
          disabled={processing}
          className="flex-1 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!dots || processing}
          className="flex-1 py-3 bg-[#9747FF] hover:bg-[#7c35d4] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processing ? "Processing…" : "Pay Now"}
        </button>
      </div>
    </form>
  );
};

// Main modal component
const PaymentOptionsModal = ({ isOpen, onClose, order_id }) => {
  const [cookies] = useCookies([]);
  const navigate = useNavigate();
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // Fetch the payment intent client_secret from the backend when the modal opens
  useEffect(() => {
    if (!isOpen || !order_id) return;

    setClientSecret(null);
    setFetchError(null);
    setLoading(true);

    axios
      .post(
        `${import.meta.env.VITE_SERVER_URL}/api/payments/create-payment-link/${order_id}/`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.access_token}`,
          },
        }
      )
      .then((res) => {
        setClientSecret(res.data.client_secret);
      })
      .catch((err) => {
        const msg = err.response?.data?.error || "Could not initialize payment. Please try again.";
        setFetchError(msg);
        toast.error(msg, { position: "top-center" });
      })
      .finally(() => setLoading(false));
  }, [isOpen, order_id]);

  const handleSuccess = () => {
    toast.success("Payment successful! Your order is confirmed.", {
      position: "top-center",
      autoClose: 3000,
    });
    onClose();
    navigate("/orders");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-[#1a1b21] dark:text-white w-full max-w-md rounded-2xl shadow-2xl p-6 relative">
        {/* Close button */}
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold mb-1">Complete Your Payment</h2>
        <p className="text-gray-400 text-sm mb-5">
          Secure payment powered by Dots
        </p>

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center py-8">
            <img src="/loading.svg" alt="Loading…" className="w-10 h-10" />
          </div>
        )}

        {/* Error state */}
        {fetchError && !loading && (
          <div className="text-red-500 text-sm text-center py-4">
            {fetchError}
          </div>
        )}

        {/* Dots Elements payment form */}
        {clientSecret && !loading && (
          <Elements dots={dotsPromise} options={{ clientSecret }}>
            <DotsPaymentForm
              clientSecret={clientSecret}
              onClose={onClose}
              onSuccess={handleSuccess}
            />
          </Elements>
        )}
      </div>
    </div>
  );
};

export default PaymentOptionsModal;
