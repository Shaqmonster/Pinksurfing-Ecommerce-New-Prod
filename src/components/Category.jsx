import { useContext, useState } from "react";
import React from "react";
import { useEffect } from "react";
import { toast } from "react-toastify";
import { Menu } from "@headlessui/react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { dataContext } from "../context/dataContext";
import { authContext } from "../context/authContext";
function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

const Category = () => {
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [activeTab, setActiveTab] = useState({ index: 0, name: "" });
  const navigate = useNavigate();
  const { searchProducts } = useContext(dataContext);
  const { setShopHeading } = useContext(authContext);
  useEffect(() => {
    const GetCategories = async () => {
      axios
        .get(`${import.meta.env.VITE_SERVER_URL}/api/product/categories/`, {
          headers: {
            "Content-Type": "application/json",
          },
        })
        .then((response) => {
          setCategories(response.data);
          setActiveTab(response.data[0].slug);
        })
        .catch((error) => {
          console.error(error);
        });
      axios
        .get(`${import.meta.env.VITE_SERVER_URL}/api/product/subcategories/`, {
          headers: {
            "Content-Type": "application/json",
          },
        })
        .then((response) => {
          setSubCategories(response.data);
          // setActiveTab(categories[0]?.name);
          // console.log(response.data);
        })
        .catch((error) => {
          console.error(error);
        });
    };
    GetCategories();
  }, [navigate]);

  return (
    <div className=" w-full shadow-md dark:bg-black dark:text-[#f5f5f5] dark:shadow-white/20  shadow-black/20  overflow-hidden">
      <div className="flex flex-col m-auto ">
        <div className="flex overflow-x-scroll px-[1%] hide-scroll-bar">
          {categories?.map((category, index) => {
            return (
              <Menu key={index + category.name}>
                <Menu.Button
                  onClick={() => {
                    if (category.slug === "perfumes") {
                      localStorage.setItem("subcategory", "perfumes");
                      setShopHeading("perfumes");
                      navigate("/shopByCategory");
                    }
                    setActiveTab(category.slug);
                  }}
                  className="w-max px-3 py-1 text-[14.2px] sm:text-[14.2px] hover:bg-gray-200 dark:hover:bg-white/20 "
                >
                  <img
                    className=" w-full object-contain h-[25px]"
                    alt="img"
                    src="/signin.jpg"
                  />
                  <p>{category?.name}</p>
                </Menu.Button>
                <Menu.Items className="grid grid-cols-3 flex-col py-3 px-6 z-50 min-w-fit w-max-full bg-[#2d1e5f] dark:border-2 dark:border-purple-300 absolute top-12">
                  {subCategories
                    .filter((i) => {
                      return i.category.name === activeTab;
                    })
                    .map((item, index) => {
                      return (
                        <div className=" py-0.5" key={item + index}>
                          <Menu.Item>
                            {({ active }) => (
                              <p
                                onClick={() => {
                                  localStorage.setItem(
                                    "subcategory",
                                    item.slug
                                  );
                                  searchProducts(
                                    `/?subcategory=${item.slug}`,
                                    "/shopByCategory"
                                  );
                                  setShopHeading(item.slug);
                                }}
                                className={` py-1 px-2 cursor-pointer rounded-sm ${
                                  active &&
                                  "hover:bg-gray-200 dark:hover:text-[#2d1e5f] "
                                }`}
                              >
                                {item.name}
                              </p>
                            )}
                          </Menu.Item>
                        </div>
                      );
                    })}
                </Menu.Items>
              </Menu>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Category;
