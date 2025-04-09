import React, { useState, useEffect, useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import { assets } from '../assets/frontend_assets/assets';
import Title from './Title';
import ProductItem from './ProductItem';
import axios from 'axios';
import { useLocation } from 'react-router-dom';

const ProductGrid = ({ title, products: initialProducts, showFilters = true }) => {
    const { backendUrl } = useContext(ShopContext);
    const { search } = useContext(ShopContext);
    const location = useLocation();
    const [showFilter, setShowFilter] = useState(false);
    const [filterProducts, setFilterProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [filteredSubcategories, setFilteredSubcategories] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedSubcategories, setSelectedSubcategories] = useState([]);
    const [sortType, setSortType] = useState('relevant');
    const [showBestsellers, setShowBestsellers] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Parse URL path for category and subcategory
    useEffect(() => {
        const pathParts = location.pathname.split('/').filter(Boolean);
        if (pathParts[0] === 'category' && pathParts.length >= 2) {
            const categorySlug = pathParts[1];
            const subcategorySlug = pathParts[2];

            // Find category and subcategory IDs from slugs
            const category = categories.find(c => c.slug === categorySlug);
            if (category) {
                setSelectedCategories([category._id]);

                if (subcategorySlug) {
                    const subcategory = subcategories.find(s => s.slug === subcategorySlug);
                    if (subcategory) {
                        setSelectedSubcategories([subcategory._id]);
                    }
                }
            }
        }
    }, [location.pathname, categories, subcategories]);

    // Initial setup of filter products
    useEffect(() => {
        if (initialProducts) {
            setFilterProducts(initialProducts);
            setIsLoading(false);
        }
    }, [initialProducts]);

    // Fetch categories and subcategories
    useEffect(() => {
        const fetchCategoriesAndSubcategories = async () => {
            try {
                const [categoriesRes, subcategoriesRes] = await Promise.all([
                    axios.get(`${backendUrl}/api/categories`),
                    axios.get(`${backendUrl}/api/subcategories`)
                ]);

                if (categoriesRes.data.success) {
                    setCategories(categoriesRes.data.categories);
                }
                if (subcategoriesRes.data.success) {
                    setSubcategories(subcategoriesRes.data.subcategories);
                }
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };

        fetchCategoriesAndSubcategories();
    }, [backendUrl]);

    // Filter subcategories based on selected categories
    useEffect(() => {
        if (selectedCategories.length > 0) {
            const filtered = subcategories.filter(sub => {
                if (typeof sub.categoryId === 'object' && sub.categoryId._id) {
                    return selectedCategories.includes(sub.categoryId._id);
                }
                return selectedCategories.includes(sub.categoryId);
            });
            setFilteredSubcategories(filtered);
        } else {
            setFilteredSubcategories(subcategories);
        }
    }, [selectedCategories, subcategories]);

    const toggleCategory = (categoryId) => {
        setSelectedCategories(prev => {
            const newSelected = prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId];

            if (prev.includes(categoryId)) {
                setSelectedSubcategories(prevSubs => {
                    return prevSubs.filter(subId => {
                        const subCategory = subcategories.find(s => s._id === subId);
                        if (!subCategory) return false;

                        const subCategoryId = typeof subCategory.categoryId === 'object'
                            ? subCategory.categoryId._id
                            : subCategory.categoryId;

                        return subCategoryId !== categoryId;
                    });
                });
            }

            return newSelected;
        });
    };

    const toggleSubcategory = (subcategoryId) => {
        setSelectedSubcategories(prev =>
            prev.includes(subcategoryId)
                ? prev.filter(id => id !== subcategoryId)
                : [...prev, subcategoryId]
        );
    };

    const applyFilter = () => {
        let filteredProducts = [...initialProducts];

        // If no filters are applied, show all products
        if (!search && !showBestsellers && selectedCategories.length === 0 && selectedSubcategories.length === 0) {
            setFilterProducts(initialProducts);
            return;
        }

        // Filter by search term
        if (search) {
            filteredProducts = filteredProducts.filter(item =>
                item.name.toLowerCase().includes(search.toLowerCase())
            );
        }

        // Filter by bestsellers
        if (showBestsellers) {
            filteredProducts = filteredProducts.filter(item => item.bestseller);
        }

        // Filter by categories
        if (selectedCategories.length > 0) {
            filteredProducts = filteredProducts.filter(product => {
                const productCategoryId = typeof product.categoryId === 'object'
                    ? product.categoryId._id
                    : product.categoryId;
                return selectedCategories.includes(productCategoryId);
            });
        }

        // Filter by subcategories
        if (selectedSubcategories.length > 0) {
            filteredProducts = filteredProducts.filter(product => {
                const productSubcategoryId = typeof product.subcategoryId === 'object'
                    ? product.subcategoryId._id
                    : product.subcategoryId;
                return selectedSubcategories.includes(productSubcategoryId);
            });
        }

        setFilterProducts(filteredProducts);
    };

    const sortProducts = (products) => {
        let sortedProducts = [...products];

        if (sortType === 'bestseller') {
            sortedProducts = sortedProducts.filter(product => product.bestseller);
        }

        switch (sortType) {
            case 'low-high':
                sortedProducts.sort((a, b) => a.price - b.price);
                break;
            case 'high-low':
                sortedProducts.sort((a, b) => b.price - a.price);
                break;
            case 'name-a-z':
                sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'name-z-a':
                sortedProducts.sort((a, b) => b.name.localeCompare(a.name));
                break;
            default:
                sortedProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        return sortedProducts;
    };

    useEffect(() => {
        if (!isLoading) {
            applyFilter();
        }
    }, [selectedCategories, selectedSubcategories, initialProducts, search, showBestsellers, isLoading]);

    useEffect(() => {
        if (!isLoading) {
            setFilterProducts(sortProducts(filterProducts));
        }
    }, [sortType, isLoading]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    return (
        <div className='flex flex-col sm:flex-row gap-1 sm:gap-10 border-t pt-4 pr-4'>
            {/* Filter Options */}
            {showFilters && categories.length > 0 && (
                <div className='min-w-60 px-4 sm:px-6'>
                    <p
                        onClick={() => {
                            if (window.innerWidth < 640) setShowFilter(!showFilter);
                        }}
                        className="my-2 text-xl flex items-center cursor-pointer gap-2 sm:cursor-default"
                    >
                        FILTERS
                        <img
                            className={`h-3 sm:hidden ${showFilter ? "rotate-90" : ""}`}
                            src={assets.dropdown_icon}
                            alt=""
                        />
                    </p>

                    {/* Bestseller Filter */}
                    <div className={`border border-gray-300 pl-5 py-3 mt-6 ${showFilter ? '' : 'hidden sm:block'}`}>
                        <p className='mb-3 text-sm font-medium'>SHOW ONLY</p>
                        <label className='flex items-center gap-2 cursor-pointer'>
                            <input
                                type="checkbox"
                                className='w-4 h-4 accent-orange-500 cursor-pointer'
                                checked={showBestsellers}
                                onChange={() => setShowBestsellers(!showBestsellers)}
                            />
                            <span className="flex items-center gap-1">
                                🔥 Bestsellers
                            </span>
                        </label>
                    </div>

                    {/* Category Filter */}
                    <div className={`border border-gray-300 pl-5 py-3 mt-6 ${showFilter ? '' : 'hidden sm:block'}`}>
                        <p className='mb-3 text-sm font-medium'>CATEGORIES</p>
                        <div className='flex flex-col gap-2 text-sm font-light text-gray-700'>
                            {categories.map((category) => (
                                <label key={category._id} className='flex gap-2 items-center cursor-pointer'>
                                    <input
                                        className='w-4 h-4 accent-orange-500 cursor-pointer'
                                        type="checkbox"
                                        checked={selectedCategories.includes(category._id)}
                                        onChange={() => toggleCategory(category._id)}
                                    />
                                    {category.name}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Subcategory filter */}
                    {filteredSubcategories.length > 0 && (
                        <div className={`border border-gray-300 pl-5 py-3 my-5 ${showFilter ? "" : "hidden sm:block"}`}>
                            <p className="mb-3 text-sm font-medium">SUBCATEGORIES</p>
                            <div className="flex flex-col gap-2 text-sm font-light text-gray-700">
                                {filteredSubcategories.map((subcategory) => (
                                    <label key={subcategory._id} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 accent-blue-500 cursor-pointer"
                                            checked={selectedSubcategories.includes(subcategory._id)}
                                            onChange={() => toggleSubcategory(subcategory._id)}
                                        />
                                        {subcategory.name}
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Right side */}
            <div className='flex-1'>
                <div className='flex justify-between items-center text-base sm:text-2xl mb-4'>
                    <Title text1={title} text2={""} />
                    {/* Product sort */}
                    <div className="relative">
                        <select
                            value={sortType}
                            onChange={(e) => setSortType(e.target.value)}
                            className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-10 py-2 text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 cursor-pointer"
                        >
                            <option value="newest">Newest First</option>
                            <option value="bestseller">Bestsellers</option>
                            <option value="low-high">Price: Low to High</option>
                            <option value="high-low">Price: High to Low</option>
                            <option value="name-a-z">Name: A to Z</option>
                            <option value="name-z-a">Name: Z to A</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Map Products */}
                <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6'>
                    {filterProducts.length > 0 ? (
                        filterProducts.map((item, index) => (
                            <ProductItem
                                key={index}
                                id={item._id}
                                image={item.image}
                                name={item.name}
                                price={item.price}
                                stock={item.stock}
                                stockStatus={item.stockStatus}
                                bestseller={item.bestseller}
                                isActive={item.isActive}
                            />
                        ))
                    ) : (
                        <div className="col-span-full text-center py-10 text-gray-500">
                            No products match the selected filters
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductGrid;