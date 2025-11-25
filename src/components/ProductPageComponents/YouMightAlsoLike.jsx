import React from "react";
import { Link } from "react-router-dom";

const YouMightAlsoLike = ({ allProducts, productId, currency }) => {
  if (!allProducts || allProducts.length <= 1) {
    return null;
  }

  const curatedProducts = allProducts
    ?.filter((product) => product.id !== productId)
    .slice(0, 6);

  const calculateDiscount = (mrp, unitPrice) => {
    const numericMrp = Number(mrp);
    const numericUnitPrice = Number(unitPrice);
    if (isNaN(numericMrp) || isNaN(numericUnitPrice) || numericMrp === 0) {
      return 0;
    }
    return ((numericMrp - numericUnitPrice) / numericMrp) * 100;
  };

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">You might also like</h2>
        <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Curated for you
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {curatedProducts.map((product) => {
          const discountPercentage = calculateDiscount(product.mrp, product.unit_price);

          return (
            <Link
              key={product.id}
              to={`/product/productDetail/${product.slug}?productId=${product.id}`}
              className="group rounded-[28px] border border-white/20 bg-white/30 dark:bg-white/5 backdrop-blur-2xl shadow-lg shadow-purple-200/40 dark:shadow-black/40 hover:scale-[1.01] hover:shadow-purple-300/60 transition relative overflow-hidden"
            >
              <div className="relative bg-white/40 dark:bg-white/5 flex items-center justify-center">
                <img
                  className="h-48 w-full object-contain p-6 transition-transform duration-300 group-hover:scale-105"
                  src={
                    product.image1 ||
                    "https://w7.pngwing.com/pngs/1008/139/png-transparent-cosmetics-advertising-cosmetics-advertising-beauty-others.png"
                  }
                  alt={product.name}
                  loading="lazy"
                />
                {discountPercentage > 0 && (
                  <span className="absolute top-4 left-4 px-2 py-1 text-xs font-semibold bg-purple-600 text-white rounded-full">
                    {discountPercentage.toFixed(0)}% off
                  </span>
                )}
              </div>

              <div className="p-6 space-y-3">
                <p className="text-sm font-semibold text-gray-900 dark:text-white min-h-[38px] leading-snug">
                  {product.name}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                    {currency}{Number(product.unit_price).toFixed(2)}
                  </span>
                  {discountPercentage > 0 && (
                    <>
                      <span className="text-sm text-gray-400 line-through">
                        {currency}{Number(product.mrp).toFixed(2)}
                      </span>
                    </>
                  )}
                </div>
                <span className="inline-flex text-xs font-semibold text-purple-600 dark:text-purple-300">
                  View details →
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default YouMightAlsoLike;
