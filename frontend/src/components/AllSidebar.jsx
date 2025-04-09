import React, { useState, useRef, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import axios from 'axios';

const AllSidebar = ({ isOpen, onClose }) => {
    const firstFocusableElement = useRef(null);
    const [currentSection, setCurrentSection] = useState("main");
    const { token, setToken, setCartItems, backendUrl } = useContext(ShopContext);
    const [userData, setUserData] = useState(null);
    const navigate = useNavigate();
    const [showProfileInfo, setShowProfileInfo] = useState(false);
    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [loading, setLoading] = useState(true);

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
            } finally {
                setLoading(false);
            }
        };

        fetchCategoriesAndSubcategories();
    }, [backendUrl]);

    // Fetch user data if logged in
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await fetch(`${backendUrl}/api/user/profile`, {
                    headers: { token }
                });
                const data = await response.json();
                if (data.success) {
                    setUserData(data.user);
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            }
        };

        if (token) {
            fetchUserData();
        }
    }, [token, backendUrl]);

    const logout = () => {
        setToken('');
        localStorage.removeItem('token');
        setCartItems({});
        navigate('/login');
        onClose();
    };

    // Add profile click handler
    const handleProfileClick = () => {
        setShowProfileInfo(!showProfileInfo);
    };

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
            if (firstFocusableElement.current) {
                firstFocusableElement.current.focus();
            }
            const handleKeyDown = (event) => {
                if (event.key === "Escape") {
                    onClose();
                }
            };
            document.addEventListener("keydown", handleKeyDown);
            return () => {
                document.body.style.overflow = "";
                document.removeEventListener("keydown", handleKeyDown);
            };
        } else {
            document.body.style.overflow = "";
        }
    }, [isOpen, onClose]);

    const renderMainSection = () => (
        <div className="flex flex-col h-full">
            {/* Trending Section */}
            <div className="p-4 border-b">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Trending</h3>
                <div className="space-y-2">
                    <Link to="/best-sellers"
                        className="flex items-center p-2 hover:bg-orange-50 rounded-lg group transition-colors"
                        onClick={onClose}
                    >
                        <span className="material-icons mr-3 text-orange-500">trending_up</span>
                        <span className="group-hover:text-orange-600">Bestsellers</span>
                    </Link>
                    <Link to="/new-releases"
                        className="flex items-center p-2 hover:bg-orange-50 rounded-lg group transition-colors"
                        onClick={onClose}
                    >
                        <span className="material-icons mr-3 text-orange-500">new_releases</span>
                        <span className="group-hover:text-orange-600">New Releases</span>
                    </Link>
                    <Link to="/movers-shakers"
                        className="flex items-center p-2 hover:bg-orange-50 rounded-lg group transition-colors"
                        onClick={onClose}
                    >
                        <span className="material-icons mr-3 text-orange-500">moving</span>
                        <span className="group-hover:text-orange-600">Movers and Shakers</span>
                    </Link>
                </div>
            </div>

            {/* Shop by Category Section */}
            <div className="p-4 flex-1">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Shop by Category</h3>
                <div className="space-y-2">
                    {loading ? (
                        <div className="flex items-center justify-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-orange-500"></div>
                        </div>
                    ) : (
                        categories.map((category) => (
                            <button
                                key={category._id}
                                onClick={() => setCurrentSection(category._id)}
                                className="flex items-center w-full p-2 hover:bg-orange-50 rounded-lg group transition-colors"
                            >
                                <span className="material-icons mr-3 text-orange-500">category</span>
                                <span className="group-hover:text-orange-600 flex-1 text-left">{category.name}</span>
                                <span className="material-icons text-gray-400">chevron_right</span>
                            </button>
                        ))
                    )}
                    <Link to="/collections"
                        className="flex items-center p-2 hover:bg-orange-50 rounded-lg group transition-colors"
                        onClick={onClose}
                    >
                        <span className="material-icons mr-3 text-orange-500">grid_view</span>
                        <span className="group-hover:text-orange-600">See All</span>
                    </Link>
                </div>
            </div>

            {/* User Account Section - Only visible when logged in */}
            {token && (
                <div className="p-4 border-t bg-gray-50">
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">My Account</h3>
                    <div className="space-y-2">
                        <Link to="/profile"
                            className="flex items-center p-2 hover:bg-orange-50 rounded-lg group transition-colors"
                            onClick={onClose}
                        >
                            <span className="material-icons mr-3 text-orange-500">person</span>
                            <span className="group-hover:text-orange-600">My Profile</span>
                        </Link>
                        <Link to="/orders"
                            className="flex items-center p-2 hover:bg-orange-50 rounded-lg group transition-colors"
                            onClick={onClose}
                        >
                            <span className="material-icons mr-3 text-orange-500">shopping_bag</span>
                            <span className="group-hover:text-orange-600">My Orders</span>
                        </Link>
                        <button
                            onClick={logout}
                            className="flex items-center w-full p-2 hover:bg-red-50 rounded-lg group transition-colors"
                        >
                            <span className="material-icons mr-3 text-red-500">logout</span>
                            <span className="group-hover:text-red-600">Logout</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );

    const renderCategorySection = (categoryId) => {
        const category = categories.find(c => c._id === categoryId);
        const categorySubcategories = subcategories.filter(sub =>
            typeof sub.categoryId === 'object' ? sub.categoryId._id === categoryId : sub.categoryId === categoryId
        );

        return (
            <div className="p-4">
                <button
                    onClick={() => setCurrentSection("main")}
                    className="flex items-center mb-4 p-2 hover:bg-orange-50 rounded-lg group transition-colors"
                >
                    <span className="material-icons mr-2 text-orange-500">arrow_back</span>
                    <span className="group-hover:text-orange-600">Back</span>
                </button>
                <h3 className="text-lg font-semibold mb-3 text-gray-800">{category?.name}</h3>
                <div className="space-y-2">
                    {categorySubcategories.map((subcategory) => (
                        <Link
                            key={subcategory._id}
                            to={`/category/${category?.slug}/${subcategory.slug}`}
                            className="flex items-center p-2 hover:bg-orange-50 rounded-lg group transition-colors"
                            onClick={onClose}
                        >
                            <span className="material-icons mr-3 text-orange-500">subdirectory_arrow_right</span>
                            <span className="group-hover:text-orange-600">{subcategory.name}</span>
                        </Link>
                    ))}
                </div>
            </div>
        );
    };

    let content;
    if (currentSection === "main") {
        content = renderMainSection();
    } else {
        content = renderCategorySection(currentSection);
    }

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/10 z-30 transition-opacity duration-300 ease-in-out"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div
                className={`fixed top-16 left-0 h-[calc(100vh-64px)] w-80 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-40 ${isOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-400 to-orange-500 p-4">
                    <div className="flex items-center gap-3">
                        {token ? (
                            <>
                                <button
                                    onClick={handleProfileClick}
                                    className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-md hover:bg-orange-50 transition-colors"
                                >
                                    <span className="material-icons text-orange-500 text-2xl">person</span>
                                </button>
                                <div>
                                    <p className="text-white text-lg font-medium">Hello, {userData?.name || 'User'}</p>
                                    <p className="text-white text-sm opacity-90">{userData?.email}</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-md">
                                    <span className="material-icons text-orange-500 text-2xl">account_circle</span>
                                </div>
                                <Link
                                    to="/login"
                                    className="text-white text-lg hover:text-orange-100 transition-colors"
                                    onClick={onClose}
                                >
                                    Hello, sign in
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Profile Info Popup */}
                    {showProfileInfo && token && (
                        <div className="mt-4 p-4 bg-white rounded-lg shadow-lg">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="material-icons text-orange-500">person</span>
                                    <p className="text-gray-800">{userData?.name}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="material-icons text-orange-500">email</span>
                                    <p className="text-gray-800">{userData?.email}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="material-icons text-orange-500">phone</span>
                                    <p className="text-gray-800">{userData?.phone || 'Not provided'}</p>
                                </div>
                                <button
                                    onClick={() => setShowProfileInfo(false)}
                                    className="mt-2 w-full p-2 bg-orange-100 text-orange-600 rounded hover:bg-orange-200 transition-colors flex items-center justify-center gap-2"
                                >
                                    <span className="material-icons text-sm">close</span>
                                    Close
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="h-[calc(100%-88px)] overflow-y-auto">
                    {content}
                </div>
            </div>
        </>
    );
};

export default AllSidebar;