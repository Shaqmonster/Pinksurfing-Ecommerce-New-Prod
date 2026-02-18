import { useContext, useEffect, useState, useMemo, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useCookies } from "react-cookie";
import axios from "axios";
import { dataContext } from "../../context/dataContext";
import { authContext } from "../../context/authContext";
import { filterProducts, slugToTitle } from "./utils";

/**
 * Custom hook encapsulating all state, data-fetching, and filter logic
 * for the CategoryProducts page.
 */
export default function useCategoryProducts() {
    const { slug } = useParams();
    const [cookies] = useCookies([]);
    const { products } = useContext(dataContext);
    const { currency, isDarkMode } = useContext(authContext);

    const categorySlug = slug;

    // Core state
    const [filterBy, setFilterBy] = useState("");
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const [CategoryOnlyData, setCategoryOnlyData] = useState([]);
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [shoppingProduct, setShoppingProducts] = useState(products);
    const [maxValue, setMaxValue] = useState(1000);
    const [sortMethod, setSortMethod] = useState("default");
    const [sortName, setSortName] = useState("Newest");
    const [loading, setLoading] = useState(false);
    const [minValue, setMinValue] = useState(0);
    const [maximumValue, setMaximumValue] = useState(20000);
    const [isCard, setIsCard] = useState(true);
    const [subcategories, setSubcategories] = useState([]);
    const [title, setTitle] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(12);

    // Dynamic Attribute Filters
    const [allowedAttributes, setAllowedAttributes] = useState([]);
    const [attributeFilters, setAttributeFilters] = useState({});

    // ---------- Derived / Computed ----------

    const filteredProducts = useMemo(() => {
        return filterProducts(shoppingProduct, {
            minValue,
            maximumValue,
            categoryFilter,
            attributeFilters,
            sortMethod,
        });
    }, [shoppingProduct, minValue, maximumValue, categoryFilter, sortMethod, attributeFilters]);

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentProducts = filteredProducts.slice(startIndex, endIndex);

    // ---------- Effects ----------
    useEffect(()=>{
        console.log("allowedAttributes:", allowedAttributes);
        console.log("attributeFilters:", attributeFilters);
        console.log("shoppingProduct:", shoppingProduct);
    },[allowedAttributes, attributeFilters,shoppingProduct]);
    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [categoryFilter, minValue, maximumValue, sortMethod, filterBy, attributeFilters]);

    // Get allowed attributes from the first product's subcategory.
    // All products in the same subcategory share the same allowed_attributes,
    // so we only need to check one product.
    useEffect(() => {
        const productsToCheck = categoryFilter === "all"
            ? shoppingProduct
            : shoppingProduct.filter(p => p?.subcategory?.name === categoryFilter);

        if (productsToCheck && productsToCheck.length > 0) {
            const attrs = productsToCheck[0]?.subcategory?.allowed_attributes;
            if (attrs && Array.isArray(attrs)) {
                setAllowedAttributes(
                    attrs.map(attr => ({
                        id: attr.id,
                        name: attr.name,
                        data_type: attr.data_type || "text",
                        options: attr.options || [],
                        is_variant: attr.is_variant || false,
                    }))
                );
            } else {
                setAllowedAttributes([]);
            }
        } else {
            setAllowedAttributes([]);
        }
        setAttributeFilters({});
    }, [categoryFilter, shoppingProduct]);

    // Set title from slug
    useEffect(() => {
        setTitle(slugToTitle(categorySlug));
    }, [categorySlug]);

    // Fetch products
    useEffect(() => {
        const getFilterProducts = async () => {
            setLoading(true);
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_SERVER_URL}/api/product/subcategories/${categorySlug}/`,
                    { headers: { "Content-Type": "application/json" } }
                );

                let subcategoriesData = response.data;
                subcategoriesData = subcategoriesData.sort((a, b) => a.name.localeCompare(b.name));
                setSubcategories(subcategoriesData);

                if (categorySlug === 'business4sale' && subcategoriesData.length === 0) {
                    setCategoryOnlyData(["all", "Business For Sale"]);
                } else {
                    setCategoryOnlyData(["all", ...subcategoriesData.map(subcat => subcat.name)]);
                }

                const res = await axios.get(
                    `${import.meta.env.VITE_SERVER_URL}/api/product/category-products/${categorySlug}/`,
                    { headers: { "Content-Type": "application/json" } }
                );

                const allProducts = res.data;
                const sortedProducts = allProducts.sort(
                    (a, b) => new Date(b.created_at) - new Date(a.created_at)
                );
                setShoppingProducts(sortedProducts);

                const prices = allProducts.map((product) => parseFloat(product.unit_price));
                if (prices.length > 0) {
                    setMinValue(Math.min(...prices));
                    setMaximumValue(Math.max(...prices));
                    setMaxValue(Math.max(...prices));
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        setCategoryFilter("all");
        getFilterProducts();
    }, [categorySlug]);

    // Recalculate max price when products change
    useEffect(() => {
        if (shoppingProduct && shoppingProduct.length > 0) {
            const prices = shoppingProduct.map((p) => Number(p.unit_price) || 0);
            const max = Math.max(...prices);
            if (max > 0) {
                setMaxValue(max);
                setMaximumValue(max);
            }
        }
    }, [shoppingProduct]);

    // ---------- Handlers ----------

    const handleSliderChange = (e) => {
        setMinValue(Number(e.minValue));
        setMaximumValue(Number(e.maxValue));
    };

    const goToPage = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleAttributeFilterChange = useCallback((attrName, value, filterType = "single") => {
        setAttributeFilters(prev => {
            const newFilters = { ...prev };

            if (filterType === "multi") {
                const currentValues = Array.isArray(prev[attrName]) ? [...prev[attrName]] : [];
                const index = currentValues.indexOf(value);
                if (index > -1) {
                    currentValues.splice(index, 1);
                } else {
                    currentValues.push(value);
                }
                newFilters[attrName] = currentValues;
            } else if (filterType === "range") {
                newFilters[attrName] = { ...prev[attrName], ...value };
            } else {
                newFilters[attrName] = value;
            }

            return newFilters;
        });
    }, []);

    const clearAttributeFilters = useCallback(() => {
        setAttributeFilters({});
    }, []);

    const removeAttributeFilter = useCallback((attrName) => {
        setAttributeFilters(prev => {
            const newFilters = { ...prev };
            delete newFilters[attrName];
            return newFilters;
        });
    }, []);

    const getUniqueAttributeValues = useCallback((attrName, dataType) => {
        const values = new Set();
        shoppingProduct.forEach(product => {
            const attrs = product.attributes || product.product_attributes;
            if (attrs) {
                const attr = attrs.find(
                    a => a.name?.toLowerCase() === attrName.toLowerCase()
                );
                if (attr && attr.value !== null && attr.value !== undefined && attr.value !== "") {
                    const rawValue = attr.value;
                    // For multi_select, split comma-separated or array values into individual items
                    if (dataType === "multi_select" || dataType === "select") {
                        if (Array.isArray(rawValue)) {
                            rawValue.forEach(v => {
                                const trimmed = String(v).trim();
                                if (trimmed) values.add(trimmed);
                            });
                        } else if (typeof rawValue === "string" && rawValue.includes(",")) {
                            rawValue.split(",").forEach(v => {
                                const trimmed = v.trim();
                                if (trimmed) values.add(trimmed);
                            });
                        } else {
                            values.add(String(rawValue).trim());
                        }
                    } else {
                        values.add(String(rawValue));
                    }
                }
            }
        });
        return Array.from(values).sort();
    }, [shoppingProduct]);

    const clearAllFilters = useCallback(() => {
        setCategoryFilter("all");
        setFilterBy("");
        setMinValue(0);
        setMaximumValue(maxValue);
        setAttributeFilters({});
    }, [maxValue]);

    return {
        // Context values
        isDarkMode,
        currency,

        // State
        title,
        categorySlug,
        loading,
        isCard, setIsCard,
        mobileFiltersOpen, setMobileFiltersOpen,
        sortMethod, setSortMethod,
        sortName, setSortName,
        categoryFilter, setCategoryFilter,
        minValue, maximumValue, maxValue,
        filterBy, setFilterBy,
        CategoryOnlyData,
        allowedAttributes,
        attributeFilters,
        itemsPerPage, setItemsPerPage,
        currentPage, setCurrentPage,

        // Derived
        filteredProducts,
        currentProducts,
        totalPages,
        startIndex,
        endIndex,

        // Handlers
        handleSliderChange,
        goToPage,
        handleAttributeFilterChange,
        clearAttributeFilters,
        removeAttributeFilter,
        getUniqueAttributeValues,
        clearAllFilters,
    };
}
