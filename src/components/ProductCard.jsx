import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { FaHeart, FaStar } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import { toast } from "react-toastify";
import { authContext } from "../context/authContext";
import { dataContext } from "../context/dataContext";
import { IoStarOutline, IoCart } from "react-icons/io5";
import Stars from "./Stars";
const ProductCard = ({ product, isCard }) => {
  const [cookies] = useCookies([]);
  const navigate = useNavigate();
  const [averageRating, setAverageRating] = useState(0);
  const [allRatings, setAllRatings] = useState([]);
  const { user, currency, setIsProfileOpen } = useContext(authContext);
  const {
    setCartProducts,
    setWishlistProducts,
    cartProducts,
    wishlistProducts,
  } = useContext(dataContext);

  const GetCartProducts = async () => {
    if (!cookies.access_token) {
      navigate("/signin");
    }
    axios
      .get(`${import.meta.env.VITE_SERVER_URL}/api/customer/cart/view/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.access_token}`,
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
    axios
      .post(
        `${import.meta.env.VITE_SERVER_URL}/api/customer/cart/add/${product.id
        }/`,
        {},
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
        toast.error(error.message || "An error occurred", {
          position: "top-right",
        });
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

  const GetWishlist = async () => {
    if (!cookies.access_token) {
      navigate("/signin");
    }
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
  }, [product.id])


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

      {/* Discount Badge */}
      {product.mrp !== product.unit_price && (
        <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white text-xs font-bold shadow-lg">
          {Math.round(((product.mrp - product.unit_price) / product.mrp) * 100)}% OFF
        </div>
      )}

      {/* Product Image */}
      {isCard ? (
        <Link to={`/product/productDetail/${product.slug}?productId=${product.id}`} className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-[1]" />
          <img
            className="w-full min-h-[200px] max-h-[200px] object-cover cursor-pointer transition-transform duration-500 group-hover:scale-105"
            src={product.image1 || "/emptyCart.png"}
            alt={product.name}
            loading="lazy"
          />
        </Link>
      ) : (
        <div className="w-[45%] overflow-hidden">
          <Link to={`/product/productDetail/${product.slug}?productId=${product.id}`}>
            <img
              className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-105"
              src={product.image1 || "/emptyCart.png"}
              alt={product.name}
              loading="lazy"
            />
          </Link>
        </div>
      )}

      {/* Product Details */}
      <div className={`relative p-4 ${isCard ? "" : "w-[55%] pl-4"}`}>
        {/* Ratings */}
        <div className="flex items-center gap-2 mb-2">
          <Stars stars={averageRating} />
          <span className="text-xs text-gray-500 dark:text-gray-400">({allRatings.length})</span>
        </div>

        <Link to={`/product/productDetail/${product.slug}?productId=${product.id}`}>
          <h2 className="text-sm sm:text-base font-semibold text-gray-800 dark:text-white line-clamp-2 leading-tight mb-3 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
            {product.name}
          </h2>
        </Link>

        {/* Pricing & Cart */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
              {currency}{product.unit_price}
            </p>
            {product.mrp !== product.unit_price && (
              <p className="text-sm text-gray-400 line-through">
                {currency}{product.mrp}
              </p>
            )}
          </div>

          {/* Add to Cart Icon */}
          <button
            onClick={(e) => {
              e.preventDefault();
              if (!user) {
                toast.error("Please sign in to add to cart");
                return;
              }
              AddtoCart();
            }}
            className="p-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-md hover:shadow-lg hover:shadow-purple-500/30 hover:scale-110 active:scale-95 transition-all duration-200"
            title="Add to Cart"
          >
            <IoCart className="text-lg" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;