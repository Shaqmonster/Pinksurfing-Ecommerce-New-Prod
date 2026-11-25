import React from "react";
import { CheckCircleIcon, ClockIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";

const TONES = {
  confirmed: { Icon: CheckCircleIcon, cls: "text-ps-success bg-[color-mix(in_srgb,var(--ps-color-success)_14%,transparent)]" },
  waiting: { Icon: ClockIcon, cls: "text-ps-action-text bg-ps-action-soft" },
  problem: { Icon: ExclamationCircleIcon, cls: "text-ps-warning bg-[color-mix(in_srgb,var(--ps-color-warning)_14%,transparent)]" },
};

/** Calm, centred status card for payment return pages. Status changes are announced politely. */
export default function PaymentStatusCard({ tone = "waiting", title, children, busy = false, actions }) {
  const { Icon, cls } = TONES[tone] || TONES.waiting;
  return (
    <div className="min-h-[70vh] bg-ps-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-ps-border bg-ps-surface px-7 py-9 text-center shadow-[var(--ps-shadow-2)]">
        <div aria-live="polite">
          <div className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${cls}`}>
            <Icon className={`h-7 w-7 ${busy ? "motion-safe:animate-pulse" : ""}`} strokeWidth={1.5} aria-hidden />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-ink mb-2">{title}</h1>
          <div className="text-sm leading-relaxed text-ps-fg2 mb-6">{children}</div>
        </div>
        {actions ? <div className="flex flex-col gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

export const primaryActionClass =
  "inline-flex w-full items-center justify-center min-h-[48px] rounded-[14px] bg-ps-action px-6 text-sm font-semibold text-white";
export const secondaryActionClass =
  "inline-flex w-full items-center justify-center min-h-[48px] rounded-[14px] border border-ps-border px-6 text-sm font-medium text-ink hover:bg-ps-hover";
