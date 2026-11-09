import React from "react";

/**
 * Loading skeleton — prefers shimmer over spinner (CORE motion rules).
 */
export default function Skeleton({ className = "", rounded = "xl" }) {
  return (
    <div
      className={[
        "ps-skeleton",
        rounded === "full" ? "rounded-full" : `rounded-${rounded}`,
        className,
      ].join(" ")}
      aria-hidden="true"
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl border border-[var(--ps-brd)] bg-[var(--ps-card)] p-3 space-y-3">
      <Skeleton className="h-[200px] w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}
