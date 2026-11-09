import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { FaHeart, FaStar, FaBed, FaBath, FaRulerCombined, FaChartLine, FaMoneyBillWave, FaClock, FaMapMarkerAlt } from "react-icons/fa";
import { formatListingLocation } from "../pages/categoryProducts/locationFilterUtils";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { authContext } from "../context/authContext";
import { dataContext } from "../context/dataContext";
import { useAccessToken } from "../hooks/useAccessToken";
import { IoStarOutline, IoCart, IoMailOutline } from "react-icons/io5";
import Stars from "./Stars";
import { formatMoney } from "../utils/formatMoney";
import { isOutOfStock } from "../utils/cartStock";
import { formatDistanceToNow } from 'date-fns';
const ProductCard = ({ product, isCard }) => {
  const navigate = useNavigate();
  const [averageRating, setAverageRating] = useState(0);
  const [allRatings, setAllRatings] = useState([]);
  const { currency } = useContext(authContext);
  const {
    setCartProducts,
    setWishlistProducts,
    cartProducts,
    wishlistProducts,
  } = useContext(dataContext);
  const accessToken = useAccessToken();
  const isInCart = cartProducts.some(
    (item) => String(item.product?.id) === String(product.id)
  );

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

  const requireSignIn = (message) => {
    toast.error(message, { position: "top-right" });
    navigate("/signin", { state: { from: window.location.pathname + window.location.search } });
  };

  const AddtoCart = () => {
    if (!accessToken) {
      requireSignIn("Please sign in to add to cart");
      return;
    }
    if (productOutOfStock) {
      toast.error("This product is out of stock", { position: "top-right" });
      return;
    }
    if (isInCart) {
      toast.info("Already in your cart", { position: "top-right" });
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
        if (response.data?.already_in_cart) {
          toast.info(response.data.message || "Already in your cart", {
            position: "top-right",
          });
        } else {
          toast.success("Added to Cart", {
            position: "top-right",
          });
        }
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
    try {
      await axios.post(
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
      const data = error.response?.data;
      toast.error(
        data?.message || data?.Status || data?.Err || data?.detail || "Unable to remove from wishlist",
        { position: "top-right" }
      );
    }
  };
  const handleWishlistClick = async () => {
    if (!accessToken) {
      requireSignIn("Please sign in to save items to your wishlist");
      return;
    }

    const isInWishlist = wishlistProducts.find((i) => i.id === product.id);

    try {
      if (isInWishlist) {
        await RemoveWishlistProduct(product.id);
      } else {
        await AddtoWishlist(product.id);
      }
    } catch (error) {
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

  const { slug: routeCategorySlug } = useParams();
  const categorySlug = product?.category?.slug || routeCategorySlug || "";

  const isResidential = categorySlug === "residential-realestate";
  const isCommercial = categorySlug === "commercial-realestate";
  const isBusiness = categorySlug === "business-for-sale" || categorySlug === "business4sale";
  const isListing = isResidential || isCommercial || isBusiness;
  const productOutOfStock = isOutOfStock(product);

  const getAttr = (name) => {
    const attr = (product.attributes || product.product_attributes || [])?.find(
      (a) => a.name?.toLowerCase() === name.toLowerCase()
    );
    return attr?.value;
  };

  const daysOnMarket = product.created_at
    ? formatDistanceToNow(new Date(product.created_at))
    : null;

  const listingLocation = isListing ? formatListingLocation(product) : null;

  const isWishlisted = wishlistProducts.some((i) => i.id === product.id);
  const mrpNum = Number(product.mrp);
  const priceNum = Number(product.unit_price);
  const showStrike =
    !isListing &&
    Number.isFinite(mrpNum) &&
    Number.isFinite(priceNum) &&
    mrpNum > priceNum;

  return (
    <div
      className={`group mx-auto rounded-2xl relative w-full flex ${
        isCard ? "flex-col" : "flex-row items-center"
      } overflow-hidden bg-[var(--ps-card)] border border-[var(--ps-brd)] hover:border-[color-mix(in_srgb,var(--ps-primary)_40%,transparent)] transition-colors duration-ps-normal`}
    >
      {/* Wishlist Icon */}
      <button
        type="button"
        aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        onClick={handleWishlistClick}
        className={`absolute top-3 right-3 z-10 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full cursor-pointer transition-transform duration-ps-instant active:scale-[0.97] ${
          isWishlisted
            ? "bg-red-500/20 text-red-500"
            : "bg-black/40 text-[var(--ps-dim)] hover:text-red-400"
        }`}
      >
        <FaHeart className="text-lg" />
      </button>

      {/* Status Badge (For Sale/Rent) */}
      {isListing && (
        <div className="absolute top-3 left-3 z-10 px-3 py-1 rounded-lg bg-white/90 dark:bg-black/80 backdrop-blur-md shadow-sm border border-gray-100 dark:border-white/10">
          <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400">
            {getAttr("listing_type") || getAttr("Listing Type") || getAttr("status") || "For Sale"}
          </span>
        </div>
      )}

      {/* Discount Badge (Generic products only) */}
      {!isListing && !productOutOfStock && showStrike && Math.round(((mrpNum - priceNum) / mrpNum) * 100) > 0 && (
        <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full bg-[var(--ps-primary)] text-white text-xs font-bold shadow-lg">
          {Math.round(((mrpNum - priceNum) / mrpNum) * 100)}% OFF
        </div>
      )}

      {/* Out of Stock Badge */}
      {productOutOfStock && (
        <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full bg-red-500 text-white text-xs font-bold shadow-lg">
          Out of Stock
        </div>
      )}

      {/* Product Image — single surface, no nested card */}
      {isCard ? (
        <Link to={`/product/productDetail/${product.slug}?productId=${product.id}`} className="relative block overflow-hidden bg-[var(--ps-surf)]">
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent z-[1] pointer-events-none" />
          <img
            className={`w-full ${isListing ? "h-[200px]" : "h-[160px]"} object-cover transition-transform duration-ps-moderate ease-ps-standard group-hover:scale-[1.03]`}
            src={product.image1 || "/emptyCart.png"}
            alt={product.name}
            loading="lazy"
          />
        </Link>
      ) : (
        <div className="w-[40%] overflow-hidden relative bg-[var(--ps-surf)]">
          <Link to={`/product/productDetail/${product.slug}?productId=${product.id}`}>
            <img
              className="h-48 w-full object-cover transition-transform duration-ps-moderate ease-ps-standard group-hover:scale-[1.03]"
              src={product.image1 || "/emptyCart.png"}
              alt={product.name}
              loading="lazy"
            />
          </Link>
        </div>
      )}

      {/* Product Details */}
      <div className={`relative p-3.5 sm:p-4 ${isCard ? "" : "w-[60%] flex flex-col justify-center"}`}>
        {/* Top Info Row (Ratings or Days on Market) */}
        <div className="flex items-center justify-between mb-2">
          {!isListing ? (
            <div className="flex items-center gap-2">
              {allRatings.length > 0 ? (
                <>
                  <Stars stars={averageRating} />
                  <span className="text-xs text-[var(--ps-dim)]">({allRatings.length})</span>
                </>
              ) : (
                <span className="text-xs text-[var(--ps-dim)]">No reviews yet</span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
              <FaClock className="text-purple-500" />
              <span>{daysOnMarket ? `${daysOnMarket} ago` : 'Recently listed'}</span>
            </div>
          )}
        </div>

        <Link to={`/product/productDetail/${product.slug}?productId=${product.id}`}>
          <h2 className="text-sm sm:text-base font-semibold text-white line-clamp-2 leading-snug mb-1 group-hover:text-[var(--ps-purple-light)] transition-colors">
            {product.name}
          </h2>
        </Link>

        {listingLocation && (
          <p className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
            <FaMapMarkerAlt className="text-purple-500 shrink-0" />
            <span className="line-clamp-1">{listingLocation}</span>
          </p>
        )}

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
            <p className="text-base sm:text-lg font-semibold text-white">
              {currency}
              {formatMoney(product.unit_price)}
            </p>
            {showStrike && (
              <p className="text-xs text-[var(--ps-dim)] line-through">
                {currency}
                {formatMoney(product.mrp)}
              </p>
            )}
          </div>

          {/* Action Button */}
          {isListing ? (
            <Link
              to={`/product/productDetail/${product.slug}?productId=${product.id}`}
              className="flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-[14px] bg-gradient-to-r from-[var(--ps-primary)] to-[var(--ps-purple-dark)] text-white text-sm font-semibold shadow-lg active:scale-[0.97] transition-transform duration-ps-instant"
            >
              <IoMailOutline className="text-base" aria-hidden="true" />
              <span>View listing</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                if (!accessToken) {
                  requireSignIn("Please sign in to add to cart");
                  return;
                }
                if (productOutOfStock) {
                  toast.error("This product is out of stock", { position: "top-right" });
                  return;
                }
                if (isInCart) {
                  toast.info("Already in your cart", { position: "top-right" });
                  return;
                }
                AddtoCart();
              }}
              disabled={productOutOfStock || isInCart}
              aria-label={
                productOutOfStock
                  ? "Out of stock"
                  : isInCart
                  ? "Already in cart"
                  : "Add to cart"
              }
              className={`min-h-[44px] min-w-[44px] flex items-center justify-center p-3 rounded-[14px] text-white shadow-lg transition-transform duration-ps-instant active:scale-[0.97] ${
                productOutOfStock
                  ? "bg-[var(--ps-dim)] cursor-not-allowed"
                  : isInCart
                  ? "bg-[var(--ps-green)] cursor-default"
                  : "bg-gradient-to-r from-[var(--ps-primary)] to-[var(--ps-purple-dark)]"
              }`}
            >
              <IoCart className="text-xl" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;