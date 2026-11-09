import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { FunnelIcon } from "@heroicons/react/20/solid";
import AttributeFilterPanel from "./AttributeFilterPanel";
import LocationFilterPanel from "./LocationFilterPanel";
import PriceRangeFilter from "./PriceRangeFilter";
import { SORT_METHODS, hasActiveFilters } from "./constants";
import ElectronicsSubcategoryFilter from "./ElectronicsSubcategoryFilter";
import { categoryShowsPriceRange, formatSubcategoryLabel } from "./priceRangeUtils";

export default function MobileFilterDrawer({
    open,
    onClose,
    categorySlug,
    isElectronics,
    subcategories,
    selectedSubcategorySlugs,
    toggleSubcategorySlug,
    clearSubcategorySlugs,
    CategoryOnlyData,
    categoryFilter,
    setCategoryFilter,
    sortMethod,
    setSortMethod,
    setSortName,
    minValue,
    maximumValue,
    maxValue,
    priceStep,
    priceScaleLabel,
    handleSliderChange,
    allowedAttributes,
    attributeFilters,
    onFilterChange,
    clearAttributeFilters,
    getUniqueAttributeValues,
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
    const showPrice = categoryShowsPriceRange(categorySlug);

    return (
        <Transition.Root show={open} as={Fragment}>
            <Dialog as="div" className="relative z-50 lg:hidden" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="transition-opacity ease-linear duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="transition-opacity ease-linear duration-300"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 z-50 flex">
                    <Transition.Child
                        as={Fragment}
                        enter="transition ease-in-out duration-300 transform"
                        enterFrom="translate-x-full"
                        enterTo="translate-x-0"
                        leave="transition ease-in-out duration-300 transform"
                        leaveFrom="translate-x-0"
                        leaveTo="translate-x-full"
                    >
                        <Dialog.Panel className="relative ml-auto flex h-full w-full max-w-sm flex-col overflow-y-auto border-l border-[var(--ps-brd)] bg-[var(--ps-bg)] shadow-2xl">
                            <div className="sticky top-0 z-10 flex items-center justify-between bg-gradient-to-r from-[var(--ps-primary)] to-[var(--ps-purple-dark)] p-4">
                                <Dialog.Title className="flex items-center gap-2 text-xl font-bold text-white">
                                    <FunnelIcon className="h-6 w-6" aria-hidden />
                                    Filters
                                </Dialog.Title>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30"
                                    aria-label="Close filters"
                                >
                                    <XMarkIcon className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="space-y-4 p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                                {isLocationCategory && (
                                    <LocationFilterPanel
                                        variant="mobile"
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
                                        variant="mobile"
                                    />
                                ) : (
                                    <div className="rounded-2xl border border-[var(--ps-brd)] bg-[var(--ps-card)] p-4">
                                        <h3 className="mb-3 text-sm font-bold text-white">Subcategories</h3>
                                        <div className="custom-scrollbar max-h-48 space-y-2 overflow-y-auto">
                                            {CategoryOnlyData.filter(
                                                (cat) => cat && cat !== "null" && cat !== "undefined"
                                            ).map((subcategory, index) => (
                                                <button
                                                    key={`${subcategory}-${index}`}
                                                    type="button"
                                                    onClick={() => {
                                                        setCategoryFilter(
                                                            subcategory === "all" ? "all" : subcategory
                                                        );
                                                        onClose();
                                                    }}
                                                    className={`min-h-[44px] w-full rounded-xl px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                                                        subcategory === categoryFilter
                                                            ? "bg-gradient-to-r from-[var(--ps-primary)] to-[var(--ps-purple-dark)] text-white"
                                                            : "bg-[var(--ps-surf)] text-[var(--ps-muted)] hover:text-white"
                                                    }`}
                                                >
                                                    {formatSubcategoryLabel(subcategory)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="rounded-2xl border border-[var(--ps-brd)] bg-[var(--ps-card)] p-4">
                                    <h3 className="mb-3 text-sm font-bold text-white">Sort By</h3>
                                    <div className="space-y-2">
                                        {SORT_METHODS.map((option) => (
                                            <button
                                                key={option.value}
                                                type="button"
                                                onClick={() => {
                                                    setSortMethod(option.value);
                                                    setSortName(option.name);
                                                    onClose();
                                                }}
                                                className={`flex min-h-[44px] w-full items-center gap-2 rounded-xl px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                                                    option.value === sortMethod
                                                        ? "bg-gradient-to-r from-[var(--ps-primary)] to-[var(--ps-purple-dark)] text-white"
                                                        : "bg-[var(--ps-surf)] text-[var(--ps-muted)] hover:text-white"
                                                }`}
                                            >
                                                {option.Icon && (
                                                    <option.Icon className="text-base opacity-80" aria-hidden />
                                                )}
                                                {option.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {showPrice && (
                                    <PriceRangeFilter
                                        variant="mobile"
                                        minValue={minValue}
                                        maximumValue={maximumValue}
                                        domainMin={0}
                                        domainMax={maxValue}
                                        step={priceStep}
                                        scaleLabel={priceScaleLabel}
                                        onChange={handleSliderChange}
                                    />
                                )}

                                {allowedAttributes.length > 0 && (
                                    <div className="rounded-2xl border border-[var(--ps-brd)] bg-[var(--ps-card)] p-4">
                                        <div className="mb-4 flex items-center justify-between">
                                            <h3 className="text-sm font-bold text-white">Filter by Attributes</h3>
                                            {hasActiveFilters(attributeFilters) && (
                                                <button
                                                    type="button"
                                                    onClick={clearAttributeFilters}
                                                    className="min-h-[44px] px-2 text-xs font-medium text-[var(--ps-purple-light)] hover:text-white"
                                                >
                                                    Clear
                                                </button>
                                            )}
                                        </div>

                                        <div className="custom-scrollbar max-h-[400px] space-y-3 overflow-y-auto pr-1">
                                            {allowedAttributes.map((attr, idx) => (
                                                <AttributeFilterPanel
                                                    key={`mobile-${attr.name}-${idx}`}
                                                    attr={attr}
                                                    uniqueValues={getUniqueAttributeValues(
                                                        attr.name,
                                                        attr.data_type
                                                    )}
                                                    attributeFilters={attributeFilters}
                                                    onFilterChange={onFilterChange}
                                                    variant="mobile"
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
