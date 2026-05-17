import React from "react";
import { IoCheckmarkCircle, IoEllipseOutline, IoTimeOutline } from "react-icons/io5";

const STATUS_STYLES = {
  done: {
    icon: IoCheckmarkCircle,
    dot: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300",
    hint: "text-emerald-300/85",
  },
  ready: {
    icon: IoEllipseOutline,
    dot: "bg-violet-500/15 border-violet-500/35 text-violet-200",
    hint: "text-violet-200/90",
  },
  waiting: {
    icon: IoTimeOutline,
    dot: "bg-amber-500/10 border-amber-500/30 text-amber-200",
    hint: "text-amber-200/90",
  },
  upcoming: {
    icon: IoEllipseOutline,
    dot: "bg-white/5 border-white/10 text-white/35",
    hint: "text-white/40",
  },
};

export default function ServicesWorkflowTimeline({ steps, title = "Order progress" }) {
  if (!steps?.length) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-white/45">{title}</p>
      <ol className="space-y-2">
        {steps.map((step) => {
          const style = STATUS_STYLES[step.status] || STATUS_STYLES.upcoming;
          const Icon = style.icon;
          return (
            <li key={step.key} className="flex gap-2.5">
              <span
                className={`mt-0.5 shrink-0 w-6 h-6 rounded-full border flex items-center justify-center ${style.dot}`}
              >
                <Icon className="text-xs" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-white/80">{step.title}</p>
                {step.hint ? <p className={`text-[11px] mt-0.5 leading-relaxed ${style.hint}`}>{step.hint}</p> : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function GateStepHint({ gate, fallbackReady = "" }) {
  if (!gate) return null;
  const text =
    gate.done && gate.labelDone
      ? gate.labelDone
      : gate.enabled && gate.labelReady
        ? gate.labelReady
        : !gate.enabled && gate.labelBlocked
          ? gate.labelBlocked
          : fallbackReady;

  if (!text) return null;

  const className = gate.done
    ? "text-emerald-300/85"
    : gate.enabled
      ? "text-white/50"
      : "text-amber-200/90";

  return <p className={`text-[11px] leading-relaxed ${className}`}>{text}</p>;
}
