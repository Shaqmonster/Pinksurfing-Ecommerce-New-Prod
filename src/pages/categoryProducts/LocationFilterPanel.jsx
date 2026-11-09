import { MapPinIcon, ViewfinderCircleIcon } from "@heroicons/react/24/outline";
import { CARS_RADIUS_OPTIONS } from "./constants";

/**
 * @param {'desktop' | 'mobile'} variant
 */
export default function LocationFilterPanel({
    variant = "desktop",
    radiusMiles,
    setRadiusMiles,
    radiusOptions = CARS_RADIUS_OPTIONS,
    manualZip,
    setManualZip,
    browserCoords,
    setBrowserCoords,
    locationFilterActive,
    locationApplying,
    locationError,
    locationGeoProgress,
    displayLocationLabel,
    setDisplayLocationLabel,
    onApply,
    onClear,
    onFetchCurrentLocation,
}) {
    const isMobile = variant === "mobile";
    const cardClass = isMobile
        ? "rounded-2xl border border-[var(--ps-brd)] bg-[var(--ps-card)] p-4"
        : "glass-card rounded-xl border border-[var(--ps-brd)] p-4";

    const labelCls = isMobile
        ? "text-xs font-medium text-[var(--ps-muted)]"
        : "text-xs font-medium text-gray-500 dark:text-[var(--ps-muted)]";
    const inputCls = isMobile
        ? "w-full min-h-[44px] rounded-xl border border-[var(--ps-brd)] bg-[var(--ps-surf)] px-3 text-sm text-white placeholder:text-[var(--ps-dim)] outline-none transition-colors focus:border-[color-mix(in_srgb,var(--ps-primary)_50%,transparent)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--ps-primary)_25%,transparent)]"
        : "w-full min-h-[44px] rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-colors focus:border-purple-400 focus:ring-2 focus:ring-purple-500/25 dark:border-[var(--ps-brd)] dark:bg-[var(--ps-surf)] dark:text-white dark:placeholder:text-[var(--ps-dim)] dark:focus:border-[color-mix(in_srgb,var(--ps-primary)_50%,transparent)] dark:focus:ring-[color-mix(in_srgb,var(--ps-primary)_25%,transparent)]";

    return (
        <div className={cardClass}>
            <h3 className="mb-2 flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--ps-primary)] to-[var(--ps-purple-dark)] shadow-[0_6px_16px_-6px_rgba(151,71,255,0.55)]">
                    <MapPinIcon className="h-4 w-4 text-white" aria-hidden />
                </div>
                Location
            </h3>

            {!locationFilterActive && (
                <p className={`mb-3 text-xs leading-relaxed ${isMobile ? "text-[var(--ps-muted)]" : "text-gray-500 dark:text-[var(--ps-muted)]"}`}>
                    Use your browser location or enter a ZIP, then Apply. Distance filtering starts only after that.
                </p>
            )}
            {locationFilterActive && displayLocationLabel && (
                <p className="mb-3 text-xs leading-relaxed text-emerald-600 dark:text-[var(--ps-green)]">
                    Near: <span className="font-semibold text-gray-900 dark:text-white">{displayLocationLabel}</span> · {radiusMiles} mi
                </p>
            )}
            {locationFilterActive && !displayLocationLabel && (
                <p className="mb-3 text-xs leading-relaxed text-emerald-600 dark:text-[var(--ps-green)]">
                    Location filter active ({radiusMiles} mi)
                </p>
            )}

            <button
                type="button"
                onClick={onFetchCurrentLocation}
                disabled={locationApplying}
                className={`mb-3 flex min-h-[44px] w-full items-center gap-2 rounded-xl border px-3 text-left text-sm font-semibold transition-colors disabled:opacity-50 ${
                    isMobile
                        ? "border-[var(--ps-brd)] bg-[var(--ps-surf)] text-white hover:border-[color-mix(in_srgb,var(--ps-primary)_40%,transparent)]"
                        : "border-gray-200 bg-white text-gray-900 hover:border-purple-300 dark:border-[var(--ps-brd)] dark:bg-[var(--ps-surf)] dark:text-white dark:hover:border-[color-mix(in_srgb,var(--ps-primary)_40%,transparent)]"
                }`}
            >
                <ViewfinderCircleIcon className="h-5 w-5 shrink-0 text-[var(--ps-purple-light)]" aria-hidden />
                <span className="leading-snug">
                    {locationApplying ? "Getting your location…" : "Use my location (browser)"}
                </span>
            </button>

            <label className={`mb-1.5 block ${labelCls}`} htmlFor={`location-zip-${variant}`}>
                Or enter ZIP / postal code
            </label>
            <div className="mb-3 flex items-center gap-2">
                <MapPinIcon className="h-5 w-5 shrink-0 text-[var(--ps-purple-light)]" aria-hidden />
                <input
                    id={`location-zip-${variant}`}
                    type="text"
                    inputMode="text"
                    autoComplete="postal-code"
                    placeholder="Enter code"
                    value={manualZip}
                    onChange={(e) => {
                        setManualZip(e.target.value);
                        setBrowserCoords(null);
                        setDisplayLocationLabel?.("");
                    }}
                    className={inputCls}
                />
            </div>

            {browserCoords && !locationFilterActive && (
                <p className="mb-3 text-xs text-[var(--ps-purple-light)]">
                    Browser location ready — click Apply or change distance.
                </p>
            )}

            <div className="mb-3 flex items-center gap-3">
                <label className={`shrink-0 ${labelCls}`} htmlFor={`location-distance-${variant}`}>
                    Distance
                </label>
                <select
                    id={`location-distance-${variant}`}
                    value={radiusMiles}
                    onChange={(e) => setRadiusMiles(Number(e.target.value))}
                    className={`${inputCls} flex-1`}
                >
                    {radiusOptions.map((m) => (
                        <option key={m} value={m}>
                            {m} mi
                        </option>
                    ))}
                </select>
            </div>

            {locationError && (
                <p className="mb-2 text-xs leading-snug text-[var(--ps-red)]">{locationError}</p>
            )}

            {locationApplying && locationGeoProgress.total > 0 && (
                <p className="mb-2 text-xs text-[var(--ps-purple-light)]">
                    Matching listing locations… {locationGeoProgress.done}/{locationGeoProgress.total}
                </p>
            )}

            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={onApply}
                    disabled={locationApplying}
                    className="min-h-[44px] flex-1 rounded-xl bg-gradient-to-r from-[var(--ps-primary)] to-[var(--ps-purple-dark)] text-sm font-semibold text-white shadow-[0_8px_18px_-6px_rgba(151,71,255,0.45)] transition-[filter] hover:brightness-110 disabled:opacity-50"
                >
                    {locationApplying ? "Applying…" : "Apply"}
                </button>
                {(locationFilterActive || browserCoords || manualZip) && (
                    <button
                        type="button"
                        onClick={onClear}
                        disabled={locationApplying}
                        className={`min-h-[44px] rounded-xl border px-4 text-sm font-medium disabled:opacity-50 ${
                            isMobile
                                ? "border-[var(--ps-brd)] bg-[var(--ps-surf)] text-white hover:border-[color-mix(in_srgb,var(--ps-primary)_40%,transparent)]"
                                : "border-gray-200 bg-gray-100 text-gray-800 hover:border-purple-300 dark:border-[var(--ps-brd)] dark:bg-[var(--ps-surf)] dark:text-white dark:hover:border-[color-mix(in_srgb,var(--ps-primary)_40%,transparent)]"
                        }`}
                    >
                        Clear
                    </button>
                )}
            </div>
        </div>
    );
}
