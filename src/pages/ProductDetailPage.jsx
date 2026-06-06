import React, { useContext } from "react";
import { useEffect, useMemo, useState } from "react";
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
import { IoClose, IoStarOutline, IoCart, IoChatbubbleOutline, IoFlash } from "react-icons/io5";
import shareImage from "/media/share.png";
import ProductDetailReviewSection from "../components/ProductPageComponents/ProductDetail-ReviewSection";
import YouMightAlsoLike from "../components/ProductPageComponents/YouMightAlsoLike";
import BusinessListingDetail from "../components/ProductPageComponents/BusinessListingDetail";
import { Helmet } from "react-helmet";
import ImageZoom from "../components/ProductPageComponents/ZoomImage";
import parse from "html-react-parser";
import { data } from "autoprefixer";
import Stars from '../components/Stars'
import { formatMoney } from "../utils/formatMoney";
import { resolveAccessToken } from "../utils/authSession";
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
  FaEnvelope,
  FaUsers,
  FaUserTie,
  FaHandshake,
  FaCheckCircle,
  FaTimesCircle,
  FaRobot,
  FaTags,
  FaBriefcase,
  FaBalanceScale,
} from "react-icons/fa";
import { IoInformationCircleOutline } from "react-icons/io5";
import VisitScheduleModal from "../components/ProductPageComponents/VisitScheduleModal";
import {
  getVisitForProduct,
  buyerRespondVendorReschedule,
  submitVisitDispute,
  createVisitPaymentLink,
} from "../api/propertyVisits";
import { createConversation } from "../api/gigs";

/** API returns `/media/...` paths; resolve against API origin when SPA is on another host. */
function resolveProductMediaUrl(url) {
  if (url == null || url === "") return "";
  const s = String(url).trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  const base = (import.meta.env.VITE_SERVER_URL || "").replace(/\/$/, "");
  if (!base) return s;
  if (s.startsWith("/")) return `${base}${s}`;
  return `${base}/${s}`;
}

function withResolvedProductImages(product) {
  if (!product || typeof product !== "object") return product;
  const next = { ...product };
  for (let i = 1; i <= 4; i++) {
    const key = `image${i}`;
    if (next[key]) next[key] = resolveProductMediaUrl(next[key]);
  }
  return next;
}

function firstProductImageUrl(product) {
  if (!product || typeof product !== "object") return "";
  for (let i = 1; i <= 4; i++) {
    const u = product[`image${i}`];
    if (u) return u;
  }
  return "";
}

function cartContainsProduct(cartItems, productUuid) {
  if (!productUuid || !Array.isArray(cartItems)) return false;
  const id = String(productUuid);
  return cartItems.some((item) => String(item.product?.id) === id);
}

const ProductDetailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [cookies, removeCookie] = useCookies(["access_token"]);
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
  const { slug: urlSlug } = useParams();
  const searchParams = new URLSearchParams(location.search);
  // ?productId= takes priority; fall back to the :slug URL param so NDA return links
  // that only have a slug (no productId query param) can still load the product.
  const rawProductId = searchParams.get("productId") || urlSlug || null;
  const [averageRating, setAverageRating] = useState(0);
  const [currentUrl, setCurrentUrl] = useState("");
  const [activeVisit, setActiveVisit] = useState(null);
  const [visitModalOpen, setVisitModalOpen] = useState(false);
  const [rescheduleVisitId, setRescheduleVisitId] = useState(null);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeBusy, setDisputeBusy] = useState(false);
  const [contactingAgent, setContactingAgent] = useState(false);

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
    authToken,
    openChatWithConversation,
    setIsSingleOrderFormOpen,
    setSingleOrderProduct,
  } = useContext(authContext);

  const accessToken = resolveAccessToken(authToken, cookies.access_token);
  const isInCart = useMemo(
    () => cartContainsProduct(cartProducts, product?.id),
    [cartProducts, product?.id]
  );

  const isOwner =
    !!user?.email &&
    !!product?.vendor?.email &&
    user.email.trim().toLowerCase() === product.vendor.email.trim().toLowerCase();
  const isDealClosed = product?.deal_active_until && new Date(product.deal_active_until) < new Date();

  // ── CATEGORY DETECTION ──
  const categorySlug = product?.category?.slug || "";
  const isResidential = categorySlug === "residential-realestate";
  const isCommercial = categorySlug === "commercial-realestate";
  const isRealEstate = isResidential || isCommercial;
  const isBusiness = categorySlug === "business4sale" || categorySlug === "business-for-sale";
  const isSpecialized = isRealEstate || isBusiness;

  useEffect(() => {
    if (!isSpecialized || !product?.id || !accessToken) {
      setActiveVisit(null);
      return;
    }
    let cancel = false;
    (async () => {
      try {
        const data = await getVisitForProduct(accessToken, product.id);
        if (!cancel) setActiveVisit(data.visit || null);
      } catch {
        if (!cancel) setActiveVisit(null);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [isSpecialized, product?.id, accessToken, product?.category?.slug]);

  // ── ATTRIBUTE MAPPING ──
  const getAttr = (...aliases) => {
    const attrs = product?.attributes || [];
    for (const name of aliases) {
      if (!name) continue;
      // Normalize underscores ↔ spaces so "smart_tags" matches "Smart tags" (label-based DB name)
      const norm = String(name).toLowerCase().replace(/_/g, " ");
      const attr = attrs.find((a) => (a?.name || "").toLowerCase().replace(/_/g, " ") === norm);
      if (attr?.value !== undefined && attr?.value !== null && attr?.value !== "") {
        return attr.value;
      }
    }
    return "";
  };

  // Treat truthy money/number-like strings safely. Negative or zero values
  // typically indicate placeholder/typo data, so we don't render them as
  // headline numbers.
  const parseMoney = (v) => {
    if (v == null || v === "") return null;
    const n = parseFloat(String(v).replace(/[^0-9.\-]/g, ""));
    return Number.isFinite(n) ? n : null;
  };
  const isPositiveMoney = (v) => {
    const n = parseMoney(v);
    return n !== null && n > 0;
  };

  const beds = getAttr("bedrooms", "beds");
  const baths = getAttr("bathrooms", "baths");
  const sqft = getAttr("square_feet", "sqft", "size");
  const lotSize = getAttr("lot_size");
  const yearBuilt = getAttr("year_built");
  const capRate = getAttr("cap_rate");
  const revenue = getAttr(
    "annual revenue",
    "revenue",
    "revenue ($)",
    "annual_revenue"
  );
  const ebitda = getAttr(
    "ebitda",
    "ebitda ($)",
    "normalized ebitda",
    "adjusted ebitda",
    "sde",
    "sde ($)"
  );
  const daysOnMarket = product.created_at ? formatDistanceToNow(new Date(product.created_at)) : null;

  const handleCopy = () => {
    const currentURL = window.location.href;

    navigator.clipboard.writeText(currentURL).then(() => {
      toast.success("Product URL copied to clipboard", {
        position: "top-right",
      });
    });
  };
  const handleShareClick = async () => {
    const shareUrl = window.location.href;
    const shareTitle = product?.name || product?.title || "Listing on PinkSurfing";
    const shareText = product?.short_description
      ? `${shareTitle} — ${product.short_description}`
      : shareTitle;

    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
        return;
      } catch (err) {
        if (err?.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard", { position: "top-right" });
    } catch {
      toast.error("Couldn't share or copy the link.", { position: "top-right" });
    }
  };

  const handleContactAgent = async () => {
    if (isDealClosed) return;

    if (!accessToken || !user) {
      toast.info("Please sign in to message the agent.", { position: "top-right" });
      sessionStorage.setItem("redirectAfterLogin", window.location.href);
      navigate("/signin");
      return;
    }

    if (isOwner) {
      return;
    }

    const agentEmail = product?.vendor?.email;
    if (!agentEmail) {
      toast.error("Agent contact isn't available right now.", { position: "top-right" });
      return;
    }

    try {
      setContactingAgent(true);
      const res = await createConversation(accessToken, agentEmail);
      const conversation = res?.data;
      if (conversation?.id && typeof openChatWithConversation === "function") {
        openChatWithConversation(conversation);
      }
    } catch (err) {
      const detail = err?.response?.data?.detail || err?.response?.data?.error;
      toast.error(typeof detail === "string" ? detail : "Couldn't start a chat with the agent.", {
        position: "top-right",
      });
    } finally {
      setContactingAgent(false);
    }
  };

  const openScheduleVisitModal = () => {
    if (isDealClosed) return;
    if (!accessToken) {
      toast.info("Please sign in to continue.");
      sessionStorage.setItem("redirectAfterLogin", window.location.href);
      navigate("/signin");
      return;
    }
    setRescheduleVisitId(null);
    setVisitModalOpen(true);
  };

  const openRescheduleVisitModal = () => {
    if (!activeVisit?.id) return;
    setRescheduleVisitId(activeVisit.id);
    setVisitModalOpen(true);
  };

  const continueVisitPayment = async () => {
    if (!activeVisit?.id || !accessToken) return;
    try {
      const pay = await createVisitPaymentLink(accessToken, activeVisit.id);
      const url = pay.payment_link || pay.payment_link_url;
      if (url) window.location.href = url;
      else toast.error("Could not resume checkout.");
    } catch (e) {
      const d = e?.response?.data?.detail;
      toast.error(typeof d === "string" ? d : "Checkout error");
    }
  };

  const respondToVendorReschedule = async (accept) => {
    if (!activeVisit?.id || !accessToken) return;
    try {
      await buyerRespondVendorReschedule(accessToken, activeVisit.id, accept);
      toast.success(accept ? "You accepted the new time." : "You declined — a refund will be processed.");
      const data = await getVisitForProduct(accessToken, product.id);
      setActiveVisit(data.visit || null);
    } catch (e) {
      const d = e?.response?.data?.detail;
      toast.error(typeof d === "string" ? d : "Could not update request.");
    }
  };

  const submitDispute = async () => {
    if (!activeVisit?.id || !accessToken) return;
    if (disputeReason.trim().length < 10) {
      toast.error("Please enter at least 10 characters.");
      return;
    }
    setDisputeBusy(true);
    try {
      await submitVisitDispute(accessToken, activeVisit.id, disputeReason.trim());
      toast.success("Dispute submitted. Our team will review it.");
      setDisputeModalOpen(false);
      setDisputeReason("");
      const data = await getVisitForProduct(accessToken, product.id);
      setActiveVisit(data.visit || null);
    } catch (e) {
      const d = e?.response?.data?.detail;
      toast.error(typeof d === "string" ? d : "Could not submit dispute.");
    } finally {
      setDisputeBusy(false);
    }
  };

  const visitKindApi = isBusiness ? "business" : "real_estate";
  const canBuyerReschedule =
    activeVisit &&
    ["pending_vendor", "accepted"].includes(activeVisit.status);
  const scheduleButtonLabel = (() => {
    if (isDealClosed) return isBusiness ? "Request Financials" : "Schedule a visit";
    if (!activeVisit) return isBusiness ? "Request financials" : "Schedule a visit";
    if (activeVisit.status === "pending_payment") return "Continue scheduling payment";
    if (activeVisit.status === "buyer_reschedule_pending")
      return "Awaiting agent response";
    if (canBuyerReschedule) return "Reschedule visit";
    return isBusiness ? "Request financials" : "Schedule a visit";
  })();
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
    if (accessToken) {
      axios
        .get(`${import.meta.env.VITE_SERVER_URL}/api/customer/cart/view/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
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
    if (accessToken) {
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
          handleError("Unable to retrieve Wishlist")
          console.error(error);
        });
    }
  };

  const AddtoCart = () => {
    const cartProductId = product?.id || productId;
    if (!accessToken) {
      toast.error("You are not Signed In", { position: "top-right" });
      sessionStorage.setItem("redirectAfterLogin", window.location.href);
      setIsProfileOpen(true);
      return;
    }
    if (!cartProductId) {
      toast.error("Product is still loading", { position: "top-right" });
      return;
    }
    if (cartContainsProduct(cartProducts, cartProductId)) {
      toast.info("Already in your cart", { position: "top-right" });
      return;
    }
    // Send the raw variant selections — the backend validates the price from DB.
    const selected_variants = Object.entries(selectedAttributes).map(
      ([name, attr]) => ({ name, value: attr.value })
    );
    axios
      .post(
        `${import.meta.env.VITE_SERVER_URL}/api/customer/cart/add/${cartProductId}/`,
        { selected_variants },
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
        const data = error.response?.data;
        toast.error(
          data?.message || data?.Status || data?.detail || "Could not add to cart",
          { position: "top-right" }
        );
      });
  };

  const handleAddToBagClick = () => {
    if (!accessToken) {
      toast.error("You are not Signed In", { position: "top-right" });
      sessionStorage.setItem("redirectAfterLogin", window.location.href);
      setIsProfileOpen(true);
      return;
    }
    if (isInCart) {
      toast.info("Already in your cart", { position: "top-right" });
      return;
    }
    AddtoCart();
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
  useEffect(() => {
    const GetProductData = async () => {
      if (!productId) {
        setLoading(false);
        setProduct({});
        return;
      }
      try {
        setLoading(true);
        const encoded = encodeURIComponent(productId);
        const productResponse = await axios.get(
          `${import.meta.env.VITE_SERVER_URL}/api/product/product/${encoded}/`,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const productData = productResponse.data?.Products;
        if (!productData || typeof productData !== "object") {
          throw new Error("Missing product payload");
        }
        const normalizedProduct = withResolvedProductImages(productData);
        setProduct(normalizedProduct);
        setActiveImage(firstProductImageUrl(normalizedProduct));

        // Build a lookup: attribute name (lowercase) → is_variant boolean
        const isVariantLookup = {};
        const allowedAttrs = normalizedProduct.subcategory?.allowed_attributes || [];
        allowedAttrs.forEach((aa) => {
          if (aa.name) isVariantLookup[aa.name.toLowerCase()] = aa.is_variant;
        });

        const variantAttrs = {};
        const specAttrs = {};

        (normalizedProduct.attributes || []).forEach(({ name, value, additional_price }) => {
          if (!name) return;
          const lowerName = name.toLowerCase();
          const isVariant = Object.prototype.hasOwnProperty.call(isVariantLookup, lowerName)
            ? isVariantLookup[lowerName]
            : true;

          const target = isVariant ? variantAttrs : specAttrs;
          if (!target[name]) target[name] = [];
          if (!target[name].some((item) => item.value === value)) {
            target[name].push({ value, additional_price });
          }
        });

        setVariantAttributeMap(variantAttrs);
        setSpecAttributeMap(specAttrs);

        if (accessToken && normalizedProduct?.id && user?.addresses?.[0]?.id) {
          try {
            const shipId = encodeURIComponent(String(normalizedProduct.id));
            const addressId = encodeURIComponent(String(user.addresses[0].id));
            const ratesResponse = await axios.get(
              `${import.meta.env.VITE_SERVER_URL}/api/shipping/fetch-rates/${shipId}/${addressId}/`,
              {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${accessToken}`,
                },
              }
            );
            console.log("Rates:", ratesResponse.data);
          } catch (shipErr) {
            console.warn("Shipping rates skipped:", shipErr);
          }
        }
      } catch (error) {
        console.error(error);
        setProduct({});
        const msg =
          error?.response?.data?.Status ||
          error?.response?.data?.detail ||
          error?.message ||
          "Could not load this listing.";
        toast.error(typeof msg === "string" ? msg : "Could not load this listing.", {
          position: "top-right",
        });
      } finally {
        setLoading(false);
      }
    };

    GetProductData();
    GetCartProducts();
    const productInCart = cartProducts.find(
      (p) => p.product?.id === productId || p.product?.slug === productId
    );

    if (productInCart) {
      setProductQty(productInCart.quantity);
    }
  }, [productId, location.search, accessToken, user?.addresses]);

  useEffect(() => {
    const getProductRatings = async (productId) => {
      if (!productId) return;
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
    const primary = firstProductImageUrl(product);
    if (primary) setActiveImage(primary);
  }, [product]);

  useEffect(() => {
    // Safely get the current URL on the client-side
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.href);
    }
  }, []);

  const formatTextToParagraphs = (text) => {
    if (!text) return "No description available.";
    
    // If text already contains HTML tags, let parse handle it
    if (/<[a-z][\s\S]*>/i.test(text)) {
      return parse(text);
    }

    // Naively split text into sentences by ". "
    const sentences = text.split(/(?<=\.)\s+/);
    
    // Group into paragraphs of ~3-4 sentences
    const paragraphs = [];
    let currentParagraph = [];
    
    sentences.forEach((sentence, index) => {
      currentParagraph.push(sentence);
      if (currentParagraph.length >= 3 || index === sentences.length - 1) {
        paragraphs.push(currentParagraph.join(" "));
        currentParagraph = [];
      }
    });

    return (
      <div className="space-y-6">
        {paragraphs.map((para, idx) => (
          <p key={idx} className="text-justify text-[15px] sm:text-[16px] leading-[1.8] text-gray-800 dark:text-white dark:[&_*]:!text-white font-medium tracking-wide">
            {para}
          </p>
        ))}
      </div>
    );
  };


  // ── BUSINESS FOR SALE: render dedicated page ──
  if (!loading && isBusiness && product?.id) {
    return (
      <>
        {orderConfirm && <OrderConfirm />}
        {product.meta_title && (
          <Helmet>
            <title>{product.meta_title}</title>
            {product.short_description && (
              <meta name="description" content={htmlToText(product.short_description)} />
            )}
            {product.tags && <meta name="keywords" content={product.tags} />}
          </Helmet>
        )}
        <BusinessListingDetail
          product={product}
          getAttr={getAttr}
          parseMoney={parseMoney}
          isPositiveMoney={isPositiveMoney}
          currency={currency}
          isDealClosed={isDealClosed}
          contactingAgent={contactingAgent}
          handleContactAgent={handleContactAgent}
          handleShareClick={handleShareClick}
          wishlistProducts={wishlistProducts}
          setWishlistProducts={setWishlistProducts}
          user={user}
          cookies={cookies}
          allProducts={allProducts}
          productId={productId}
          reviews={reviews}
          activeVisit={activeVisit}
          respondToVendorReschedule={respondToVendorReschedule}
          setDisputeModalOpen={setDisputeModalOpen}
        />
        <VisitScheduleModal
          open={visitModalOpen}
          onClose={() => { setVisitModalOpen(false); setRescheduleVisitId(null); }}
          accessToken={accessToken}
          productId={product.id}
          visitKind={visitKindApi}
          rescheduleVisitId={rescheduleVisitId}
          onSuccess={async () => {
            if (!accessToken || !product?.id) return;
            try {
              const data = await getVisitForProduct(accessToken, product.id);
              setActiveVisit(data.visit || null);
            } catch { setActiveVisit(null); }
          }}
        />
        {disputeModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/75" onClick={() => !disputeBusy && setDisputeModalOpen(false)} role="presentation">
            <div className="w-full max-w-md rounded-2xl bg-gray-900 border border-white/10 p-6 text-white shadow-2xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
              <h3 className="text-lg font-bold mb-2">Raise a dispute</h3>
              <p className="text-xs text-gray-400 mb-4">Describe the issue. Our team at Pinksurfing will review. Minimum 10 characters.</p>
              <textarea value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)} rows={5} className="w-full rounded-xl bg-black/40 border border-white/10 p-3 text-sm mb-4" placeholder="What happened?" />
              <div className="flex gap-2">
                <button type="button" disabled={disputeBusy} onClick={() => { if (!disputeBusy) { setDisputeModalOpen(false); setDisputeReason(""); } }} className="flex-1 py-3 rounded-xl border border-white/10 text-sm font-semibold">Cancel</button>
                <button type="button" disabled={disputeBusy || disputeReason.trim().length < 10} onClick={submitDispute} className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-sm font-semibold disabled:opacity-40">{disputeBusy ? "Submitting…" : "Submit"}</button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

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
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 font-medium capitalize">
                      <FaMapMarkerAlt className="text-purple-500" />
                      <span>
                        {[getAttr("city") || product.vendor?.city, getAttr("state") || product.vendor?.state]
                          .filter(Boolean)
                          .join(", ")}
                        {getAttr("zip", "zip_code", "zip / radius") ? ` ${getAttr("zip", "zip_code", "zip / radius")}` : ""}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-start md:items-end gap-1">
                    <div className="flex items-center gap-3">
                      <div className="text-5xl md:text-6xl font-black text-purple-600 tracking-tighter">
                        {currency}{formatMoney(finalUnitPrice)}
                      </div>
                      {isDealClosed && (
                        <div className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-500 font-black uppercase tracking-widest text-xs rounded-xl">
                          Deal Closed
                        </div>
                      )}
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
                      {isPositiveMoney(revenue) && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                            <FaMoneyBillWave size={18} />
                          </div>
                          <div>
                            <div className="text-lg font-black text-gray-900 dark:text-white leading-none">{currency}{formatMoney(parseMoney(revenue))}</div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Revenue</div>
                          </div>
                        </div>
                      )}
                      {isPositiveMoney(ebitda) && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <FaChartLine size={18} />
                          </div>
                          <div>
                            <div className="text-lg font-black text-gray-900 dark:text-white leading-none">{currency}{formatMoney(parseMoney(ebitda))}</div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">EBITDA</div>
                          </div>
                        </div>
                      )}
                      {getAttr("years in operation") && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                            <FaBuilding size={18} />
                          </div>
                          <div>
                            <div className="text-lg font-black text-gray-900 dark:text-white leading-none">{getAttr("years in operation")} yrs</div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">In operation</div>
                          </div>
                        </div>
                      )}
                      {getAttr("employees") && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                            <FaUsers size={18} />
                          </div>
                          <div>
                            <div className="text-lg font-black text-gray-900 dark:text-white leading-none">{getAttr("employees")}</div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Employees</div>
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
                {isSpecialized && (
                  /* Premium Grid Gallery — adapts to how many real photos the listing has */
                  (() => {
                    const allPhotos = [product.image1, product.image2, product.image3, product.image4].filter(Boolean);
                    const heroSrc = activeImage || allPhotos[0] || "";
                    const sideSrcs = allPhotos.slice(1);

                    const ImgWithFallback = ({ src, alt, className, onClick }) => (
                      <div className={`relative w-full h-full ${onClick ? "cursor-pointer" : ""}`} onClick={onClick}>
                        {src ? (
                          <img
                            src={src}
                            alt={alt}
                            loading="lazy"
                            className={className}
                            onError={(e) => {
                              const el = e.currentTarget;
                              el.style.display = "none";
                              const sib = el.nextElementSibling;
                              if (sib) sib.classList.remove("hidden");
                            }}
                          />
                        ) : null}
                        <div
                          className={`${src ? "hidden" : ""} absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#13131a] text-gray-500`}
                          aria-hidden={src ? "true" : "false"}
                        >
                          <FaBriefcase className="text-2xl text-gray-600" />
                          <span className="text-[9px] font-black uppercase tracking-widest">No photo</span>
                        </div>
                      </div>
                    );

                    if (allPhotos.length <= 1) {
                      return (
                        <div className="aspect-[16/10] relative group rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-[#13131a]">
                          <ImgWithFallback
                            src={heroSrc}
                            alt={product.name || "Listing photo"}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-4 grid-rows-2 gap-3 aspect-[16/10]">
                        <div className="col-span-3 row-span-2 relative group rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-[#13131a]">
                          <ImgWithFallback
                            src={heroSrc}
                            alt={product.name || "Listing photo"}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        </div>

                        <div className="col-span-1 row-span-1 relative rounded-2xl overflow-hidden shadow-lg border border-white/10 bg-[#13131a]">
                          <ImgWithFallback
                            src={sideSrcs[0]}
                            alt={`${product.name || "Listing"} — view 2`}
                            className="w-full h-full object-cover hover:scale-110 transition-transform"
                            onClick={sideSrcs[0] ? () => setActiveImage(sideSrcs[0]) : undefined}
                          />
                        </div>

                        <div className="col-span-1 row-span-1 relative rounded-2xl overflow-hidden shadow-lg border border-white/10 bg-[#13131a]">
                          <ImgWithFallback
                            src={sideSrcs[1]}
                            alt={`${product.name || "Listing"} — view 3`}
                            className="w-full h-full object-cover hover:scale-110 transition-transform"
                            onClick={sideSrcs[1] ? () => setActiveImage(sideSrcs[1]) : undefined}
                          />
                          {allPhotos.length > 3 && (
                            <button
                              type="button"
                              onClick={() => sideSrcs[2] && setActiveImage(sideSrcs[2])}
                              className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center text-white text-xs font-bold uppercase tracking-widest"
                            >
                              +{allPhotos.length - 3} more
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()
                )}

                {/* Business / listing snapshot — uses real attributes from the API */}
                {isSpecialized && (
                  <div className="space-y-4 mt-2">
                    {(() => {
                      const industry = product.subcategory?.name;
                      const transitionType = getAttr("transition type", "transition support");
                      const owner = getAttr("owner involvement");
                      const financing = getAttr("financing options");
                      const ebitdaMultiple = getAttr("ebitda multiple", "revenue multiple");
                      const remote = getAttr("remote business", "remote", "web/mobile only");
                      const litigation = getAttr("pending litigation");
                      const aiLeverage = getAttr("ai leverageable", "ai-enabled operations", "ai-enabled");
                      const sopsDocumented = getAttr("sops documented", "documented sops", "sops");
                      const crmInPlace = getAttr("crm/erp in place", "crm/erp");
                      const expansion = getAttr("expansion opportunity", "expansion");
                      const licenses = getAttr("licenses required");
                      const _smartRaw = getAttr("smart_tags", "smart features", "smart match") || "";
                      const _smartStr = _smartRaw.trim();
                      const smartFeatures = (() => {
                        if (!_smartStr) return [];
                        // Handle Python list notation ['a', 'b'] stored by old backend
                        if (_smartStr.startsWith("[") && _smartStr.endsWith("]")) {
                          try {
                            const p = JSON.parse(_smartStr);
                            if (Array.isArray(p)) return p.map(x => String(x).trim()).filter(Boolean);
                          } catch {}
                          return _smartStr.slice(1, -1).split(",").map(i => i.trim().replace(/^['"]|['"]$/g, "")).filter(Boolean);
                        }
                        return _smartStr.split(",").map(s => s.trim()).filter(Boolean);
                      })();
                      const staffRoles = getAttr("staff roles");
                      const techStack = getAttr("technology stack");
                      const keyVendors = getAttr("key vendors");

                      // truthy-string helpers for boolean-ish attributes
                      const yes = (v) => {
                        const s = String(v || "").toLowerCase();
                        return s === "true" || s === "yes";
                      };
                      const no = (v) => {
                        const s = String(v || "").toLowerCase();
                        return s === "false" || s === "no";
                      };

                      const facts = [
                        industry && { label: "Industry", value: industry, icon: <FaBriefcase /> },
                        getAttr("years in operation") && {
                          label: "Years in operation",
                          value: `${getAttr("years in operation")}`,
                          icon: <FaBuilding />,
                        },
                        getAttr("employees") && {
                          label: "Employees",
                          value: getAttr("employees"),
                          icon: <FaUsers />,
                        },
                        owner && { label: "Owner involvement", value: owner, icon: <FaUserTie /> },
                        isPositiveMoney(revenue) && {
                          label: "Annual revenue",
                          value: `${currency}${formatMoney(parseMoney(revenue))}`,
                          icon: <FaMoneyBillWave />,
                        },
                        isPositiveMoney(ebitda) && {
                          label: "EBITDA / SDE",
                          value: `${currency}${formatMoney(parseMoney(ebitda))}`,
                          icon: <FaChartLine />,
                        },
                        ebitdaMultiple && { label: "Multiple", value: `${ebitdaMultiple}x`, icon: <FaChartLine /> },
                        financing && { label: "Financing", value: financing, icon: <FaHandshake /> },
                        transitionType && {
                          label: "Transition",
                          value: transitionType,
                          icon: <FaUserTie />,
                        },
                        (yes(remote) || no(remote)) && {
                          label: "Remote",
                          value: yes(remote) ? "Yes" : "No",
                          icon: yes(remote) ? <FaCheckCircle /> : <FaTimesCircle />,
                          tone: yes(remote) ? "good" : "muted",
                        },
                        (yes(aiLeverage) || no(aiLeverage)) && {
                          label: "AI-leverageable",
                          value: yes(aiLeverage) ? "Yes" : "No",
                          icon: <FaRobot />,
                          tone: yes(aiLeverage) ? "good" : "muted",
                        },
                        (yes(sopsDocumented) || no(sopsDocumented)) && {
                          label: "SOPs documented",
                          value: yes(sopsDocumented) ? "Yes" : "No",
                          icon: yes(sopsDocumented) ? <FaCheckCircle /> : <FaTimesCircle />,
                          tone: yes(sopsDocumented) ? "good" : "muted",
                        },
                        (yes(crmInPlace) || no(crmInPlace)) && {
                          label: "CRM / ERP",
                          value: yes(crmInPlace) ? "In place" : "None",
                          icon: yes(crmInPlace) ? <FaCheckCircle /> : <FaTimesCircle />,
                          tone: yes(crmInPlace) ? "good" : "muted",
                        },
                        (yes(expansion) || no(expansion)) && {
                          label: "Expansion upside",
                          value: yes(expansion) ? "Yes" : "No",
                          icon: yes(expansion) ? <FaCheckCircle /> : <FaTimesCircle />,
                          tone: yes(expansion) ? "good" : "muted",
                        },
                        licenses && { label: "Licenses required", value: licenses, icon: <FaBalanceScale /> },
                        litigation && {
                          label: "Pending litigation",
                          value: litigation,
                          icon: <FaBalanceScale />,
                          tone: String(litigation).toLowerCase() === "none" ? "good" : "warn",
                        },
                      ].filter(Boolean);

                      const hasAnything =
                        facts.length > 0 ||
                        smartFeatures.length > 0 ||
                        !!staffRoles ||
                        !!techStack ||
                        !!keyVendors ||
                        !!product.short_description ||
                        !!product.description;

                      if (!hasAnything) return null;

                      const toneClass = (tone) =>
                        tone === "good"
                          ? "text-emerald-400"
                          : tone === "warn"
                            ? "text-amber-400"
                            : "text-purple-400";

                      return (
                        <div className="bg-white dark:bg-[#111]/80 backdrop-blur-xl rounded-3xl border border-gray-100 dark:border-white/10 shadow-xl p-6 sm:p-8 space-y-8">
                          <div>
                            <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.25em] mb-4">
                              {isBusiness ? "Business snapshot" : "Listing snapshot"}
                            </h2>

                            {facts.length > 0 && (
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {facts.map((f, i) => (
                                  <div
                                    key={i}
                                    className="flex items-start gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5"
                                  >
                                    <div className={`text-base mt-0.5 ${toneClass(f.tone)}`}>{f.icon}</div>
                                    <div className="min-w-0">
                                      <div className="text-[9px] font-black uppercase tracking-widest text-gray-400 truncate">
                                        {f.label}
                                      </div>
                                      <div className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                        {f.value}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {smartFeatures.length > 0 && (
                            <div>
                              <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.25em] mb-3 flex items-center gap-2">
                                <FaTags className="text-purple-500" /> Smart highlights
                              </h3>
                              <div className="flex flex-wrap gap-2">
                                {smartFeatures.map((tag) => (
                                  <span
                                    key={tag}
                                    className="px-3 py-1.5 rounded-full text-[11px] font-bold bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-300"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {(staffRoles || techStack || keyVendors) && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {staffRoles && (
                                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5">
                                  <div className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Staff & roles</div>
                                  <div className="text-xs text-gray-800 dark:text-gray-200 leading-relaxed">{staffRoles}</div>
                                </div>
                              )}
                              {techStack && (
                                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5">
                                  <div className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Tech stack</div>
                                  <div className="text-xs text-gray-800 dark:text-gray-200 leading-relaxed">{techStack}</div>
                                </div>
                              )}
                              {keyVendors && (
                                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5">
                                  <div className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Key vendors</div>
                                  <div className="text-xs text-gray-800 dark:text-gray-200 leading-relaxed">{keyVendors}</div>
                                </div>
                              )}
                            </div>
                          )}

                          {(product.short_description || product.description) && (
                            <div>
                              <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.25em] mb-3">
                                {isBusiness ? "About this business" : "About this listing"}
                              </h3>
                              <div className="prose prose-sm dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 leading-relaxed">
                                {parse(product.short_description || product.description || "")}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {!isSpecialized && (
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
                          type="button"
                          onClick={handleContactAgent}
                          disabled={isDealClosed || contactingAgent || isOwner}
                          className={`w-full py-5 ${isDealClosed || isOwner ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 text-white shadow-xl shadow-purple-600/20 active:scale-95 disabled:opacity-70 disabled:cursor-progress'} font-black uppercase tracking-[0.2em] text-[11px] rounded-2xl transition-all flex items-center justify-center gap-3`}
                        >
                          {contactingAgent ? (
                            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          ) : (
                            <IoChatbubbleOutline size={16} />
                          )}
                          {isDealClosed
                            ? "Deal Closed"
                            : contactingAgent
                              ? "Opening chat…"
                              : isBusiness
                                ? "Message Lister"
                                : "Message Agent"}
                        </button>

                        {activeVisit?.status === "vendor_reschedule_pending" && activeVisit?.pending_reschedule_at && (
                          <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4 space-y-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-purple-200">
                              New time proposed
                            </p>
                            <p className="text-xs text-gray-300">
                              {new Date(activeVisit.pending_reschedule_at).toLocaleString(undefined, {
                                weekday: "short",
                                dateStyle: "medium",
                                timeStyle: "short",
                              })}
                            </p>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => respondToVendorReschedule(true)}
                                className="flex-1 py-3 rounded-xl bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest"
                              >
                                Accept
                              </button>
                              <button
                                type="button"
                                onClick={() => respondToVendorReschedule(false)}
                                className="flex-1 py-3 rounded-xl border border-white/20 text-[10px] font-black uppercase tracking-widest text-white"
                              >
                                Reject (refund)
                              </button>
                            </div>
                          </div>
                        )}

                        {activeVisit?.status === "buyer_reschedule_pending" && (
                          <p className="text-[10px] text-gray-400 px-1">
                            You proposed a new time. Waiting for the listing agent to confirm.
                          </p>
                        )}

                        <button 
                          onClick={() => {
                            if (isDealClosed) return;
                            if (activeVisit?.status === "pending_payment") {
                              continueVisitPayment();
                              return;
                            }
                            if (activeVisit?.status === "buyer_reschedule_pending") return;
                            if (canBuyerReschedule) openRescheduleVisitModal();
                            else openScheduleVisitModal();
                          }}
                          disabled={
                            isDealClosed ||
                            activeVisit?.status === "buyer_reschedule_pending" ||
                            activeVisit?.status === "vendor_reschedule_pending"
                          }
                          className={`w-full py-5 ${isDealClosed || activeVisit?.status === "buyer_reschedule_pending" || activeVisit?.status === "vendor_reschedule_pending" ? 'bg-gray-800/50 text-gray-500 cursor-not-allowed border border-gray-800' : 'bg-white/5 hover:bg-white/10 text-white border border-white/10 active:scale-95'} font-black uppercase tracking-[0.2em] text-[11px] rounded-2xl transition-all flex items-center justify-center gap-3`}
                        >
                          <FaCalendarAlt /> {isDealClosed ? "Deal Closed" : scheduleButtonLabel}
                        </button>

                        {activeVisit?.status === "accepted" && (
                          <button
                            type="button"
                            onClick={() => setDisputeModalOpen(true)}
                            className="w-full py-3 rounded-2xl border border-red-500/30 text-red-300 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10"
                          >
                            Raise a dispute
                          </button>
                        )}
                      </div>
                      
                      <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            {isBusiness ? "Listed by" : "Listing Agent"}
                          </span>
                          <span className="text-xs font-black text-white text-right truncate">
                            {product.vendor?.store_name ||
                              [product.vendor?.first_name, product.vendor?.last_name].filter(Boolean).join(" ") ||
                              "Pinksurfing seller"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            {isBusiness ? "Listing ID" : "Property ID"}
                          </span>
                          <span className="text-xs font-black text-white">#PS-{product.id?.slice(-6).toUpperCase()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={handleWishlistClick}
                        aria-pressed={!!wishlistProducts.find((i) => i.id === product.id)}
                        className="group flex items-center gap-3 p-4 rounded-3xl bg-white/5 border border-white/10 hover:border-pink-500/40 hover:bg-pink-500/[0.06] transition-all"
                      >
                        <div className="w-11 h-11 rounded-2xl bg-pink-500/15 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <FaHeart
                            id={`heart-${product.id}`}
                            size={18}
                            className={
                              wishlistProducts.find((i) => i.id === product.id)
                                ? "text-pink-500"
                                : "text-gray-400"
                            }
                          />
                        </div>
                        <div className="text-left">
                          <div className="text-[12px] font-black text-white uppercase tracking-widest leading-tight">
                            {wishlistProducts.find((i) => i.id === product.id)
                              ? "Saved"
                              : "Save listing"}
                          </div>
                          <div className="text-[10px] text-gray-500 leading-tight mt-0.5">
                            Add to your wishlist
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={handleShareClick}
                        className="group flex items-center gap-3 p-4 rounded-3xl bg-white/5 border border-white/10 hover:border-purple-500/40 hover:bg-purple-500/[0.06] transition-all"
                      >
                        <div className="w-11 h-11 rounded-2xl bg-purple-500/15 flex items-center justify-center text-purple-300 group-hover:scale-105 transition-transform">
                          <FaShare size={16} />
                        </div>
                        <div className="text-left">
                          <div className="text-[12px] font-black text-white uppercase tracking-widest leading-tight">
                            Share
                          </div>
                          <div className="text-[10px] text-gray-500 leading-tight mt-0.5">
                            Send or copy link
                          </div>
                        </div>
                      </button>
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
                      <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-baseline gap-4 flex-wrap">
                          <span className="text-5xl sm:text-6xl font-black tracking-tighter text-gray-900 dark:text-white">
                            {currency}{formatMoney(finalUnitPrice)}
                          </span>
                        </div>
                        {isDealClosed && (
                          <div className="px-6 py-2 bg-red-500/10 border border-red-500/20 text-red-500 font-black uppercase tracking-widest text-sm rounded-xl">
                            Deal Closed
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Standard Action Zone */}
                    <div className="flex flex-col gap-4 py-4">
                      <div className="flex flex-col xl:flex-row gap-4">
                        {!isOwner ? (
                          <>
                            <button
                              type="button"
                              onClick={handleAddToBagClick}
                              disabled={product.quantity === 0 || isDealClosed}
                              className={`flex-1 group relative px-8 py-4 ${isDealClosed ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500' : isInCart ? 'bg-emerald-600 text-white cursor-default' : 'bg-black dark:bg-white text-white dark:text-black hover:scale-[1.02] active:scale-95 shadow-xl'} font-black uppercase tracking-widest text-[10px] rounded-xl overflow-hidden transition-all duration-500`}
                            >
                              <span className="relative z-10 flex items-center justify-center gap-3">
                                {isDealClosed ? (
                                  <>Deal Closed</>
                                ) : isInCart ? (
                                  <>Already in bag</>
                                ) : (
                                  <>
                                    <IoCart size={16} />
                                    Add to bag
                                  </>
                                )}
                              </span>
                              {!isDealClosed && !isInCart && (
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                              )}
                            </button>

                            {!isDealClosed && product.quantity > 0 && (
                              <button
                                onClick={() => {
                                  if (!user) {
                                    toast.error("You are not Signed In", { position: "top-right" });
                                    sessionStorage.setItem("redirectAfterLogin", window.location.href);
                                    setIsProfileOpen(true);
                                    setTimeout(() => setIsProfileOpen(false), 10000);
                                    return;
                                  }
                                  setSingleOrderProduct({
                                    ...product,
                                    unit_price: finalUnitPrice,
                                    mrp: finalMrp,
                                    original_unit_price: product.unit_price,
                                    original_mrp: product.mrp,
                                    additional_price: additionalPrice,
                                    selected_variants: Object.entries(selectedAttributes).map(
                                      ([name, attr]) => ({ name, value: attr.value })
                                    ),
                                    quantity: productQty,
                                  });
                                  setIsSingleOrderFormOpen(true);
                                }}
                                className="flex-1 px-8 py-4 bg-purple-600 text-white font-black uppercase tracking-widest text-[10px] rounded-xl transition-all duration-500 hover:bg-purple-700 hover:shadow-2xl hover:shadow-purple-500/20 active:scale-95 shadow-xl flex items-center justify-center gap-3"
                              >
                                <IoFlash size={16} />
                                Buy now — {currency}{formatMoney(finalUnitPrice)}
                              </button>
                            )}
                          </>
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
                        {formatTextToParagraphs(product?.short_description)}
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

      <VisitScheduleModal
        open={visitModalOpen}
        onClose={() => {
          setVisitModalOpen(false);
          setRescheduleVisitId(null);
        }}
        accessToken={accessToken}
        productId={product.id}
        visitKind={visitKindApi}
        rescheduleVisitId={rescheduleVisitId}
        onSuccess={async () => {
          if (!accessToken || !product?.id) return;
          try {
            const data = await getVisitForProduct(accessToken, product.id);
            setActiveVisit(data.visit || null);
          } catch {
            setActiveVisit(null);
          }
        }}
      />

      {disputeModalOpen && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/75"
          onClick={() => !disputeBusy && setDisputeModalOpen(false)}
          role="presentation"
        >
          <div
            className="w-full max-w-md rounded-2xl bg-gray-900 border border-white/10 p-6 text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h3 className="text-lg font-bold mb-2">Raise a dispute</h3>
            <p className="text-xs text-gray-400 mb-4">
              Describe the issue (no-show, fraud, etc.). Our team at Pinksurfing will review. Minimum 10 characters.
            </p>
            <textarea
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              rows={5}
              className="w-full rounded-xl bg-black/40 border border-white/10 p-3 text-sm mb-4"
              placeholder="What happened?"
            />
            <div className="flex gap-2">
              <button
                type="button"
                disabled={disputeBusy}
                onClick={() => {
                  if (!disputeBusy) {
                    setDisputeModalOpen(false);
                    setDisputeReason("");
                  }
                }}
                className="flex-1 py-3 rounded-xl border border-white/10 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={disputeBusy || disputeReason.trim().length < 10}
                onClick={submitDispute}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-sm font-semibold disabled:opacity-40"
              >
                {disputeBusy ? "Submitting…" : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

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
