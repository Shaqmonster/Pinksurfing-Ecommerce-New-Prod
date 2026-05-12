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
        <div className="font-sen min-h-screen">
            <div className="overflow-hidden">
                <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-8 lg:p-14 shadow-2xl">
                    <div className="flex h-full flex-col">
                        <div className="flex-1">
                            <div className="flex items-end justify-between mb-12 border-b border-white/5 pb-8">
                                <div className="space-y-1">
                                    <p className="text-purple-400 text-[10px] font-black uppercase tracking-[0.3em]">Management</p>
                                    <h2 className="text-4xl font-black text-white tracking-tighter uppercase">
                                        Shopping Cart
                                    </h2>
                                </div>
                                <span className="text-xs font-black text-white/30 uppercase tracking-widest bg-white/5 px-4 py-2 rounded-xl">
                                    {cartProducts.length} {cartProducts.length === 1 ? 'Item' : 'Items'}
                                </span>
                            </div>

                            <div className="mt-4">
                                <div className="flow-root">
                                    <ul role="list" className="divide-y divide-white/5">
                                        {cartProducts.map((product, index) => (
                                            <li key={product.product.id + index} className="flex py-10 group first:pt-0">
                                                <div className="h-28 w-28 sm:h-40 sm:w-40 flex-shrink-0 overflow-hidden rounded-[2rem] border border-white/10 group-hover:border-purple-500/30 transition-all duration-500 shadow-2xl relative">
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                                                    <img
                                                        src={`${product.product.image1}`}
                                                        alt={product.product.imageAlt}
                                                        className="h-full w-full object-cover object-center group-hover:scale-110 transition-transform duration-700"
                                                    />
                                                </div>

                                                <div className="ml-8 flex flex-1 flex-col">
                                                    <div>
                                                        <div className="flex justify-between text-xl font-black text-white tracking-tighter uppercase">
                                                            <h3>
                                                                <a href={product.product.href} className="hover:text-purple-400 transition-colors">
                                                                    {product.product.name}
                                                                </a>
                                                            </h3>
                                                            <p className="ml-4 text-purple-400 font-black">
                                                                {currency}{" "}
                                                                {formatMoney(
                                                                    product.additional_price > 0
                                                                        ? Number(product.product.unit_price) + Number(product.additional_price)
                                                                        : Number(product.product.unit_price)
                                                                )}
                                                            </p>
                                                        </div>
                                                        <p className="mt-3 text-sm text-white/40 leading-relaxed max-w-xl">
                                                            {htmlToText(product.product.short_description)}
                                                        </p>
                                                    </div>
                                                    
                                                    <div className="flex flex-1 items-end justify-between text-sm mt-8">
                                                        <div className="flex items-center gap-6 bg-white/[0.03] px-5 py-3 rounded-2xl border border-white/5">
                                                            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Qty</span>
                                                            <div className="flex items-center gap-5">
                                                                <button
                                                                    onClick={() => {
                                                                        if (product.quantity === 1) return RemoveCartProduct(product.product.id);
                                                                        DecrementQty(product.product.id);
                                                                    }}
                                                                    type="button"
                                                                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all active:scale-90"
                                                                >
                                                                    -
                                                                </button>
                                                                <span className="text-base font-black text-white min-w-[20px] text-center">
                                                                    {product.quantity}
                                                                </span>
                                                                <button
                                                                    disabled={product.quantity === product.product.quantity}
                                                                    onClick={() => IncrementQty(product.product.id)}
                                                                    type="button"
                                                                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all active:scale-90 disabled:opacity-30"
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <button
                                                            onClick={() => RemoveCartProduct(product.product.id)}
                                                            className="text-[10px] font-black text-red-400/50 hover:text-red-400 uppercase tracking-[0.2em] transition-all py-2 px-4 rounded-xl hover:bg-red-500/5"
                                                        >
                                                            Remove Item
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
                            <div className="py-32 flex flex-col items-center justify-center space-y-10">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-purple-500/10 blur-[100px] rounded-full"></div>
                                    <img
                                        className="relative w-56 sm:w-72 object-contain opacity-20 grayscale brightness-200"
                                        src="/cartEmpty.svg"
                                        alt="Empty Cart"
                                    />
                                </div>
                                <div className="text-center space-y-3">
                                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Your cart is empty</h3>
                                    <p className="text-white/30 text-sm font-medium max-w-xs mx-auto">
                                        Explore our exclusive marketplace and start adding premium products.
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        navigate("/shoppingMall/all");
                                        setIsCartOpen(false);
                                    }}
                                    className="px-12 py-5 bg-white text-black font-black rounded-2xl shadow-2xl hover:bg-gray-100 transition-all duration-300 uppercase tracking-widest text-xs active:scale-95"
                                >
                                    Start Shopping
                                </button>
                            </div>
                        )}

                        {cartProducts.length > 0 && (
                            <div className="mt-16 pt-16 border-t border-white/5">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
                                    <div className="space-y-2">
                                        <div className="flex items-baseline gap-6">
                                            <p className="text-white/30 font-black uppercase tracking-[0.2em] text-[10px]">Total Value</p>
                                            <p className="text-5xl font-black text-white tracking-tighter">
                                                {currency}{formatMoney(subTotal)}
                                            </p>
                                        </div>
                                        <p className="text-xs text-white/20 font-medium">
                                            Shipping and taxes calculated at secure checkout.
                                        </p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-center gap-6">
                                        <button
                                            onClick={() => navigate("/shoppingMall/all")}
                                            className="text-[10px] font-black text-white/30 hover:text-white transition-all uppercase tracking-widest px-8 py-5 border border-white/5 rounded-2xl hover:bg-white/5"
                                        >
                                            Continue Shopping
                                        </button>
                                        <Link to="/checkout" className="w-full sm:w-auto">
                                            <button
                                                onClick={() => setIsCartOpen(false)}
                                                className="w-full sm:px-16 py-6 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-2xl shadow-2xl shadow-purple-500/20 hover:scale-[1.02] active:scale-95 transition-all duration-300 uppercase tracking-[0.2em] text-xs"
                                            >
                                                Secure Checkout
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}