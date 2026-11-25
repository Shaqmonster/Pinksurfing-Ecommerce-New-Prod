import React from "react";
import PsButton from "./PsButton";

/**
 * Shown when data failed to load — never an empty state in disguise.
 * Says what happened in plain words and offers a retry.
 */
export default function ErrorState({
  title = "We couldn't load this",
  description = "Check your connection and try again.",
  onRetry,
  retryLabel = "Try again",
  className = "",
}) {
  return (
    <div
      role="alert"
      className={[
        "flex flex-col items-center justify-center text-center gap-3 py-12 px-6",
        className,
      ].join(" ")}
    >
      <h3 className="text-[var(--ps-text-title-lg)] font-semibold text-ink leading-[var(--ps-leading-title-lg)]">
        {title}
      </h3>
      {description ? (
        <p className="max-w-md text-[var(--ps-text-body)] text-ps-fg2 leading-[var(--ps-leading-body)]">
          {description}
        </p>
      ) : null}
      {onRetry ? (
        <PsButton variant="secondary" onClick={onRetry}>
          {retryLabel}
        </PsButton>
      ) : null}
    </div>
  );
}
