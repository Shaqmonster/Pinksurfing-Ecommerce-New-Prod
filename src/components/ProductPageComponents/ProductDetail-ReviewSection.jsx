import { useState } from "react";
import PropTypes from "prop-types";
import { IoStar, IoStarOutline } from "react-icons/io5";
import parse from "html-react-parser";

const ProductDetailReviewSection = ({ reviews, product }) => {
  const [activeTab, setActiveTab] = useState(1);

  // Use default reviews if the passed reviews array is empty
  const displayReviews =
    reviews.length > 0
      ? reviews
      : ProductDetailReviewSection.defaultProps.reviews;

  const Stars = ({ stars }) => {
    const ratingStars = Array.from({ length: 7 }, (elem, index) => (
      <span key={index}>
        {stars >= index + 1 ? (
          <IoStar className=" text-[27px] text-yellow-500 " />
        ) : (
          <IoStarOutline className=" text-[27px] text-yellow-500" />
        )}
      </span>
    ));
    return (
      <div className=" flex justify-evenly px-2 sm:px-4 items-center gap-3 sm:gap-5 mt-3 mb-4">
        {ratingStars}
      </div>
    );
  };

  return (
    <>
      <div className="flex flex-col">
        <div className="flex items-start justify-left border-b border-gray-400">
          <p
            onClick={() => setActiveTab(1)}
            className={`raleway cursor-pointer text-center text-[11px] md:text-[16px] 2xl:text-[20px] py-1.5 px-7 ${
              activeTab === 1 && "bg-white dark:text-black"
            }`}
          >
            Details
          </p>
          <p
            onClick={() => setActiveTab(2)}
            className={`raleway cursor-pointer text-center text-[11px] md:text-[16px] 2xl:text-[20px] py-1.5 px-7 ${
              activeTab === 2 && "bg-white dark:text-black"
            }`}
          >
            Reviews ({displayReviews.length})
          </p>
        </div>
      </div>
      {activeTab === 1 ? (
        <div className="flex flex-col text-xs sm:text-sm lg:p-7 py-3 lg:py-10 font-[400]">
          <div className="raleway text-[12px] md:text-[13.3px] 2xl:text-[14px]">
            {product?.description
              ? parse(product.description)
              : "No description available."}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-xs sm:text-sm lg:p-7 py-3 lg:py-10 font-[400]">
          {displayReviews.length > 0 ? (
            displayReviews.map((item, index) => (
              <div
                key={index}
                className="flex flex-col md:flex-row items-center justify-between shadow-sm shadow-black/30 bg-yellow-200 dark:bg-white/20 rounded-md my-2 md:w-[60%] p-5"
              >
                <div>
                  <p>
                    Comment:
                    <span className="ml-1 font-semibold">{item.title}</span>
                  </p>
                  <p className="flex items-center gap-1">
                    Rating:
                    <Stars stars={item?.rating} />({item?.rating})
                  </p>
                  <p>
                    Review:
                    <span className="ml-1 font-semibold">{item.comment}</span>
                  </p>
                </div>
                <div>
                  <p>
                    By:
                    <span className="ml-1 font-semibold">
                      {item?.userId?.name}
                    </span>
                  </p>
                  <p>
                    Date:
                    <span className="ml-1 font-semibold">
                      {item.createdAt.split("T")[0]}
                    </span>
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="raleway text-[12px] md:text-[13.3px] 2xl:text-[14px]">
              No reviews available.
            </p>
          )}
        </div>
      )}
    </>
  );
};

ProductDetailReviewSection.propTypes = {
  reviews: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      rating: PropTypes.number.isRequired,
      comment: PropTypes.string.isRequired,
      userId: PropTypes.shape({
        name: PropTypes.string.isRequired,
      }).isRequired,
      createdAt: PropTypes.string.isRequired,
    })
  ),
  product: PropTypes.shape({
    description: PropTypes.string,
  }),
};

ProductDetailReviewSection.defaultProps = {
  reviews: [
    {
      title: "Great Product",
      rating: 5,
      comment: "I loved this product. Highly recommend!",
      userId: { name: "John Doe" },
      createdAt: "2023-06-15T00:00:00Z",
    },
  ],
  product: {
    description:
      "<p>This is a <strong>great</strong> product for <em>everyone</em>.</p>",
  },
};

export default ProductDetailReviewSection;
