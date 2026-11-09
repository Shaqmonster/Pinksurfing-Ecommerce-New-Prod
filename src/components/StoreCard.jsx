import React from "react";
import { Link } from "react-router-dom";
import { IoArrowForward } from "react-icons/io5";

const StoreCard = ({ store }) => {
  const awsS3BaseUrl = "https://pinksurfing-ecom.s3.us-east-2.amazonaws.com/";

  const storeImage = store.store_image
    ? store.store_image.startsWith("http")
      ? store.store_image
      : `${awsS3BaseUrl}${store.store_image}`
    : "/brand/hero-shop-by-store.jpg";

  return (
    <Link to={`/store/${store.slug}`} className="block group">
      <article className="relative overflow-hidden rounded-2xl border border-[var(--ps-brd)] bg-[var(--ps-card)] transition-colors duration-ps-normal hover:border-[color-mix(in_srgb,var(--ps-primary)_40%,transparent)]">
        <div className="relative h-[160px] overflow-hidden bg-[var(--ps-surf)]">
          <img
            src={storeImage}
            alt={store.store_name}
            className="w-full h-full object-cover transition-transform duration-ps-moderate ease-ps-standard group-hover:scale-[1.03]"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-base font-semibold text-white line-clamp-1">
              {store.store_name}
            </h3>
            <span className="mt-1 inline-flex items-center gap-1 text-sm text-[var(--ps-purple-light)]">
              Visit store
              <IoArrowForward className="text-xs transition-transform duration-ps-instant group-hover:translate-x-0.5" aria-hidden="true" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
};

export default StoreCard;
