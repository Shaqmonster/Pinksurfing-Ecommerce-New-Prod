import MultiRangeSlider from "multi-range-slider-react";
import { formatFilterPrice } from "./priceRangeUtils";

const PS_PRIMARY = "#9747ff";
const PS_PRIMARY_SOFT = "#b882ff";
const TRACK_IDLE = "rgba(255, 255, 255, 0.14)";
const TRACK_IDLE_LIGHT = "rgba(15, 23, 42, 0.12)";

/**
 * Dual-thumb price range control styled with PinkSurfing tokens.
 * Uses solid bar colors (library applies background-color, not gradients).
 */
export default function PriceRangeFilter({
    minValue = 0,
    maximumValue = 0,
    domainMin = 0,
    domainMax = 1000,
    step = 1,
    onChange,
    variant = "desktop",
    scaleLabel,
}) {
    const isMobile = variant === "mobile";
    const safeMax = Math.max(Number(domainMax) || 0, Number(domainMin) || 0, 1);
    const safeMin = Math.min(Number(domainMin) || 0, safeMax);
    const safeStep = Math.max(Number(step) || 1, 1);

    let left = Number(minValue);
    let right = Number(maximumValue);
    if (!Number.isFinite(left)) left = safeMin;
    if (!Number.isFinite(right)) right = safeMax;
    left = Math.min(Math.max(left, safeMin), safeMax);
    right = Math.min(Math.max(right, left), safeMax);

    const trackIdle = isMobile ? TRACK_IDLE : TRACK_IDLE_LIGHT;

    const handleInput = (e) => {
        if (typeof onChange === "function") {
            onChange({
                minValue: Number(e.minValue),
                maxValue: Number(e.maxValue),
            });
        }
    };

    return (
        <div className={isMobile
            ? "rounded-2xl border border-[var(--ps-brd)] bg-[var(--ps-card)] p-4"
            : "glass-card rounded-xl border border-[var(--ps-brd)] p-4"
        }>
            <h3 className="mb-1 flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--ps-primary)] to-[var(--ps-purple-dark)] shadow-[0_6px_16px_-6px_rgba(151,71,255,0.55)]">
                    <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                Price Range
            </h3>
            {scaleLabel ? (
                <p className="mb-3 text-xs leading-snug text-[var(--ps-dim)] dark:text-[var(--ps-muted)]">
                    {scaleLabel}
                </p>
            ) : (
                <div className="mb-3" />
            )}

            <div className="px-1">
                <MultiRangeSlider
                    className="ps-range-slider"
                    min={safeMin}
                    max={safeMax}
                    step={safeStep}
                    minValue={left}
                    maxValue={right}
                    label={false}
                    ruler={false}
                    canMinMaxValueSame={false}
                    style={{ border: "none", boxShadow: "none", padding: "16px 4px" }}
                    barInnerColor={PS_PRIMARY}
                    barRightColor={isMobile ? TRACK_IDLE : trackIdle}
                    barLeftColor={isMobile ? TRACK_IDLE : trackIdle}
                    thumbLeftColor={PS_PRIMARY}
                    thumbRightColor={PS_PRIMARY_SOFT}
                    onInput={handleInput}
                    onChange={handleInput}
                />
            </div>

            <div className="mt-4 flex gap-3">
                <div className="min-h-[44px] flex-1 rounded-xl border border-gray-200 bg-white/70 px-3 py-2 text-center dark:border-[var(--ps-brd)] dark:bg-[var(--ps-surf)]">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-[var(--ps-dim)]">
                        Min
                    </span>
                    <p className="text-sm font-bold tabular-nums text-gray-900 dark:text-white">
                        {formatFilterPrice(left)}
                    </p>
                </div>
                <div className="min-h-[44px] flex-1 rounded-xl border border-gray-200 bg-white/70 px-3 py-2 text-center dark:border-[var(--ps-brd)] dark:bg-[var(--ps-surf)]">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-[var(--ps-dim)]">
                        Max
                    </span>
                    <p className="text-sm font-bold tabular-nums text-gray-900 dark:text-white">
                        {formatFilterPrice(right)}
                    </p>
                </div>
            </div>
        </div>
    );
}
