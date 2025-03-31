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
            setSelectedCategory("All"); // Reset to "All" if no or invalid category in URL
        }

    }, [location.search]); // Run effect when location.search changes

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
            {isFocused && <div className="fixed inset-0 bg-black opacity-50 z-5 transition-opacity"></div>}

            <form
                className="flex items-center  max-w-xl overflow-hidden border border-gray-300 rounded-full focus-within:border-orange-500 relative z-10 bg-white"
                onSubmit={handleSearch}
            >
                <div className="w-30 border-r border-gray-300 bg-gray-100">
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full px-3 py-2 text-sm outline-none md:text-base"
                    >
                        {categories.map((category, index) => (
                            <option key={index} value={category}>{category}</option>
                        ))}
                    </select>
                </div>

                <input
                    type="text"
                    placeholder="Search Trendy Products.."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onKeyDown={handleKeyPress}
                    className=" w-65 px-4 py-2 text-sm outline-none md:text-base"
                />

                <button type="submit" className="flex items-center justify-center w-10 h-10 text-white bg-orange-500 hover:bg-orange-600 rounded-full">
                    <img src={assets.search_icon} className="h-5 w-5" alt="Search" />
                </button>
            </form>
        </>
    );
};

export default Searchbar;