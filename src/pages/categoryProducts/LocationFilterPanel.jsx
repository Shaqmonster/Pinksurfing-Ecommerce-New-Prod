import { MapPinIcon } from "@heroicons/react/24/outline";
import { LOCATION_RADIUS_MILES_OPTIONS } from "./constants";

const COUNTRY_OPTIONS = [
    { code: "us", label: "United States" },
    { code: "in", label: "India" },
    { code: "gb", label: "United Kingdom" },
    { code: "ca", label: "Canada" },
    { code: "au", label: "Australia" },
];

/**
 * @param {'desktop' | 'mobile'} variant
 */
export default function LocationFilterPanel({
    variant = "desktop",
    radiusMiles,
    setRadiusMiles,
    manualZip,
    setManualZip,
    manualCountryIso2,
    setManualCountryIso2,
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
        ? "bg-gray-800 p-4 rounded-2xl border border-gray-700"
        : "glass-card p-4 rounded-xl";

    return (
        <div className={cardClass}>
            <h3
                className={`text-base font-bold mb-3 flex items-center gap-2 ${
                    isMobile ? "text-white" : "text-gray-900 dark:text-white"
                }`}
            >
                <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isMobile ? "bg-blue-600/40" : "bg-gradient-to-br from-blue-500 to-cyan-500"
                    }`}
                >
                    <MapPinIcon className={`w-4 h-4 ${isMobile ? "text-blue-200" : "text-white"}`} />
                </span>
                Fetch by location
            </h3>
            <p
                className={`text-xs mb-4 ${
                    isMobile ? "text-gray-400" : "text-gray-500 dark:text-gray-400"
                }`}
            >
                Show listings within a radius of your position or a postal code. Product locations come from each
                listing&apos;s Zip / postal field.
            </p>

            {/* Current anchor summary */}
            <div
                className={`flex items-center justify-between gap-2 mb-3 text-sm ${
                    isMobile ? "text-gray-200" : "text-gray-800 dark:text-gray-200"
                }`}
            >
                <span className="font-medium">Location</span>
                <span className="flex items-center gap-1.5 font-mono text-xs truncate max-w-[140px]">
                    <MapPinIcon className="w-4 h-4 shrink-0 opacity-70" />
                    {locationFilterActive
                        ? displayLocationLabel || "Set"
                        : browserCoords
                          ? "GPS ready"
                          : manualZip || "—"}
                </span>
            </div>

            {/* Distance */}
            <label
                className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${
                    isMobile ? "text-gray-400" : "text-gray-500 dark:text-gray-400"
                }`}
            >
                Distance from me
            </label>
            <div className="relative mb-4">
                <select
                    value={radiusMiles}
                    onChange={(e) => setRadiusMiles(Number(e.target.value))}
                    className={`w-full appearance-none rounded-xl px-3 py-2.5 pr-9 text-sm font-medium border transition-colors ${
                        isMobile
                            ? "bg-gray-900 border-gray-600 text-white focus:ring-2 focus:ring-blue-500"
                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    }`}
                >
                    {LOCATION_RADIUS_MILES_OPTIONS.map((m) => (
                        <option key={m} value={m}>
                            {m} miles
                        </option>
                    ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                    ▼
                </span>
            </div>

            {/* Postal + country */}
            <label
                className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${
                    isMobile ? "text-gray-400" : "text-gray-500 dark:text-gray-400"
                }`}
            >
                Postal / ZIP code
            </label>
            <input
                type="text"
                inputMode="text"
                autoComplete="postal-code"
                placeholder="e.g. 90210 or 500001"
                value={manualZip}
                onChange={(e) => {
                    setManualZip(e.target.value);
                    setBrowserCoords(null);
                    setDisplayLocationLabel?.("");
                }}
                className={`w-full rounded-xl px-3 py-2.5 text-sm mb-2 border ${
                    isMobile
                        ? "bg-gray-900 border-gray-600 text-white placeholder:text-gray-500"
                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white"
                }`}
            />
            <label
                className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${
                    isMobile ? "text-gray-400" : "text-gray-500 dark:text-gray-400"
                }`}
            >
                Country
            </label>
            <select
                value={manualCountryIso2}
                onChange={(e) => setManualCountryIso2(e.target.value)}
                className={`w-full rounded-xl px-3 py-2.5 text-sm mb-4 border ${
                    isMobile
                        ? "bg-gray-900 border-gray-600 text-white"
                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white"
                }`}
            >
                {COUNTRY_OPTIONS.map((c) => (
                    <option key={c.code} value={c.code}>
                        {c.label}
                    </option>
                ))}
            </select>

            <button
                type="button"
                onClick={onUseMyLocation}
                disabled={locationApplying}
                className={`w-full mb-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isMobile
                        ? "bg-slate-700 text-white hover:bg-slate-600 disabled:opacity-50"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50"
                }`}
            >
                Use my location (browser)
            </button>

            {/* Include listings without zip */}
            <p
                className={`text-xs font-semibold uppercase tracking-wide mb-2 ${
                    isMobile ? "text-gray-400" : "text-gray-500 dark:text-gray-400"
                }`}
            >
                Include listings without postal code
            </p>
            <div className="flex gap-4 mb-4">
                <label className={`flex items-center gap-2 text-sm cursor-pointer ${isMobile ? "text-gray-200" : ""}`}>
                    <input
                        type="radio"
                        name={`includeNoZip-${variant}`}
                        checked={includeWithoutZip}
                        onChange={() => setIncludeWithoutZip(true)}
                        className="text-blue-600 focus:ring-blue-500"
                    />
                    Yes
                </label>
                <label className={`flex items-center gap-2 text-sm cursor-pointer ${isMobile ? "text-gray-200" : ""}`}>
                    <input
                        type="radio"
                        name={`includeNoZip-${variant}`}
                        checked={!includeWithoutZip}
                        onChange={() => setIncludeWithoutZip(false)}
                        className="text-blue-600 focus:ring-blue-500"
                    />
                    No
                </label>
            </div>

            {locationError && (
                <p className="text-xs text-red-500 dark:text-red-400 mb-2">{locationError}</p>
            )}

            {locationApplying && locationGeoProgress.total > 0 && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">
                    Geocoding listings… {locationGeoProgress.done}/{locationGeoProgress.total}
                </p>
            )}

            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={onApply}
                    disabled={locationApplying}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:shadow-lg disabled:opacity-50"
                >
                    {locationApplying ? "Working…" : "Apply"}
                </button>
                {(locationFilterActive || browserCoords) && (
                    <button
                        type="button"
                        onClick={onClear}
                        disabled={locationApplying}
                        className={`px-4 py-2.5 rounded-xl text-sm font-medium ${
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
