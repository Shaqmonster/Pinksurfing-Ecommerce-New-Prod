import useCategoryProducts from "./categoryProducts/useCategoryProducts";
import MobileFilterDrawer from "./categoryProducts/MobileFilterDrawer";
import CategoryHeader from "./categoryProducts/CategoryHeader";
import CategorySidebar from "./categoryProducts/CategorySidebar";
import ProductsSection from "./categoryProducts/ProductsSection";

export default function CategoryProducts() {
  const hook = useCategoryProducts();

  return (
    <div className={`min-h-screen ${hook.isDarkMode ? "dark bg-[#0A0B0E]" : "bg-gradient-to-br from-slate-50 via-white to-purple-50"}`}>
      {/* Background Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[100px]"></div>
      </div>

      {/* Mobile Filter Drawer */}
      <MobileFilterDrawer
        open={hook.mobileFiltersOpen}
        onClose={() => hook.setMobileFiltersOpen(false)}
        CategoryOnlyData={hook.CategoryOnlyData}
        categoryFilter={hook.categoryFilter}
        setCategoryFilter={hook.setCategoryFilter}
        sortMethod={hook.sortMethod}
        setSortMethod={hook.setSortMethod}
        setSortName={hook.setSortName}
        minValue={hook.minValue}
        maximumValue={hook.maximumValue}
        maxValue={hook.maxValue}
        handleSliderChange={hook.handleSliderChange}
        allowedAttributes={hook.allowedAttributes}
        attributeFilters={hook.attributeFilters}
        onFilterChange={hook.handleAttributeFilterChange}
        clearAttributeFilters={hook.clearAttributeFilters}
        getUniqueAttributeValues={hook.getUniqueAttributeValues}
      />

      {/* Main Content */}
      <main className="relative z-10 max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        {/* Header with breadcrumb, title, controls */}
        <CategoryHeader
          title={hook.title}
          filteredProducts={hook.filteredProducts}
          isCard={hook.isCard}
          setIsCard={hook.setIsCard}
          sortMethod={hook.sortMethod}
          setSortMethod={hook.setSortMethod}
          sortName={hook.sortName}
          setSortName={hook.setSortName}
          allowedAttributes={hook.allowedAttributes}
          attributeFilters={hook.attributeFilters}
          onFilterChange={hook.handleAttributeFilterChange}
          clearAttributeFilters={hook.clearAttributeFilters}
          getUniqueAttributeValues={hook.getUniqueAttributeValues}
          setMobileFiltersOpen={hook.setMobileFiltersOpen}
        />

        {/* Main Grid: Sidebar + Products */}
        <div className="grid grid-cols-1 lg:grid-cols-5 xl:grid-cols-6 gap-4 lg:gap-6">
          <CategorySidebar
            CategoryOnlyData={hook.CategoryOnlyData}
            categoryFilter={hook.categoryFilter}
            setCategoryFilter={hook.setCategoryFilter}
            minValue={hook.minValue}
            maximumValue={hook.maximumValue}
            maxValue={hook.maxValue}
            handleSliderChange={hook.handleSliderChange}
            filterBy={hook.filterBy}
            setFilterBy={hook.setFilterBy}
          />

          <div className="lg:col-span-4 xl:col-span-5">
            <ProductsSection
              loading={hook.loading}
              filteredProducts={hook.filteredProducts}
              currentProducts={hook.currentProducts}
              isCard={hook.isCard}
              attributeFilters={hook.attributeFilters}
              clearAttributeFilters={hook.clearAttributeFilters}
              removeAttributeFilter={hook.removeAttributeFilter}
              clearAllFilters={hook.clearAllFilters}
              startIndex={hook.startIndex}
              endIndex={hook.endIndex}
              itemsPerPage={hook.itemsPerPage}
              setItemsPerPage={hook.setItemsPerPage}
              setCurrentPage={hook.setCurrentPage}
              currentPage={hook.currentPage}
              totalPages={hook.totalPages}
              goToPage={hook.goToPage}
            />
          </div>
        </div>
      </main>

      {/* Styles */}
      <style jsx>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        .dark .glass-card {
          background: rgba(17, 24, 39, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #8B5CF6, #EC4899);
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #7C3AED, #DB2777);
        }
      `}</style>
    </div>
  );
}
