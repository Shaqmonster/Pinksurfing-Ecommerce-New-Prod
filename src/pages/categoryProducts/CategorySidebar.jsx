import { Disclosure } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { QUICK_FILTERS } from "./constants";
import LocationFilterPanel from "./LocationFilterPanel";
import ElectronicsSubcategoryFilter from "./ElectronicsSubcategoryFilter";
import PriceRangeFilter from "./PriceRangeFilter";
import { categoryShowsPriceRange, formatSubcategoryLabel } from "./priceRangeUtils";

function SectionIcon({ children }) {
    return (
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--ps-primary)] to-[var(--ps-purple-dark)] shadow-[0_6px_16px_-6px_rgba(151,71,255,0.55)]">
            {children}
        </div>
    );
}

export default function CategorySidebar({
    categorySlug,
    isElectronics,
    subcategories,
    selectedSubcategorySlugs,
    toggleSubcategorySlug,
    clearSubcategorySlugs,
    CategoryOnlyData,
    categoryFilter,
    setCategoryFilter,
    minValue,
    maximumValue,
    maxValue,
    priceStep,
    priceScaleLabel,
    handleSliderChange,
    filterBy,
    setFilterBy,
    attributeFilters = {},
    onFilterChange,
    isLocationCategory,
    radiusMiles,
    setRadiusMiles,
    radiusOptions,
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
    applyLocationFilter,
    fetchCurrentLocationAndApply,
    clearLocationFilter,
}) {
    const relevantFilters = QUICK_FILTERS.filter(
        (f) => !f.categoryMatch || f.categoryMatch.includes(categorySlug)
    );
    const showPrice = categoryShowsPriceRange(categorySlug);

    return (
        <aside className="hidden space-y-4 lg:block">
            {isLocationCategory && (
                <LocationFilterPanel
                    variant="desktop"
                    radiusMiles={radiusMiles}
                    setRadiusMiles={setRadiusMiles}
                    radiusOptions={radiusOptions}
                    manualZip={manualZip}
                    setManualZip={setManualZip}
                    browserCoords={browserCoords}
                    setBrowserCoords={setBrowserCoords}
                    locationFilterActive={locationFilterActive}
                    locationApplying={locationApplying}
                    locationError={locationError}
                    locationGeoProgress={locationGeoProgress}
                    displayLocationLabel={displayLocationLabel}
                    setDisplayLocationLabel={setDisplayLocationLabel}
                    onApply={applyLocationFilter}
                    onClear={clearLocationFilter}
                    onFetchCurrentLocation={fetchCurrentLocationAndApply}
                />
            )}

            {isElectronics ? (
                <ElectronicsSubcategoryFilter
                    subcategories={subcategories}
                    selectedSlugs={selectedSubcategorySlugs}
                    onToggle={toggleSubcategorySlug}
                    onClear={clearSubcategorySlugs}
                    variant="desktop"
                />
            ) : (
                <div className="glass-card rounded-xl border border-[var(--ps-brd)] p-4">
                    <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white">
                        <SectionIcon>
                            <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                            </svg>
                        </SectionIcon>
                        Subcategories
                    </h3>
                    <div className="custom-scrollbar max-h-[500px] space-y-2 overflow-y-auto pr-1">
                        {CategoryOnlyData.filter((cat) => cat && cat !== "null" && cat !== "undefined").map(
                            (subcategory, index) => {
                                const isActive = subcategory === categoryFilter;
                                return (
                                    <button
                                        key={`${subcategory}-${index}`}
                                        type="button"
                                        onClick={() =>
                                            setCategoryFilter(subcategory === "all" ? "all" : subcategory)
                                        }
                                        className={`group flex min-h-[44px] w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors duration-ps-normal ${
                                            isActive
                                                ? "bg-gradient-to-r from-[var(--ps-primary)] to-[var(--ps-purple-dark)] text-white shadow-md"
                                                : "bg-[var(--ps-surf)] text-[var(--ps-muted)] hover:bg-[var(--ps-card2)] hover:text-white"
                                        }`}
                                    >
                                        <span className="capitalize leading-snug">
                                            {formatSubcategoryLabel(subcategory)}
                                        </span>
                                        {isActive && (
                                            <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                                                <path
                                                    fillRule="evenodd"
                                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        )}
                                    </button>
                                );
                            }
                        )}
                    </div>
                </div>
            )}

            {showPrice && (
                <PriceRangeFilter
                    variant="desktop"
                    minValue={minValue}
                    maximumValue={maximumValue}
                    domainMin={0}
                    domainMax={maxValue}
                    step={priceStep}
                    scaleLabel={priceScaleLabel}
                    onChange={handleSliderChange}
                />
            )}

            {relevantFilters.length > 0 && (
                <div className="glass-card rounded-xl border border-[var(--ps-brd)] p-4">
                    <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white">
                        <SectionIcon>
                            <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                                />
                            </svg>
                        </SectionIcon>
                        Quick Filters
                    </h3>
                    {relevantFilters.map((section) => (
                        <Disclosure key={section.id} as="div" className="mt-3">
                            {({ open }) => (
                                <>
                                    <Disclosure.Button
                                        className={`flex min-h-[44px] w-full items-center justify-between rounded-xl border border-[var(--ps-brd)] bg-[var(--ps-surf)] px-3 py-2 text-sm font-medium text-white outline-none transition-colors duration-ps-normal hover:border-[color-mix(in_srgb,var(--ps-primary)_40%,transparent)] focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--ps-cyan)_40%,transparent)] ${
                                            open ? "border-[color-mix(in_srgb,var(--ps-primary)_45%,transparent)]" : ""
                                        }`}
                                    >
                                        {section.name}
                                        <ChevronDownIcon
                                            className={`h-5 w-5 text-[var(--ps-muted)] transition-transform duration-ps-normal ${
                                                open ? "rotate-180" : ""
                                            }`}
                                        />
                                    </Disclosure.Button>
                                    <Disclosure.Panel className="space-y-2 pt-2">
                                        {section.options.map((option, idx) => {
                                            const current = attributeFilters?.[section.id];
                                            const isActive = current === option || filterBy === option;
                                            return (
                                                <button
                                                    key={`${section.id}-${idx}`}
                                                    type="button"
                                                    onClick={() => {
                                                        const next = isActive ? "" : option;
                                                        if (typeof onFilterChange === "function") {
                                                            onFilterChange(section.id, next, "single");
                                                        }
                                                        if (typeof setFilterBy === "function") {
                                                            setFilterBy(next);
                                                        }
                                                    }}
                                                    className={`w-full min-h-[44px] rounded-xl px-3 py-2 text-left text-sm transition-colors duration-ps-normal ${
                                                        isActive
                                                            ? "bg-[var(--ps-primary)] text-white"
                                                            : "bg-[var(--ps-surf)] text-[var(--ps-muted)] hover:bg-[var(--ps-card2)] hover:text-white"
                                                    }`}
                                                >
                                                    {option}
                                                </button>
                                            );
                                        })}
                                    </Disclosure.Panel>
                                </>
                            )}
                        </Disclosure>
                    ))}
                </div>
            )}
        </aside>
    );
}
