import { useContext, useEffect, useState } from "react";
import {
    ArrowLeftCircleIcon,
    ShoppingBagIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { authContext } from "../../context/authContext";
import CancelDialog from "../CancelDialog";
import { formatMoney } from "../../utils/formatMoney";
import { AnimatePresence } from "framer-motion";
import { useAccessToken } from "../../hooks/useAccessToken";

export default function AllOrders() {
  const accessToken = useAccessToken();
    const { currency, authToken, setIsSingleOrderFormOpen, setSingleOrderProduct, setIsProfileOpen } =
        useContext(authContext);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [deleteOrderId, setDeleteOrderId] = useState("");

    const GetOrders = async () => {
        if (!accessToken) {
            navigate("/signin");
            return;
        }
        setLoading(true);
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
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    useEffect(() => {
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

    const handleOptimisticCancel = (cancelledOrderId) => {
        setOrders((prev) =>
            prev.map((o) =>
                o.id === cancelledOrderId
                    ? { ...o, order_status: "CANCELED" }
                    : o
            )
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
                setOrders((prev) =>
                    prev.map((o) =>
                        o.id === orderItemId
                            ? { ...o, order_status: "RETURN-REQUESTED" }
                            : o
                    )
                );
                toast.success(
                    "Return Scheduled! A carrier will arrive tomorrow. No printing required.",
                    { position: "top-center", autoClose: 6000 }
                );
            }
        } catch (error) {
            console.error(error);
            toast.error(
                error.response?.data?.error || "Failed to initiate return.",
                { position: "top-center", autoClose: 3000 }
            );
        }
    };

    const getStatusStyle = (status) => {
        switch (status?.toUpperCase()) {
            case "DELIVERED": return "text-green-400 bg-green-400/10 border-green-400/20";
            case "CANCELED": return "text-red-400 bg-red-400/10 border-red-400/20";
            case "RETURN-REQUESTED":
            case "RETURN-DELIVERED": return "text-orange-400 bg-orange-400/10 border-orange-400/20";
            case "PENDING":
            case "RECEIVED":
            case "PACKED": return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
            default: return "text-purple-400 bg-purple-400/10 border-purple-400/20";
        }
    };

    const grouped = groupOrdersByOrderId(orders);
    const visibleOrderIds = Object.keys(grouped).filter(
        (id) => !grouped[id].some((o) => o.order_status.toUpperCase() === "PENDING")
    );

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6 pb-16">
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl border border-[var(--ps-brd)] bg-[var(--ps-surf)] text-white"
                    aria-label="Back"
                >
                    <ArrowLeftCircleIcon className="w-5 h-5" />
                </button>
                <div>
                    <h2 className="text-xl font-semibold text-white">My orders</h2>
                    <p className="text-sm text-[var(--ps-muted)]">
                        {loading ? "Loading…" : `${visibleOrderIds.length} order${visibleOrderIds.length === 1 ? "" : "s"}`}
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="space-y-3" aria-busy="true">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="rounded-2xl border border-[var(--ps-brd)] bg-[var(--ps-card)] p-4 flex gap-4">
                            <div className="ps-skeleton h-20 w-20 rounded-xl shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="ps-skeleton h-4 w-2/3 rounded" />
                                <div className="ps-skeleton h-3 w-1/3 rounded" />
                                <div className="ps-skeleton h-8 w-28 rounded-lg" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-3">
                    {visibleOrderIds.map((orderId) => {
                        const items = grouped[orderId];
                        const head = items[0];
                        return (
                            <article
                                key={orderId}
                                className="rounded-2xl border border-[var(--ps-brd)] bg-[var(--ps-card)] overflow-hidden"
                            >
                                <div className="px-4 py-3 border-b border-[var(--ps-brd)] flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                        <p className="text-xs text-[var(--ps-dim)]">
                                            Order #{head.order_number || orderId}
                                        </p>
                                        <p className="text-sm text-white">
                                            {new Date(head.date_of_order).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <p className="text-base font-semibold text-white">
                                        {currency}
                                        {formatMoney(calculateTotalPrice(items))}
                                    </p>
                                </div>
                                <ul className="divide-y divide-[var(--ps-brd)]">
                                    {items.map((order) => (
                                        <li key={order.id} className="p-4 flex gap-3 sm:gap-4">
                                            <img
                                                src={order.product.image1}
                                                alt=""
                                                className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl object-cover bg-[var(--ps-surf)] shrink-0"
                                                loading="lazy"
                                            />
                                            <div className="min-w-0 flex-1 space-y-2">
                                                <div className="flex flex-wrap items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <h3 className="text-sm font-medium text-white line-clamp-2">
                                                            {order.product.name}
                                                        </h3>
                                                        <p className="text-xs text-[var(--ps-muted)] mt-0.5">
                                                            Qty {order.quantity} · {currency}
                                                            {formatMoney(order.total_price)}
                                                        </p>
                                                    </div>
                                                    <span
                                                        className={`inline-flex items-center px-2 py-0.5 rounded-lg border text-[10px] font-semibold uppercase tracking-wide ${getStatusStyle(order.order_status)}`}
                                                    >
                                                        {order.order_status}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {order.order_status.toUpperCase() === "CANCELED" ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSingleOrderProduct(order.product);
                                                                setIsSingleOrderFormOpen(true);
                                                                setIsProfileOpen(false);
                                                            }}
                                                            className="min-h-[40px] px-3 rounded-xl bg-white text-black text-xs font-semibold"
                                                        >
                                                            Order again
                                                        </button>
                                                    ) : (
                                                        <>
                                                            <button
                                                                type="button"
                                                                className="min-h-[40px] px-3 rounded-xl bg-gradient-to-r from-[var(--ps-primary)] to-[var(--ps-purple-dark)] text-white text-xs font-semibold"
                                                                onClick={() => {
                                                                    if (order.order_status === "DELIVERED") {
                                                                        setSingleOrderProduct(order.product);
                                                                        setIsSingleOrderFormOpen(true);
                                                                        setIsProfileOpen(false);
                                                                    } else {
                                                                        navigate(`/summary/${order.id}`, { state: { fromTab: 4 } });
                                                                    }
                                                                }}
                                                            >
                                                                {order.order_status === "DELIVERED" ? "Buy again" : "Track"}
                                                            </button>
                                                            {["PENDING", "RECEIVED", "PACKED"].includes(
                                                                order.order_status.toUpperCase()
                                                            ) && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setDeleteOrderId(order.id);
                                                                        setIsOpen(true);
                                                                    }}
                                                                    className="min-h-[40px] px-3 rounded-xl border border-red-500/30 text-red-400 text-xs font-semibold"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            )}
                                                            {order.order_status.toUpperCase() === "DELIVERED" && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleReturnOrder(order.id)}
                                                                    className="min-h-[40px] px-3 rounded-xl border border-[var(--ps-brd)] text-[var(--ps-muted)] text-xs font-semibold"
                                                                >
                                                                    Return
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </article>
                        );
                    })}

                    {visibleOrderIds.length === 0 && (
                        <div className="rounded-2xl border border-[var(--ps-brd)] bg-[var(--ps-card)] px-6 py-14 text-center">
                            <ShoppingBagIcon className="w-10 h-10 mx-auto text-[var(--ps-dim)] mb-3" />
                            <h3 className="text-lg font-semibold text-white mb-1">No orders yet</h3>
                            <p className="text-sm text-[var(--ps-muted)] mb-5">
                                When you place an order, it will show up here.
                            </p>
                            <button
                                type="button"
                                onClick={() => navigate("/shoppingMall")}
                                className="min-h-[44px] px-5 rounded-[14px] bg-gradient-to-r from-[var(--ps-primary)] to-[var(--ps-purple-dark)] text-white text-sm font-semibold"
                            >
                                Browse shopping mall
                            </button>
                        </div>
                    )}
                </div>
            )}

            <AnimatePresence>
                {isOpen && (
                    <CancelDialog
                        isOpen={isOpen}
                        orderId={deleteOrderId}
                        setIsOpen={setIsOpen}
                        GetOrders={GetOrders}
                        onOptimisticCancel={handleOptimisticCancel}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
