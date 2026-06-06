import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { XMarkIcon, ShieldCheckIcon, CreditCardIcon } from "@heroicons/react/24/outline";
import axios from "axios";
import { formatMoney } from "../utils/formatMoney";
import { useAccessToken } from "../hooks/useAccessToken";

const SERVER_URL = import.meta.env.VITE_SERVER_URL;

const PaymentOptionsModal = ({
  isOpen,
  onClose,
  order_id,
  cartProducts,
  singleOrderProduct,
}) => {
  const accessToken = useAccessToken();
  const navigate = useNavigate();
  const [loadingVendorId, setLoadingVendorId] = useState(null);

  // 1. Group items by Vendor
  const groupedCart = useMemo(() => {
    if (cartProducts && cartProducts.length > 0) {
      return cartProducts.reduce((acc, item) => {
        const vendorId = item.product.vendor.id;
        if (!acc[vendorId]) {
          acc[vendorId] = {
            vendorName: item.product.vendor.store_name || "Unknown Store",
            items: [],
            total: 0
          };
        }
        const price = item.additional_price > 0 
          ? Number(item.product.unit_price) + Number(item.additional_price) 
          : Number(item.product.unit_price);
        
        acc[vendorId].items.push(item);
        acc[vendorId].total += price * item.quantity;
        return acc;
      }, {});
    }
    
    if (singleOrderProduct) {
      const vendorId = singleOrderProduct.vendor?.id || singleOrderProduct.product?.vendor?.id;
      const vendorName = singleOrderProduct.vendor?.store_name || singleOrderProduct.product?.vendor?.store_name || "Unknown Store";
      const price = Number(singleOrderProduct.unit_price ?? singleOrderProduct.total_price ?? 0) + Number(singleOrderProduct.additional_price ?? 0);
      
      return {
        [vendorId]: {
          vendorName,
          items: [singleOrderProduct],
          total: price * (singleOrderProduct.quantity || 1)
        }
      };
    }
    
    return {};
  }, [cartProducts, singleOrderProduct]);

  const handleVendorPayment = async (vendorId) => {
    if (!accessToken) {
      navigate("/signin");
      return;
    }

    setLoadingVendorId(vendorId);
    try {
      const response = await axios.post(
        `${SERVER_URL}/api/payments/square/create-order/${order_id}/vendor/${vendorId}/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      // Redirect to Square's hosted checkout page
      window.location.href = response.data.payment_link;
    } catch (error) {
      console.error("Payment error:", error);
      let errorMessage = "Payment setup incomplete for this vendor.";
      const errorCode = error.response?.data?.square_error_code;
      const errorDetails = error.response?.data?.details;
      
      if (error.response?.status === 403 && errorCode === "INSUFFICIENT_SCOPES") {
        errorMessage = "This vendor needs to reconnect their Square account with the correct permissions. Please notify the vendor.";
      } else if (errorCode === "INSUFFICIENT_SCOPES") {
        errorMessage = `Permission error: ${errorDetails || "Vendor account needs reauthorization."}`;
      } else if (error.response?.status === 400) {
        errorMessage = error.response?.data?.details || errorMessage;
      } else {
        errorMessage = error.response?.data?.error || errorMessage;
      }
      
      toast.error(errorMessage, {
        position: "top-center"
      });

    } finally {
      setLoadingVendorId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-[#121214] shadow-2xl overflow-hidden border border-white/5">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Multi-Vendor Checkout</h2>
            <p className="text-white/70 text-sm font-medium">Items are grouped by vendor for individual payment.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <XMarkIcon className="h-6 w-6 text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 max-h-[70vh] overflow-y-auto space-y-6">
          {Object.entries(groupedCart).map(([vendorId, data]) => (
            <div key={vendorId} className="bg-white/[0.03] border border-gray-100 dark:border-white/5 rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-white/5 pb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  Order from {data.vendorName}
                </h3>
                <span className="text-xl font-black text-purple-600 dark:text-purple-400">${formatMoney(data.total)}</span>
              </div>
              
              <ul className="space-y-3">
                {data.items.map((item, idx) => (
                  <li key={idx} className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>{item.product?.name || item.name} <span className="text-xs text-gray-400">x{item.quantity}</span></span>
                    <span className="font-medium">${formatMoney((Number(item.product?.unit_price || item.unit_price || 0) + Number(item.additional_price || 0)) * item.quantity)}</span>
                  </li>
                ))}
              </ul>

              <button
                disabled={loadingVendorId !== null}
                onClick={() => handleVendorPayment(vendorId)}
                className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-xs transition-all ${
                  loadingVendorId === vendorId
                    ? "bg-gray-100 text-gray-400 cursor-wait"
                    : "bg-[#3E3E3E] text-white hover:bg-black shadow-lg"
                }`}
              >
                {loadingVendorId === vendorId ? (
                  <div className="h-4 w-4 border-2 border-purple-500 border-t-transparent animate-spin rounded-full" />
                ) : (
                  <>
                    <CreditCardIcon className="h-4 w-4" />
                    Pay with Square
                  </>
                )}
              </button>
            </div>
          ))}

          {Object.keys(groupedCart).length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400">No items found in your order.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.01] flex items-center justify-center gap-2 text-xs text-gray-400 uppercase font-bold tracking-widest">
          <ShieldCheckIcon className="h-4 w-4 text-emerald-500" />
          <span>Secure Multi-Vendor Transaction System</span>
        </div>
      </div>
    </div>
  );
};

export default PaymentOptionsModal;
