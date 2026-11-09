import { FaStar } from "react-icons/fa";
import { IoStarOutline } from "react-icons/io5";
import React from "react";

const Stars = ({ stars = 0 }) => {
  const value = Number(stars) || 0;
  const ratingStars = Array.from({ length: 5 }, (_, index) => (
    <span key={index} aria-hidden="true">
      {value >= index + 1 ? (
        <FaStar className="text-[var(--ps-primary)]" />
      ) : (
        <IoStarOutline className="text-[var(--ps-dim)]" />
      )}
    </span>
  ));

  return (
    <div
      className="flex items-center gap-0.5"
      role="img"
      aria-label={`${Math.min(5, Math.max(0, value))} out of 5 stars`}
    >
      {ratingStars}
    </div>
  );
};

export default Stars;
