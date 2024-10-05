import { useState } from "react";
import { Tab } from "@headlessui/react";
import React, { useContext } from "react";
import { useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { useNavigate } from "react-router-dom";
function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Tabs() {
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [activeTab, setActiveTab] = useState({ index: 0, name: "" });
  const navigate = useNavigate();
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
          setActiveTab(categories[0].name);
          console.log(response.data);
        })
        .catch((error) => {
          console.error(error);
        });
    };
    GetCategories();
  }, [navigate]);

  return (
    <div className="w-full  px-2 py-1 sm:px-0">
      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-[#2d1e5f] p-1">
          {categories.map((category, index) => (
            <Tab
              onClick={() => {
                setActiveTab(category.name);
              }}
              key={category + index}
              className={({ selected }) =>
                classNames(
                  "w-full rounded-lg py-2.5 text-sm font-medium leading-5",
                  " focus:outline-none ",
                  selected
                    ? "bg-white text-purple-900 shadow"
                    : "text-blue-100 hover:bg-white/[0.12] hover:text-white"
                )
              }
            >
              {category.name}
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels className="mt-2">
          <Tab.Panel
            className={classNames(
              "rounded-xl bg-white p-3",
              " ring-offset-2 grid grid-cols-3  focus:outline-none focus:ring-2"
            )}
          >
            {subCategories.map((item, idx) => {
              return (
                <ul>
                  <div key={idx}>
                    {item.category.name === activeTab && (
                      <li className="relative rounded-md p-3 hover:bg-gray-200">
                        <h3 className="text-sm font-medium leading-5">
                          {item.name}
                        </h3>
                        <a
                          href="#"
                          className={classNames(
                            "absolute inset-0 rounded-md",
                            "ring-blue-400 focus:z-10 focus:outline-none focus:ring-2"
                          )}
                        />
                      </li>
                    )}
                  </div>
                </ul>
              );
            })}
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}
