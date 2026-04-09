import { MapPinIcon, ViewfinderCircleIcon } from "@heroicons/react/24/outline";
import { LOCATION_RADIUS_MILES_OPTIONS } from "./constants";

/**
 * @param {'desktop' | 'mobile'} variant
 */
export default function LocationFilterPanel({
    variant = "desktop",
    radiusMiles,
    setRadiusMiles,
    manualZip,
    setManualZip,
    browserCoords,
    setBrowserCoords,
    locationFilterActive,
    locationApplying,
    locationError,
    locationGeoProgress,
    setDisplayLocationLabel,
    onApply,
    onClear,
    onFetchCurrentLocation,
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
            {/* 1. Fetch current location — runs filter immediately */}
            <button
                type="button"
                onClick={onFetchCurrentLocation}
                disabled={locationApplying}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg mb-2 transition-colors ${
                    isMobile
                        ? "bg-slate-700/80 hover:bg-slate-600 text-white disabled:opacity-50"
                        : "bg-slate-100 dark:bg-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-white disabled:opacity-50"
                }`}
            >
                <ViewfinderCircleIcon
                    className={`w-4 h-4 shrink-0 ${isMobile ? "text-cyan-400" : "text-blue-600 dark:text-cyan-400"}`}
                />
                <span className="text-[11px] font-semibold text-left leading-tight">Fetch current location</span>
            </button>

            {/* 2. ZIP / postal */}
            <div className="flex items-start gap-2 mb-2">
                <MapPinIcon
                    className={`w-4 h-4 shrink-0 mt-1.5 ${isMobile ? "text-blue-400" : "text-blue-600 dark:text-blue-400"}`}
                />
                <div className="flex-1 min-w-0">
                    <label className={`block text-[10px] font-medium mb-0.5 ${labelCls}`}>ZIP / postal</label>
                    <input
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
                        className={`w-full rounded-lg px-2 py-1.5 text-xs border ${inputCls}`}
                    />
                </div>
            </div>

            {/* 3. Distance */}
            <div className="flex items-center justify-between gap-2 mb-3">
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

            {locationError && (
                <p className="text-[10px] text-red-500 dark:text-red-400 mb-1.5 leading-snug">{locationError}</p>
            )}

            {locationApplying && locationGeoProgress.total > 0 && (
                <p className="text-[10px] text-blue-600 dark:text-blue-400 mb-1.5">
                    Geocoding… {locationGeoProgress.done}/{locationGeoProgress.total}
                </p>
            )}

            {/* 4. Apply + Clear */}
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={onApply}
                    disabled={locationApplying}
                    className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                    {locationApplying ? "…" : "Apply"}
                </button>
                {(locationFilterActive || browserCoords) && (
                    <button
                        type="button"
                        onClick={onClear}
                        disabled={locationApplying}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-medium ${
                            isMobile
                                ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
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
