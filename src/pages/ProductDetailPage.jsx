import React, { useContext } from "react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { useCookies } from "react-cookie";
import { toast } from "react-toastify";
import Header from "../components/Header";
import axios from "axios";
import { FaShare } from "react-icons/fa";
import OrderConfirm from "../components/OrderConfirm";
import { FaHeart, FaStar, FaTruck } from "react-icons/fa";
import { dataContext } from "../context/dataContext";
import { authContext } from "../context/authContext";
import { IoClose, IoStarOutline } from "react-icons/io5";
import shareImage from "/media/share.png";
import ProductDetailReviewSection from "../components/ProductPageComponents/ProductDetail-ReviewSection";
import YouMightAlsoLike from "../components/ProductPageComponents/YouMightAlsoLike";
import { Helmet } from "react-helmet";
import ImageZoom from "../components/ProductPageComponents/ZoomImage";
import parse from "html-react-parser";

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
  const attributeArrays = {};
  const [attributeArrays2, setAttributeArray2] = useState({});
  const [viewMainImg, setViewMainImg] = useState(false);
  const [productQty, setProductQty] = useState(1);
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [loading, setLoading] = useState(false);
  const [zoomCoordinates, setZoomCoordinates] = useState({ x: 0, y: 0 });
  const searchParams = new URLSearchParams(location.search);
  const productId = searchParams.get("productId");
  const {
    setCartProducts,
    cartProducts,
    setWishlistProducts,
    wishlistProducts,
    additionalAttribute,
    setAdditionalAttribute,
  } = useContext(dataContext);
  const {
    user,
    setSingleOrderProduct,
    setIsSingleOrderFormOpen,
    setIsProfileOpen,
    currency,
  } = useContext(authContext);
  console.log(user);

  const handleShareClick = () => {
    const currentURL = window.location.href;

    navigator.clipboard.writeText(currentURL).then(() => {
      toast.success("Product URL copied to clipboard", {
        position: "top-right",
      });
    });
  };

  const handleMouseMove = (e) => {
    setViewMainImg(true);
    const { left, top, width, height } = e.target.getBoundingClientRect();
    const x = ((e.pageX - left) / width) * 100;
    const y = ((e.pageY - top) / height) * 100;
    setZoomCoordinates({ x, y });
  };

  // fetch cart products --------------------------------------------------------
  const GetCartProducts = async () => {
    if (cookies.token) {
      axios
        .get(`${import.meta.env.VITE_SERVER_URL}/api/customer/cart/view/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.token}`,
          },
        })
        .then((response) => {
          console.log(response.data);
          setCartProducts(response.data);
        })
        .catch((error) => {
          console.error(error);
        });
    }
  };
  const GetWishlist = async () => {
    if (cookies.token) {
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
    }
  };

  const AddtoCart = () => {
    const additionalPrice = Object.values(selectedAttributes).reduce(
      (total, attr) => total + (attr.additional_price || 0),
      0
    );
    axios
      .post(
        `${import.meta.env.VITE_SERVER_URL
        }/api/customer/cart/add/${productId}/`,
        {
          additional_price: additionalPrice,
        },
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
  //   remove product--------------------------------------------------------
  const RemoveWishlistProduct =async (productId) => {
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

        setProduct(productResponse.data.Products);
        setLoading(false);
        setActiveImage(productResponse.data.Products.image);

        productResponse.data.Products.attributes.forEach((attribute) => {
          const { name, value, additional_price } = attribute;
          if (name != "") {
            if (!attributeArrays[name]) {
              attributeArrays[name] = [];
            }
            const isValueUnique = !attributeArrays[name].some(
              (item) => item.value === value
            );
            if (isValueUnique) {
              attributeArrays[name].push({ value, additional_price });
            }
          }
        });

        setAttributeArray2(attributeArrays);

        const reviewsResponse = await axios.get(
          `${import.meta.env.VITE_SERVER_URL
          }/api/ratings/get-ratings/${productId}/`,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        setReviews(reviewsResponse.data.ratings_reviews);
        if (cookies.token) {
          const addressId = user.addresses[0]?.id;
          const ratesResponse = await axios.get(
            `${import.meta.env.VITE_SERVER_URL
            }/api/shipping/fetch-rates/${productId}/${addressId}/`,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${cookies.token}`,
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

  const discountPercentage = (
    ((product.mrp -
      Object.values(selectedAttributes).reduce(
        (total, attr) => total + (attr.additional_price || 0),
        Number(product.unit_price)
      )) /
      product.mrp) *
    100
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
      <section className=" pb-2 bg-white dark:bg-black font-poppins min-h-screen h-max">
        {/* {viewMainImg && (
          <div className=" fixed w-full h-[100vh] flex items-center justify-center -top-0 z-50 left-0 bg-black/20">
            <div className=" relative z-50 w-[70%] md:w-[50%] h-[60%]">
              <IoClose
                onClick={() => {
                  setViewMainImg(false);
                }}
                className=" absolute text-[24px] -top-20 bg-orange-400 cursor-pointer right-0 z-50"
              />
              <img
                src={
                  activeImage ||
                  product.image1 ||
                  "https://w7.pngwing.com/pngs/1008/139/png-transparent-cosmetics-advertising-cosmetics-advertising-beauty-others.png"
                }
                alt={activeImage}
                className=" w-full object-cover border border-white h-[80vh] absolute -top-20"
              />
            </div>
          </div>
        )} */}
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
          <div className=" lg:col-span-3 2xl:col-span-4 flex items-center justify-center">
            <img
              src="/loading.svg"
              alt="loading"
              className="w-[50px] h-[50px] sm:w-[70px] sm:h-[70px] object-contain"
            />
          </div>
        ) : (
          <div className="bg-gray-100 dark:bg-black dark:text-[#f5f5f5] py-1 sm:py-8 h-full">
            <div className="max-w-screen-2xl flex flex-col mx-auto px-4 sm:px-6 lg:px-10 2xl:px-24">
              <div className="flex flex-col md:flex-row -mx-4">
                <div className="md:flex-1 px-4">
                  <div className="h-fit sm:min-h-[460px] dark:border dark:border-gray-800 sm:h-fit rounded-lg mb-4">
                    <img
                      className="w-full min-h-[320px] max-h-[320px] sm:h-[87%] object-contain  cursor-pointer border border-black"
                      src={
                        activeImage ||
                        product.image1 ||
                        "https://w7.pngwing.com/pngs/1008/139/png-transparent-cosmetics-advertising-cosmetics-advertising-beauty-others.png"
                      }
                      alt="Product Image"
                      onMouseOut={() => {
                        setViewMainImg(false);
                      }}
                      onMouseMove={handleMouseMove}
                    />
                    <div className="flex items-center gap-1 border-t-2 pt-4 border-gray-400 h-[80px] sm:h-[120px]">
                      {product.image1 && (
                        <img
                          onClick={() => setActiveImage(product.image1)}
                          className={`w-[23.95%] sm:w-[23.95%] lg:w-[24.45%] h-full object-contain cursor-pointer ${activeImage === product.image1
                              ? "opacity-40 border-[2px] border-orange-400 "
                              : " cursor-pointer"
                            }  object-contain`}
                          src={
                            product.image1 ||
                            "https://w7.pngwing.com/pngs/1008/139/png-transparent-cosmetics-advertising-cosmetics-advertising-beauty-others.png"
                          }
                          alt="Product Image"
                        />
                      )}
                      {product.image2 && (
                        <img
                          onClick={() => {
                            setActiveImage(product.image2);
                          }}
                          className={`w-[23.95%] sm:w-[23.95%] lg:w-[24.45%] h-full object-contain cursor-pointer ${activeImage === product.image2
                              ? "opacity-40 border-[2px] border-orange-400 "
                              : " cursor-pointer"
                            } object-contain`}
                          src={
                            product.image2 ||
                            "https://w7.pngwing.com/pngs/1008/139/png-transparent-cosmetics-advertising-cosmetics-advertising-beauty-others.png"
                          }
                          alt="Product Image"
                        />
                      )}
                      {product.image3 && (
                        <img
                          onClick={() => {
                            setActiveImage(product.image3);
                          }}
                          className={`w-[23.95%] sm:w-[23.95%] lg:w-[24.45%] h-full object-contain cursor-pointer ${activeImage === product.image3
                              ? "opacity-40 border-[2px] border-orange-400 "
                              : " cursor-pointer"
                            }  object-contain`}
                          src={
                            product.image3 ||
                            "https://w7.pngwing.com/pngs/1008/139/png-transparent-cosmetics-advertising-cosmetics-advertising-beauty-others.png"
                          }
                          alt="Product Image"
                        />
                      )}
                      {product.image4 && (
                        <img
                          onClick={() => {
                            setActiveImage(product.image4);
                          }}
                          className={`w-[23.95%] sm:w-[23.95%] lg:w-[24.45%] h-full object-contain cursor-pointer ${activeImage === product.image4
                              ? "opacity-40 border-[2px] border-orange-400 "
                              : " cursor-pointer"
                            }  object-contain`}
                          src={`${product.image4}`}
                          alt="Product Image"
                        />
                      )}
                    </div>
                    <div className=" px-2 pb-4 sm:px-6 border-t flex justify-center sm:justify-start items-center gap-5 border-gray-300  ">
                      <div className="flex flex-wrap items-center mt-2 sm:mt-4">
                        <span className="mr-2">
                          <FaTruck className=" text-gray-800 dark:text-[#f5f5f5]" />
                        </span>
                        <h2 className=" text-sm lg:text-lg font-bold text-black/70 lg:  text-black dark:text-[#f5f5f5]">
                          Free domestic shipping
                        </h2>
                      </div>
                      <div className="flex flex-wrap items-center mt-2 sm:mt-4"></div>
                    </div>
                  </div>
                </div>
                <div className="md:flex-1 px-4 relative dark:bg-black">
                  <h2 className="text-2xl capitalize font-[600] text-black  dark:text-[#f5f5f5] mb-2">
                    {product.name}
                    <FaHeart
                      id={`heart-${product.id}`}
                      onClick={handleWishlistClick}
                      className={`absolute top-2 right-2 cursor-pointer ${wishlistProducts.find((i) => {
                        return i.id === product.id;
                      })
                          ? "text-red-500"
                          : "text-gray-400"
                        } text-[22px] `}
                    />
                  </h2>
                  <div className="absolute top-2 right-10">
                    <FaShare
                      className="cursor-pointer text-white text-xl"
                      onClick={handleShareClick}
                    />
                  </div>

                  <div className="flex flex-col mb-1 sm:mb-4">
                    <div className="flex mr-4 pt-4 items-center">
                      <span className="text-[1.5rem] md:text-[1.7rem] 2xl:text-[1.9rem] font-semibold raleway  text-[#1d1d1d] dark:text-[#f5f5f5] mr-1">
                        {currency}
                        {Object.values(selectedAttributes)
                          .reduce(
                            (total, attr) =>
                              total + (attr.additional_price || 0),
                            Number(product.unit_price)
                          )
                          .toFixed(2)}
                      </span>
                      {discountPercentage !== "0.00" && (
                        <span className=" text-[1.1rem] md:text-[1.3rem] 2xl:text-[1.5rem] font-semibold raleway   dark:text-[#f5f5f588] ml-1 line-through text-gray-400">
                          {currency}
                          {product.mrp}
                        </span>
                      )}
                      {discountPercentage !== "0.00" && (
                        <span className="label label-warning text-sm ml-1 raleway h-4">
                          ({discountPercentage}%)
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] md:text-[12px] 2xl:text-[13px] -mt-1 raleway">
                      Tax Included
                    </div>
                  </div>
                  <p
                    className={` text-[15px] ${additionalAttribute.price === 0 && "hidden"
                      }`}
                  ></p>
                  {Object.entries(attributeArrays2).map(
                    ([attributeName, values]) => (
                      <div key={attributeName} className="my-4">
                        <span className="font-bold text-gray-700  dark:text-[#f5f5f5] mb-1">
                          Select {attributeName} :
                        </span>
                        <ul>
                          {attributeName.toLowerCase() === "color" ? (
                            <div className=" flex items-center">
                              {values.map((value, index) => (
                                <button
                                  onClick={() =>
                                    handleAttributeSelection(
                                      attributeName,
                                      value
                                    )
                                  }
                                  key={index}
                                  className={`w-7 h-7 ${selectedAttributes[attributeName]?.value ===
                                      value.value
                                      ? " border-2 border-blue-400"
                                      : "border-2 border-black"
                                    } rounded-full bg-${value.value.toLowerCase()}-500   ml-2`}
                                ></button>
                              ))}
                            </div>
                          ) : (
                            <div className=" flex items-baseline">
                              {values.map((value, index) => (
                                <button
                                  key={index}
                                  onClick={() =>
                                    handleAttributeSelection(
                                      attributeName,
                                      value
                                    )
                                  }
                                  className={`text-gray-500 6 ${selectedAttributes[attributeName]?.value ===
                                      value.value
                                      ? " border border-blue-400 bg-blue-600 text-white"
                                      : "border bg-transparent border-white/30 hover:bg-gray-400 hover:text-gray-800 "
                                    }  py-2 px-4 rounded-xl font-bold mr-2`}
                                >
                                  {value.value}
                                </button>
                              ))}
                            </div>
                          )}
                        </ul>
                      </div>
                    )
                  )}
                  <div>
                    <p className="text-[12px] text-[#585454] md:text-sm flex items-center gap-2 border-t pt-[15px] mt-[15px] raleway  dark:text-[#ece9e9]">
                      {product?.short_description
                        ? parse(product.short_description)
                        : "No description available."}
                    </p>
                  </div>
                  <div className="flex items-center w-full sm:w-full py-3 sm:py-3 dark:bg-black shadow-inner sm:shadow-none shadow-black/20">
                    <div className="w-full">
                      <button
                        onClick={() => {
                          if (!user) {
                            toast.error("You are not Signed In ", {
                              position: "top-right",
                            });
                            setIsProfileOpen(true);
                            setTimeout(() => {
                              setIsProfileOpen(false);
                            }, 10000);
                            return;
                          }

                          AddtoCart();
                        }}
                        disabled={product.quantity === 0 ? true : false}
                        className="w-full bg-[#FFD814] disabled:bg-gray-400 disabled:text-gray-600   text-black p-2 px-4 rounded-2xl font-bold hover:bg-[#2d1e5f] hover:text-white"
                      >
                        {product.quantity === 0
                          ? "Out Of Stock"
                          : "Add To Cart"}
                      </button>
                    </div>
                  </div>
                  <div className="w-full">
                    {product.quantity > 0 && (
                      <button
                        onClick={() => {
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
                          setIsSingleOrderFormOpen(true);
                          setSingleOrderProduct(product);
                          setIsProfileOpen(false);
                        }}
                        className="w-full bg-[#FFA41C] mb-3 text-black py-2 px-4 rounded-2xl font-bold hover:bg-[#2d1e5f] hover:text-white"
                      >
                        Buy Now
                      </button>
                    )}
                  </div>
                </div>
                <div className="hidden md:block">
                  <YouMightAlsoLike
                    allProducts={allProducts}
                    productId={productId}
                    product={product}
                    currency={currency}
                  />
                </div>
              </div>
              <ProductDetailReviewSection reviews={reviews} product={product} />
              <div className="md:hidden">
                <YouMightAlsoLike
                  allProducts={allProducts}
                  productId={productId}
                  product={product}
                  currency={currency}
                />
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
};

export default ProductDetailPage;
