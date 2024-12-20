import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { FaHeart, FaStar } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import { toast } from "react-toastify";
import { authContext } from "../context/authContext";
import { dataContext } from "../context/dataContext";
import { IoStarOutline } from "react-icons/io5";
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
    if (!cookies.token) {
      navigate("/signin");
    }
    axios
      .get(`${import.meta.env.VITE_SERVER_URL}/api/customer/cart/view/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.token}`,
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
            Authorization: `Bearer ${cookies.token}`,
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
            Authorization: `Bearer ${cookies.token}`,
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
    if (!cookies.token) {
      navigate("/signin");
    }
    axios
      .get(`${import.meta.env.VITE_SERVER_URL}/api/customer/wishlist/view/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.token}`,
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
            Authorization: `Bearer ${cookies.token}`,
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
      className={`mx-auto mt-4 rounded-xl relative w-full lg:w-[100%] flex ${isCard ? "flex-col" : "flex-row items-center"
        } transform overflow-hidden bg-white dark:bg-[#1A1C1E] shadow-md duration-300 hover:scale-[1.02] hover:shadow-lg`}
    >
      {/* Wishlist Icon */}
      {/* <FaHeart
        id={`heart-${product.id}`}
        onClick={handleWishlistClick}
        className={`absolute top-4 right-4 cursor-pointer ${wishlistProducts.find((i) => i.id === product.id)
          ? "text-red-500"
          : "text-gray-400"
          } text-[22px] transition-transform duration-200 transform hover:scale-110`}
      /> */}

      {/* Product Image */}
      {isCard ? (
        <Link to={`/product/productDetail/${product.slug}?productId=${product.id}`}>
          <img
            className="w-full min-h-[220px] max-h-[220px] sm:h-[90%] object-cover rounded-t-lg border border-gray-200 dark:border-gray-700 cursor-pointer"
            src={`${product.image1}` || "/emptyCart.png"}
            alt="Product Image"
          />
        </Link>
      ) : (
        <div className="w-[50%] overflow-hidden">
          <Link to={`/product/productDetail/${product.slug}?productId=${product.id}`}>
            <img
              className="max-h-48 w-full object-cover rounded-l-lg border border-gray-200 dark:border-gray-700"
              src={`${product.image1}` || "/emptyCart.png"}
              alt="Product Image"
            />
          </Link>
        </div>
      )}

      {/* Product Details */}
      <div className={`relative px-4 py-3 ${isCard ? "" : "w-[50%] ml-auto"}`}>
        {/* Ratings */}
        <div className="mt-2">
          <div className="flex gap-2">

          <Stars stars={averageRating} /> {" "} <span className="text-[#77878F]"> ({allRatings.length})</span>
          </div>
        </div>
        <Link to={`/product/productDetail/${product.slug}?productId=${product.id}`}>
          <h2 className="text-[16px] sm:text-lg font-medium text-gray-800 dark:text-white text-center sm:text-left truncate">
            {product.name}
          </h2>

          <div className="flex flex-col items-center sm:items-start mt-2">
            {/* Pricing */}
            <div className="flex items-baseline justify-center sm:justify-start">
              {product.mrp !== product.unit_price && (
                <p className="text-[13.4px] lg:text-sm mr-2 text-gray-500 line-through dark:text-gray-400">
                  <span>{currency}</span>
                  {product.mrp}
                </p>
              )}
              <p className="text-lg font-semibold text-[#933FFF] dark:text-[#933FFF]">
                <span>{currency}</span>
                {product.unit_price}
              </p>
            </div>

          </div>
        </Link>

        {/* View Product Button */}
        {/* <div className="flex mt-4 md:justify-start justify-center">
          <Link to={`/product/productDetail/${product.slug}?productId=${product.id}`}>
            <button
              className={`w-full py-2 px-2 rounded-lg bg-gradient-to-r bg-[#933FFF] text-white font-medium text-sm shadow-md hover:shadow-lg hover:opacity-90 transition duration-300 ${isCard ? "" : "mt-3"}`}
            >
              View Product
            </button>
          </Link>
        </div> */}
      </div>
    </div>
  );
};

export default ProductCard;