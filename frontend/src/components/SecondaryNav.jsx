import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';
import AllSidebar from './AllSidebar';
import { assets } from '../assets/frontend_assets/assets';

const SecondaryNav = () => {
    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [allSidebarOpen, setAllSidebarOpen] = useState(false);
    const sidebarRef = useRef(null);
    const buttonRef = useRef(null);
    const { backendUrl } = useContext(ShopContext);
    const location = useLocation();

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

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                sidebarRef.current &&
                !sidebarRef.current.contains(event.target) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target)
            ) {
                setAllSidebarOpen(false);
            }
        };

        if (allSidebarOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
            };
        }
    }, [allSidebarOpen]);

    const getSubcategoriesForCategory = (categoryId) => {
        return subcategories.filter(sub =>
            typeof sub.categoryId === 'object' ? sub.categoryId._id === categoryId : sub.categoryId === categoryId
        );
    };

    const isActive = (path) => {
        return location.pathname === path;
    };

    if (loading) {
        return (
            <div className="bg-white shadow-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-center items-center h-10">
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-orange-500"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <nav className="bg-white shadow-md">
            <div className="max-w-7xl px-4 sm:px-6 lg:px-4">
                <div className="flex items-center h-10">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setAllSidebarOpen(true)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded hover:bg-gray-200 focus:outline-none"
                            aria-expanded={allSidebarOpen}
                            aria-label="Open all categories menu"
                            ref={buttonRef}
                        >
                            <img src={assets.menu} className="w-4 h-4" alt="" />
                            <span className="text-sm">All</span>
                        </button>

                        {categories.map((category) => {
                            const categorySubcategories = getSubcategoriesForCategory(category._id);
                            return (
                                <div key={category._id} className="relative group">
                                    <Link
                                        to={`/category/${category.slug}`}
                                        className={`text-gray-700 hover:text-orange-500 px-2 py-1.5 text-sm font-medium transition-colors inline-block ${isActive(`/category/${category.slug}`) ? 'text-orange-500' : ''
                                            }`}
                                    >
                                        {category.name}
                                    </Link>
                                    {categorySubcategories.length > 0 && (
                                        <div className="absolute left-0 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                            <div className="py-1" role="menu" aria-orientation="vertical">
                                                {categorySubcategories.map((subcategory) => (
                                                    <Link
                                                        key={subcategory._id}
                                                        to={`/category/${category.slug}/${subcategory.slug}`}
                                                        className={`block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-500 ${isActive(`/category/${category.slug}/${subcategory.slug}`) ? 'bg-orange-50 text-orange-500' : ''
                                                            }`}
                                                        role="menuitem"
                                                    >
                                                        {subcategory.name}
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* All Sidebar */}
            {allSidebarOpen && (
                <div className="fixed inset-0 z-50">
                    <div ref={sidebarRef}>
                        <AllSidebar isOpen={allSidebarOpen} onClose={() => setAllSidebarOpen(false)} />
                    </div>
                </div>
            )}
        </nav>
    );
};

export default SecondaryNav;
