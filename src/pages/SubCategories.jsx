import { useEffect, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import axios from "axios";
import { authContext } from "../context/authContext";
import Header from "../components/Header";
import { dataContext } from "../context/dataContext";
import { ArrowLeftCircleIcon } from "@heroicons/react/24/outline";

const SubCategories = () => {
  const navigate = useNavigate();
  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const { category, setShopHeading } = useContext(authContext);
  const { setProducts } = useContext(dataContext);
  let localStorageCategory = localStorage.getItem("category");

  // search products ------------------------------------------------------------
  const searchProducts = async (subLink, address) => {
    setLoading(true);
    axios
      .get(
        `${import.meta.env.VITE_SERVER_URL}/api/product/filter-products${subLink}`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      .then((response) => {
        navigate(address);
        // console.log(response.data);
        setProducts(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  useEffect(() => {
    const GetSubCategories = async () => {
      setLoading(true);
      axios
        .get(`${import.meta.env.VITE_SERVER_URL}/api/product/subcategories/`, {
          headers: {
            "Content-Type": "application/json",
          },
        })
        .then((response) => {
          setSubCategories(response.data);
          setLoading(false);
        })
        .catch((error) => {
          console.error(error);
        });
    };
    GetSubCategories();

    if (category === "perfumes") {
      localStorage.setItem("subcategory", "perfumes");
      setShopHeading("perfumes");
      navigate("/shopByCategory");
    }
  }, [navigate, category]);

  return (
    <>

      <div className="w-full min-h-screen flex flex-col dark:bg-black dark:text-[#f5f5f5]">
        {/* categories-------------------------------------- */}
        <div className="w-full flex my-3 items-center gap-8 justify-between 2xl:justify-start relative flex-wrap px-[4.5%]">
          <h1 className="font-bold relative capitalize flex items-center gap-2 text-[24px] sm:text-[27px] text-purple-900 dark:text-purple-600">
            <ArrowLeftCircleIcon
              onClick={() => {
                navigate("/");
              }}
              className="cursor-pointer hidden lg:block w-[30px] dark:text-[#f5f5f5] left-[1.5%] top-1.5"
            />
            {category || localStorageCategory}{" "}
          </h1>
          {/* sub categories ------------------------------------ */}
          {!loading ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-10 place-content-center gap-x-8 gap-y-5 w-full flex-wrap text-black">
                {subCategories
                  .filter((i) => {
                    return i.category.name === (category || localStorageCategory);
                  })
                  .map((item, index) => {
                    return (
                      <div
                        className="cursor-pointer"
                        key={item.id || index}
                        onClick={() => {
                          searchProducts(
                            `/?subcategory=${item.slug}`,
                            "/shopByCategory"
                          );
                          localStorage.setItem("subcategory", item.slug);
                          setShopHeading(item.slug);
                        }}
                      >
                        <div className="w-full sm:w-[150px] flex flex-col items-center gap-1">
                          <div className="w-[130px] sm:w-full h-[120px] flex items-center justify-center rounded-md overflow-hidden bg-[#2d1e5f]">
                            <img
                              src={item.image || ""}
                              className={`${item.extraclass} w-[50%] object-contain rounded-md`}
                            />
                          </div>
                          <p className="font-medium dark:text-[#f5f5f5] capitalize text-center text-[15.6px]">
                            {item.name}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
              {subCategories.filter((i) => {
                return i.category.name === (category || localStorageCategory);
              }).length === 0 && (
                <p className="-mt-10 text-black dark:text-[#f5f5f5]">
                  No sub categories available in this category
                </p>
              )}
            </>
          ) : (
            <div className="lg:col-span-3 2xl:col-span-4 w-full h-full flex items-center justify-center">
              <img
                src="/loading.svg"
                alt="loading"
                className="w-[50px] h-[50px] sm:w-[70px] sm:h-[70px] object-contain"
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SubCategories;
