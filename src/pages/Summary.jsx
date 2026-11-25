import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import { authContext } from "../context/authContext";
import { useCookies } from "react-cookie";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { FaStar } from "react-icons/fa";
import { IoStar, IoStarOutline } from "react-icons/io5";
import CancelDialog from "../components/CancelDialog";
import RatingForm from "../components/RatingForm";
import { ArrowLeftCircleIcon } from "@heroicons/react/24/outline";
import TrackingTimeline from "../components/TrackingTimeline";
import { formatMoney } from "../utils/formatMoney";
import { useAccessToken } from "../hooks/useAccessToken";
import ErrorState from "../components/ui/ErrorState";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { orderStatusLabel } from "../utils/orderStatus";
import { isItemPaid } from "../utils/orderPayment";

import { notify } from "../lib/notify";
const Summary = () => {
  const accessToken = useAccessToken();
  const { user, isRatingFormOpen, currency, setIsRatingFormOpen } =
    React.useContext(authContext);
  const [cookies, removeCookie] = useCookies([]);
  const [orders, setOrders] = useState([]);
  const [order, setOrder] = useState();
  const [addresses, setAddresses] = useState([]);
  let [isOpen, setIsOpen] = useState(false);
  let [deleteOrderId, setDeleteOrderId] = useState("");
  let [orderStatus, setOrderStatus] = useState("");
  const [reviews, setReviews] = useState([]);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [confirmReturn, setConfirmReturn] = useState(false);

  const navigate = useNavigate();
  const { orderId } = useParams();

  const GetOrder = async () => {
    if (!accessToken) {
      navigate("/signin");
      return;
    }
    setLoading(true);
    setLoadError(false);
    axios
      .get(
        `${import.meta.env.VITE_SERVER_URL}/api/order/track-order/${orderId}/`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )
      .then((response) => {
        setOrder(response.data);
      })
      .catch((error) => {
        console.error(error);
        setLoadError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const GetAddresses = async () => {
    if (!accessToken) return;
    axios
      .get(`${import.meta.env.VITE_SERVER_URL}/api/customer/address/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      })
      .then((response) => {
        setAddresses(response.data);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  useEffect(() => {
    GetOrder();
    GetAddresses();
  }, [accessToken, orderId]);

  useEffect(() => {
    if (!order?.product?.id) return;
    axios
      .get(`${import.meta.env.VITE_SERVER_URL}/api/ratings/get-ratings/${order.product.id}/`, {
        headers: { "Content-Type": "application/json" },
      })
      .then((res) => setReviews(res.data.ratings_reviews || []))
      .catch(() => {});
  }, [order?.product?.id]);

  const handleReturnOrder = async (orderItemId) => {
    if (!accessToken) {
      navigate("/signin");
      return;
    }
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/order/return-order/${orderItemId}/`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      if (response.status === 202 || response.status === 200) {
        setOrder((prev) =>
          prev ? { ...prev, order_status: "RETURN-REQUESTED" } : prev
        );
        notify.success("Return requested. We'll show the next steps here.");
      }
    } catch (error) {
      const err = new Error("return failed");
      err.userMessage =
        error.response?.data?.error ||
        (error.response
          ? "We couldn't request this return. Please try again."
          : "We couldn't reach PinkSurfing. Check your connection and try again.");
      throw err;
    }
  };

  const getStatusColor = (status) => {
    const s = status?.toUpperCase();
    if (s === "DELIVERED" || s === "RETURNED")
      return "text-ps-success bg-[color-mix(in_srgb,var(--ps-color-success)_10%,transparent)] border-[color-mix(in_srgb,var(--ps-color-success)_30%,transparent)]";
    if (s === "CANCELED" || s === "ERROR" || s === "RETURN-DISPUTED")
      return "text-ps-warning bg-[color-mix(in_srgb,var(--ps-color-warning)_10%,transparent)] border-[color-mix(in_srgb,var(--ps-color-warning)_30%,transparent)]";
    return "text-ps-fg2 bg-ps-sunken border-ps-border";
  };

  if (loadError && !loading) {
    return (
      <div className="min-h-screen bg-ps-bg text-ink">
        <main className="max-w-xl mx-auto px-4 py-16">
          <ErrorState
            title="We couldn't load this order"
            description="Your order is safe — this is a connection problem on our side or yours."
            onRetry={GetOrder}
          />
        </main>
      </div>
    );
  }

  if (loading || !order) {
    return (
      <div className="min-h-screen bg-[var(--ps-bg)] text-ink">
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-6" aria-busy="true">
          <div className="space-y-3">
            <div className="ps-skeleton h-4 w-28 rounded" />
            <div className="ps-skeleton h-9 w-56 rounded" />
            <div className="ps-skeleton h-4 w-40 rounded" />
          </div>
          <div className="rounded-2xl border border-[var(--ps-brd)] bg-[var(--ps-card)] p-4 sm:p-6 flex flex-col sm:flex-row gap-4">
            <div className="ps-skeleton h-40 w-full sm:w-40 rounded-xl shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="ps-skeleton h-6 w-2/3 rounded" />
              <div className="ps-skeleton h-4 w-full rounded" />
              <div className="ps-skeleton h-4 w-4/5 rounded" />
              <div className="ps-skeleton h-10 w-32 rounded-xl" />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 ps-skeleton h-48 rounded-2xl" />
            <div className="ps-skeleton h-48 rounded-2xl" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--ps-bg)] text-ink">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <button 
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 min-h-[44px] text-[var(--ps-muted)] hover:text-ink transition-colors mb-2"
            >
              <ArrowLeftCircleIcon className="w-5 h-5" />
              <span className="text-sm">Back to orders</span>
            </button>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-1">
              Order details
            </h1>
            <p className="text-[var(--ps-muted)] text-sm">
              ID: <span className="text-[var(--ps-purple-light)]">{order.order_number || orderId}</span>
            </p>
          </div>
          
          <div className={`inline-flex px-3 py-1.5 rounded-xl border text-sm font-medium ${getStatusColor(order.order_status)}`}>
            {orderStatusLabel(order.order_status)}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8 space-y-5">
            <div className="rounded-2xl border border-[var(--ps-brd)] bg-[var(--ps-card)] overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-52 h-52 bg-[var(--ps-surf)] p-4 flex items-center justify-center shrink-0">
                  <img
                    className="max-w-full max-h-full object-contain"
                    alt={order.product.name}
                    src={order.product.image1}
                    loading="lazy"
                  />
                </div>
                <div className="flex-1 p-5 sm:p-6 flex flex-col">
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold tracking-tight mb-2">{order.product.name}</h2>
                    <div>
                      <div
                        className={`text-ps-meta text-sm leading-relaxed mb-2 transition-all duration-300 ${isDescriptionExpanded ? "" : "line-clamp-2"}`}
                      >
                        {String(order.product.description || "")
                          .replace(/<[^>]*>/g, " ")
                          .replace(/\s+/g, " ")
                          .trim()}
                      </div>
                      {String(order.product.description || "").replace(/<[^>]*>/g, "").length > 150 && (
                        <button 
                          onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                          className="text-[10px] font-black uppercase tracking-widest text-purple-400 hover:text-purple-300 transition-colors"
                        >
                          {isDescriptionExpanded ? "Read Less —" : "Read More +"}
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-4 mb-5">
                      <div>
                        <p className="text-xs text-[var(--ps-muted)] mb-1">Quantity</p>
                        <p className="text-base font-semibold">x{order.quantity}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[var(--ps-muted)] mb-1">Unit price</p>
                        <p className="text-base font-semibold">{currency}{formatMoney(order.total_price / order.quantity)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-4 border-t border-[var(--ps-brd)]">
                    <button
                      type="button"
                      onClick={() => navigate(`/product/productDetail/${order.product.slug}?productId=${order.product.id}`)}
                      className="min-h-[44px] px-4 rounded-xl border border-ps-border bg-ps-surface text-ink text-xs font-semibold"
                    >
                      View product
                    </button>
                    {["PENDING", "RECEIVED", "PACKED"].includes(order.order_status.toUpperCase()) && (
                      <button
                        type="button"
                        onClick={() => { setIsOpen(true); setDeleteOrderId(order.id); }}
                        className="min-h-[44px] px-4 rounded-xl border border-red-500/30 text-red-400 text-xs font-semibold"
                      >
                        Cancel order
                      </button>
                    )}
                    {order.order_status.toUpperCase() === "DELIVERED" && (
                      <button
                        type="button"
                        onClick={() => setConfirmReturn(true)}
                        className="min-h-[44px] px-4 rounded-xl border border-[var(--ps-brd)] text-[var(--ps-muted)] text-xs font-semibold"
                      >
                        Return item
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {order.order_status && ["RECEIVED", "PACKED", "SHIPPED", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"].includes(order.order_status.toUpperCase().replace(/\s+/g, "_")) && (
              <div className="rounded-2xl border border-[var(--ps-brd)] bg-[var(--ps-card)] p-5 sm:p-6">
                <h3 className="text-sm font-semibold text-ink mb-4">Shipment progress</h3>
                <TrackingTimeline orderItemId={orderId} />
              </div>
            )}

            <div className="rounded-2xl border border-[var(--ps-brd)] bg-[var(--ps-card)] p-5 sm:p-6">
              <h3 className="text-sm font-semibold text-ink mb-3">Payment status</h3>
              <p className="text-sm text-[var(--ps-muted)] leading-relaxed">
                {order.held_in_escrow > 0
                  ? `Payment of ${currency}${formatMoney(order.held_in_escrow)} is held until fulfillment.`
                  : isItemPaid(order)
                  ? "Paid. Square confirmed the payment for this item."
                  : String(order.order_status).toUpperCase() === "CANCELED"
                  ? "This item was canceled. If it had been paid, the refund goes to your original payment method."
                  : "Not paid yet. You can pay for it from your orders."}
              </p>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-5">
            <div className="rounded-2xl border border-[var(--ps-brd)] bg-[var(--ps-card)] p-5 sm:p-6">
              <h3 className="text-sm font-semibold text-ink mb-4">Price summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[var(--ps-muted)]">Subtotal</span>
                  <span className="font-medium">{currency}{formatMoney(order.total_price)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[var(--ps-muted)]">Shipping</span>
                  <span className="font-medium">
                    {Number(order.shipping_cost || 0) > 0 ? `${currency}${formatMoney(order.shipping_cost)}` : "Free"}
                  </span>
                </div>
                <div className="pt-3 border-t border-[var(--ps-brd)] flex justify-between items-center">
                  <span className="text-sm font-semibold">Total</span>
                  <span className="text-xl font-semibold text-ink">
                    {currency}{formatMoney(Number(order.total_price || 0) + Number(order.shipping_cost || 0))}
                  </span>
                </div>
              </div>
            </div>

            {order.order_status.toLowerCase() === "delivered" && (() => {
              const myRating = reviews.find((r) => String(r.order_item) === String(order.id));
              return (
                <div className="rounded-2xl border border-[var(--ps-brd)] bg-[var(--ps-card)] p-5 sm:p-6">
                  <h3 className="text-sm font-semibold text-ink mb-4">Product feedback</h3>
                  {myRating ? (
                    <>
                      <div className="flex gap-1 mb-3">
                        {Array.from({ length: 7 }, (_, i) => (
                          <IoStar key={i} className={`text-lg ${myRating.rating >= i + 1 ? "text-amber-400" : "text-ink/10"}`} />
                        ))}
                      </div>
                      <p className="text-ink font-medium mb-1">{myRating.title || "Your review"}</p>
                      <p className="text-[var(--ps-muted)] text-sm mb-4 line-clamp-3">”{myRating.body}”</p>
                      <button
                        type="button"
                        onClick={() => setIsRatingFormOpen(true)}
                        className="text-sm text-[var(--ps-purple-light)] hover:text-ink"
                      >
                        Edit review
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-[var(--ps-muted)] mb-4">
                        Share your experience to help other buyers.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsRatingFormOpen(true)}
                        className="w-full min-h-[44px] rounded-xl bg-gradient-to-r from-[var(--ps-primary)] to-[var(--ps-purple-dark)] text-sm font-semibold text-white"
                      >
                        Rate item
                      </button>
                    </>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </main>

      <ConfirmDialog
        open={confirmReturn}
        onClose={() => setConfirmReturn(false)}
        title="Request a return?"
        confirmLabel="Request return"
        busyLabel="Requesting…"
        cancelLabel="Not now"
        onConfirm={() => handleReturnOrder(order.id)}
      >
        <p>
          {order.product?.name || "This item"} goes back to the store. Once they receive and check it, your refund is
          processed to your original payment method.
        </p>
        <p className="mt-2">You’ll see each step on this page.</p>
      </ConfirmDialog>

      {isOpen && (
        <CancelDialog
          isOpen={isOpen}
          orderId={deleteOrderId}
          order={order}
          setIsOpen={setIsOpen}
          GetOrders={GetOrder}
        />
      )}
      
      <RatingForm order={order} />
    </div>
  );
};

export default Summary;
