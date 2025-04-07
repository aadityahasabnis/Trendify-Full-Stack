import React, { useContext, useState, useEffect } from "react";
import { assets } from "../assets/frontend_assets/assets";
import { ShopContext } from "../context/ShopContext";
import { useNavigate, useLocation } from "react-router-dom";

const Searchbar = () => {
    const { search, setSearch } = useContext(ShopContext);
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [isFocused, setIsFocused] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const categories = ["All", "Men", "Women", "Kids"];

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const categoryParam = searchParams.get("category");

        if (categoryParam && categories.includes(categoryParam)) {
            setSelectedCategory(categoryParam);
        } else {
            setSelectedCategory("All");
        }
    }, [location.search]);

    const handleSearch = (e) => {
        e.preventDefault();
        setSearch(search);
        setIsFocused(false);

        let queryParams = `search=${encodeURIComponent(search)}`;
        if (selectedCategory !== "All") {
            queryParams += `&category=${encodeURIComponent(selectedCategory)}`;
        }

        navigate(`/collections?${queryParams}`);
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            handleSearch(e);
        }
    };

    return (
        <>
            {isFocused && (
                <div
                    className="fixed inset-0 bg-black opacity-50 z-[55] transition-opacity"
                    onClick={() => setIsFocused(false)}
                ></div>
            )}

            <form
                className="flex items-center w-full max-w-xl overflow-hidden border border-gray-300 rounded-full focus-within:border-orange-500 relative z-[56] bg-white"
                onSubmit={handleSearch}
            >
                {/* Category Selector - Hidden on smaller screens */}
                <div className="hidden md:block border-r border-gray-300 bg-gray-100">
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-24 lg:w-28 px-2 py-2 text-xs lg:text-sm outline-none bg-transparent cursor-pointer"
                    >
                        {categories.map((category, index) => (
                            <option key={index} value={category}>{category}</option>
                        ))}
                    </select>
                </div>

                {/* Search Input */}
                <input
                    type="text"
                    placeholder="Search Products..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                    onKeyDown={handleKeyPress}
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
        </>
    );
};

export default Searchbar;