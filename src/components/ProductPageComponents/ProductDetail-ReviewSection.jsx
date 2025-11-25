import PropTypes from "prop-types";
import { IoStar, IoStarOutline } from "react-icons/io5";
import parse from "html-react-parser";

const ProductDetailReviewSection = ({ reviews, product }) => {
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
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Details</h2>
        <div className="mt-4 text-sm sm:text-base leading-relaxed text-gray-600 dark:text-gray-300 prose dark:prose-invert max-w-none">
          {product?.description ? parse(product.description) : "No description available."}
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
