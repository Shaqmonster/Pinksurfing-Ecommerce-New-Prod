import React, { useContext, useEffect, useRef, useState } from "react";
import { authContext } from "../context/authContext";
import { dataContext } from "../context/dataContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import ProductCard from "../components/ProductCard";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import PageSEO from "../components/PageSEO";
import EmptyState from "../components/ui/EmptyState";
import { ProductCardSkeleton } from "../components/ui/Skeleton";

const SKELETON_COUNT = 8;
const GRID_CLASS =
  "grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 pb-10";

const SearchPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { search, setSearch } = useContext(authContext);
  const { products, setProducts } = useContext(dataContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const requestIdRef = useRef(0);

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
    const query = (search || "").trim();
    const requestId = ++requestIdRef.current;

    if (!query) {
      setLoading(false);
      setError(null);
      setProducts([]);
      return;
    }

    const getAllProducts = async () => {
      setLoading(true);
      setError(null);
      setProducts([]);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_SERVER_URL}/api/product/filter-products/?search=${encodeURIComponent(query)}`,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        if (requestId !== requestIdRef.current) return;
        const data = Array.isArray(response.data) ? response.data : [];
        setProducts(data);
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        console.error(err);
        setProducts([]);
        setError("We couldn't load search results. Please try again.");
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    };

    getAllProducts();
  }, [search, setProducts]);

  const query = (search || "").trim();
  const resultCount = Array.isArray(products) ? products.length : 0;

  return (
    <div className="w-full min-h-screen bg-[var(--ps-bg)] text-white">
      <PageSEO title="Search" path="/search" noindex />
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-12 pt-6 pb-16">
        <header className="mb-6 sm:mb-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 min-h-[44px] text-sm text-[var(--ps-muted)] hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ps-cyan)] rounded-lg"
            aria-label="Go back"
          >
            <ArrowLeftIcon className="w-5 h-5" aria-hidden="true" />
            Back
          </button>

          <div className="mt-4 flex flex-col gap-1">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
              Search
            </h1>
            {query ? (
              <p className="text-sm sm:text-base text-[var(--ps-muted)]">
                {loading ? (
                  <>Looking for &ldquo;{query}&rdquo;&hellip;</>
                ) : error ? (
                  <>Couldn&apos;t search for &ldquo;{query}&rdquo;</>
                ) : (
                  <>
                    {resultCount} result{resultCount === 1 ? "" : "s"} for &ldquo;
                    {query}&rdquo;
                  </>
                )}
              </p>
            ) : (
              <p className="text-sm sm:text-base text-[var(--ps-muted)]">
                Find products across PinkSurfing.
              </p>
            )}
          </div>
        </header>

        {loading ? (
          <div className={GRID_CLASS} aria-busy="true" aria-live="polite">
            {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <EmptyState
            title="Something went wrong"
            description={error}
            actionLabel="Return home"
            actionHref="/"
            className="mt-8"
          />
        ) : resultCount > 0 ? (
          <div className={GRID_CLASS}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} isCard={true} />
            ))}
          </div>
        ) : query ? (
          <EmptyState
            title="No products found"
            description={`We couldn't find anything matching "${query}". Try different keywords or browse the mall.`}
            actionLabel="Return home"
            actionHref="/"
            className="mt-8"
          />
        ) : (
          <EmptyState
            title="Start searching"
            description="Use the search bar to find products across PinkSurfing."
            actionLabel="Return home"
            actionHref="/"
            className="mt-8"
          />
        )}
      </div>
    </div>
  );
};

export default SearchPage;
