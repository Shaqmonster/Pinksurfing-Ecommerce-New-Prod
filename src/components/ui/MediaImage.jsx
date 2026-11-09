import React, { useEffect, useRef, useState } from "react";
import Skeleton from "./Skeleton";

/**
 * Image with skeleton until paint. Handles cached images where onLoad may not fire.
 */
export default function MediaImage({
  src,
  alt = "",
  className = "",
  skeletonClassName = "",
  ...props
}) {
  const imgRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [src]);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    if (img.complete && img.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [src]);

  return (
    <div className={`relative overflow-hidden ${skeletonClassName}`}>
      {!loaded && !failed && (
        <Skeleton className="absolute inset-0 h-full w-full" rounded="none" />
      )}
      {!failed && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className={`${className} transition-opacity duration-300 ${
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
