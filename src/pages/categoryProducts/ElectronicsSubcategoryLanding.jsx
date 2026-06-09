import { useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { ChevronRightIcon } from "@heroicons/react/20/solid";
import { authContext } from "../../context/authContext";
import {
  getElectronicsSubMeta,
  sortElectronicsSubcategories,
} from "../../constants/electronicsSubcategories";

export default function ElectronicsSubcategoryLanding() {
  const navigate = useNavigate();
  const { isDarkMode } = useContext(authContext);
  const [loading, setLoading] = useState(true);
  const [subcategories, setSubcategories] = useState([]);
  const [productCounts, setProductCounts] = useState({});

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const base = import.meta.env.VITE_SERVER_URL;

      try {
        const [schemaRes, dbRes, productsRes] = await Promise.all([
          axios.get(`${base}/api/product/schema/subcategories/electronics/`),
          axios.get(`${base}/api/product/subcategories/electronics/`).catch(() => ({ data: [] })),
          axios.get(`${base}/api/product/category-products/electronics/`).catch(() => ({ data: [] })),
        ]);

        if (cancelled) return;

        const schemaSubs = schemaRes.data?.subcategories || schemaRes.data || [];
        const dbSubs = Array.isArray(dbRes.data) ? dbRes.data : [];
        const dbBySlug = Object.fromEntries(dbSubs.map((s) => [s.slug, s]));

        const merged = schemaSubs.map((sub) => {
          const slug = sub.id || sub.slug;
          const db = dbBySlug[slug];
          return {
            slug,
            name: sub.name || db?.name || slug,
            image: db?.image || null,
          };
        });

        setSubcategories(sortElectronicsSubcategories(merged));

        const counts = {};
        (productsRes.data || []).forEach((product) => {
          const slug = product?.subcategory?.slug;
          if (slug) counts[slug] = (counts[slug] || 0) + 1;
        });
        setProductCounts(counts);
      } catch (error) {
        console.error(error);
        if (!cancelled) setSubcategories([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalProducts = useMemo(
    () => Object.values(productCounts).reduce((sum, n) => sum + n, 0),
    [productCounts]
  );

  return (
    <div
      className={`min-h-screen ${
        isDarkMode
          ? "dark bg-[#0A0B0E]"
          : "bg-gradient-to-br from-slate-50 via-white to-purple-50"
      }`}
    >
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      <main className="relative z-10 max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
          <Link to="/" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
            Home
          </Link>
          <ChevronRightIcon className="w-4 h-4" />
          <span className="text-purple-600 dark:text-purple-400 font-medium">Electronics</span>
        </nav>

        <div className="glass-card p-5 sm:p-6 rounded-2xl mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shrink-0">
              <span className="text-white text-2xl">⚡</span>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Electronics
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Choose a category to browse components, memory, storage, and more
                {!loading && totalProducts > 0 && (
                  <span className="ml-2 inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                    {totalProducts} listings
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <img src="/loading.svg" alt="Loading" className="w-14 h-14 object-contain" />
          </div>
        ) : subcategories.length === 0 ? (
          <div className="glass-card rounded-2xl p-10 text-center">
            <p className="text-gray-600 dark:text-gray-400">No subcategories available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {subcategories.map((sub) => {
              const meta = getElectronicsSubMeta(sub.slug);
              const count = productCounts[sub.slug] || 0;

              return (
                <button
                  key={sub.slug}
                  type="button"
                  onClick={() => navigate(`/category/electronics/${sub.slug}`)}
                  className="group text-left rounded-2xl overflow-hidden border border-white/10 bg-white/70 dark:bg-gray-900/60 backdrop-blur-md shadow-lg hover:shadow-xl hover:shadow-purple-500/15 hover:-translate-y-1 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                >
                  <div
                    className={`relative h-32 sm:h-36 bg-gradient-to-br ${meta.gradient} flex items-center justify-center overflow-hidden`}
                  >
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                    {sub.image ? (
                      <img
                        src={sub.image}
                        alt=""
                        className="relative z-[1] w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <span className="relative z-[1] text-5xl drop-shadow-lg group-hover:scale-110 transition-transform duration-300">
                        {meta.icon}
                      </span>
                    )}
                    {count > 0 && (
                      <span className="absolute top-3 right-3 z-[2] px-2.5 py-1 rounded-full text-xs font-semibold bg-black/50 text-white backdrop-blur-sm">
                        {count} {count === 1 ? "item" : "items"}
                      </span>
                    )}
                  </div>

                  <div className="p-4 sm:p-5">
                    <h2 className="font-semibold text-gray-900 dark:text-white text-base sm:text-lg group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      {sub.name}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 line-clamp-2">
                      {meta.description}
                    </p>
                    <span className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-purple-600 dark:text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      Browse
                      <ChevronRightIcon className="w-4 h-4" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>

      <style jsx>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        .dark .glass-card {
          background: rgba(17, 24, 39, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
}
