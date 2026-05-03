import { Fragment, useContext } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import axios from "axios";
import { toast } from "react-toastify";
import { authContext } from "../../context/authContext";
import { dataContext } from "../../context/dataContext";
import { IoRemoveCircle } from "react-icons/io5";
import { formatMoney } from "../../utils/formatMoney";

export default function ProfileCartPage() {
    const { isCartOpen, setIsCartOpen, currency, isDarkMode } =
        useContext(authContext);
    const { setCartProducts, cartProducts } = useContext(dataContext);
    const navigate = useNavigate();
    const [cookies, removeCookie] = useCookies([]);
    // fetch cart products --------------------------------------------------------
    const GetCartProducts = async () => {
        if (!cookies.access_token) {
            return navigate("/signin");
        }
        axios
            .get(`${import.meta.env.VITE_SERVER_URL}/api/customer/cart/view/`, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${cookies.access_token}`,
                },
            })
            .then((response) => {
                console.log(response.data);
                setCartProducts(response.data);
                // console.log(subTotal);
            })
            .catch((error) => {
                console.error(error);
                toast.error("Unable to load cart", {
                    position: "top-center",
                    autoClose: 3000,
                });
            });
    };
    useEffect(() => {
        GetCartProducts();
    }, [cookies, navigate, removeCookie]);

    //   remove product--------------------------------------------------------
    const RemoveCartProduct = (productId) => {
        // console.log(productId);
        // console.log(cookies.access_token);
        axios
            .post(
                `${import.meta.env.VITE_SERVER_URL
                }/api/customer/cart/remove/${productId}/`,
                {},
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${cookies.access_token}`,
                    },
                }
            )
            .then((response) => {
                // console.log(response.data);
                GetCartProducts();
            })
            .catch((error) => {
                // console.error(error);
                toast.error(error.response.data.detail || "An error occurred while removing product from cart", {
                    position: "top-center",
                    autoClose: 3000,
                });
            });
    };
    //   increment product--------------------------------------------------------
    const IncrementQty = (productId) => {
        axios
            .post(
                `${import.meta.env.VITE_SERVER_URL
                }/api/customer/cart/increase-quantity/${productId}/`,
                {},
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${cookies.access_token}`,
                    },
                }
            )
            .then((response) => {
                GetCartProducts();
                console.log(response);
            })
            .catch((error) => {
                console.error(error);
                toast.error(error.response.data.message || error.response.data.Status || "An error occurred", {
                    position: "top-center",
                    autoClose: 3000,
                });
            });
    };
    //   decrement product--------------------------------------------------------
    const DecrementQty = (productId) => {
        axios
            .post(
                `${import.meta.env.VITE_SERVER_URL
                }/api/customer/cart/decrease-quantity/${productId}/`,
                {},
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${cookies.access_token}`,
                    },
                }
            )
            .then((response) => {
                // console.log(response);
                GetCartProducts();
            })
            .catch((error) => {
                console.error(error);
                toast.error(error.response.data.message || error.response.data.Status || "An error occurred", {
                    position: "top-center",
                    autoClose: 3000,
                });
            });
    };
    const subTotal = cartProducts?.reduce((acc, product) => {
        const priceToAdd =
            product.additional_price > 0
                ? Number(product.product.unit_price) + Number(product.additional_price)
                : product.product.unit_price;

        return acc + priceToAdd * product.quantity;
    }, 0);

    function htmlToText(html) {
        let doc = new DOMParser().parseFromString(html, "text/html");
        return doc.body.textContent || "";
    }

    return (
        <div className="font-sen">
            <div className="overflow-hidden">
                <div className="bg-[#0E0F13]/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 lg:p-10 shadow-2xl">
                    <div className="flex h-full flex-col">
                        <div className="flex-1">
                            <div className="flex items-end justify-between mb-8">
                                <h2 className="text-3xl font-extrabold text-white tracking-tight">
                                    Shopping Cart
                                </h2>
                                <span className="text-sm font-medium text-gray-500">
                                    {cartProducts.length} {cartProducts.length === 1 ? 'Item' : 'Items'}
                                </span>
                            </div>

                            <div className="mt-4">
                                <div className="flow-root">
                                    <ul role="list" className="divide-y divide-white/5">
                                        {cartProducts.map((product, index) => (
                                            <li key={product.product.id + index} className="flex py-8 group transition-all duration-300">
                                                <div className="h-24 w-24 sm:h-32 sm:w-32 flex-shrink-0 overflow-hidden rounded-2xl border border-white/5 group-hover:border-purple-500/30 transition-colors">
                                                    <img
                                                        src={`${product.product.image1}`}
                                                        alt={product.product.imageAlt}
                                                        className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                                                    />
                                                </div>

                                                <div className="ml-6 flex flex-1 flex-col">
                                                    <div>
                                                        <div className="flex justify-between text-lg font-bold text-white tracking-tight">
                                                            <h3>
                                                                <a href={product.product.href} className="hover:text-purple-400 transition-colors">
                                                                    {product.product.name}
                                                                </a>
                                                            </h3>
                                                            <p className="ml-4 text-purple-400">
                                                                {currency}{" "}
                                                                {formatMoney(
                                                                    product.additional_price > 0
                                                                        ? Number(product.product.unit_price) + Number(product.additional_price)
                                                                        : Number(product.product.unit_price)
                                                                )}
                                                            </p>
                                                        </div>
                                                        <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                                                            {htmlToText(product.product.short_description)}
                                                        </p>
                                                    </div>
                                                    
                                                    <div className="flex flex-1 items-end justify-between text-sm mt-4">
                                                        <div className="flex items-center gap-4 bg-white/5 px-3 py-2 rounded-xl border border-white/5">
                                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Qty</span>
                                                            <div className="flex items-center gap-3">
                                                                <button
                                                                    onClick={() => {
                                                                        if (product.quantity === 1) return RemoveCartProduct(product.product.id);
                                                                        DecrementQty(product.product.id);
                                                                    }}
                                                                    type="button"
                                                                    className="w-6 h-6 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
                                                                >
                                                                    -
                                                                </button>
                                                                <span className="text-sm font-bold text-white min-w-[20px] text-center">
                                                                    {product.quantity}
                                                                </span>
                                                                <button
                                                                    disabled={product.quantity === product.product.quantity}
                                                                    onClick={() => IncrementQty(product.product.id)}
                                                                    type="button"
                                                                    className="w-6 h-6 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors disabled:opacity-30"
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <button
                                                            onClick={() => RemoveCartProduct(product.product.id)}
                                                            className="text-xs font-bold text-red-400/70 hover:text-red-400 uppercase tracking-widest transition-colors"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {cartProducts.length === 0 && (
                            <div className="py-20 flex flex-col items-center justify-center space-y-6">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-purple-500/20 blur-3xl rounded-full"></div>
                                    <img
                                        className="relative w-48 sm:w-64 object-contain opacity-80"
                                        src="/cartEmpty.svg"
                                        alt="Empty Cart"
                                    />
                                </div>
                                <div className="text-center space-y-2">
                                    <h3 className="text-2xl font-bold text-white">Your cart is empty</h3>
                                    <p className="text-gray-500 max-w-xs mx-auto">
                                        Looks like you haven't added anything to your cart yet.
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        navigate("/shoppingMall/all");
                                        setIsCartOpen(false);
                                    }}
                                    className="px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-500 text-white font-bold rounded-2xl shadow-xl shadow-purple-500/20 hover:scale-105 transition-all duration-300 uppercase tracking-widest text-xs"
                                >
                                    Start Shopping
                                </button>
                            </div>
                        )}

                        {cartProducts.length > 0 && (
                            <div className="mt-10 pt-10 border-t border-white/5">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                    <div className="space-y-1">
                                        <div className="flex items-baseline gap-4">
                                            <p className="text-gray-500 font-medium">Subtotal</p>
                                            <p className="text-3xl font-extrabold text-white">
                                                {currency}{formatMoney(subTotal)}
                                            </p>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            Shipping and taxes calculated at checkout.
                                        </p>
                                    </div>
                                    <Link to="/checkout" className="w-full sm:w-auto">
                                        <button
                                            onClick={() => setIsCartOpen(false)}
                                            className="w-full sm:px-12 py-5 bg-gradient-to-r from-purple-600 to-purple-500 text-white font-black rounded-2xl shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-[1.02] transition-all duration-300 uppercase tracking-widest text-sm"
                                        >
                                            Checkout
                                        </button>
                                    </Link>
                                </div>
                                <div className="mt-8 text-center">
                                    <button
                                        onClick={() => navigate("/shoppingMall/all")}
                                        className="text-xs font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-widest"
                                    >
                                        or Continue Shopping &rarr;
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}