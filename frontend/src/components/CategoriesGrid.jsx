import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import Title from './Title';
import axios from 'axios';

const CategoriesGrid = () => {
    const { backendUrl } = useContext(ShopContext);
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hoveredCategory, setHoveredCategory] = useState(null);

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
            } finally {
                setLoading(false);
            }
        };

        fetchCategoriesAndSubcategories();
    }, [backendUrl]);

    const getSubcategoriesForCategory = (categoryId) => {
        return subcategories.filter(sub =>
            typeof sub.categoryId === 'object' ? sub.categoryId._id === categoryId : sub.categoryId === categoryId
        );
    };

    // Fallback images for categories that don't have their own
    const fallbackImages = {
        'Men': 'https://images.unsplash.com/photo-1617137968427-85924c800a22?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'Women': 'https://images.unsplash.com/photo-1581044777550-4cfa60707c03?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'Kids': 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'Electronics': 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'Home': 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
    };

    const getCategoryImage = (category) => {
        return category.image || fallbackImages[category.name] || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8';
    };

    // Fixed prices for categories
    const categoryPrices = {
        "Men's Clothing": 499,
        'Women': 699,
        'Kids': 299,
        'Electronics': 399,
        'Sports & Outdoors': 449,
        'Toys & Games': 129,
        'Books & Stationery': 59,
        'Pet Supplies': 89,
        'Baby & Kids': 139,
        'Home and Kitchen': 99
    };

    const getCategoryPrice = (category) => {
        return categoryPrices[category.name] || 399;
    };

    const handleCategoryClick = (category) => {
        navigate(`/category/${category.slug}`);
    };

    if (loading) {
        return (
            <div className="my-16 px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10">
                    <Title text1="SHOP BY" text2="CATEGORY" />
                    <div className="flex justify-center mt-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="my-16 px-4 sm:px-6 lg:px-8">
            {/* Main Title */}
            <div className="text-center mb-12">
                <Title text1="SHOP BY" text2="CATEGORY" />
                <p className="w-3/4 mx-auto text-sm text-gray-600 mt-2">
                    Explore our wide range of products across different categories
                </p>
            </div>

            {/* Featured Categories - Large Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                {categories.slice(0, 2).map((category) => (
                    <div
                        key={category._id}
                        className="relative group cursor-pointer overflow-hidden rounded-xl shadow-lg"
                        onClick={() => handleCategoryClick(category)}
                    >
                        <div className="aspect-[16/9]">
                            <img
                                src={getCategoryImage(category)}
                                alt={category.name}
                                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent">
                                <div className="absolute bottom-0 left-0 right-0 p-6">
                                    <h3 className="text-2xl font-bold text-white mb-2">{category.name}</h3>
                                    <p className="text-white/80 text-sm mb-4">{category.description || `Explore our ${category.name.toLowerCase()} collection`}</p>
                                    <button className="bg-white text-gray-900 px-6 py-2 rounded-full text-sm font-medium hover:bg-orange-50 transition-colors">
                                        Shop Now
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Category Grid - Smaller Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-12">
                {categories.slice(2).map((category) => {
                    const categorySubcategories = getSubcategoriesForCategory(category._id);
                    return (
                        <div
                            key={category._id}
                            className="group cursor-pointer relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300"
                            onClick={() => handleCategoryClick(category)}
                            onMouseEnter={() => setHoveredCategory(category._id)}
                            onMouseLeave={() => setHoveredCategory(null)}
                        >
                            <div className="aspect-square">
                                <img
                                    src={getCategoryImage(category)}
                                    alt={category.name}
                                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent">
                                    <div className="absolute bottom-0 left-0 right-0 p-4">
                                        <h3 className="text-lg font-bold text-white mb-1 group-hover:opacity-0 transition-opacity duration-300">{category.name}</h3>
                                        {categorySubcategories.length > 0 && (
                                            <p className="text-white/70 text-sm group-hover:opacity-0 transition-opacity duration-300">
                                                {categorySubcategories.length} subcategories
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Price Tag */}
                            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                                <span className="text-sm font-medium text-gray-900">
                                    Starting ₹{getCategoryPrice(category)}
                                </span>
                            </div>

                            {/* Hover Overlay - Category Description */}
                            {hoveredCategory === category._id && (
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out">
                                    <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 ease-out">
                                        <h4 className="text-white font-medium mb-2 text-lg">{category.name}</h4>
                                        <p className="text-white/80 text-sm line-clamp-2 mb-3">
                                            {category.description || `Explore our ${category.name.toLowerCase()} collection`}
                                        </p>
                                        <button
                                            className="bg-white/20 backdrop-blur-sm text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-white/30 transition-colors"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/category/${category.slug}`);
                                            }}
                                        >
                                            Shop Now
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Special Offers as Last Category */}
                <div
                    className="group cursor-pointer relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300"
                    onClick={() => navigate('/offers')}
                >
                    <div className="aspect-square bg-gradient-to-br from-orange-500 to-pink-500">
                        <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-3">Special Offers</h3>
                                <p className="text-white/90 text-sm mb-4">
                                    Discover amazing deals across all categories. Up to 60% off on selected items.
                                </p>
                                <button className="bg-white text-gray-900 px-6 py-2 rounded-full text-sm font-medium hover:bg-opacity-90 transition-colors">
                                    View All Offers
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CategoriesGrid; 