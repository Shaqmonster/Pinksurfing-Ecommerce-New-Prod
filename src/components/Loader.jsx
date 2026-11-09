import React from "react";

const Loader = ({ className = "" }) => {
  return (
    <div
      className={[
        "h-12 w-12 animate-spin rounded-full border-4 border-solid border-[var(--ps-surf)] border-t-[var(--ps-primary)]",
        className,
      ].join(" ")}
      role="status"
      aria-label="Loading"
    />
  );
};

export default Loader;
