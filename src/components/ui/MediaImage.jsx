import React, { useState } from "react";
import Skeleton from "./Skeleton";

/**
 * Image with skeleton placeholder until load — keeps grids from popping empty then jumping.
 */
export default function MediaImage({
  src,
  alt = "",
  className = "",
  skeletonClassName = "",
  ...props
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div className={`relative overflow-hidden ${skeletonClassName}`}>
      {!loaded && !failed && <Skeleton className="absolute inset-0 h-full w-full" rounded="none" />}
      {!failed && (
        <img
          src={src}
          alt={alt}
          className={`${className} transition-opacity duration-ps-normal ease-ps-standard ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setLoaded(true)}
          onError={() => {
            setFailed(true);
            setLoaded(true);
          }}
          {...props}
        />
      )}
      {failed && (
        <div className="absolute inset-0 bg-[var(--ps-surf)]" aria-hidden />
      )}
    </div>
  );
}
