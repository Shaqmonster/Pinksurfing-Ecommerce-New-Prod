import React, { useCallback, useState } from "react";
import Skeleton from "./Skeleton";

/**
 * Fills its wrapper; skeleton overlays until pixels are ready.
 * Img stays mounted and visible — never gated behind opacity-0.
 */
export default function MediaImage({
  src,
  alt = "",
  className = "",
  skeletonClassName = "",
  ...props
}) {
  const [showSkeleton, setShowSkeleton] = useState(true);

  const markReady = useCallback((node) => {
    if (!node) return;
    if (node.complete && node.naturalWidth > 0) {
      setShowSkeleton(false);
    }
  }, []);

  return (
    <div className={`relative overflow-hidden ${skeletonClassName}`}>
      {showSkeleton && (
        <div className="absolute inset-0 z-[1]" aria-hidden>
          <Skeleton className="h-full w-full" rounded="none" />
        </div>
      )}
      <img
        ref={markReady}
        key={src}
        src={src}
        alt={alt}
        className={`absolute inset-0 z-0 h-full w-full object-cover ${className}`}
        onLoad={() => setShowSkeleton(false)}
        onError={() => setShowSkeleton(false)}
        {...props}
      />
    </div>
  );
}
