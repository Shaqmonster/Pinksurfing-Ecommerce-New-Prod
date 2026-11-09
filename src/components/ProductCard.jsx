import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import {
  FaHeart,
  FaBed,
  FaBath,
  FaRulerCombined,
  FaChartLine,
  FaMoneyBillWave,
  FaClock,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { formatListingLocation } from "../pages/categoryProducts/locationFilterUtils";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { authContext } from "../context/authContext";
import { dataContext } from "../context/dataContext";
import { useAccessToken } from "../hooks/useAccessToken";
import { IoCart, IoMailOutline, IoStarOutline } from "react-icons/io5";
import Stars from "./Stars";
import { formatMoney } from "../utils/formatMoney";
import { isOutOfStock } from "../utils/cartStock";
import { formatDistanceToNow } from "date-fns";
import MediaImage from "./ui/MediaImage";

const EMPTY_SPEC = "—";

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
    navigate("/signin", {
      state: { from: window.location.pathname + window.location.search },
    });
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
        `${import.meta.env.VITE_SERVER_URL}/api/customer/cart/add/${product.id}/`,
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
        `${import.meta.env.VITE_SERVER_URL}/api/customer/wishlist/add/${productId}`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )
      .then(() => {
        GetWishlist();
        toast.success("Added to wishlist", {
          position: "top-right",
        });
      })
      .catch((error) => {
        console.error(error);
        toast.error(
          error.response?.data?.message ||
            error.response?.data?.Status ||
            error.response?.data?.detail ||
            "An error occurred",
          {
            position: "top-right",
          }
        );
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
        data?.message ||
          data?.Status ||
          data?.Err ||
          data?.detail ||
          "Unable to remove from wishlist",
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
    } catch {
      toast.error("An error occurred", {
        position: "top-right",
      });
    }
  };

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
          setAverageRating(totalRating / ratingsReviews.length);
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
  const isBusiness =
    categorySlug === "business-for-sale" || categorySlug === "business4sale";
  const isListing = isResidential || isCommercial || isBusiness;
  const productOutOfStock = isOutOfStock(product);

  const getAttr = (...aliases) => {
    const attrs = product.attributes || product.product_attributes || [];
    for (const name of aliases) {
      if (!name) continue;
      const norm = String(name).toLowerCase().replace(/_/g, " ");
      const attr = attrs.find(
        (a) => (a?.name || "").toLowerCase().replace(/_/g, " ") === norm
      );
      if (attr?.value !== undefined && attr?.value !== null && attr?.value !== "") {
        return attr.value;
      }
    }
    return "";
  };

  const formatSpec = (value) => {
    if (value === undefined || value === null || value === "") return EMPTY_SPEC;
    const str = String(value).trim();
    if (!str || str === "--" || str === "-" || str.toLowerCase() === "n/a") {
      return EMPTY_SPEC;
    }
    return str;
  };

  const daysOnMarket = product.created_at
    ? formatDistanceToNow(new Date(product.created_at))
    : null;

  const listingLocation = isListing ? formatListingLocation(product) : null;

  const listingTypeRaw =
    getAttr("listing_type", "Listing Type", "status", "intent", "listing intent") ||
    "";
  const isLease = /lease|rent/i.test(listingTypeRaw);
  const listingBadgeLabel = (() => {
    if (!listingTypeRaw) return isBusiness ? "For Sale" : "For Sale";
    if (/lease/i.test(listingTypeRaw)) return "For Lease";
    if (/rent/i.test(listingTypeRaw)) return "For Rent";
    if (/sale/i.test(listingTypeRaw)) return "For Sale";
    return listingTypeRaw;
  })();

  const beds = formatSpec(getAttr("bedrooms", "beds"));
  const baths = formatSpec(getAttr("bathrooms", "baths"));
  const sqftRaw = getAttr("square_feet", "sqft", "size");
  const sqft = formatSpec(sqftRaw);
  const sqftLabel = sqft === EMPTY_SPEC ? EMPTY_SPEC : `${sqft} sqft`;

  const isWishlisted = wishlistProducts.some((i) => i.id === product.id);
  const mrpNum = Number(product.mrp);
  const priceNum = Number(product.unit_price);
  const showStrike =
    !isListing &&
    Number.isFinite(mrpNum) &&
    Number.isFinite(priceNum) &&
    mrpNum > priceNum;
  const discountPct = showStrike
    ? Math.round(((mrpNum - priceNum) / mrpNum) * 100)
    : 0;

  const detailHref = `/product/productDetail/${product.slug}?productId=${product.id}`;
  const imageAspect = isListing ? "aspect-[16/10]" : "aspect-[4/3]";

  const handleAddToCartClick = (e) => {
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
  };

  return (
    <div
      className={`group mx-auto rounded-2xl relative w-full flex ${
        isCard ? "flex-col h-full" : "flex-row items-stretch"
      } overflow-hidden bg-[var(--ps-card)] border border-[var(--ps-brd)] hover:border-[color-mix(in_srgb,var(--ps-primary)_40%,transparent)] transition-colors duration-ps-normal`}
    >
      {/* Wishlist */}
      <button
        type="button"
        aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        onClick={handleWishlistClick}
        className={`absolute top-2.5 right-2.5 z-10 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full cursor-pointer transition-colors duration-ps-instant active:scale-[0.97] ${
          isWishlisted
            ? "bg-red-500/20 text-red-500"
            : "bg-black/45 text-white/80 hover:text-red-400"
        }`}
      >
        <FaHeart className="text-base" aria-hidden="true" />
      </button>

      {/* Listing badge */}
      {isListing && (
        <div className="absolute top-2.5 left-2.5 z-10 px-2.5 py-1 rounded-md bg-[var(--ps-primary)] text-white shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-[0.08em]">
            {listingBadgeLabel}
          </span>
        </div>
      )}

      {/* Discount badge */}
      {!isListing && !productOutOfStock && discountPct > 0 && (
        <div className="absolute top-2.5 left-2.5 z-10 px-2.5 py-1 rounded-full bg-[var(--ps-primary)] text-white text-[11px] font-bold">
          {discountPct}% OFF
        </div>
      )}

      {/* Out of stock badge */}
      {productOutOfStock && (
        <div className="absolute top-2.5 left-2.5 z-10 px-2.5 py-1 rounded-full bg-red-500 text-white text-[11px] font-bold">
          Out of Stock
        </div>
      )}

      {/* Media */}
      {isCard ? (
        <Link
          to={detailHref}
          className={`relative block w-full overflow-hidden bg-[var(--ps-surf)] ${imageAspect}`}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent z-[1] pointer-events-none" />
          <MediaImage
            fill
            className="transition-transform duration-ps-moderate ease-ps-standard group-hover:scale-[1.03]"
            src={product.image1 || "/emptyCart.png"}
            alt={product.name}
            loading="lazy"
          />
        </Link>
      ) : (
        <div
          className={`w-[38%] min-w-[120px] max-w-[200px] overflow-hidden relative bg-[var(--ps-surf)] ${
            isListing ? "min-h-[140px]" : "min-h-[128px]"
          }`}
        >
          <Link to={detailHref} className="absolute inset-0 block">
            <MediaImage
              fill
              className="transition-transform duration-ps-moderate ease-ps-standard group-hover:scale-[1.03]"
              src={product.image1 || "/emptyCart.png"}
              alt={product.name}
              loading="lazy"
            />
          </Link>
        </div>
      )}

      {/* Body */}
      <div
        className={`relative flex flex-col flex-1 min-w-0 ${
          isCard ? "p-3 sm:p-3.5" : "w-[62%] p-3 sm:p-4 justify-center"
        }`}
      >
        {/* Identity meta */}
        {!isListing ? (
          <div className="flex items-center gap-1.5 mb-1 min-h-[16px] text-[11px]">
            {allRatings.length > 0 ? (
              <>
                <Stars stars={averageRating} />
                <span className="leading-none text-[var(--ps-dim)]">
                  ({allRatings.length})
                </span>
              </>
            ) : (
              <span className="inline-flex items-center gap-1 leading-none text-[var(--ps-dim)]/80">
                <IoStarOutline className="text-[12px]" aria-hidden="true" />
                No reviews yet
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 mb-1.5 text-[11px] sm:text-xs font-medium text-[var(--ps-dim)]">
            <FaClock className="text-[var(--ps-primary)] shrink-0 text-[11px]" aria-hidden="true" />
            <span>
              {daysOnMarket ? `${daysOnMarket} ago` : "Recently listed"}
            </span>
          </div>
        )}

        <Link to={detailHref} className="block min-w-0">
          <h2
            className={`font-semibold text-white leading-snug group-hover:text-[var(--ps-purple-light)] transition-colors ${
              isListing
                ? "text-sm sm:text-[15px] line-clamp-2 mb-1.5"
                : "text-sm sm:text-[15px] line-clamp-2 mb-2"
            }`}
          >
            {product.name}
          </h2>
        </Link>

        {listingLocation && (
          <p className="flex items-center gap-1.5 text-[11px] sm:text-xs font-medium text-[var(--ps-dim)] mb-2">
            <FaMapMarkerAlt
              className="text-[var(--ps-primary)] shrink-0 text-[11px]"
              aria-hidden="true"
            />
            <span className="line-clamp-1">{listingLocation}</span>
          </p>
        )}

        {/* Listing specs */}
        {isListing && (
          <div className="flex items-center flex-wrap gap-x-3 gap-y-1.5 mb-3 text-[var(--ps-dim)]">
            {isResidential && (
              <>
                <div className="flex items-center gap-1.5 min-w-[2.5rem]">
                  <FaBed className="text-[var(--ps-primary)] text-[13px] shrink-0" aria-hidden="true" />
                  <span className="text-sm font-semibold text-white/90 tabular-nums">
                    {beds}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 min-w-[2.5rem]">
                  <FaBath className="text-[var(--ps-primary)] text-[13px] shrink-0" aria-hidden="true" />
                  <span className="text-sm font-semibold text-white/90 tabular-nums">
                    {baths}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FaRulerCombined
                    className="text-[var(--ps-primary)] text-[13px] shrink-0"
                    aria-hidden="true"
                  />
                  <span className="text-sm font-semibold text-white/90 tabular-nums whitespace-nowrap">
                    {sqftLabel}
                  </span>
                </div>
              </>
            )}
            {isCommercial && (
              <>
                <div className="flex items-center gap-1.5">
                  <FaRulerCombined
                    className="text-[var(--ps-primary)] text-[13px] shrink-0"
                    aria-hidden="true"
                  />
                  <span className="text-sm font-semibold text-white/90 tabular-nums whitespace-nowrap">
                    {sqftLabel}
                  </span>
                </div>
                {getAttr("cap_rate") && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold bg-white/10 px-1.5 py-0.5 rounded">
                      CAP
                    </span>
                    <span className="text-sm font-semibold text-white/90">
                      {getAttr("cap_rate")}%
                    </span>
                  </div>
                )}
                {getAttr("class_rating") && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold bg-white/10 px-1.5 py-0.5 rounded">
                      CLASS
                    </span>
                    <span className="text-sm font-semibold text-white/90">
                      {getAttr("class_rating")}
                    </span>
                  </div>
                )}
              </>
            )}
            {isBusiness && (
              <>
                <div className="flex items-center gap-1.5 min-w-0">
                  <FaChartLine
                    className="text-[var(--ps-primary)] text-[13px] shrink-0"
                    aria-hidden="true"
                  />
                  <span className="text-[10px] font-bold uppercase text-[var(--ps-dim)]">
                    Rev
                  </span>
                  <span className="text-sm font-semibold text-white/90 whitespace-nowrap">
                    {getAttr("revenue")
                      ? `$${formatMoney(getAttr("revenue"))}`
                      : EMPTY_SPEC}
                  </span>
                </div>
                {getAttr("ebitda") && (
                  <div className="flex items-center gap-1.5">
                    <FaMoneyBillWave
                      className="text-[var(--ps-primary)] text-[13px] shrink-0"
                      aria-hidden="true"
                    />
                    <span className="text-[10px] font-bold uppercase text-[var(--ps-dim)]">
                      EBITDA
                    </span>
                    <span className="text-sm font-semibold text-white/90 whitespace-nowrap">
                      ${formatMoney(getAttr("ebitda"))}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Price + CTA */}
        <div className="flex items-center justify-between gap-3 mt-auto pt-0.5">
          <div className="min-w-0 flex items-baseline gap-2 flex-wrap">
            <p className="text-base sm:text-lg font-semibold text-white tabular-nums leading-none">
              <span>
                {currency}
                {formatMoney(product.unit_price)}
              </span>
              {isListing && isLease && (
                <span className="ml-0.5 text-xs font-medium text-[var(--ps-dim)]">
                  /mo
                </span>
              )}
            </p>
            {showStrike && (
              <p className="text-xs text-[var(--ps-dim)] line-through tabular-nums leading-none">
                {currency}
                {formatMoney(product.mrp)}
              </p>
            )}
          </div>

          {isListing ? (
            <Link
              to={detailHref}
              className="inline-flex items-center justify-center gap-1.5 shrink-0 min-h-[44px] px-3.5 rounded-xl bg-[var(--ps-primary)] text-white text-sm font-semibold hover:brightness-110 active:scale-[0.97] transition-[transform,filter] duration-ps-instant"
            >
              <IoMailOutline className="text-[15px]" aria-hidden="true" />
              <span>View listing</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleAddToCartClick}
              disabled={productOutOfStock || isInCart}
              aria-label={
                productOutOfStock
                  ? "Out of stock"
                  : isInCart
                    ? "Already in cart"
                    : "Add to cart"
              }
              className={`inline-flex items-center justify-center gap-1.5 shrink-0 min-h-[44px] min-w-[44px] px-3 rounded-xl text-white text-sm font-semibold transition-[transform,filter,background-color] duration-ps-instant active:scale-[0.97] ${
                productOutOfStock
                  ? "bg-[var(--ps-dim)] cursor-not-allowed"
                  : isInCart
                    ? "bg-[var(--ps-green)] cursor-default"
                    : "bg-[var(--ps-primary)] hover:brightness-110"
              }`}
            >
              <IoCart className="text-lg" aria-hidden="true" />
              <span className="hidden sm:inline">
                {productOutOfStock ? "Unavailable" : isInCart ? "In cart" : "Add"}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
