import { useContext, useEffect, useState } from "react";
import {
    ArrowLeftCircleIcon,
    ShoppingBagIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { authContext } from "../../context/authContext";
import CancelDialog from "../CancelDialog";
import { formatMoney } from "../../utils/formatMoney";
import { AnimatePresence } from "framer-motion";
import { useAccessToken } from "../../hooks/useAccessToken";
import ErrorState from "../ui/ErrorState";
import ConfirmDialog from "../ui/ConfirmDialog";
import { orderStatusLabel } from "../../utils/orderStatus";
import {
    createVendorPaymentLink,
    pendingLabel,
    shopperPaymentError,
    unpaidByVendor,
} from "../../utils/orderPayment";

import { notify } from "../../lib/notify";
export default function AllOrders() {
  const accessToken = useAccessToken();
    const { currency, authToken, setIsSingleOrderFormOpen, setSingleOrderProduct, setIsProfileOpen } =
        useContext(authContext);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [deleteOrderId, setDeleteOrderId] = useState("");
    const [loadError, setLoadError] = useState(false);
    const [returnItem, setReturnItem] = useState(null);
    const [payingVendor, setPayingVendor] = useState(null);
    const [payError, setPayError] = useState("");

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
        GetOrders();
    }, [accessToken]);

    const groupOrdersByOrderId = (orders) => {
        return orders.reduce((acc, order) => {
            if (!acc[order.order]) {
                acc[order.order] = [];
            }
            acc[order.order].push(order);
            return acc;
        });
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
                notify.success("Return requested. We'll show the next steps on this order.");
            }
        } catch (error) {
            console.error(error);
            const err = new Error("return failed");
            err.userMessage =
                error.response?.data?.error ||
                (error.response
                    ? "We couldn't request this return. Please try again."
                    : "We couldn't reach PinkSurfing. Check your connection and try again.");
            throw err;
        }
    };

    const getStatusStyle = (status) => {
        switch (status?.toUpperCase()) {
            case "DELIVERED":
            case "RETURNED":
                return "text-ps-success border-[color-mix(in_srgb,var(--ps-color-success)_30%,transparent)] bg-[color-mix(in_srgb,var(--ps-color-success)_10%,transparent)]";
            case "CANCELED":
            case "ERROR":
            case "RETURN-DISPUTED":
                return "text-ps-warning border-[color-mix(in_srgb,var(--ps-color-warning)_30%,transparent)] bg-[color-mix(in_srgb,var(--ps-color-warning)_10%,transparent)]";
            default:
                return "text-ps-fg2 border-ps-border bg-ps-sunken";
        }
    };

    const grouped = groupOrdersByOrderId(orders);
    const visibleOrderIds = Object.keys(grouped);

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6 pb-16">
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl border border-[var(--ps-brd)] bg-[var(--ps-surf)] text-ink"
                    aria-label="Back"
                >
                    <ArrowLeftCircleIcon className="w-5 h-5" />
                </button>
                <div>
                    <h2 className="text-xl font-semibold text-ink">My orders</h2>
                    <p className="text-sm text-[var(--ps-muted)]">
                        {loading ? "Loading…" : `${visibleOrderIds.length} order${visibleOrderIds.length === 1 ? "" : "s"}`}
                    </p>
                </div>
            </div>

            {payError && (
                <p role="alert" className="text-sm text-ps-danger">{payError}</p>
            )}
            {loadError && !loading ? (
                <ErrorState
                    title="We couldn't load your orders"
                    description="Your orders are safe — this is a connection problem on our side or yours."
                    onRetry={GetOrders}
                    className="rounded-2xl border border-[var(--ps-brd)] bg-[var(--ps-card)]"
                />
            ) : loading ? (
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
                                        <p className="text-sm text-ink">
                                            {new Date(head.date_of_order).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <p className="text-base font-semibold text-ink">
                                        {currency}
                                        {formatMoney(calculateTotalPrice(items))}
                                    </p>
                                </div>
                                {unpaidByVendor(items).length > 0 && (
                                    <div className="px-4 py-3 border-b border-[var(--ps-brd)] bg-ps-sunken">
                                        <p className="text-sm font-medium text-ink">
                                            {pendingLabel(items.filter((o) => o.order_status === "PENDING"))}
                                        </p>
                                        <p className="text-xs text-ps-fg2 mb-2">
                                            {pendingLabel(items.filter((o) => o.order_status === "PENDING")) === "Confirming payment"
                                                ? "Square is confirming your payment. This usually takes under a minute."
                                                : "Some items in this order haven't been paid for yet."}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {unpaidByVendor(items).map((g) => (
                                                <button
                                                    key={g.vendorId}
                                                    type="button"
                                                    disabled={Boolean(payingVendor)}
                                                    onClick={() => payVendor(orderId, g.vendorId)}
                                                    className="min-h-[40px] px-3 rounded-xl bg-ps-action text-white text-xs font-semibold disabled:opacity-60"
                                                >
                                                    {payingVendor === `${orderId}:${g.vendorId}` ? "Opening…" : `Pay ${g.storeName} · ${currency}${formatMoney(g.total)}`}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
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
                                                        <h3 className="text-sm font-medium text-ink line-clamp-2">
                                                            {order.product.name}
                                                        </h3>
                                                        <p className="text-xs text-[var(--ps-muted)] mt-0.5">
                                                            Qty {order.quantity} · {currency}
                                                            {formatMoney(order.total_price)}
                                                        </p>
                                                    </div>
                                                    <span
                                                        className={`inline-flex items-center px-2 py-0.5 rounded-lg border text-[11px] font-medium ${getStatusStyle(order.order_status)}`}
                                                    >
                                                        {orderStatusLabel(order.order_status)}
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
                                                                        navigate(`/summary/${order.id}`, { state: { fromTab: 5 } });
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
                                                                    onClick={() => setReturnItem(order)}
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

                    <ConfirmDialog
                        open={Boolean(returnItem)}
                        onClose={() => setReturnItem(null)}
                        title="Request a return?"
                        confirmLabel="Request return"
                        busyLabel="Requesting…"
                        cancelLabel="Not now"
                        onConfirm={() => handleReturnOrder(returnItem.id)}
                    >
                        <p>
                            {returnItem?.product?.name || "This item"} goes back to the store. Once they receive and check it,
                            your refund is processed to your original payment method.
                        </p>
                        <p className="mt-2">You’ll see each step on this order.</p>
                    </ConfirmDialog>

                    {visibleOrderIds.length === 0 && (
                        <div className="rounded-2xl border border-[var(--ps-brd)] bg-[var(--ps-card)] px-6 py-14 text-center">
                            <ShoppingBagIcon className="w-10 h-10 mx-auto text-[var(--ps-dim)] mb-3" />
                            <h3 className="text-lg font-semibold text-ink mb-1">No orders yet</h3>
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
                        order={orders.find((o) => o.id === deleteOrderId)}
                        setIsOpen={setIsOpen}
                        GetOrders={GetOrders}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
