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

  const navigate = useNavigate();
  const { orderId } = useParams();

  const GetOrder = async () => {
    if (!accessToken) {
      navigate("/signin");
      return;
    }
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

  if (!order) return null;

  const getStatusColor = (status) => {
    const s = status?.toUpperCase();
    if (s === "DELIVERED") return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
    if (["PENDING", "RECEIVED", "PACKED", "SHIPPED"].includes(s)) return "text-amber-400 bg-amber-400/10 border-amber-400/20";
    if (s === "CANCELED") return "text-rose-400 bg-rose-400/10 border-rose-400/20";
    return "text-purple-400 bg-purple-400/10 border-purple-400/20";
  };

  return (
    <div className="min-h-screen bg-[#0E0F13] text-white selection:bg-purple-500/30">
      {/* Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-pink-600/5 blur-[100px] rounded-full" />
      </div>

      <main className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-4 group"
            >
              <ArrowLeftCircleIcon className="w-6 h-6 transition-transform group-hover:-translate-x-1" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Back to orders</span>
            </button>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase mb-2">
              Order Details
            </h1>
            <p className="text-gray-500 font-mono text-sm tracking-tight">
              ID: <span className="text-purple-400">{order.order_number || orderId}</span>
            </p>
          </div>
          
          <div className={`px-6 py-2.5 rounded-2xl border text-xs font-black uppercase tracking-[0.2em] backdrop-blur-xl ${getStatusColor(order.order_status)}`}>
            {order.order_status}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Product & Tracking */}
          <div className="lg:col-span-8 space-y-8">
            {/* Product Card */}
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/5 rounded-[2.5rem] overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-72 h-72 bg-white/5 p-8 flex items-center justify-center">
                  <img
                    className="max-w-full max-h-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                    alt={order.product.name}
                    src={order.product.image1}
                  />
                </div>
                <div className="flex-1 p-8 md:p-10 flex flex-col">
                  <div className="flex-1">
                    <h2 className="text-2xl font-black tracking-tight mb-2 uppercase">{order.product.name}</h2>
                    <div>
                      <div 
                        className={`text-gray-400 text-sm leading-relaxed mb-2 transition-all duration-300 ${isDescriptionExpanded ? "" : "line-clamp-2"}`}
                        dangerouslySetInnerHTML={{ __html: order.product.description }}
                      />
                      {order.product.description?.length > 150 && (
                        <button 
                          onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                          className="text-[10px] font-black uppercase tracking-widest text-purple-400 hover:text-purple-300 transition-colors"
                        >
                          {isDescriptionExpanded ? "Read Less —" : "Read More +"}
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-8 mb-8 mt-8">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Quantity</p>
                        <p className="text-xl font-bold">x{order.quantity}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Unit Price</p>
                        <p className="text-xl font-bold">{currency} {formatMoney(order.total_price / order.quantity)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 pt-8 border-t border-white/5">
                    <button
                      onClick={() => navigate(`/product/productDetail/${order.product.slug}?productId=${order.product.id}`)}
                      className="px-8 py-3.5 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
                    >
                      View Product
                    </button>
                    {["PENDING", "RECEIVED", "PACKED"].includes(order.order_status.toUpperCase()) && (
                      <button
                        onClick={() => { setIsOpen(true); setDeleteOrderId(order.id); }}
                        className="px-8 py-3.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500/20 transition-all"
                      >
                        Cancel Order
                      </button>
                    )}
                    {order.order_status.toUpperCase() === "DELIVERED" && (
                      <button
                        onClick={() => handleReturnOrder(order.id)}
                        className="px-8 py-3.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-500/20 transition-all"
                      >
                        Return Item
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Tracking Section */}
            {order.order_status && ["RECEIVED", "PACKED", "SHIPPED", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"].includes(order.order_status.toUpperCase().replace(/\s+/g, "_")) && (
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-10">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-8">Shipment Progress</h3>
                <TrackingTimeline orderItemId={orderId} />
              </div>
            )}

            {/* Payment Protection Status */}
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-10">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-8">Security & Verification</h3>
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 rounded-[1.25rem] bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-black tracking-tight uppercase mb-1">
                    {order.held_in_escrow > 0 ? "Payment Protected" : "Transaction Verified"}
                  </h4>
                  <p className="text-gray-400 text-sm leading-relaxed max-w-xl">
                    {order.held_in_escrow > 0 
                      ? `Your payment of ${currency}${formatMoney(order.held_in_escrow)} is held securely until fulfillment. Our automated protection system is active for this transaction.`
                      : "Your payment has been successfully processed and verified. This order is fully covered by our merchant fulfillment guarantee."
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Summary & Reviews */}
          <div className="lg:col-span-4 space-y-8">
            {/* Order Summary */}
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-10">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-8">Price Summary</h3>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm uppercase tracking-wider">Subtotal</span>
                  <span className="font-bold">{currency} {formatMoney(order.total_price)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm uppercase tracking-wider">Shipping</span>
                  <span className="text-emerald-400 font-bold">FREE</span>
                </div>
                <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                  <span className="text-sm font-black uppercase tracking-[0.2em]">Total</span>
                  <span className="text-3xl font-black text-purple-400 tracking-tighter">
                    {currency} {formatMoney(order.total_price)}
                  </span>
                </div>
              </div>
            </div>

            {/* Review Section */}
            {order.order_status.toLowerCase() === "delivered" && (() => {
              const myRating = reviews.find((r) => String(r.order_item) === String(order.id));
              return (
                <div className="bg-gradient-to-br from-purple-600/10 to-pink-600/10 backdrop-blur-xl border border-purple-500/20 rounded-[2.5rem] p-10 flex flex-col items-center text-center">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-300 mb-6">Product Feedback</h3>
                  
                  {myRating ? (
                    <>
                      <div className="flex gap-1 mb-6">
                        {Array.from({ length: 7 }, (_, i) => (
                          <IoStar key={i} className={`text-xl ${myRating.rating >= i + 1 ? "text-amber-400" : "text-white/10"}`} />
                        ))}
                      </div>
                      <p className="text-white font-bold mb-2 uppercase tracking-tight">{myRating.title || "Experience Shared"}</p>
                      <p className="text-gray-400 text-sm mb-8 italic line-clamp-3">"{myRating.body}"</p>
                      <button
                        onClick={() => setIsRatingFormOpen(true)}
                        className="text-[10px] font-black uppercase tracking-widest text-purple-400 hover:text-purple-300 transition-colors underline underline-offset-8"
                      >
                        Modify Review
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20">
                        <IoStar className="text-3xl text-emerald-400" />
                      </div>
                      <h4 className="text-xl font-black uppercase tracking-tight mb-2">Share your thoughts</h4>
                      <p className="text-gray-400 text-sm mb-8 leading-relaxed">Your feedback helps others make informed decisions. Share your experience!</p>
                      <button
                        onClick={() => setIsRatingFormOpen(true)}
                        className="w-full py-4 bg-emerald-500 text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all"
                      >
                        Rate Item
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
