import React, { useContext } from "react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { useCookies } from "react-cookie";
import { toast } from "react-toastify";
import Header from "../components/Header";
import axios from "axios";
import { FaCopy, FaFacebook, FaFontAwesome, FaPinterest, FaShare, FaTwitter } from "react-icons/fa";
import OrderConfirm from "../components/OrderConfirm";
import { FaHeart, FaStar, FaTruck, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { dataContext } from "../context/dataContext";
import { authContext } from "../context/authContext";
import { IoClose, IoStarOutline, IoCart } from "react-icons/io5";
import shareImage from "/media/share.png";
import ProductDetailReviewSection from "../components/ProductPageComponents/ProductDetail-ReviewSection";
import YouMightAlsoLike from "../components/ProductPageComponents/YouMightAlsoLike";
import { Helmet } from "react-helmet";
import ImageZoom from "../components/ProductPageComponents/ZoomImage";
import parse from "html-react-parser";
import { data } from "autoprefixer";
import Stars from '../components/Stars'
import { formatMoney } from "../utils/formatMoney";
import { formatDistanceToNow } from "date-fns";
import { 
  FaBed, 
  FaBath, 
  FaRulerCombined, 
  FaChartLine, 
  FaMoneyBillWave, 
  FaClock, 
  FaBuilding, 
  FaMapMarkerAlt, 
  FaCalendarAlt,
  FaPhoneAlt,
  FaEnvelope
} from "react-icons/fa";
import { IoInformationCircleOutline } from "react-icons/io5";


const ProductDetailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [cookies, removeCookie] = useCookies([]);
  const [orderConfirm, setorderConfirm] = useState(false);
  const [product, setProduct] = useState({});
  const [allProducts, setAllProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [activeImage, setActiveImage] = useState("");
  const [updatedPrice, setUpdatedPrice] = useState(null);
  // variant attributes (is_variant: true) → selectable options that can change price
  const [variantAttributeMap, setVariantAttributeMap] = useState({});
  // spec attributes (is_variant: false) → read-only informational fields
  const [specAttributeMap, setSpecAttributeMap] = useState({});
  const [viewMainImg, setViewMainImg] = useState(false);
  const [productQty, setProductQty] = useState(1);
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("story");
  const [isStoryExpanded, setIsStoryExpanded] = useState(false);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [zoomCoordinates, setZoomCoordinates] = useState({ x: 0, y: 0 });
  const searchParams = new URLSearchParams(location.search);
  const rawProductId = searchParams.get("productId");
  const [averageRating, setAverageRating] = useState(0);
  const [currentUrl, setCurrentUrl] = useState("");

  // Remove trailing slash from productId, if any
  const productId = rawProductId ? rawProductId.replace(/\/$/, "") : rawProductId;
  const { handleError, handleSuccess } = useContext(dataContext);
  const {
    setCartProducts,
    cartProducts,
    setWishlistProducts,
    wishlistProducts,
    additionalAttribute,
    setAdditionalAttribute,
  } = useContext(dataContext);
  const {
    setIsProfileOpen,
    isProfileOpen,
    currency,
    user,
  } = useContext(authContext);

  const isOwner = user?.email === product?.vendor?.email;

  // ── CATEGORY DETECTION ──
  const categorySlug = product?.category?.slug || "";
  const isResidential = categorySlug === "residential-realestate";
  const isCommercial = categorySlug === "commercial-realestate";
  const isRealEstate = isResidential || isCommercial;
  const isBusiness = categorySlug === "business4sale" || categorySlug === "business-for-sale";
  const isSpecialized = isRealEstate || isBusiness;

  // ── ATTRIBUTE MAPPING ──
  const getAttr = (name) => {
    const lowerName = name.toLowerCase();
    // Check attributes array directly for speed and reliability
    const attr = (product?.attributes || []).find(a => a.name?.toLowerCase() === lowerName);
    return attr?.value || "";
  };

  const beds = getAttr("bedrooms") || getAttr("beds");
  const baths = getAttr("bathrooms") || getAttr("baths");
  const sqft = getAttr("square_feet") || getAttr("sqft") || getAttr("size");
  const lotSize = getAttr("lot_size");
  const yearBuilt = getAttr("year_built");
  const capRate = getAttr("cap_rate");
  const revenue = getAttr("annual revenue");
  const ebitda = getAttr("ebitda");
  const daysOnMarket = product.created_at ? formatDistanceToNow(new Date(product.created_at)) : null;

  const handleCopy = () => {
    const currentURL = window.location.href;

    navigator.clipboard.writeText(currentURL).then(() => {
      toast.success("Product URL copied to clipboard", {
        position: "top-right",
      });
    });
  };
  const handleShareClick = () => {
    if (navigator.share) {
      navigator.share({
        title: product.title,
        url: window.location.href,
      })
        .then(() => console.log('Product shared successfully!'))
        .catch((error) => console.error('Error sharing:', error));
    } else {
      toast.error('Sharing is not supported in this browser.');
    }
  };
  useEffect(() => {
    // Remove trailing slash from URL if present
    if (location.pathname.endsWith("/")) {
      const newPath = location.pathname.slice(0, -1) + location.search;
      navigate(newPath, { replace: true });
    }
  }, [location, navigate]);

  const handleMouseMove = (e) => {
    setViewMainImg(true);
    const { left, top, width, height } = e.target.getBoundingClientRect();
    const x = ((e.pageX - left) / width) * 100;
    const y = ((e.pageY - top) / height) * 100;
    setZoomCoordinates({ x, y });
  };

  // fetch cart products --------------------------------------------------------
  const GetCartProducts = async () => {
    if (cookies.access_token) {
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
        })
        .catch((error) => {
          handleError("Unable to retrieve Cart Products")
          console.error(error);
        });
    }
  };
  const GetWishlist = async () => {
    if (cookies.access_token) {
      axios
        .get(`${import.meta.env.VITE_SERVER_URL}/api/customer/wishlist/view/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.access_token}`,
          },
        })
        .then((response) => {
          setWishlistProducts(response.data.items);
        })
        .catch((error) => {
          handleError("Unable to retrieve Wishlist")
          console.error(error);
        });
    }
  };

  const AddtoCart = () => {
    // Send the raw variant selections — the backend validates the price from DB.
    const selected_variants = Object.entries(selectedAttributes).map(
      ([name, attr]) => ({ name, value: attr.value })
    );
    axios
      .post(
        `${import.meta.env.VITE_SERVER_URL}/api/customer/cart/add/${productId}/`,
        { selected_variants },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.access_token}`,
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
        toast.error(error.response.data.message || error.response.data.Status || error.response.data.detail || "An error occurred", {
          position: "top-right",
        });
      });
  };
  //   remove product--------------------------------------------------------
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
            Authorization: `Bearer ${cookies.access_token}`,
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
        error.response.data.detail ||
        "An error occurred", {
        position: "top-right",
      });
    }
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
            Authorization: `Bearer ${cookies.access_token}`,
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
  useEffect(() => {
    const GetProductData = async () => {
      try {
        setLoading(true);
        const productResponse = await axios.get(
          `${import.meta.env.VITE_SERVER_URL
          }/api/product/product/${productId}/`,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const productData = productResponse.data.Products;
        setProduct(productData);
        const isOwner = user?.email === productData.vendor?.email;
        setLoading(false);
        setActiveImage(productResponse.data.Products.image);

        // Build a lookup: attribute name (lowercase) → is_variant boolean
        // from the subcategory's allowed_attributes list.
        const isVariantLookup = {};
        const allowedAttrs = productData.subcategory?.allowed_attributes || [];
        allowedAttrs.forEach((aa) => {
          if (aa.name) isVariantLookup[aa.name.toLowerCase()] = aa.is_variant;
        });

        const variantAttrs = {};
        const specAttrs = {};

        (productData.attributes || []).forEach(({ name, value, additional_price }) => {
          if (!name) return;
          const lowerName = name.toLowerCase();
          // Default to variant=true when not found (preserves existing behavior)
          const isVariant = isVariantLookup.hasOwnProperty(lowerName)
            ? isVariantLookup[lowerName]
            : true;

          const target = isVariant ? variantAttrs : specAttrs;
          if (!target[name]) target[name] = [];
          // De-duplicate by value
          if (!target[name].some((item) => item.value === value)) {
            target[name].push({ value, additional_price });
          }
        });

        setVariantAttributeMap(variantAttrs);
        setSpecAttributeMap(specAttrs);

        if (cookies.access_token) {
          const addressId = user.addresses[0]?.id;
          const ratesResponse = await axios.get(
            `${import.meta.env.VITE_SERVER_URL
            }/api/shipping/fetch-rates/${productId}/${addressId}/`,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${cookies.access_token}`,
              },
            }
          );
          console.log("Rates:", ratesResponse.data);
        }
      } catch (error) {
        console.error(error);
      }
    };

    GetProductData();
    GetCartProducts();
    const productInCart = cartProducts.find(
      (product) => product.product.id === productId
    );

    if (productInCart) {
      setProductQty(productInCart.quantity);
    }
  }, [cookies, navigate, removeCookie]);

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
        setReviews(ratingsReviews);

        if (ratingsReviews.length > 0) {
          const totalRating = ratingsReviews.reduce(
            (sum, review) => sum + review.rating,
            0
          );
          const avgRating = totalRating / ratingsReviews.length;
          console.log("Average rating:", avgRating);
          setAverageRating(avgRating);
        } else {
          setAverageRating(0);
        }
      } catch (error) {
        console.error("Error fetching ratings:", error);
      }
    };
    getProductRatings(product.id);
  }, [product.id])

  useEffect(() => {
    const getProducts = async () => {
      axios
        .get(`${import.meta.env.VITE_SERVER_URL}/api/product/all-products/`, {
          headers: {
            "Content-Type": "application/json",
          },
        })
        .then((response) => {
          console.log(response.data.Products);
          setAllProducts(response.data.Products);
        })
        .catch((error) => {
          console.error(error);
        });
    };
    getProducts();
  }, []);

  const handleAttributeSelection = (name, attribute) => {
    setSelectedAttributes((prevState) => {
      if (prevState[name]?.value === attribute.value) {
        const { [name]: _, ...rest } = prevState;
        return rest;
      } else {
        return {
          ...prevState,
          [name]: attribute,
        };
      }
    });
    console.log(name, attribute);
  };

  // Calculate additional price from selected attributes
  const additionalPrice = Object.values(selectedAttributes).reduce(
    (total, attr) => total + (attr.additional_price || 0),
    0
  );

  // Calculate prices with additional price added to both unit price and MRP
  const finalUnitPrice = Number(product.unit_price) + additionalPrice;
  const finalMrp = Number(product.mrp) + additionalPrice;

  const discountPercentage = (
    ((finalMrp - finalUnitPrice) / finalMrp) * 100
  ).toFixed(2);

  function htmlToText(html) {
    let doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  }
  const handleWishlistClick = async () => {
    if (!user) {
      toast.error("You are not Signed In", {
        position: "top-right",
      });
      sessionStorage.setItem("redirectAfterLogin", window.location.href);
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
  useEffect(() => {
    if (product.image1) {
      setActiveImage(product.image1);
    }
  }, [product]);

  useEffect(() => {
    // Safely get the current URL on the client-side
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.href);
    }
  }, []);

  return (
    <>
      {orderConfirm && <OrderConfirm />}
      {product && product.meta_title && (
        <Helmet>
          <title>{product.meta_title}</title>
          {product.short_description && (
            <meta
              name="description"
              content={htmlToText(product.short_description)}
            />
          )}
          {product.tags && <meta name="keywords" content={product.tags} />}
        </Helmet>
      )}
      
      <section className="relative pb-8 bg-gradient-to-br from-white via-purple-50/30 to-white dark:from-[#0A0B0E] dark:via-[#1a1020] dark:to-[#0A0B0E] font-poppins min-h-screen overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        {viewMainImg && (
          <ImageZoom
            imageUrl={
              activeImage ||
              product.image1 ||
              "https://w7.pngwing.com/pngs/1008/139/png-transparent-cosmetics-advertising-cosmetics-advertising-beauty-others.png"
            }
            x={zoomCoordinates.x}
            y={zoomCoordinates.y}
          />
        )}

        {loading ? (
          <div className="min-h-screen flex items-center justify-center">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-purple-200 dark:border-purple-900 rounded-full"></div>
              <div className="w-20 h-20 border-4 border-purple-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            </div>
          </div>
        ) : (
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-6 animate-fadeIn">
              <Link to="/" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Home</Link>
              <span>/</span>
              <Link to={`/category/${product.category?.slug}`} className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                {product.category?.name}
              </Link>
              <span>/</span>
              <span className="text-gray-900 dark:text-white font-medium">{product.name}</span>
            </div>

            {/* Premium Listing Header (Real Estate/Business) */}
            {isSpecialized && (
              <div className="mb-10 space-y-4 animate-fadeIn">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-purple-500/20">
                        {isBusiness ? "Business For Sale" : (isResidential ? "Residential" : "Commercial")}
                      </span>
                      {daysOnMarket && (
                        <span className="px-3 py-1 bg-white/10 dark:bg-white/5 border border-white/10 text-gray-500 dark:text-gray-400 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1.5">
                          <FaClock className="text-purple-500" /> {daysOnMarket} on market
                        </span>
                      )}
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white tracking-tighter leading-[0.95]">
                      {product.name}
                    </h1>
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 font-medium">
                      <FaMapMarkerAlt className="text-purple-500" />
                      <span>{getAttr("city") || product.city}{getAttr("state") ? `, ${getAttr("state")}` : ""} {getAttr("zip") || product.zip_code}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-start md:items-end gap-1">
                    <div className="text-5xl md:text-6xl font-black text-purple-600 tracking-tighter">
                      {currency}{formatMoney(finalUnitPrice)}
                    </div>
                    <div className="text-xs font-bold uppercase tracking-widest text-gray-400">
                      Est. {currency}{formatMoney(finalUnitPrice / 180)}/mo
                    </div>
                  </div>
                </div>

                {/* Specs Strip */}
                <div className="grid grid-cols-2 md:flex md:items-center gap-4 md:gap-8 p-6 bg-white/50 dark:bg-white/[0.03] backdrop-blur-3xl rounded-3xl border border-white/20 dark:border-white/5 shadow-xl">
                  {isRealEstate ? (
                    <>
                      {beds && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                            <FaBed size={18} />
                          </div>
                          <div>
                            <div className="text-lg font-black text-gray-900 dark:text-white leading-none">{beds}</div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Beds</div>
                          </div>
                        </div>
                      )}
                      {baths && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <FaBath size={18} />
                          </div>
                          <div>
                            <div className="text-lg font-black text-gray-900 dark:text-white leading-none">{baths}</div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Baths</div>
                          </div>
                        </div>
                      )}
                      {sqft && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                            <FaRulerCombined size={18} />
                          </div>
                          <div>
                            <div className="text-lg font-black text-gray-900 dark:text-white leading-none">{formatMoney(sqft).replace("$", "")}</div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Sqft</div>
                          </div>
                        </div>
                      )}
                      {capRate && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                            <FaChartLine size={18} />
                          </div>
                          <div>
                            <div className="text-lg font-black text-gray-900 dark:text-white leading-none">{capRate}%</div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Cap Rate</div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {revenue && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                            <FaMoneyBillWave size={18} />
                          </div>
                          <div>
                            <div className="text-lg font-black text-gray-900 dark:text-white leading-none">{currency}{formatMoney(revenue)}</div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Revenue</div>
                          </div>
                        </div>
                      )}
                      {ebitda && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <FaChartLine size={18} />
                          </div>
                          <div>
                            <div className="text-lg font-black text-gray-900 dark:text-white leading-none">{currency}{formatMoney(ebitda)}</div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">EBITDA</div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  <div className="ml-auto hidden md:flex items-center gap-2 px-4 py-2 bg-purple-600/10 border border-purple-500/20 rounded-2xl text-purple-600 text-[10px] font-black uppercase tracking-widest">
                    <IoInformationCircleOutline size={16} /> Verified Listing
                  </div>
                </div>
              </div>
            )}

            <div className={`grid grid-cols-1 ${isSpecialized ? "lg:grid-cols-3" : "lg:grid-cols-2"} gap-8 lg:gap-12`}>
              {/* Left Column - Image Gallery */}
              <div className={`${isSpecialized ? "lg:col-span-2" : "lg:col-span-1"} space-y-4 animate-slideInLeft`}>
                {isSpecialized ? (
                  /* Premium Grid Gallery */
                  <div className="grid grid-cols-4 grid-rows-2 gap-3 aspect-[16/10]">
                    <div className="col-span-3 row-span-2 relative group rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                      <img 
                        src={activeImage || product.image1} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                        alt="Property main"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>
                    <div className="col-span-1 row-span-1 relative group rounded-2xl overflow-hidden shadow-lg border border-white/10">
                      <img 
                        src={product.image2 || product.image1} 
                        className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform" 
                        onClick={() => setActiveImage(product.image2)}
                        alt="view 2"
                      />
                    </div>
                    <div className="col-span-1 row-span-1 relative group rounded-2xl overflow-hidden shadow-lg border border-white/10">
                      <img 
                        src={product.image3 || product.image1} 
                        className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform" 
                        onClick={() => setActiveImage(product.image3)}
                        alt="view 3"
                      />
                      {(!product.image4 && !product.image3) && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center text-white text-xs font-bold uppercase">
                          +12 Photos
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Standard E-commerce Gallery */
                  <>
                    <div className="relative group bg-white dark:bg-gray-900/50 rounded-2xl overflow-hidden shadow-2xl border border-purple-100 dark:border-purple-900/30 backdrop-blur-sm">
                      <div className="aspect-square flex items-center justify-center p-8 bg-gradient-to-br from-white to-purple-50/50 dark:from-gray-900/50 dark:to-purple-950/30">
                        <img
                          className="w-full h-full object-contain cursor-crosshair transition-transform duration-500 group-hover:scale-105"
                          src={activeImage || product.image1}
                          alt={product.name}
                          onMouseOut={() => setViewMainImg(false)}
                          onMouseMove={handleMouseMove}
                        />
                      </div>
                      
                      {/* Stock Badge */}
                      {product.quantity > 0 ? (
                        <div className="absolute top-4 left-4 px-4 py-2 bg-green-500 text-white text-xs font-semibold rounded-full shadow-lg animate-bounce">
                          In Stock
                        </div>
                      ) : (
                        <div className="absolute top-4 left-4 px-4 py-2 bg-red-500 text-white text-xs font-semibold rounded-full shadow-lg">
                          Out of Stock
                        </div>
                      )}

                      {/* Discount Badge */}
                      {discountPercentage !== "0.00" && (
                        <div className="absolute bottom-4 left-4 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-bold rounded-full shadow-lg">
                          {discountPercentage}% OFF
                        </div>
                      )}
                    </div>

                    {/* Thumbnail Gallery */}
                    <div className="grid grid-cols-4 gap-3">
                      {[product.image1, product.image2, product.image3, product.image4].filter(Boolean).map((img, index) => (
                        <button
                          key={index}
                          onClick={() => setActiveImage(img)}
                          className={`relative aspect-square rounded-xl overflow-hidden transition-all duration-300 transform hover:scale-105 ${
                            activeImage === img
                              ? "ring-4 ring-purple-500 shadow-xl scale-105"
                              : "ring-2 ring-gray-200 dark:ring-gray-700 hover:ring-purple-300 dark:hover:ring-purple-700"
                          }`}
                        >
                          <img
                            src={img}
                            alt={`Product view ${index + 1}`}
                            className="w-full h-full object-cover bg-white dark:bg-gray-900"
                          />
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Right Column - Product Info */}
              <div className="space-y-6 animate-slideInRight">
                {isSpecialized ? (
                  /* Specialized Action Panel */
                  <div className="space-y-6">
                    <div className="p-8 bg-[#111]/90 dark:bg-[#111]/90 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 shadow-2xl">
                      <h3 className="text-lg font-black text-white uppercase tracking-widest mb-6 border-b border-white/5 pb-4 flex items-center gap-3">
                        <FaEnvelope className="text-purple-500" /> Interested?
                      </h3>
                      <div className="space-y-4">
                        <button 
                          onClick={() => toast.info("Contacting Agent...", { position: "top-right" })}
                          className="w-full py-5 bg-purple-600 hover:bg-purple-700 text-white font-black uppercase tracking-[0.2em] text-[11px] rounded-2xl shadow-xl shadow-purple-600/20 transition-all active:scale-95 flex items-center justify-center gap-3"
                        >
                          <FaPhoneAlt /> Contact {isBusiness ? "Broker" : "Agent"}
                        </button>
                        <button 
                          onClick={() => toast.info("Scheduling Tour...", { position: "top-right" })}
                          className="w-full py-5 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-black uppercase tracking-[0.2em] text-[11px] rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-3"
                        >
                          <FaCalendarAlt /> {isBusiness ? "Request Financials" : "Schedule a Tour"}
                        </button>
                      </div>
                      
                      <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Listing Agent</span>
                          <span className="text-xs font-black text-white">{product.vendor?.name || "Premium Brokerage"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Property ID</span>
                          <span className="text-xs font-black text-white">#PS-{product.id?.slice(-6).toUpperCase()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-white/5 rounded-3xl border border-white/5 flex items-center justify-between group cursor-pointer hover:bg-white/10 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                          <FaHeart size={20} />
                        </div>
                        <div>
                          <div className="text-sm font-black text-white uppercase tracking-widest">Save Listing</div>
                          <div className="text-[10px] text-gray-500">Add to your favorites</div>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-purple-500 group-hover:border-purple-500 transition-all">
                        <FaShare className="text-white text-xs" />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Standard E-commerce Info */
                  <>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Stars stars={averageRating} />
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {averageRating.toFixed(1)} ({reviews.length} reviews)
                      </span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
                      {product.name}
                    </h1>

                    <div className="flex flex-wrap gap-3 text-sm">
                      {product.brand_name && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                          <span className="text-gray-600 dark:text-gray-400">Brand:</span>
                          <span className="font-semibold text-purple-700 dark:text-purple-300">{product.brand_name}</span>
                        </div>
                      )}
                      {product.category?.name && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                          <span className="text-gray-600 dark:text-gray-400">Category:</span>
                          <span className="font-semibold text-blue-700 dark:text-blue-300">{product.category.name}</span>
                        </div>
                      )}
                    </div>

                    {/* Standard Price Section */}
                    <div className="relative overflow-hidden p-8 bg-white dark:bg-gray-900/40 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-2xl group">
                      <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-purple-500/20 transition-all duration-700"></div>
                      <div className="relative z-10">
                        <div className="flex items-baseline gap-4 flex-wrap">
                          <span className="text-5xl sm:text-6xl font-black tracking-tighter text-gray-900 dark:text-white">
                            {currency}{formatMoney(finalUnitPrice)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Standard Action Zone */}
                    <div className="flex flex-col gap-4 py-4">
                      <div className="flex flex-col xl:flex-row gap-4">
                        {!isOwner ? (
                          <button
                            onClick={() => {
                              if (!user) {
                                toast.error("You are not Signed In", { position: "top-right" });
                                sessionStorage.setItem("redirectAfterLogin", window.location.href);
                                setIsProfileOpen(true);
                                setTimeout(() => setIsProfileOpen(false), 10000);
                                return;
                              }
                              AddtoCart();
                            }}
                            disabled={product.quantity === 0}
                            className="flex-1 group relative px-8 py-4 bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-widest text-[10px] rounded-xl overflow-hidden transition-all duration-500 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl"
                          >
                            <span className="relative z-10 flex items-center justify-center gap-3">
                              <IoCart size={16} />
                              Add to bag
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                          </button>
                        ) : (
                          <div className="flex-1 px-8 py-4 bg-white/5 border border-white/10 rounded-xl text-white/30 text-[10px] font-black uppercase tracking-widest flex items-center justify-center">
                            Your Product
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between p-5 bg-white dark:bg-gray-900/40 rounded-xl border border-gray-100 dark:border-white/5 shadow-md">
                        <button
                          onClick={handleWishlistClick}
                          className="flex items-center gap-3 group"
                        >
                          <FaHeart
                            id={`heart-${product.id}`}
                            className={`transition-all duration-300 text-xl group-hover:scale-125 ${
                              wishlistProducts.find((i) => i.id === product.id)
                                ? "text-red-500 animate-pulse"
                                : "text-gray-400 group-hover:text-red-400"
                            }`}
                          />
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 group-hover:text-purple-600 transition-colors">
                            {wishlistProducts.find((i) => i.id === product.id) ? "In Wishlist" : "Save for later"}
                          </span>
                        </button>

                        <div className="flex items-center gap-2">
                          <button onClick={handleShareClick} className="p-2.5 bg-gray-50 dark:bg-white/5 rounded-lg transition-all hover:scale-110 hover:bg-purple-50">
                            <FaShare className="text-gray-500" size={12} />
                          </button>
                          <button onClick={handleCopy} className="p-2.5 bg-gray-50 dark:bg-white/5 rounded-lg transition-all hover:scale-110 hover:bg-purple-50">
                            <FaCopy className="text-gray-600 dark:text-gray-400" size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Trust Badges */}
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { icon: "🛡️", label: "Secure" },
                          { icon: "🔄", label: "7 Day" },
                          { icon: "✨", label: "Authentic" }
                        ].map((badge, i) => (
                          <div key={i} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gray-50/50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5">
                            <span className="text-lg">{badge.icon}</span>
                            <span className="text-[7px] font-black uppercase tracking-[0.1em] text-gray-400">{badge.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* SECTION 3: PRODUCT INFO TABS (Story & Specs) */}
            <div className="mt-16 relative overflow-hidden bg-white dark:bg-[#111]/80 backdrop-blur-xl rounded-[2.5rem] border border-gray-100 dark:border-white/10 shadow-xl transition-all duration-500">
                  {/* Tab Navigation */}
                  <div className="flex border-b border-gray-100 dark:border-white/5">
                    {[
                      { id: "story", label: "Product Story", icon: "✨" },
                      { id: "specs", label: "Specifications", icon: "📋" }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-3 py-6 text-[10px] font-black uppercase tracking-widest transition-all duration-300 relative ${
                          activeTab === tab.id 
                            ? "text-purple-600 dark:text-purple-400" 
                            : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        }`}
                      >
                        <span className="text-sm">{tab.icon}</span>
                        {tab.label}
                        {activeTab === tab.id && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 to-blue-600 animate-fadeIn"></div>
                        )}
                      </button>
                    ))}
                  </div>

              {/* Tab Content */}
              <div className="p-10 sm:p-12">
                {activeTab === "story" ? (
                  <div className="animate-fadeIn max-w-4xl mx-auto">
                    {product?.short_description ? (
                      <div className="
                        text-[16px] text-gray-800 dark:text-white dark:[&_*]:!text-white whitespace-pre-line leading-relaxed
                        [&_p]:mb-6
                        [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-6
                        [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-6
                        [&_li]:mb-3
                        [&_strong]:font-black
                        [&_h1]:text-3xl [&_h1]:font-black [&_h1]:tracking-tighter [&_h1]:mb-6
                        [&_h2]:text-2xl [&_h2]:font-black [&_h2]:tracking-tighter [&_h2]:mb-6
                        [&_h3]:text-xl [&_h3]:font-black [&_h3]:tracking-tighter [&_h3]:mb-4
                        [&_a]:text-purple-600 [&_a]:underline transition-all
                      ">

                        {parse(product.short_description)}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic py-12 text-center">No product story available.</p>
                    )}
                  </div>
                ) : (
                  <div className="animate-fadeIn">
                    {Object.keys(specAttributeMap).length > 0 ? (
                      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-12 gap-y-10">
                        {Object.entries(specAttributeMap).map(([attrName, values]) => {
                          const displayValue = values.map((v) => v.value).join(", ");
                          const isBoolean = displayValue.toLowerCase() === "true" || displayValue.toLowerCase() === "false";
                          const isTrue = displayValue.toLowerCase() === "true";
                          
                          return (
                            <div key={attrName} className="flex flex-col gap-2.5 group">
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-400 group-hover:text-purple-500 transition-colors">
                                {attrName}
                              </span>
                              
                              <div className="flex items-center gap-3">
                                {isBoolean ? (
                                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider ${
                                    isTrue 
                                      ? "bg-green-500/10 text-green-500 border border-green-500/20" 
                                      : "bg-gray-100 dark:bg-white/5 text-gray-400"
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${isTrue ? "bg-green-500" : "bg-gray-400"}`} />
                                    {isTrue ? "Yes" : "No"}
                                  </div>
                                ) : (
                                  <p className="text-[15px] font-bold text-gray-900 dark:text-white leading-tight">
                                    {displayValue}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic py-12 text-center">No specifications available.</p>
                    )}
                  </div>
                    )}
                  </div>
                </div>


            {/* Reviews and Recommendations */}
            <div className="mt-16 space-y-12">
              <ProductDetailReviewSection reviews={reviews} product={product} />
              <YouMightAlsoLike
                allProducts={allProducts}
                productId={productId}
                product={product}
                currency={currency}
              />
            </div>
          </div>
        )}
      </section>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-slideInLeft {
          animation: slideInLeft 0.6s ease-out;
        }

        .animate-slideInRight {
          animation: slideInRight 0.6s ease-out;
        }

        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out;
        }
      `}} />
    </>
  );
};

export default ProductDetailPage;
