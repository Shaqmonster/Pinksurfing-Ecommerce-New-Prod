import { MapPinIcon } from "@heroicons/react/24/outline";
import { LOCATION_RADIUS_MILES_OPTIONS } from "./constants";

/**
 * Compact location filter (reference: marketplace sidebar) — no title block, minimal vertical space.
 * @param {'desktop' | 'mobile'} variant
 */
export default function LocationFilterPanel({
    variant = "desktop",
    radiusMiles,
    setRadiusMiles,
    manualZip,
    setManualZip,
    includeWithoutZip,
    setIncludeWithoutZip,
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
    onUseMyLocation,
}) {
    const isMobile = variant === "mobile";
    const cardClass = isMobile
        ? "bg-gray-800 px-3 py-2.5 rounded-xl border border-gray-700"
        : "glass-card px-3 py-2.5 rounded-xl";

    const labelCls = isMobile ? "text-gray-400" : "text-gray-500 dark:text-gray-400";
    const inputCls = isMobile
        ? "bg-gray-900 border-gray-600 text-white placeholder:text-gray-500"
        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white";

    return (
        <div className={cardClass}>
            {/* Location row: pin + zip */}
            <div className="flex items-center gap-2 mb-2">
                <MapPinIcon
                    className={`w-4 h-4 shrink-0 ${isMobile ? "text-blue-400" : "text-blue-600 dark:text-blue-400"}`}
                />
                <div className="flex-1 min-w-0">
                    <div className={`flex justify-between items-center gap-1 mb-0.5 ${labelCls}`}>
                        <span className="text-[11px] font-medium">Location</span>
                        <span className="text-[10px] font-mono truncate max-w-[100px] text-gray-600 dark:text-gray-300">
                            {locationFilterActive
                                ? displayLocationLabel || "—"
                                : browserCoords
                                  ? "GPS"
                                  : manualZip || "—"}
                        </span>
                    </div>
                    <input
                        type="text"
                        inputMode="text"
                        autoComplete="postal-code"
                        placeholder="ZIP / postal"
                        value={manualZip}
                        onChange={(e) => {
                            setManualZip(e.target.value);
                            setBrowserCoords(null);
                            setDisplayLocationLabel?.("");
                        }}
                        className={`w-full rounded-lg px-2 py-1.5 text-xs border ${inputCls}`}
                    />
                </div>
            </div>

            {/* Distance — single row */}
            <div className="flex items-center justify-between gap-2 mb-2">
                <span className={`text-[11px] font-medium whitespace-nowrap ${labelCls}`}>Distance</span>
                <select
                    value={radiusMiles}
                    onChange={(e) => setRadiusMiles(Number(e.target.value))}
                    className={`flex-1 max-w-[140px] rounded-lg px-2 py-1 text-xs font-medium border ${inputCls}`}
                >
                    {LOCATION_RADIUS_MILES_OPTIONS.map((m) => (
                        <option key={m} value={m}>
                            {m} mi
                        </option>
                    ))}
                </select>
            </div>

            {/* Include without ZIP — compact */}
            <div className={`flex items-center justify-between gap-2 mb-2 ${labelCls}`}>
                <span className="text-[10px] leading-tight max-w-[58%]">No ZIP on listing</span>
                <div className="flex items-center gap-3 shrink-0">
                    <label className="flex items-center gap-1 text-[11px] cursor-pointer">
                        <input
                            type="radio"
                            name={`noZip-${variant}`}
                            checked={includeWithoutZip}
                            onChange={() => setIncludeWithoutZip(true)}
                            className="text-blue-600"
                        />
                        Yes
                    </label>
                    <label className="flex items-center gap-1 text-[11px] cursor-pointer">
                        <input
                            type="radio"
                            name={`noZip-${variant}`}
                            checked={!includeWithoutZip}
                            onChange={() => setIncludeWithoutZip(false)}
                            className="text-blue-600"
                        />
                        No
                    </label>
                </div>
            </div>

            {locationError && (
                <p className="text-[10px] text-red-500 dark:text-red-400 mb-1.5 leading-snug">{locationError}</p>
            )}

            {locationApplying && locationGeoProgress.total > 0 && (
                <p className="text-[10px] text-blue-600 dark:text-blue-400 mb-1.5">
                    Geocoding… {locationGeoProgress.done}/{locationGeoProgress.total}
                </p>
            )}

            <div className="flex flex-wrap gap-1.5">
                <button
                    type="button"
                    onClick={onUseMyLocation}
                    disabled={locationApplying}
                    className={`flex-1 min-w-[100px] py-1.5 rounded-lg text-[11px] font-semibold ${
                        isMobile
                            ? "bg-slate-700 text-white hover:bg-slate-600 disabled:opacity-50"
                            : "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50"
                    }`}
                >
                    Near me
                </button>
                <button
                    type="button"
                    onClick={onApply}
                    disabled={locationApplying}
                    className="flex-1 min-w-[72px] py-1.5 rounded-lg text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                    {locationApplying ? "…" : "Apply"}
                </button>
                {(locationFilterActive || browserCoords) && (
                    <button
                        type="button"
                        onClick={onClear}
                        disabled={locationApplying}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium ${
                            isMobile
                                ? "bg-gray-700 text-gray-200"
                                : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                        } disabled:opacity-50`}
                    >
                        Clear
                    </button>
                )}
            </div>
        </div>
    );
}
