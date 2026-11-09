import React, { useContext, useEffect, useState } from "react";
import { authContext } from "../context/authContext";
import { dataContext } from "../context/dataContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import ProductCard from "../components/ProductCard";
import { ArrowLeftCircleIcon } from "@heroicons/react/24/outline";
import PageSEO from "../components/PageSEO";
import EmptyState from "../components/ui/EmptyState";

const SearchPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { search, setSearch } = useContext(authContext);
  const { products, setProducts } = useContext(dataContext);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q != null && q !== search) {
      setSearch(q);
    }
    // Sync URL → context once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const urlQ = searchParams.get("q") ?? "";
    if (search === urlQ) return;
    if (search) {
      setSearchParams({ q: search }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }, [search, searchParams, setSearchParams]);

  useEffect(() => {
    const getAllProducts = async () => {
      setLoading(true);
      if (search === "") {
        setLoading(false);
        setProducts([]);
        return;
      }
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_SERVER_URL}/api/product/filter-products/?search=${search}`,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        setProducts(response.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    getAllProducts();
  }, [search, setProducts]);

  return (
    <div className="w-full min-h-screen dark:bg-[#0E0F13] bg-white flex flex-col">
      <PageSEO title="Search" path="/search" noindex />
      <div className="flex relative flex-col w-full h-full px-[2%] 2xl:px-[4.5%]">
        <h2 className="font-bold text-[24px] sm:text-[27px] flex items-center gap-2 text-purple-900 dark:text-purple-600">
          <ArrowLeftCircleIcon
            onClick={() => navigate(-1)}
            className="cursor-pointer block w-[27px] sm:w-[30px] dark:text-[#f5f5f5] top-1.5"
          />
          Search Page
        </h2>
        <svg
          className="fixed top-0 right-0 z-[0] pointer-events-none"
          width="536"
          height="1071"
          viewBox="0 0 536 1071"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g filter="url(#filter0_f_1_3190)">
            <circle cx="535.5" cy="535.5" r="207.5" fill="#8B33FE" fillOpacity="0.4" />
          </g>
          <defs>
            <filter
              id="filter0_f_1_3190"
              x="0"
              y="0"
              width="1071"
              height="1071"
              filterUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB"
            >
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
              <feGaussianBlur stdDeviation="164" result="effect1_foregroundBlur_1_3190" />
            </filter>
          </defs>
        </svg>
        <div className="bg-white dark:bg-[#0E0F13]">
          <div className="w-full sm:py-0 sm:pb-10 lg:px-0">
            {!loading ? (
              products.length > 0 ? (
                <div className="grid grid-cols-2 pb-6 sm:grid-cols-3 lg:grid-cols-4 gap-y-2.5 gap-x-0.5 lg:gap-x-2 lg:items-center lg:justify-start flex-wrap">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} isCard={true} />
                  ))}
                </div>
              ) : search ? (
                <EmptyState
                  title="No products found"
                  description={`We couldn't find anything matching "${search}". Try different keywords or browse the mall.`}
                  actionLabel="Return home"
                  actionHref="/"
                  className="mt-[8%]"
                />
              ) : (
                <EmptyState
                  title="Start searching"
                  description="Use the search bar to find products across PinkSurfing."
                  actionLabel="Return home"
                  actionHref="/"
                  className="mt-[8%]"
                />
              )
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
