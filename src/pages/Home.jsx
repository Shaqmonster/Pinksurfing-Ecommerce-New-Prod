import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import axios from "axios";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { authContext } from "../context/authContext";
import { dataContext } from "../context/dataContext";
import { Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import SearchForm from "../components/Search";
import { categories, subCategories } from "../utils/Categories";
import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";
import ChannelsForSale from "../components/ChannelsForSale";

const Home = () => {
  const navigate = useNavigate();
  const [cookies] = useCookies([]);
  const { setCategory, isDarkMode, user, currency } = useContext(authContext);
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [storeLoading, setStoreLoading] = useState(false);
  const fetchedCategories = [
    { id: 1, name: "Shop By Store" },
    { id: 2, name: "Trending Top Sales" },
    { id: 3, name: "Buyer's Choice" },
    { id: 4, name: "Pinksurfing finds" },
  ];
  const awsS3BaseUrl =
    "https://pinksurfing.s3.eu-central-1.amazonaws.com/pinksurfing/";

  useEffect(() => {
    const fetchStores = async () => {
      try {
        setStoreLoading(true);
        const storesResponse = await axios.get(
          `${import.meta.env.VITE_SERVER_URL}/api/vendor/all-stores/`,
          {
            headers: { "Content-Type": "application/json" },
          }
        );
        setStores(storesResponse.data.stores);
      } catch (error) {
        console.error(error);
      } finally {
        setStoreLoading(false);
      }
    };

    const fetchProducts = async () => {
      try {
        const productsResponse = await axios.get(
          `${import.meta.env.VITE_SERVER_URL}/api/product/all-products/`,
          {
            headers: { "Content-Type": "application/json" },
          }
        );
        console.log(productsResponse.data.Products);
        setProducts(productsResponse.data.Products);
      } catch (error) {
        console.error(error);
      }
    };

    fetchStores();
    fetchProducts();
  }, []);

  const searchProducts = async (subLink, address) => {
    axios
      .get(
        `${
          import.meta.env.VITE_SERVER_URL
        }/api/product/filter-products${subLink}`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.token}`,
          },
        }
      )
      .then((response) => {
        navigate(address);
        setProducts(response.data);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const calculateDiscount = (mrp, unitPrice) => {
    const numericMrp = Number(mrp);
    const numericUnitPrice = Number(unitPrice);
    if (isNaN(numericMrp) || isNaN(numericUnitPrice) || numericMrp === 0) {
      return 0;
    }
    return ((numericMrp - numericUnitPrice) / numericMrp) * 100;
  };

  const getDiscountedProducts = () => {
    return products.filter(
      (product) => calculateDiscount(product.mrp, product.unit_price) > 5
    );
  };

  const responsive = {
    superLargeDesktop: {
      breakpoint: { max: 4000, min: 3000 },
      items: 5,
    },
    desktop: {
      breakpoint: { max: 3000, min: 1024 },
      items: 3,
    },
    tablet: {
      breakpoint: { max: 1024, min: 464 },
      items: 2,
    },
    mobile: {
      breakpoint: { max: 464, min: 0 },
      items: 1,
    },
  };

  return (
    <>
      <SearchForm />
      <div
        className={`w-full min-h-screen flex flex-col ${
          isDarkMode ? "dark:bg-black" : "bg-white"
        }`}
      >
        <div className="w-full py-3 flex my-3 items-center gap-x-32 justify-between 2xl:justify-start flex-wrap px-[4.5%]">
          <div className="w-full grid grid-cols-1 my-3 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((item, index) => (
              <div
                onClick={() => {
                  if (item.id === 3) {
                    if (user.is_vendor) {
                      navigate(`/store/${user.vendor.slug}`);
                    } else {
                      toast.info(
                        "You do not have a store. Register on our vendor page."
                      );
                      setTimeout(() => {
                        window.open(
                          "https://vendors.pinksurfing.com",
                          "_blank"
                        );
                      }, 3000);
                    }
                  } else if (item.id === 1 || item.id === 2) {
                    setCategory("shoppingMall");
                    localStorage.setItem("category","shoppingMall");
                    localStorage.setItem("category_name", item.name);
                    navigate(`/categoryProducts`);
                  } else {
                    navigate(`/shoppingMall/all`);
                  }
                }}
                key={item.id + index}
                className=""
              >
                <div className="w-full sm:w-[330px] lg:w-[360px] h-[260px] flex flex-col items-center gap-1 text-black dark:text-[#f5f5f5] cursor-pointer">
                  <div className="w-full h-[85%] flex overflow-hidden p-0 items-center justify-center border border-pink-500 rounded-xl shadow-md bg-[#2d1e5f]">
                    <img
                      src={item.image}
                      className={`${
                        item.extraclass
                          ? item.extraclass
                          : "w-[45%] object-contain"
                      }`}
                      loading="lazy"
                    />
                  </div>
                  <p className="font-medium text-[18px]">{item.name}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 place-content-center gap-x-8 gap-y-5 mt-5 w-full flex-wrap pt-[3%] text-black dark:text-[#f5f5f5]">
            {subCategories.map((item, index) => (
              <div
                className="cursor-pointer"
                key={item.id + index}
                onClick={() => {
                  setCategory(item.category.toLowerCase());
                  localStorage.setItem("category", item.category.toLowerCase());
                  localStorage.setItem("category_name", item.name);
                  navigate(`/categoryProducts`);
                }}
              >
                <div className="w-full sm:w-[150px] h-[140px] flex flex-col items-center gap-1">
                  {item.id === "3" ? (
                    <a
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-[130px] sm:w-full h-full flex items-center justify-center shadow-md rounded-md border border-pink-500 overflow-hidden bg-[#2d1e5f]"
                    >
                      <img
                        src={item.image}
                        className={`${item.extraclass} rounded-md`}
                      />
                    </a>
                  ) : (
                    <Link
                      className="w-[130px] sm:w-full h-full flex items-center justify-center shadow-md rounded-md border border-pink-500 overflow-hidden bg-[#2d1e5f]"
                    >
                      <img
                        src={item.image}
                        className={`${item.extraclass} rounded-md`}
                      />
                    </Link>
                  )}
                  <p className="font-medium text-[15.6px]">{item.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Product Sliders */}
        {fetchedCategories.map((category, index) => (
          <div
            key={category.id}
            className="my-5 mx-5 text-black dark:text-slate-300"
          >
            <h2 className="text-2xl font-semibold mb-3 flex justify-between items-center capitalize">
              {category.name}
              <Link
                to={`/shopByStore`}
                className="px-6 py-1 border border-gray-300 text-xs rounded-lg hover:bg-gray-100 mr-10"
                style={{ background: "transparent" }}
              >
                View all
              </Link>
            </h2>
            {category.id === 1 && (
              <div>
                {storeLoading ? (
                  <div className="flex justify-center items-center">
                    <img
                      src="/loading.svg"
                      alt="loading"
                      className="w-[50px] h-[50px] sm:w-[70px] sm:h-[70px] object-contain"
                    />
                  </div>
                ) : (
                  <Carousel responsive={responsive} itemClass="p-2">
                    {stores.map((store, storeIndex) => (
                      <div key={storeIndex} className="p-2 w-full md:w-4/5 lg:w-10/12">
                        <Link
                          className="border border-gray-300 rounded-lg w-full h-full flex flex-col items-center gap-1 overflow-hidden cursor-pointer"
                          to={`/store/${store.slug}`}
                        >
                          <img
                            src={
                              store.store_image
                                ? `${awsS3BaseUrl}${store.store_image}`
                                : "https://media-cldnry.s-nbcnews.com/image/upload/t_nbcnews-fp-1024-512,f_auto,q_auto:best/newscms/2017_26/2053956/170627-better-grocery-store-main-se-539p.jpg"
                            }
                            alt={store.store_name}
                            className="w-full h-[180px] object-cover"
                          />
                        </Link>
                        <h3 className="mt-2 text-lg font-medium text-center">
                          {store.store_name}
                        </h3>
                      </div>
                    ))}
                  </Carousel>

                )}
              </div>
            )}
            {category.id === 2 && (
              <div>
                <Carousel responsive={responsive} itemClass="p-2">
                  {getDiscountedProducts().map((product, productIndex) => (
                    <div key={productIndex} className="p-2 w-full md:w-4/5 lg:w-10/12">
                      <Link
                        to={`/product/productDetail/${product.slug}?productId=${product.id}`}
                        className="border border-gray-300 rounded-lg w-full h-full flex flex-col items-center gap-1 overflow-hidden cursor-pointer"
                      >
                        <img
                          src={product.image1}
                          alt={product.title}
                          className="w-full h-[180px] object-cover"
                        />
                      </Link>
                      <div className="p-2 text-center">
                        <p className="font-medium text-[14px]">{product.name}</p>
                        <p className="text-[16px] font-semibold">
                          {currency}
                          {Number(product.unit_price).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </Carousel>
              </div>
            )}

          </div>
        ))}
        <ChannelsForSale />
      </div>
    </>
  );
};

export default Home;
