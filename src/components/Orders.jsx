import { useContext, useEffect, useState } from "react";
import {
  ArrowLeftCircleIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import axios from "axios";
import { authContext } from "../context/authContext";
import Header from "./Header";
import CancelDialog from "./CancelDialog";
import RatingForm from '../components/RatingForm'
import { formatMoney } from "../utils/formatMoney";
import { useAccessToken } from "../hooks/useAccessToken";
import { EmptyState } from "./ui";
import ErrorState from "./ui/ErrorState";
import { orderStatusLabel, orderStatusTone } from "../utils/orderStatus";
import {
  createVendorPaymentLink,
  pendingLabel,
  shopperPaymentError,
  unpaidByVendor,
} from "../utils/orderPayment";
export default function Orders() {
  const accessToken = useAccessToken();
  const { currency, setIsRatingFormOpen, isRatingFormOpen, authToken } = useContext(authContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [payingVendor, setPayingVendor] = useState(null);
  const [payError, setPayError] = useState("");
  const navigate = useNavigate();
  const [cookies] = useCookies(["access_token"]);
    const [isOpen, setIsOpen] = useState(false);
  const [deleteOrderId, setDeleteOrderId] = useState("");


  const {
    user,
    singleOrderProduct,
    setSingleOrderProduct,
    setIsSingleOrderFormOpen,
    setIsProfileOpen,
  } = useContext(authContext);

  useEffect(() => {
    console.log(singleOrderProduct)
  }, [setSingleOrderProduct])
  const GetOrders = async () => {
    if (!accessToken) {
      navigate("/signin");
      return;
    }
    setLoading(true);
    setLoadError(false);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/api/customer/my-orders/`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      const sortedOrders = response.data.sort(
        (a, b) => new Date(b.date_of_order) - new Date(a.date_of_order)
      );

      setOrders(sortedOrders);
    } catch (error) {
      console.error(error);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!accessToken) {
      navigate("/signin");
      return;
    }
    GetOrders();
  }, [accessToken]);

  const groupOrdersByOrderId = (orders) => {
    return orders.reduce((acc, order) => {
      if (!acc[order.order]) {
        acc[order.order] = [];
      }
      acc[order.order].push(order);
      return acc;
    }, {});
  };

  const calculateTotalPrice = (orders) => {
    return orders.reduce(
      (total, order) => total + Number(order.total_price),
      0
    );
  };

  const payVendor = async (orderId, vendorId) => {
    setPayError("");
    setPayingVendor(`${orderId}:${vendorId}`);
    try {
      window.location.href = await createVendorPaymentLink(orderId, vendorId, accessToken);
    } catch (error) {
      setPayError(shopperPaymentError(error));
      setPayingVendor(null);
    }
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const openModal = () => {
    setIsOpen(true);
  };

  return (
    <>
      <div className="flex flex-col w-full h-full min-h-screen dark:bg-[#0E0F13] pb-6 px-[2%] 2xl:px-[4.5%]">
        <h2 className="font-bold flex items-center gap-0.5 mb-3 text-[21px] sm:text-[27px] text-purple-900 dark:text-purple-600">
          <ArrowLeftCircleIcon
            onClick={() => {
              navigate("/");
            }}
            className="cursor-pointer block w-[27px] sm:w-[30px] dark:text-[#f5f5f5] top-1.5"
          />
          My Orders
        </h2>
        <svg
          className="fixed top-0 right-0 z-[0] pointer-events-none"
          width="536"
          height="1071"
          viewBox="0 0 536 1071"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g filter="url(#filter0_f_1_3190)">
            <circle cx="535.5" cy="535.5" r="207.5" fill="#8B33FE" fillOpacity="0.4" />
          </g>
          <defs>
            <filter
              id="filter0_f_1_3190"
              x="0"
              y="0"
              width="1071"
              height="1071"
              filterUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB"
            >
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
              <feGaussianBlur stdDeviation="164" result="effect1_foregroundBlur_1_3190" />
            </filter>
          </defs>
        </svg>

        {loadError && !loading ? (
          <ErrorState
            title="We couldn't load your orders"
            description="Your orders are safe — this is a connection problem on our side or yours."
            onRetry={GetOrders}
          />
        ) : !loading ? (
          <>
            {payError && (
              <p role="alert" className="w-full lg:w-[80%] mx-auto mt-4 text-sm text-ps-danger">
                {payError}
              </p>
            )}
            <div className="flex flex-col items-center gap-2">
              {Object.keys(groupOrdersByOrderId(orders))
                .map((orderId) => (
                  <div
                    key={orderId}
                    className="w-full lg:w-[80%] bg-purple-50 dark:bg-[#1A1C1E] dark:border dark:border-white/30 dark:text-[#f5f5f5] mt-4 shadow-md border border-black/20 rounded-md"
                  >
                    <div className="flex justify-between items-center p-4 border-b dark:border-white/30">
                      <div>
                        <p className="font-bold text-[18px] sm:text-[20px]">
                          Order ID: {orderId}
                        </p>
                        <p className="font-medium text-black/80 dark:text-[#f5f5f5] text-[14px] sm:text-[15px]">
                          Date of Order:{" "}
                          {new Date(
                            groupOrdersByOrderId(orders)[orderId][0].date_of_order
                          ).toLocaleString("en-US", {
                            weekday: "short",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true
                          })}
                        </p>
                        <p className="font-medium text-black/80 dark:text-[#f5f5f5] text-[14px] sm:text-[15px]">
                          Total Price: {currency}{" "}
                          {formatMoney(
                            calculateTotalPrice(
                              groupOrdersByOrderId(orders)[orderId]
                            )
                          )}
                        </p>
                      </div>
                    </div>
                    {unpaidByVendor(groupOrdersByOrderId(orders)[orderId]).length > 0 && (
                      <div className="px-4 py-3 border-b border-ps-border bg-ps-sunken">
                        <p className="text-sm font-medium text-ink">
                          {pendingLabel(groupOrdersByOrderId(orders)[orderId].filter((o) => o.order_status === "PENDING"))}
                        </p>
                        <p className="text-sm text-ps-fg2 mb-2">
                          {pendingLabel(groupOrdersByOrderId(orders)[orderId].filter((o) => o.order_status === "PENDING")) === "Confirming payment"
                            ? "Square is confirming your payment. This usually takes under a minute."
                            : "Some items in this order haven't been paid for yet."}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {unpaidByVendor(groupOrdersByOrderId(orders)[orderId]).map((g) => (
                            <button
                              key={g.vendorId}
                              type="button"
                              disabled={Boolean(payingVendor)}
                              onClick={() => payVendor(orderId, g.vendorId)}
                              className="min-h-[40px] rounded-xl bg-ps-action px-4 text-sm font-semibold text-white disabled:opacity-60"
                            >
                              {payingVendor === `${orderId}:${g.vendorId}` ? "Opening…" : `Pay ${g.storeName} · ${currency} ${formatMoney(g.total)}`}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {groupOrdersByOrderId(orders)[orderId].map((order, index) => (

                      <div
                        key={index}
                        className="flex p-4 border-b dark:border-white/30"
                      >

                        <div className="w-full sm:flex items-center"
                        >
                          <button onClick={() => navigate(`/summary/${order.id}`)}>

                            <div className="w-auto h-32 sm:h-40 rounded-md mb-2 sm:mb-0 overflow-hidden "                           >
                              <img
                                className="w-full h-full object-cover"
                                alt="img"
                                src={`${order.product.image1}`}
                              />
                            </div>
                          </button>
                          <div className="flex flex-col ml-4 sm:flex-grow">
                            <p className="font-bold mb-1 text-[18px] sm:text-[20px] capitalize">
                              {order.product.name}
                            </p>
                            <p className="font-medium mb-2 text-black/80 dark:text-[#f5f5f5] text-[14px] sm:text-[15px]">
                              Price: {currency} {formatMoney(order.total_price)}
                            </p>
                          </div>
                          <div className="flex flex-col ml-4 sm:flex-grow">
                            <p className="text-[13.5px] sm:text-[14.5px] font-medium mb-1 text-gray-700 dark:text-[#f5f5f5]">
                              Quantity: {order.quantity}
                            </p>
                            <p className="text-[13.5px] sm:text-[14.5px] font-medium mb-1 text-gray-700 dark:text-[#f5f5f5]">
                              Status:{" "}
                              <span className={orderStatusTone(order.order_status)}>
                                {orderStatusLabel(order.order_status)}
                              </span>
                            </p>
                            {/* Payment Protection Badge */}
                            <p className="text-[12px] sm:text-[13px] mt-1">
                              {order.held_in_escrow > 0 ? (
                                <span className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full text-[11px] font-medium">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                  </svg>
                                  Payment Protected
                                </span>
                              ) : order.vendor_earnings_status === "PAID_OUT" || order.vendor_earnings_status === "CLEARED" ? (
                                <span className="inline-flex items-center gap-1 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full text-[11px] font-medium">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Payment Complete
                                </span>
                              ) : order.vendor_earnings_status === "PENDING" ? (
                                <span className="inline-flex items-center gap-1 bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded-full text-[11px] font-medium">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Processing
                                </span>
                              ) : null}
                            </p>
                          </div>
                          <RatingForm order={order} />
                          <div className="flex flex-col mt-2 sm:mt-0 ml-4">
                            {
                              order.order_status !== "CANCELED" ? (
                                <>
                                  <button
                                    className="bg-ps-action-soft text-ink font-medium text-sm sm:text-[16px] py-2 px-12 rounded-md mb-2 w-full max-w-[300px]"
                                    onClick={() => {
                                      if (order.order_status === "DELIVERED") {
                                        setSingleOrderProduct(order.product);
                                        setIsSingleOrderFormOpen(true);
                                        setIsProfileOpen(false);
                                      } else {
                                        navigate(`/summary/${order.id}`);
                                      }
                                    }}>
                                    {
                                      order.order_status === "DELIVERED"
                                        ? "Buy again"
                                        : "Track Order"
                                    }

                                    <ArrowRightIcon className="inline-block w-4" />
                                  </button>
                                  {
                                    order.order_status !== "DELIVERED" ? (
                                      <button
                                        disabled={
                                          order.order_status.toUpperCase() === "SHIPPED" ||
                                          order.order_status.toUpperCase() ===
                                          "DELIVERED" ||
                                          order.order_status.toUpperCase() === "RETURNED" ||
                                          order.order_status.toUpperCase() ===
                                          "RETURN-REQUESTED" ||
                                          order.order_status.toUpperCase() === "CANCELED"
                                        }
                                        onClick={() => {
                                          openModal();
                                          setDeleteOrderId(order.id);
                                        }}
                                        className="disabled:text-gray-400 disabled:hover:bg-transparent disabled:border-gray-300 text-red-600 font-medium text-sm sm:text-[16px] py-2 sm:py-2.5 hover:bg-red-100 dark:disabled:hover:bg-transparent dark:disabled:hover:text-gray-400 dark:hover:bg-red-600 dark:hover:text-white rounded-md border border-red-500 w-full max-w-[300px]"
                                      >
                                        {order.order_status === "shipped"
                                          ? "Shipped"
                                          : "Cancel Order"}
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => {
                                          console.log('clicked')
                                          setIsRatingFormOpen(true);
                                          console.log(isRatingFormOpen)
                                        }}
                                        className="bg-ps-action-soft text-ink font-medium text-sm sm:text-[16px] py-2 px-12 rounded-md mb-2 w-full max-w-[300px]"
                                      >
                                        Rate Product
                                      </button>
                                    )
                                  }
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => {
                                      setIsSingleOrderFormOpen(true);
                                      setSingleOrderProduct(order.product);
                                      setIsProfileOpen(false);
                                    }
                                    }
                                    className="bg-ps-action-soft text-ink font-medium text-sm sm:text-[16px] py-2 px-12 rounded-md mb-2 w-full max-w-[300px]"
                                  >
                                    Buy Again
                                    <ArrowRightIcon className="inline-block w-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      navigate(
                                        `/product/productDetail/${order.product.slug}?productId=${order.product.id}`
                                      );
                                    }}
                                    className="bg-ps-action-soft text-ink font-medium text-sm sm:text-[16px] py-2 px-12 rounded-md mb-2 w-full max-w-[300px]"
                                  >
                                    View Product
                                    <ArrowRightIcon className="inline-block w-4" />
                                  </button>
                                </>
                              )
                            }
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              {orders.length === 0 && (
                <EmptyState
                  title="No orders yet"
                  description="When you buy something, it will show up here with tracking."
                  actionLabel="Start shopping"
                  actionHref="/shoppingMall"
                />
              )}
            </div>
            {isOpen && (
              <CancelDialog
                isOpen={isOpen}
                orderId={deleteOrderId}
                order={orders.find((o) => o.id === deleteOrderId)}
                setIsOpen={setIsOpen}
                GetOrders={GetOrders}
              />
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <img
              src="/loading.svg"
              alt="loading"
              className="w-[50px] h-[50px] sm:w-[70px] sm:h-[70px] object-contain"
            />
          </div>
        )}
      </div >
    </>
  );
}
