import React from "react";

/**
 * Icon control with native title + accessible name (premium icon-first chrome).
 */
export default function IconTip({
  label,
  children,
  className = "",
  as: Comp = "button",
  type = "button",
  ...props
}) {
  const shared = {
    title: label,
    "aria-label": label,
    className: [
      "relative inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl",
      "text-[var(--ps-muted)] hover:text-white hover:bg-[var(--ps-surf)]",
      "border border-transparent hover:border-[var(--ps-brd)]",
      "transition-colors duration-ps-fast ease-ps-standard",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ps-cyan)]",
      "active:scale-[0.97]",
      className,
    ].join(" "),
    ...props,
  };

  if (Comp === "button") {
    return (
      <button type={type} {...shared}>
        {children}
      </button>
    );
  }

  return <Comp {...shared}>{children}</Comp>;
}
