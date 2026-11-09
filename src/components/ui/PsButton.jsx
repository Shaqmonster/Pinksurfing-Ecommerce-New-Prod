import React from "react";

const variants = {
  primary:
    "bg-gradient-to-r from-[var(--ps-primary)] to-[var(--ps-purple-dark)] text-white border-transparent shadow-[0_8px_18px_-6px_rgba(151,71,255,0.45)]",
  secondary:
    "bg-[var(--ps-surf)] text-[var(--ps-white)] border-[var(--ps-brd)] hover:border-[var(--ps-purple-light)]",
  tertiary:
    "bg-transparent text-[var(--ps-purple-light)] border-transparent hover:bg-white/5",
  destructive:
    "bg-[var(--ps-red)] text-white border-transparent",
};

const sizes = {
  md: "min-h-[44px] px-5 text-[var(--ps-text-body)]",
  sm: "min-h-[44px] sm:min-h-[36px] px-4 text-[var(--ps-text-body-sm)]",
};

/**
 * Shared primary-action button aligned to CORE PsButton patterns.
 */
export default function PsButton({
  children,
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  disabled = false,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-[14px] border font-semibold",
        "transition-transform duration-[var(--ps-motion-instant)] ease-[var(--ps-ease-standard)]",
        "active:scale-[var(--ps-scale-pressed)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ps-cyan)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ps-bg)]",
        "disabled:opacity-50 disabled:pointer-events-none",
        variants[variant] || variants.primary,
        sizes[size] || sizes.md,
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
