import { useContext, useEffect, useState } from "react";
import {
    ArrowLeftCircleIcon,
    ArrowRightIcon,
    ShoppingBagIcon,
    TruckIcon,
    CheckCircleIcon,
    XCircleIcon,
    ArrowPathIcon
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import axios from "axios";
import { toast } from "react-toastify";
import { authContext } from "../../context/authContext";
import CancelDialog from "../CancelDialog";
import { formatMoney } from "../../utils/formatMoney";
import { resolveAccessToken } from "../../utils/authSession";
import { motion, AnimatePresence } from "framer-motion";

export default function AllOrders() {
    const { currency, authToken, setIsSingleOrderFormOpen, setSingleOrderProduct, setIsProfileOpen } =
        useContext(authContext);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [cookies] = useCookies(["access_token"]);
    const accessToken = resolveAccessToken(authToken, cookies.access_token);

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

    return (
        <div className="font-sen min-h-screen">
            <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-8 lg:p-14 shadow-2xl relative overflow-hidden">
                <div className="flex items-center justify-between mb-12 border-b border-white/5 pb-8 relative z-10">
                    <div className="flex items-center gap-6">
                        <motion.button
                            whileHover={{ scale: 1.1, x: -5 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => navigate("/")}
                            className="p-3 bg-white/5 rounded-2xl border border-white/10 text-white hover:bg-white/10 transition-all"
                        >
                            <ArrowLeftCircleIcon className="w-6 h-6" />
                        </motion.button>
                        <div className="space-y-1">
                            <p className="text-purple-400 text-[10px] font-black uppercase tracking-[0.4em]">Fulfillment</p>
                            <h2 className="text-4xl font-black text-white tracking-tighter uppercase">My Orders</h2>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl">
                        <ShoppingBagIcon className="w-5 h-5 text-purple-400" />
                        <span className="text-xs font-black text-white tracking-widest uppercase">
                            {Object.keys(groupOrdersByOrderId(orders)).filter(id => !groupOrdersByOrderId(orders)[id].some(o => o.order_status.toUpperCase() === "PENDING")).length} Global Orders
                        </span>
                    </div>
                </div>

                {!loading ? (
                    <div className="space-y-10 relative z-10">
                        {Object.keys(groupOrdersByOrderId(orders))
                            .filter(id => !groupOrdersByOrderId(orders)[id].some(o => o.order_status.toUpperCase() === "PENDING"))
                            .map((orderId) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={orderId}
                                    className="bg-white/[0.03] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl group"
                                >
                                    <div className="p-8 md:p-10 bg-white/[0.02] border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-4">
                                                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Master Order ID</span>
                                                <span className="text-sm font-black text-purple-400 uppercase tracking-tighter">#{groupOrdersByOrderId(orders)[orderId][0].order_number || orderId}</span>
                                            </div>
                                            <p className="text-white font-black text-xl tracking-tighter uppercase">
                                                Planted on {new Date(groupOrdersByOrderId(orders)[orderId][0].date_of_order).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-8">
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Total Investment</p>
                                                <p className="text-3xl font-black text-white tracking-tighter">
                                                    {currency}{formatMoney(calculateTotalPrice(groupOrdersByOrderId(orders)[orderId]))}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="divide-y divide-white/5">
                                        {groupOrdersByOrderId(orders)[orderId].map((order, index) => (
                                            <div key={index} className="p-8 md:p-10 flex flex-col lg:flex-row gap-10 hover:bg-white/[0.02] transition-all">
                                                <div className="h-40 w-40 flex-shrink-0 rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl relative group-hover:border-purple-500/30 transition-all duration-500">
                                                    <img
                                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                        src={`${order.product.image1}`}
                                                        alt={order.product.name}
                                                    />
                                                </div>

                                                <div className="flex-1 flex flex-col md:flex-row justify-between gap-8">
                                                    <div className="space-y-4">
                                                        <div>
                                                            <h3 className="text-2xl font-black text-white tracking-tighter uppercase mb-1">{order.product.name}</h3>
                                                            <div className="flex items-center gap-4">
                                                                <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Qty: {order.quantity}</span>
                                                                <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                                                                <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">{currency}{formatMoney(order.total_price)}</span>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${getStatusStyle(order.order_status)}`}>
                                                            {order.order_status === "DELIVERED" && <CheckCircleIcon className="w-3.5 h-3.5" />}
                                                            {order.order_status === "CANCELED" && <XCircleIcon className="w-3.5 h-3.5" />}
                                                            {["PENDING", "RECEIVED", "PACKED"].includes(order.order_status) && <ArrowPathIcon className="w-3.5 h-3.5 animate-spin-slow" />}
                                                            {order.order_status}
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
                                                        {order.order_status.toUpperCase() === "CANCELED" ? (
                                                            <button
                                                                onClick={() => {
                                                                    setSingleOrderProduct(order.product);
                                                                    setIsSingleOrderFormOpen(true);
                                                                    setIsProfileOpen(false);
                                                                }}
                                                                className="px-8 py-4 bg-white text-black font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-purple-50 transition-all shadow-xl active:scale-95"
                                                            >
                                                                Re-Initialize Order
                                                            </button>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    className="px-8 py-4 bg-purple-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-purple-500 transition-all shadow-xl shadow-purple-500/20 active:scale-95"
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
                                                                    {order.order_status === "DELIVERED" ? "Buy Again" : "Live Tracking"}
                                                                </button>

                                                                {["PENDING", "RECEIVED", "PACKED"].includes(order.order_status.toUpperCase()) && (
                                                                    <button
                                                                        onClick={() => {
                                                                            setDeleteOrderId(order.id);
                                                                            setIsOpen(true);
                                                                        }}
                                                                        className="px-8 py-4 bg-transparent border border-red-500/30 text-red-400 hover:bg-red-500/5 font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all"
                                                                    >
                                                                        Abort Mission
                                                                    </button>
                                                                )}

                                                                {order.order_status.toUpperCase() === "DELIVERED" && (
                                                                    <button
                                                                        onClick={() => handleReturnOrder(order.id)}
                                                                        className="px-8 py-4 bg-transparent border border-orange-500/30 text-orange-400 hover:bg-orange-500/5 font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all"
                                                                    >
                                                                        Initiate Return
                                                                    </button>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            ))}
                        
                        {orders.length === 0 && (
                            <div className="py-32 flex flex-col items-center justify-center space-y-10">
                                <div className="relative">
                                    <ShoppingBagIcon className="relative text-white/10 text-8xl" />
                                </div>
                                <div className="text-center space-y-3">
                                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter">No Active Protocols</h3>
                                    <p className="text-white/30 text-sm font-medium max-w-xs mx-auto">
                                        Your acquisition history is empty. Start building your portfolio today.
                                    </p>
                                </div>
                                <button
                                    onClick={() => navigate("/shoppingMall/all")}
                                    className="px-12 py-5 bg-white text-black font-black rounded-2xl shadow-2xl hover:bg-gray-100 transition-all duration-300 uppercase tracking-widest text-xs active:scale-95"
                                >
                                    Initialize Shopping
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="py-40 flex items-center justify-center">
                        <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
                    </div>
                )}
            </div>

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
