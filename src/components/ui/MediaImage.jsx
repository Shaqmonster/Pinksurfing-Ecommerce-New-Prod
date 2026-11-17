import React, { useCallback, useState } from "react";
import Skeleton from "./Skeleton";

/**
 * Image with optional skeleton overlay.
 *
 * fill=true → absolute inset-0 (must sit inside a sized relative parent).
 * Never combine `relative` + `absolute` on the wrapper — Tailwind conflict
 * collapses height to 0 and images become invisible.
 *
 * fallback: rendered instead of the image if it fails to load (a broken URL otherwise leaves an
 * empty tile).
 */
export default function MediaImage({
  src,
  alt = "",
  className = "",
  skeletonClassName = "",
  fill = false,
  fallback = null,
  ...props
}) {
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [failedSrc, setFailedSrc] = useState(null);

  const markReady = useCallback((node) => {
    if (!node) return;
    if (node.complete && node.naturalWidth > 0) {
      setShowSkeleton(false);
    }
  }, []);

  const wrapperClass = fill
    ? `absolute inset-0 overflow-hidden ${skeletonClassName}`
    : `relative overflow-hidden ${skeletonClassName}`;

  if (fallback && failedSrc && failedSrc === src) {
    return fallback;
  }

  return (
    <div className={wrapperClass}>
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
        className={
          fill
            ? `absolute inset-0 z-0 h-full w-full object-cover ${className}`
            : `relative z-0 h-full w-full object-cover ${className}`
        }
        onLoad={() => setShowSkeleton(false)}
        onError={() => {
          setShowSkeleton(false);
          setFailedSrc(src);
        }}
        {...props}
      />
    </div>
  );
}
