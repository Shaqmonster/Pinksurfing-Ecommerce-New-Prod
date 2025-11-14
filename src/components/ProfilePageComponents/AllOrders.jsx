import { useContext, useEffect, useState } from "react";
import {
    ArrowLeftCircleIcon,
    ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import axios from "axios";
import { authContext } from "../../context/authContext";
import Header from "../Header";
import CancelDialog from "../CancelDialog";
import { useElements } from "@stripe/react-stripe-js";
import RatingForm from '../../components/RatingForm'
export default function AllOrders() {
    const { currency, setIsRatingFormOpen, isRatingFormOpen } = useContext(authContext);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [cookies, removeCookie] = useCookies([]);
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
        if (!cookies.token) {
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
                        Authorization: `Bearer ${cookies.token}`,
                    },
                }
            );
            console.log(response.data);
            const sortedOrders = response.data.sort(
                (a, b) => new Date(b.date_of_order) - new Date(a.date_of_order)
            );

            setOrders(sortedOrders);
            setLoading(false);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        GetOrders();
    }, [cookies, navigate, removeCookie]);

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

    const closeModal = () => {
        setIsOpen(false);
    };

    const openModal = () => {
        setIsOpen(true);
    };

    return (
        <>
            <div className="font-sen flex flex-col w-full h-full min-h-screen dark:bg-[#0E0F13] pb-6 px-[2%] 2xl:px-[4.5%] border border-gray-500  rounded-lg p-4">
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

                {!loading ? (
                    <>
                        <div className="flex flex-col items-start gap-2">
                            {Object.keys(groupOrdersByOrderId(orders))
                                .filter(
                                    (orderId) =>
                                        !groupOrdersByOrderId(orders)[orderId].some(
                                            (order) => order.order_status.toUpperCase() === "PENDING"
                                        )
                                )
                                .map((orderId) => (
                                    <div
                                        key={orderId}
                                        className="w-full lg:w-[80%] bg-purple-50 dark:bg-[#0E0F13] dark:border dark:border-white/30 dark:text-[#f5f5f5] mt-4 shadow-md border border-black/20 rounded-md"
                                    >
                                        <div className="flex justify-between items-center p-4 border-b dark:border-white/30">
                                            <div>
                                                <p className=" text-[12px] sm:text-[15px]">
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
                                                    {calculateTotalPrice(
                                                        groupOrdersByOrderId(orders)[orderId]
                                                    )}
                                                </p>
                                            </div>
                                        </div>
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
                                                            Price: {currency} {order.total_price}
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-col ml-4 sm:flex-grow">
                                                        <p className="text-[13.5px] sm:text-[14.5px] font-medium mb-1 text-gray-700 dark:text-[#f5f5f5]">
                                                            Quantity: {order.quantity}
                                                        </p>
                                                        <p className="text-[13.5px] sm:text-[14.5px] font-medium mb-1 text-gray-700 dark:text-[#f5f5f5]">
                                                            Status:{" "}
                                                            <span className={
                                                                order.order_status === "DELIVERED"
                                                                    ? "text-green-600"
                                                                    : order.order_status === "PENDING"
                                                                        ? "text-yellow-600"
                                                                        : order.order_status === "CANCELED"
                                                                            ? "text-red-600"
                                                                            : "black" // default color if status is unknown                            
                                                            }>
                                                                {order.order_status}
                                                            </span>
                                                        </p>
                                                    </div>
                                                    <RatingForm order={order} />
                                                    <div className="flex flex-col mt-2 sm:mt-0 ml-4">
                                                        {
                                                            order.order_status !== "CANCELED" ? (
                                                                <>
                                                                    <button
                                                                        className="bg-[#8B33FE] text-white font-medium text-sm sm:text-[16px] py-2 px-12 rounded-md mb-2 w-full max-w-[300px]"
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
                                                                                className="bg-[#39247d] text-white font-medium text-sm sm:text-[16px] py-2 px-12 rounded-md mb-2 w-full max-w-[300px]"
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
                                                                        className="bg-[#2d1e5f] text-white font-medium text-sm sm:text-[16px] py-2 px-12 rounded-md mb-2 w-full max-w-[300px]"
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
                                                                        className="bg-[#39247d] text-white font-medium text-sm sm:text-[16px] py-2 px-12 rounded-md mb-2 w-full max-w-[300px]"
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
                                <div className="w-full text-center mt-4">
                                    <p className="dark:text-[#f5f5f5]">
                                        You have not made any Orders till Now
                                    </p>
                                </div>
                            )}
                        </div>
                        {isOpen && (
                            <CancelDialog
                                isOpen={isOpen}
                                orderId={deleteOrderId}
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
