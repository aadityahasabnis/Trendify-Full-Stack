import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { assets } from "../assets/frontend_assets/assets";

const AllSidebar = ({ isOpen, onClose }) => {
    const firstFocusableElement = useRef(null);
    const [currentSection, setCurrentSection] = useState("main");

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
        <div className="p-4">
            <div className="p-4">
                <h3 className="font-semibold mb-2">Trending</h3>
                <Link to="/best-sellers" className="block p-2 hover:bg-gray-100">
                    Bestsellers
                </Link>
                <Link to="/new-releases" className="block p-2 hover:bg-gray-100">
                    New Releases
                </Link>
                <Link to="/movers-shakers" className="block p-2 hover:bg-gray-100">
                    Movers and Shakers
                </Link>
            </div>
            <div className="p-4">
                <h3 className="font-semibold mb-2">Shop by Category</h3>
                <button
                    onClick={() => setCurrentSection("mobiles")}
                    className="block p-2 hover:bg-gray-100 w-full text-left"
                >
                    Mobiles
                </button>
                <button
                    onClick={() => setCurrentSection("computers")}
                    className="block p-2 hover:bg-gray-100 w-full text-left"
                >
                    Computers
                </button>
                <Link to="/tv" className="block p-2 hover:bg-gray-100">
                    TV
                </Link>
                <Link to="/mens-fashion" className="block p-2 hover:bg-gray-100">
                    Mens Fashion
                </Link>
                <Link to="/womens-fashion" className="block p-2 hover:bg-gray-100">
                    Womens Fashion
                </Link>
                <Link to="/see-all" className="block p-2 hover:bg-gray-100">
                    See All
                </Link>
            </div>
        </div>
    );

    const renderMobilesSection = () => (
        <div className="p-4">
            <button
                onClick={() => setCurrentSection("main")}
                className="block p-2 mb-4 hover:bg-gray-100 w-full text-left"
            >
                &lt; Back
            </button>
            <h3 className="font-semibold mb-2">Mobiles, Tablets & More</h3>
            <Link to="/mobile-phones" className="block p-2 hover:bg-gray-100">
                Mobiles
            </Link>
            <Link to="/tablets" className="block p-2 hover:bg-gray-100">
                Tablets
            </Link>
            <Link to="/mobile-accessories" className="block p-2 hover:bg-gray-100">
                Mobile Accessories
            </Link>
        </div>
    );

    const renderComputersSection = () => (
        <div className="p-4">
            <button
                onClick={() => setCurrentSection("main")}
                className="block p-2 mb-4 hover:bg-gray-100 w-full text-left"
            >
                &lt; Back
            </button>
            <h3 className="font-semibold mb-2">Computers & Accessories</h3>
            <Link to="/laptops" className="block p-2 hover:bg-gray-100">
                Laptops
            </Link>
            <Link to="/desktops" className="block p-2 hover:bg-gray-100">
                Desktops
            </Link>
            <Link to="/computer-accessories" className="block p-2 hover:bg-gray-100">
                Computer Accessories
            </Link>
        </div>
    );

    let content;
    if (currentSection === "main") {
        content = renderMainSection();
    } else if (currentSection === "mobiles") {
        content = renderMobilesSection();
    } else if (currentSection === "computers") {
        content = renderComputersSection();
    }

    return (
        <div
            className={`fixed top-0 left-0 h-full w-80 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${isOpen ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"
                }`}
        >
            <div className="transition-opacity duration-300">
                <div className="bg-orange-400 flex items-center justify-between mb-5 p-4">
                    <div className="flex gap-4 items-center">
                        <img
                            src={assets.profile_icon || "/fallback-profile.png"}
                            className="w-10"
                            alt="Profile Icon"
                        />
                        <p className="text-2xl font-semibold">Hello, sign in</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-4xl top-2 right-4 text-gray-500 hover:text-gray-800 hover:rotate-90 transition-transform duration-300"
                    >
                        &times;
                    </button>
                </div>
                <div className="transition-transform duration-300 ease-in-out transform translate-x-0">
                    {content}
                </div>
            </div>
        </div>
    );
};

export default AllSidebar;