import axios from "axios";
import React, { useContext, useEffect } from "react";
import { FaHeart, FaStar } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import { toast } from "react-toastify";
import { authContext } from "../context/authContext";
import { dataContext } from "../context/dataContext";
import { IoStarOutline } from "react-icons/io5";

const ProductCard = ({ product, isCard }) => {
  const [cookies] = useCookies([]);
  const navigate = useNavigate();
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
        toast.error(error.message || "An error occurred", {
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
      toast.error("An error occurred", {
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

  const Stars = ({ stars }) => {
    const ratingStars = Array.from({ length: 5 }, (elem, index) => {
      return (
        <div key={index}>
          {stars >= index + 1 ? (
            <FaStar className=" dark:text-yellow-400 text-black" />
          ) : (
            <IoStarOutline className=" text-black dark:text-yellow-400 " />
          )}
        </div>
      );
    });
    return <div className=" flex items-center gap-0.5">{ratingStars}</div>;
  };

  return (
    <div
      className={`mx-auto mt-2 rounded-lg relative w-[100%] lg:w-70 flex ${isCard ? "flex-col" : "flex-row items-end"
        } transform overflow-hidden bg-[#ffffff] dark:bg-[#08060f] shadow-md duration-300 hover:scale-[1.005] hover:shadow-lg`}
    >
      <FaHeart
        id={`heart-${product.id}`}
        onClick={handleWishlistClick}
        className={`absolute top-4 right-4 cursor-pointer ${wishlistProducts.find((i) => i.id === product.id)
            ? "text-red-500"
            : "text-gray-400"
          } text-[20px]`}
      />

      {isCard ? (
        <Link
          to={`/product/productDetail/${product.slug}?productId=${product.id}`}
        >
          <img
                      className="w-full min-h-[200px] max-h-[200px] sm:h-[87%] object-contain  cursor-pointer border border-black"
                      src={`${product.image1}` || "/emptyCart.png"}
            alt="Product Image"
          />
        </Link>
      ) : (
        <div className="w-[50%] overflow-hidden">
          <Link
            to={`/product/productDetail/${product.slug}?productId=${product.id}`}
          >
            <img
              className="max-h-48 w-full object-contain object-center"
              src={`${product.image1}` || "/emptyCart.png"}
              alt="Product Image"
            />
          </Link>
        </div>
      )}

      <div
        className={`text-[#f5f5f5] relative ${isCard ? "" : "w-[50%] ml-auto"}`}
      >
        <Link
          to={`/product/productDetail/${product.slug}?productId=${product.id}`}
        >
          <h2 className="text-[16px] h-[25px] text-[#363F4D] text-center sm:h-fit overflow-hidden sm:text-lg font-medium dark:text-white whitespace-nowrap px-4">
            {product.name}
          </h2>
          <div className="flex flex-col items-center lg:items-center w-full">
            <div className="flex items-baseline w-full justify-center">
              {product.mrp !== product.unit_price && (
                <p className="text-[13.4px] lg:text-base mr-1 text-grey/70 line-through text-[#A4A4A4] dark:text-gray-300">
                  <span>{currency}</span>
                  {product.mrp}
                </p>
              )}
              <p className="text-center mb-2 lg:mr-2 text-lg font-semibold text-[#F9BA48] dark:text-white">
                <span>{currency}</span>
                {product.unit_price}
              </p>
            </div>
            <Stars
              stars={
                product?.avgRating
                  ? product?.avgRating
                  : Math.floor(Math.random() * 6)
              }
            />
          </div>
        </Link>
        <div className="flex flex-col justify-self-end">
          <Link
            to={`/product/productDetail/${product.slug}?productId=${product.id}`}
          >
            <button
              className={`w-full mt-2 text-[13.7px] sm:text-base bg-[#efefef] dark:bg-[#FFA41C] dark:text-black text-purple-900 font-semibold py-1.5 ${isCard ? "" : "mt-5"
                }`}
            >
              View Product
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;