import React, { useContext, useEffect, useState } from "react";
import { authContext } from "../context/authContext";
import { dataContext } from "../context/dataContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../components/Header";
import ProductCard from "../components/ProductCard";
import { toast } from "react-toastify";
import { ArrowLeftCircleIcon } from "@heroicons/react/24/outline";
import SearchForm from "../components/Search";

const SearchPage = ({ }) => {
  const navigate = useNavigate();
  const { search } = useContext(authContext);
  const { products, setProducts } = useContext(dataContext);
  const [loading, setLoading] = useState(false);
  console.log(search);
  useEffect(() => {
    const getAllProducts = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_SERVER_URL}/api/product/filter-products/?search=${search}`,
          {
            headers: {
              "Content-Type": "application/json",
            }
          }
        );
        console.log(response.data);
        setProducts(response.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    getAllProducts();
  }, [search]);

  return (
    <div className="w-full min-h-screen dark:bg-black flex flex-col">
      <SearchForm />
      <div className="flex relative flex-col w-full h-full px-[2%] 2xl:px-[4.5%]">
        <h2 className="font-bold text-[24px] sm:text-[27px] flex items-center gap-2 text-purple-900 dark:text-purple-600">
          <ArrowLeftCircleIcon
            onClick={() => navigate(-1)}
            className="cursor-pointer block w-[27px] sm:w-[30px] dark:text-[#f5f5f5] top-1.5"
          />
          Search Page
        </h2>
        <div className="bg-white dark:bg-black">
          <div className="w-full sm:py-0 sm:pb-10 lg:px-0">
            {!loading ? (
              <div className="grid grid-cols-2 pb-6 sm:grid-cols-3 lg:grid-cols-4 gap-y-2.5 gap-x-0.5 lg:gap-x-2 lg:items-center lg:justify-start flex-wrap">
                {products.length > 0 ? (
                  products.map((product) => (
                    <ProductCard key={product.id} product={product} isCard={true} />
                  ))
                ) : (
                  <p className="w-full text-center mt-[10%] text-[15px] dark:text-[#f5f5f5]">
                    No Products Found
                  </p>
                )}
              </div>
            ) : (
              <div className="lg:col-span-3 2xl:col-span-4 flex items-center justify-center">
                <img
                  src="/loading.svg"
                  alt="loading"
                  className="w-[50px] h-[50px] sm:w-[70px] sm:h-[70px] object-contain"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
