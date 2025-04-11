import React, { useContext, useState, useEffect, useRef } from "react";
import { assets } from "../assets/frontend_assets/assets";
import { ShopContext } from "../context/ShopContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";

const Searchbar = () => {
    const { search, setSearch, products, backendUrl } = useContext(ShopContext);
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [isFocused, setIsFocused] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [categories, setCategories] = useState([]);
    const searchRef = useRef(null);
    const navigate = useNavigate();

    // Fetch categories from backend
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get(`${backendUrl}/api/categories`);
                if (response.data.success) {
                    setCategories(response.data.categories);
                }
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };

        fetchCategories();
    }, [backendUrl]);

    // Handle search input changes
    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearch(value);
        filterResults(value, selectedCategory);
    };

    // Filter results based on search query and category
    const filterResults = (query, category) => {
        let filtered = products;

        // Apply category filter
        if (category !== "All") {
            filtered = filtered.filter(product => {
                // Check if product has a category and it matches the selected category
                return product.category &&
                    (product.category._id === category ||
                        product.category === category);
            });
        }

        // Apply search query filter
        if (query) {
            const searchLower = query.toLowerCase();
            filtered = filtered.filter(product =>
                product.name.toLowerCase().includes(searchLower) ||
                (product.description && product.description.toLowerCase().includes(searchLower))
            );
        }

        setSearchResults(filtered.slice(0, 5)); // Limit to 5 results
    };

    // Handle category selection
    const handleCategoryChange = (e) => {
        const category = e.target.value;
        setSelectedCategory(category);
        filterResults(search, category);
    };

    // Handle search submission
    const handleSearch = (e) => {
        e.preventDefault();
        if (!search.trim()) {
            toast.error("Please enter a search term");
            return;
        }

        let queryParams = `search=${encodeURIComponent(search)}`;
        if (selectedCategory !== "All") {
            queryParams += `&category=${encodeURIComponent(selectedCategory)}`;
        }

        navigate(`/collections?${queryParams}`);
        setSearch(""); // Clear search input
        setIsFocused(false);
    };

    // Handle click outside to close search results
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsFocused(false);
                setSearch(""); // Clear search input when clicking outside
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative w-full" ref={searchRef}>
            {isFocused && (
                <div
                    className="fixed inset-0 bg-black opacity-50 z-[55] transition-opacity"
                    onClick={() => {
                        setIsFocused(false);
                        setSearch("");
                    }}
                ></div>
            )}

            <form
                className="flex items-center w-full overflow-hidden border border-gray-300 rounded-full focus-within:border-orange-500 relative z-[56] bg-white"
                onSubmit={handleSearch}
            >
                {/* Category Selector */}
                <div className="hidden md:block border-r border-gray-300 bg-gray-100">
                    <select
                        value={selectedCategory}
                        onChange={handleCategoryChange}
                        className="w-30 lg:w-28 px-2 py-2 text-xs lg:text-sm outline-none bg-transparent cursor-pointer"
                    >
                        <option value="All">All</option>
                        {categories.map((category) => (
                            <option key={category._id} value={category._id}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Search Input */}
                <input
                    type="text"
                    placeholder="Search Products..."
                    value={search}
                    onChange={handleSearchChange}
                    onFocus={() => setIsFocused(true)}
                    className="flex-1 min-w-0 px-3 py-2 text-xs lg:text-sm outline-none"
                />

                {/* Search Button */}
                <button
                    type="submit"
                    className="flex items-center justify-center w-8 h-8 lg:w-10 lg:h-10 text-white bg-orange-500 hover:bg-orange-600 rounded-full flex-shrink-0 transition-colors"
                >
                    <img
                        src={assets.search_icon}
                        className="h-4 w-4 lg:h-5 lg:w-5"
                        alt="Search"
                    />
                </button>
            </form>

            {/* Search Results Dropdown */}
            {isFocused && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg z-[60] max-h-96 overflow-y-auto">
                    {searchResults.map((product) => (
                        <div
                            key={product._id}
                            className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                            onClick={() => {
                                navigate(`/product/${product._id}`);
                                setIsFocused(false);
                                setSearch(""); // Clear search input after selecting a product
                            }}
                        >
                            <img
                                src={product.image[0]}
                                alt={product.name}
                                className="w-12 h-12 object-cover rounded"
                            />
                            <div className="flex-1">
                                <h3 className="text-sm font-medium text-gray-900">{product.name}</h3>
                                <p className="text-xs text-gray-500">₹{product.price}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Searchbar;