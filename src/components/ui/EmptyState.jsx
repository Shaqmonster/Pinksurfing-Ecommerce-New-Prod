import React from "react";
import PsButton from "./PsButton";

/**
 * Shared empty state — title, support copy, optional primary action.
 */
export default function EmptyState({
  title = "Nothing here yet",
  description,
  actionLabel,
  onAction,
  actionHref,
  className = "",
}) {
  return (
    <div
      className={[
        "flex flex-col items-center justify-center text-center gap-3 py-12 px-6",
        className,
      ].join(" ")}
      role="status"
    >
      <h3 className="text-[var(--ps-text-title-lg)] font-semibold text-[var(--ps-white)] leading-[var(--ps-leading-title-lg)]">
        {title}
      </h3>
      {description ? (
        <p className="max-w-md text-[var(--ps-text-body)] text-[var(--ps-muted)] leading-[var(--ps-leading-body)]">
          {description}
        </p>
      ) : null}
      {actionLabel && (onAction || actionHref) ? (
        actionHref ? (
          <a href={actionHref}>
            <PsButton>{actionLabel}</PsButton>
          </a>
        ) : (
          <PsButton onClick={onAction}>{actionLabel}</PsButton>
        )
      ) : null}
    </div>
  );
}
