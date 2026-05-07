import React, { useState } from "react";
import PropTypes from "prop-types";
import { IoStar, IoStarOutline } from "react-icons/io5";
import { FaChevronDown } from "react-icons/fa";
import parse from "html-react-parser";

const ProductDetailReviewSection = ({ reviews, product }) => {
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const displayReviews = reviews?.length ? reviews : [];

  const renderStars = (value = 0) =>
    Array.from({ length: 5 }, (_, index) =>
      value >= index + 1 ? (
        <IoStar key={index} className="text-lg text-yellow-400" />
      ) : (
        <IoStarOutline key={index} className="text-lg text-yellow-400" />
      )
    );

  return (
    <section className="space-y-10" id="product-details">
      {/* Redesigned Collapsible Details */}
      <div className="relative overflow-hidden bg-white dark:bg-gray-900/40 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-xl transition-all duration-500">
        <button
          onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
          className="w-full flex items-center justify-between p-8 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 text-purple-500">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </div>
            <div className="text-left">
              <h2 className="text-lg font-black uppercase tracking-tight text-gray-900 dark:text-white">Product Details</h2>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Comprehensive Overview</p>
            </div>
          </div>
          <div className={`w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center transition-transform duration-300 ${isDetailsExpanded ? 'rotate-180' : ''}`}>
            <FaChevronDown className="w-4 h-4 text-gray-500" />
          </div>
        </button>

        <div className={`px-8 pb-8 transition-all duration-500 ease-in-out ${isDetailsExpanded ? 'max-h-[5000px] opacity-100 text-white' : 'max-h-0 opacity-0 overflow-hidden'}`}>
          <div className="pt-6 border-t border-gray-100 dark:border-white/5
            text-sm sm:text-base leading-relaxed text-gray-600 dark:text-gray-300 
            [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4
            [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4
            [&_li]:mb-2 [&_strong]:font-black [&_strong]:text-gray-900 dark:[&_strong]:text-white
            [&_h1]:text-2xl [&_h1]:font-black [&_h1]:tracking-tighter [&_h1]:mb-4
            [&_h2]:text-xl [&_h2]:font-black [&_h2]:tracking-tighter [&_h2]:mb-4
            [&_h3]:text-lg [&_h3]:font-black [&_h3]:tracking-tighter [&_h3]:mb-2
            [&_a]:text-purple-600 [&_a]:underline transition-all
          ">
            {product?.description ? parse(product.description) : "No description available."}
          </div>
        </div>
      </div>

      <div id="product-reviews">
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Reviews</h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {displayReviews.length} {displayReviews.length === 1 ? "review" : "reviews"}
          </span>
        </div>

        {displayReviews.length ? (
          <div className="mt-6 space-y-6">
            {displayReviews.map((item, index) => (
              <article key={`${item?.id || index}-${item?.customer}`} className="pb-6 border-b border-gray-200 dark:border-gray-800 last:border-b-0 last:pb-0">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    {item?.customer || item?.userId?.name || "Verified Buyer"}
                  </p>
                  <time className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {item?.created_at?.split("T")[0] || "—"}
                  </time>
                </div>

                <div className="flex items-center gap-1 mt-3">{renderStars(item?.rating)}</div>

                {item?.title && (
                  <p className="mt-3 font-medium text-gray-900 dark:text-gray-100">
                    {item.title}
                  </p>
                )}

                {item?.body && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    {item.body}
                  </p>
                )}
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-5 text-sm text-gray-500 dark:text-gray-400">
            No reviews available yet. Be the first to share your experience.
          </p>
        )}
      </div>
    </section>
  );
};

ProductDetailReviewSection.propTypes = {
  reviews: PropTypes.array,
  product: PropTypes.shape({
    description: PropTypes.string,
  }),
};

ProductDetailReviewSection.defaultProps = {
  reviews: [],
  product: {
    description: "",
  },
};

export default ProductDetailReviewSection;
