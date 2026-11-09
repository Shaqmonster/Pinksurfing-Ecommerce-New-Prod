import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import { authContext } from "../context/authContext";
import { useCookies } from "react-cookie";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { FaStar } from "react-icons/fa";
import { IoStar, IoStarOutline } from "react-icons/io5";
import CancelDialog from "../components/CancelDialog";
import { toast } from "react-toastify";
import RatingForm from "../components/RatingForm";
import { ArrowLeftCircleIcon } from "@heroicons/react/24/outline";
import TrackingTimeline from "../components/TrackingTimeline";
import { formatMoney } from "../utils/formatMoney";
import { useAccessToken } from "../hooks/useAccessToken";

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

  const navigate = useNavigate();
  const { orderId } = useParams();

  const GetOrder = async () => {
    if (!accessToken) {
      navigate("/signin");
      return;
    }
    setLoading(true);
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

  const handleOptimisticCancel = (cancelledOrderId) => {
    setOrder((prev) =>
      prev ? { ...prev, order_status: "CANCELED" } : prev
    );
  };

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
        toast.success("Return Requested Successfully");
      }
    } catch (error) {
      toast.error("Failed to initiate return");
    }
  };

  const getStatusColor = (status) => {
    const s = status?.toUpperCase();
    if (s === "DELIVERED") return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
    if (["PENDING", "RECEIVED", "PACKED", "SHIPPED"].includes(s)) return "text-amber-400 bg-amber-400/10 border-amber-400/20";
    if (s === "CANCELED") return "text-rose-400 bg-rose-400/10 border-rose-400/20";
    return "text-[var(--ps-purple-light)] bg-[var(--ps-primary)]/10 border-[var(--ps-primary)]/20";
  };

  if (loading || !order) {
    return (
      <div className="min-h-screen bg-[var(--ps-bg)] text-white">
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
    <div className="min-h-screen bg-[var(--ps-bg)] text-white">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <button 
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 min-h-[44px] text-[var(--ps-muted)] hover:text-white transition-colors mb-2"
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
          
          <div className={`inline-flex px-3 py-1.5 rounded-xl border text-xs font-semibold uppercase tracking-wide ${getStatusColor(order.order_status)}`}>
            {order.order_status}
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
                        className={`text-gray-400 text-sm leading-relaxed mb-2 transition-all duration-300 ${isDescriptionExpanded ? "" : "line-clamp-2"}`}
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
                      className="min-h-[44px] px-4 rounded-xl bg-white text-black text-xs font-semibold"
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
                        onClick={() => handleReturnOrder(order.id)}
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
                <h3 className="text-sm font-semibold text-white mb-4">Shipment progress</h3>
                <TrackingTimeline orderItemId={orderId} />
              </div>
            )}

            <div className="rounded-2xl border border-[var(--ps-brd)] bg-[var(--ps-card)] p-5 sm:p-6">
              <h3 className="text-sm font-semibold text-white mb-3">Payment status</h3>
              <p className="text-sm text-[var(--ps-muted)] leading-relaxed">
                {order.held_in_escrow > 0
                  ? `Payment of ${currency}${formatMoney(order.held_in_escrow)} is held until fulfillment.`
                  : "Payment processed and verified for this order."}
              </p>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-5">
            <div className="rounded-2xl border border-[var(--ps-brd)] bg-[var(--ps-card)] p-5 sm:p-6">
              <h3 className="text-sm font-semibold text-white mb-4">Price summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[var(--ps-muted)]">Subtotal</span>
                  <span className="font-medium">{currency}{formatMoney(order.total_price)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[var(--ps-muted)]">Shipping</span>
                  <span className="text-emerald-400 font-medium">FREE</span>
                </div>
                <div className="pt-3 border-t border-[var(--ps-brd)] flex justify-between items-center">
                  <span className="text-sm font-semibold">Total</span>
                  <span className="text-xl font-semibold text-white">
                    {currency}{formatMoney(order.total_price)}
                  </span>
                </div>
              </div>
            </div>

            {order.order_status.toLowerCase() === "delivered" && (() => {
              const myRating = reviews.find((r) => String(r.order_item) === String(order.id));
              return (
                <div className="rounded-2xl border border-[var(--ps-brd)] bg-[var(--ps-card)] p-5 sm:p-6">
                  <h3 className="text-sm font-semibold text-white mb-4">Product feedback</h3>
                  {myRating ? (
                    <>
                      <div className="flex gap-1 mb-3">
                        {Array.from({ length: 7 }, (_, i) => (
                          <IoStar key={i} className={`text-lg ${myRating.rating >= i + 1 ? "text-amber-400" : "text-white/10"}`} />
                        ))}
                      </div>
                      <p className="text-white font-medium mb-1">{myRating.title || "Your review"}</p>
                      <p className="text-[var(--ps-muted)] text-sm mb-4 line-clamp-3">"{myRating.body}"</p>
                      <button
                        type="button"
                        onClick={() => setIsRatingFormOpen(true)}
                        className="text-sm text-[var(--ps-purple-light)] hover:text-white"
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

      {isOpen && (
        <CancelDialog
          isOpen={isOpen}
          orderId={deleteOrderId}
          setIsOpen={setIsOpen}
          GetOrders={GetOrder}
          onOptimisticCancel={handleOptimisticCancel}
        />
      )}
      
      <RatingForm order={order} />
    </div>
  );
};

export default Summary;
