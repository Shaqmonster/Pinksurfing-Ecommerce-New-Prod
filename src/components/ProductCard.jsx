import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { FaHeart, FaStar, FaBed, FaBath, FaRulerCombined, FaChartLine, FaMoneyBillWave, FaClock } from "react-icons/fa";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useCookies } from "react-cookie";
import { toast } from "react-toastify";
import { authContext } from "../context/authContext";
import { dataContext } from "../context/dataContext";
import { resolveAccessToken } from "../utils/authSession";
import { IoStarOutline, IoCart, IoMailOutline } from "react-icons/io5";
import Stars from "./Stars";
import { formatMoney } from "../utils/formatMoney";
import { formatDistanceToNow } from 'date-fns';
const ProductCard = ({ product, isCard }) => {
  const [cookies] = useCookies(["access_token"]);
  const navigate = useNavigate();
  const [averageRating, setAverageRating] = useState(0);
  const [allRatings, setAllRatings] = useState([]);
  const { user, authToken, currency, setIsProfileOpen } = useContext(authContext);
  const accessToken = resolveAccessToken(authToken, cookies.access_token);
  const {
    setCartProducts,
    setWishlistProducts,
    cartProducts,
    wishlistProducts,
  } = useContext(dataContext);

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
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const AddtoCart = () => {
    if (!accessToken) {
      toast.error("Please sign in to add to cart", { position: "top-right" });
      setIsProfileOpen(true);
      return;
    }
    axios
      .post(
        `${import.meta.env.VITE_SERVER_URL}/api/customer/cart/add/${product.id
        }/`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )
      .then((response) => {
        toast.success("Added to Cart", {
          position: "top-right",
        });
        GetCartProducts();
      })
      .catch((error) => {
        console.error(error);
        toast.error(
          error.response?.data?.message ||
            error.response?.data?.Status ||
            error.response?.data?.detail ||
            "Could not add to cart",
          { position: "top-right" }
        );
      });
  };

  const AddtoWishlist = (productId) => {
    axios
      .post(
        `${import.meta.env.VITE_SERVER_URL
        }/api/customer/wishlist/add/${productId}`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )
      .then((response) => {
        GetWishlist();
        toast.success("Added to wishlist", {
          position: "top-right",
        });
      })
      .catch((error) => {
        console.error(error);
        toast.error(error.response.data.message || error.response.data.Status || error.response.data.detail || "An error occurred", {
          position: "top-right",
        });
      });
  };

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
        setWishlistProducts(response.data.items);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const RemoveWishlistProduct = async (productId) => {
    const heartElement = document.getElementById(`heart-${productId}`);
    heartElement.classList.remove("text-red-500");
    heartElement.classList.add("text-gray-400");

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/customer/wishlist/remove/${productId}`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      GetWishlist();
      toast.success("Removed from wishlist", {
        position: "top-right",
      });
    } catch (error) {
      console.error(error);
      heartElement.classList.add("text-red-500");
      heartElement.classList.remove("text-gray-400");
      toast.error(error.response.data.message ||
        error.response.data.Status ||
        error.response.data.Err ||
        error.response.data.detail || "unable to remove product from wishlist", {
        position: "top-right",
      });
    }
  };
  const handleWishlistClick = async () => {
    if (!user) {
      toast.error("You are not Signed In", {
        position: "top-right",
      });
      setIsProfileOpen(true);
      setTimeout(() => {
        setIsProfileOpen(false);
      }, 10000);
      return;
    }

    const isInWishlist = wishlistProducts.find((i) => i.id === product.id);
    const heartElement = document.getElementById(`heart-${product.id}`);

    heartElement.classList.add("text-red-500");
    heartElement.classList.remove("text-gray-400");

    try {
      if (isInWishlist) {
        await RemoveWishlistProduct(product.id);
      } else {
        await AddtoWishlist(product.id);
      }
    } catch (error) {
      // Revert the color if there's an error
      heartElement.classList.remove("text-red-500");
      heartElement.classList.add("text-gray-400");
      toast.error("An error occurred", {
        position: "top-right",
      });
    }
  };

  // const Stars = ({ stars }) => {
  //   const ratingStars = Array.from({ length: 7 }, (elem, index) => {
  //     return (
  //       <div key={index}>
  //         {stars >= index + 1 ? (
  //           <FaStar className=" dark:text-yellow-400 text-black" />
  //         ) : (
  //           <IoStarOutline className=" text-black dark:text-yellow-400 " />
  //         )}
  //       </div>
  //     );
  //   });
  //   return <div className=" flex items-center gap-0.5">{ratingStars}</div>;
  // };


  useEffect(() => {
    const getProductRatings = async (productId) => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_SERVER_URL}/api/ratings/get-ratings/${productId}/`,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const ratingsReviews = response.data.ratings_reviews;
        setAllRatings(ratingsReviews);
        if (ratingsReviews.length > 0) {
          const totalRating = ratingsReviews.reduce(
            (sum, review) => sum + review.rating,
            0
          );
          const avgRating = totalRating / ratingsReviews.length;
          setAverageRating(avgRating);
        } else {
          setAverageRating(0);
        }
      } catch (error) {
        console.error("Error fetching ratings:", error);
      }
    };
    getProductRatings(product.id);
  }, [product.id]);

  const { slug: categorySlug } = useParams();

  const isResidential = categorySlug === "residential-realestate";
  const isCommercial = categorySlug === "commercial-realestate";
  const isBusiness = categorySlug === "business-for-sale" || categorySlug === "business4sale";
  const isListing = isResidential || isCommercial || isBusiness;

  const getAttr = (name) => {
    const attr = (product.attributes || product.product_attributes || [])?.find(
      (a) => a.name?.toLowerCase() === name.toLowerCase()
    );
    return attr?.value;
  };

  const daysOnMarket = product.created_at
    ? formatDistanceToNow(new Date(product.created_at))
    : null;


  return (
    <div
      className={`group mx-auto mt-4 rounded-2xl relative w-full lg:w-[100%] flex ${
        isCard ? "flex-col" : "flex-row items-center"
      } overflow-hidden bg-white/80 dark:bg-white/5 backdrop-blur-md border border-gray-200/50 dark:border-white/10 shadow-lg hover:shadow-xl hover:shadow-purple-500/10 dark:hover:shadow-purple-500/20 transition-all duration-300 hover:-translate-y-1`}
    >
      {/* Wishlist Icon */}
      <div
        id={`heart-${product.id}`}
        onClick={handleWishlistClick}
        className={`absolute top-3 right-3 z-10 p-2 rounded-full backdrop-blur-md cursor-pointer transition-all duration-200 hover:scale-110 ${
          wishlistProducts.find((i) => i.id === product.id)
            ? "bg-red-500/20 text-red-500"
            : "bg-white/50 dark:bg-black/30 text-gray-400 hover:text-red-500 hover:bg-red-500/20"
        }`}
      >
        <FaHeart className="text-lg" />
      </div>

      {/* Status Badge (For Sale/Rent) */}
      {isListing && (
        <div className="absolute top-3 left-3 z-10 px-3 py-1 rounded-lg bg-white/90 dark:bg-black/80 backdrop-blur-md shadow-sm border border-gray-100 dark:border-white/10">
          <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400">
            {getAttr("status") || "For Sale"}
          </span>
        </div>
      )}

      {/* Discount Badge (Generic products only) */}
      {!isListing && product.mrp && product.unit_price && product.mrp !== product.unit_price && Math.round(((product.mrp - product.unit_price) / product.mrp) * 100) > 0 && (
        <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white text-xs font-bold shadow-lg">
          {Math.round(((product.mrp - product.unit_price) / product.mrp) * 100)}% OFF
        </div>
      )}

      {/* Product Image */}
      {isCard ? (
        <Link to={`/product/productDetail/${product.slug}?productId=${product.id}`} className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300 z-[1]" />
          <img
            className={`w-full ${isListing ? "min-h-[260px] max-h-[260px]" : "min-h-[200px] max-h-[200px]"} object-cover cursor-pointer transition-transform duration-700 group-hover:scale-110`}
            src={product.image1 || "/emptyCart.png"}
            alt={product.name}
            loading="lazy"
          />
        </Link>
      ) : (
        <div className="w-[40%] overflow-hidden relative">
          <Link to={`/product/productDetail/${product.slug}?productId=${product.id}`}>
            <img
              className="h-64 w-full object-cover transition-transform duration-700 group-hover:scale-110"
              src={product.image1 || "/emptyCart.png"}
              alt={product.name}
              loading="lazy"
            />
          </Link>
        </div>
      )}

      {/* Product Details */}
      <div className={`relative p-5 ${isCard ? "" : "w-[60%] flex flex-col justify-center"}`}>
        {/* Top Info Row (Ratings or Days on Market) */}
        <div className="flex items-center justify-between mb-3">
          {!isListing ? (
            <div className="flex items-center gap-2">
              <Stars stars={averageRating} />
              <span className="text-xs text-gray-400">({allRatings.length})</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
              <FaClock className="text-purple-500" />
              <span>{daysOnMarket ? `${daysOnMarket} ago` : 'Recently listed'}</span>
            </div>
          )}
        </div>

        <Link to={`/product/productDetail/${product.slug}?productId=${product.id}`}>
          <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white line-clamp-1 leading-tight mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
            {product.name}
          </h2>
        </Link>

        {/* Specs Row (for Listings) */}
        {isListing && (
          <div className="flex items-center gap-4 mb-4 text-gray-600 dark:text-gray-400 overflow-hidden">
            {isResidential && (
              <>
                <div className="flex items-center gap-1.5">
                  <FaBed className="text-purple-500 text-sm" />
                  <span className="text-sm font-bold">{getAttr("bedrooms") || "0"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FaBath className="text-purple-500 text-sm" />
                  <span className="text-sm font-bold">{getAttr("bathrooms") || "0"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FaRulerCombined className="text-purple-500 text-sm" />
                  <span className="text-sm font-bold whitespace-nowrap">{getAttr("square_feet") || "--"} sqft</span>
                </div>
              </>
            )}
            {isCommercial && (
              <>
                <div className="flex items-center gap-1.5">
                  <FaRulerCombined className="text-purple-500 text-sm" />
                  <span className="text-sm font-bold whitespace-nowrap">{getAttr("square_feet") || "--"} sqft</span>
                </div>
                {getAttr("cap_rate") && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded">CAP</span>
                    <span className="text-sm font-bold">{getAttr("cap_rate")}%</span>
                  </div>
                )}
                {getAttr("class_rating") && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded">CLASS</span>
                    <span className="text-sm font-bold">{getAttr("class_rating")}</span>
                  </div>
                )}
              </>
            )}
            {isBusiness && (
              <>
                <div className="flex items-center gap-1.5">
                  <FaChartLine className="text-purple-500 text-sm" />
                  <span className="text-xs font-bold uppercase text-gray-400">Rev:</span>
                  <span className="text-sm font-bold whitespace-nowrap">{getAttr("revenue") ? `$${formatMoney(getAttr("revenue"))}` : "--"}</span>
                </div>
                {getAttr("ebitda") && (
                  <div className="flex items-center gap-1.5">
                    <FaMoneyBillWave className="text-purple-500 text-sm" />
                    <span className="text-xs font-bold uppercase text-gray-400">EBITDA:</span>
                    <span className="text-sm font-bold whitespace-nowrap">${formatMoney(getAttr("ebitda"))}</span>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Pricing & Call to Action */}
        <div className="flex items-center justify-between gap-4 mt-auto">
          <div className="flex flex-col">
            <p className="text-xl font-black bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
              {currency}
              {formatMoney(product.unit_price)}
            </p>
            {!isListing && product.mrp !== product.unit_price && (
              <p className="text-xs text-gray-400 line-through">
                {currency}
                {formatMoney(product.mrp)}
              </p>
            )}
          </div>

          {/* Action Button */}
          {isListing ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                toast.info("Connecting you with the agent...");
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white text-xs font-bold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105 active:scale-95 transition-all duration-300"
            >
              <IoMailOutline className="text-base" />
              <span>{isBusiness || isCommercial ? "Contact Broker" : "Contact Agent"}</span>
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.preventDefault();
                if (!user) {
                  toast.error("Please sign in to add to cart");
                  return;
                }
                AddtoCart();
              }}
              className="p-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-110 active:scale-95 transition-all duration-300"
              title="Add to Cart"
            >
              <IoCart className="text-xl" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;