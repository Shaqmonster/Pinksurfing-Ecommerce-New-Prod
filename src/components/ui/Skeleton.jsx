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
    <div className="rounded-2xl border border-[var(--ps-brd)] bg-[var(--ps-card)] overflow-hidden flex flex-col h-full">
      <Skeleton className="aspect-[4/3] w-full rounded-none" rounded="none" />
      <div className="p-3 sm:p-3.5 space-y-2.5 flex-1 flex flex-col">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-[88%]" />
        <div className="mt-auto flex items-center justify-between gap-3 pt-1">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-11 w-11 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
