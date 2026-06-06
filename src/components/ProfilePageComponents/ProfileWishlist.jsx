import { Fragment, useContext } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import axios from "axios";
import { toast } from "react-toastify";
import { authContext } from "../../context/authContext";
import { dataContext } from "../../context/dataContext";
import { FaHeart, FaHeartBroken } from "react-icons/fa";
import { formatMoney } from "../../utils/formatMoney";
import { useAccessToken } from "../../hooks/useAccessToken";

export default function ProfileWishlist() {
  const accessToken = useAccessToken();
    const { isWishlistOpen, isDarkMode, setIsWishlistOpen } =
        useContext(authContext);
    const { setCartProducts } = useContext(dataContext);
    const { wishlistProducts, setWishlistProducts } = useContext(dataContext);
    const { currency } = useContext(authContext);
    const navigate = useNavigate();
    const [cookies, removeCookie] = useCookies([]);
    const [subTotal, setSubTotal] = useState(0);
    const GetWishlist = async () => {
        if (!accessToken) {
            navigate("/signin");
        }
        axios
            .get(`${import.meta.env.VITE_SERVER_URL}/api/customer/wishlist/view/`, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
            })
            .then((response) => {
                // console.log(response.data.items);
                setWishlistProducts(response.data.items);
                // console.log(wishlistProducts);
            })
            .catch((error) => {
                console.error(error);
            });
    };

    // const additionalPrice = 2;
    // fetch cart products --------------------------------------------------------
    const GetCartProducts = async () => {
        if (!accessToken) {
            navigate("/signin");
        }
        axios
            .get(`${import.meta.env.VITE_SERVER_URL}/api/customer/cart/view/`, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
            })
            .then((response) => {
                setCartProducts(response.data);
                // console.log(subTotal);
            })
            .catch((error) => {
                console.error(error);
            });
    };
    useEffect(() => {
        GetWishlist();
    }, [cookies, navigate, removeCookie]);
    const AddtoCart = (productId) => {
        // console.log(accessToken);
        axios
            .post(
                `${import.meta.env.VITE_SERVER_URL
                }/api/customer/cart/add/${productId}/`,
                {},
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            )
            .then((response) => {
                // console.log(response.data);
                toast.success("Added to Cart", {
                    position: "top-right",
                });
                GetCartProducts();
            })
            .catch((error) => {
                console.error(error);
                // Handle the error here
                toast.error(error.response.data.message || error.response.data.Status || error.response.data.detail || "An error occurred", {
                    position: "top-right",
                });
            });
    };
    //   remove product--------------------------------------------------------
    const RemoveWishlistProduct = (productId) => {
        // console.log(productId);
        // console.log(accessToken);
        axios
            .post(
                `${import.meta.env.VITE_SERVER_URL
                }/api/customer/wishlist/remove/${productId}`,
                {},
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            )
            .then((response) => {
                // console.log(response.data);
                // setWishlistProducts(response.data);
                // console.log(products);
                GetWishlist();
            })
            .catch((error) => {
                console.error(error);
                // Handle the error here
                toast.error(error.response.data.message ||
                    error.response.data.Status ||
                    error.response.data.Err ||
                    error.response.data.detail ||
                    "An error occurred", {
                    position: "top-right",
                    autoClose: 3000
                });
            });
    };

    function htmlToText(html) {
        let doc = new DOMParser().parseFromString(html, "text/html");
        return doc.body.textContent || "";
    }

    return (
        <div className="font-sen min-h-screen">
            <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-8 lg:p-14 shadow-2xl">
                <div className="flex items-end justify-between mb-12 border-b border-white/5 pb-8">
                    <div className="space-y-1">
                        <p className="text-purple-400 text-[10px] font-black uppercase tracking-[0.3em]">Curation</p>
                        <h2 className="text-4xl font-black text-white tracking-tighter uppercase">
                            My Wishlist
                        </h2>
                    </div>
                    <span className="text-xs font-black text-white/30 uppercase tracking-widest bg-white/5 px-4 py-2 rounded-xl">
                        {wishlistProducts?.length || 0} {wishlistProducts?.length === 1 ? 'Item' : 'Items'}
                    </span>
                </div>

                <div className="flow-root">
                    <ul role="list" className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {wishlistProducts?.map((product) => (
                            <li key={product.id} className="relative group">
                                <div className="bg-white/[0.03] border border-white/5 rounded-[2rem] p-6 hover:bg-white/[0.06] hover:border-purple-500/30 transition-all duration-500 shadow-xl overflow-hidden">
                                    <div className="flex gap-6">
                                        <div className="h-28 w-28 sm:h-36 sm:w-36 flex-shrink-0 overflow-hidden rounded-2xl border border-white/5 shadow-2xl relative">
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                            <img
                                                className="h-full w-full object-cover object-center group-hover:scale-110 transition-transform duration-700"
                                                src={`${product.image1}`}
                                                alt={product.name}
                                            />
                                        </div>
                                        
                                        <div className="flex-1 flex flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between items-start">
                                                    <Link
                                                        to={`/product/productDetail/${product.slug}?productId=${product.id}`}
                                                        onClick={() => setIsWishlistOpen(false)}
                                                        className="block"
                                                    >
                                                        <h3 className="text-lg font-black text-white tracking-tighter uppercase hover:text-purple-400 transition-colors">
                                                            {product.name}
                                                        </h3>
                                                    </Link>
                                                    <button
                                                        onClick={() => RemoveWishlistProduct(product.id)}
                                                        className="text-white/20 hover:text-red-500 transition-colors p-1"
                                                    >
                                                        <XMarkIcon className="w-5 h-5" />
                                                    </button>
                                                </div>
                                                <p className="mt-2 text-sm text-white/30 line-clamp-2 leading-relaxed">
                                                    {htmlToText(product.short_description)}
                                                </p>
                                            </div>

                                            <div className="mt-4 flex items-center justify-between">
                                                <p className="text-xl font-black text-purple-400 tracking-tighter">
                                                    {currency}{formatMoney(product.unit_price)}
                                                </p>
                                                <button
                                                    disabled={product.quantity === 0}
                                                    onClick={() => AddtoCart(product.id)}
                                                    className="px-6 py-2.5 bg-white text-black font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-purple-50 transition-all active:scale-95 disabled:opacity-20"
                                                >
                                                    Add to Cart
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {wishlistProducts?.length === 0 && (
                    <div className="py-32 flex flex-col items-center justify-center space-y-10">
                        <div className="relative">
                            <div className="absolute inset-0 bg-red-500/10 blur-[100px] rounded-full"></div>
                            <FaHeartBroken className="relative text-white/10 text-8xl transition-transform duration-700 group-hover:scale-110" />
                        </div>
                        <div className="text-center space-y-3">
                            <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Your wishlist is empty</h3>
                            <p className="text-white/30 text-sm font-medium max-w-xs mx-auto">
                                Save the premium products you love here for future consideration.
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                navigate("/shoppingMall/all");
                                setIsWishlistOpen(false);
                            }}
                            className="px-12 py-5 bg-white text-black font-black rounded-2xl shadow-2xl hover:bg-gray-100 transition-all duration-300 uppercase tracking-widest text-xs active:scale-95"
                        >
                            Explore Marketplace
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}