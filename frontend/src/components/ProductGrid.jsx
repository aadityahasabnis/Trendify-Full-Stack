import React, { useState, useEffect, useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import { assets } from '../assets/frontend_assets/assets';
import Title from './Title';
import ProductItem from './ProductItem';
import axios from 'axios';

const ProductGrid = ({ title, products: initialProducts, showFilters = true }) => {
    const { backendUrl } = useContext(ShopContext);
    const { search } = useContext(ShopContext);
    const [showFilter, setShowFilter] = useState(false);
    const [filterProducts, setFilterProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [filteredSubcategories, setFilteredSubcategories] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedSubcategories, setSelectedSubcategories] = useState([]);
    const [sortType, setSortType] = useState('relevant');

    // Initial setup of filter products
    useEffect(() => {
        setFilterProducts(initialProducts);
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
                // Handle both object and string categoryId
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

            // Clear subcategory selections if a category is deselected
            if (prev.includes(categoryId)) {
                setSelectedSubcategories(prevSubs => {
                    return prevSubs.filter(subId => {
                        const subCategory = subcategories.find(s => s._id === subId);
                        if (!subCategory) return false;

                        // Handle both object and string categoryId
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

        // Filter by search term
        if (search) {
            filteredProducts = filteredProducts.filter(item =>
                item.name.toLowerCase().includes(search.toLowerCase())
            );
        }

        // Filter by categories
        if (selectedCategories.length > 0) {
            filteredProducts = filteredProducts.filter(product => {
                // Match on categoryId field
                return selectedCategories.includes(product.categoryId);
            });
        }

        // Filter by subcategories
        if (selectedSubcategories.length > 0) {
            filteredProducts = filteredProducts.filter(product => {
                // Match on subcategoryId field
                return selectedSubcategories.includes(product.subcategoryId);
            });
        }

        setFilterProducts(filteredProducts);
    };

    const sortProduct = () => {
        let fpCopy = [...filterProducts];
        switch (sortType) {
            case 'low-high':
                setFilterProducts(fpCopy.sort((a, b) => (a.price - b.price)));
                break;
            case 'high-low':
                setFilterProducts(fpCopy.sort((a, b) => (b.price - a.price)));
                break;
            case 'bestsellers':
                setFilterProducts(fpCopy.filter((a) => (a.bestseller === true)));
                break;
            case 'customer-reviews':
                setFilterProducts(fpCopy.sort((a, b) => (b.rating - a.rating)));
                break;
            default:
                applyFilter();
                break;
        }
    };

    useEffect(() => {
        applyFilter();
    }, [selectedCategories, selectedSubcategories, initialProducts, search]);

    useEffect(() => {
        sortProduct();
    }, [sortType]);

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

                    {/* Category Filter */}
                    <div className={`border border-gray-300 pl-5 py-3 mt-6 ${showFilter ? '' : 'hidden sm:block'}`}>
                        <p className='mb-3 text-sm font-medium'>CATEGORIES</p>
                        <div className='flex flex-col gap-2 text-sm font-light text-gray-700'>
                            {categories.map((category) => (
                                <label key={category._id} className='flex gap-2 items-center cursor-pointer'>
                                    <input
                                        className='w-4 h-4 accent-blue-500 cursor-pointer'
                                        type="checkbox"
                                        checked={selectedCategories.includes(category._id)}
                                        onChange={() => toggleCategory(category._id)}
                                    />
                                    {category.name}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Subcategory filter - only show if categories are selected */}
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
                <div className='flex justify-between text-base sm:text-2xl mb-4'>
                    <Title text1={title} text2={""} />
                    {/* Product sort */}
                    <select
                        onChange={(e) => setSortType(e.target.value)}
                        className="border-gray-300 border text-sm px-2 rounded hover:border-orange-500 focus:border-orange-500"
                    >
                        <option value="relevant">Sort by: Relevant</option>
                        <option value="low-high">Sort by: Low to High</option>
                        <option value="high-low">Sort by: High to Low</option>
                        <option value="bestsellers">Sort by: Bestsellers</option>
                        <option value="customer-reviews">Sort by: Customer Reviews</option>
                    </select>
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