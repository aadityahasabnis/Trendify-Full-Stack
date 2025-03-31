import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import AllSidebar from "./AllSidebar"; // Assuming AllSidebar.js is in the same directory
import { assets } from "../assets/frontend_assets/assets";

const SecondaryNav = () => {
    const [allSidebarOpen, setAllSidebarOpen] = useState(false);
    const sidebarRef = useRef(null);
    const buttonRef = useRef(null);

    const handleClickOutside = (event) => {
        if (
            sidebarRef.current &&
            !sidebarRef.current.contains(event.target) &&
            buttonRef.current && // Ensure buttonRef is not null
            !buttonRef.current.contains(event.target)
        ) {
            setAllSidebarOpen(false);
        }
    };

    useEffect(() => {
        if (allSidebarOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [allSidebarOpen]);

    return (
        <div className="bg-gray-100 border-b relative z-0">
            <div className="flex items-center pl-2 py-0">
                <button
                    onClick={() => setAllSidebarOpen(true)}
                    className="flex flex-row gap-2 px-4 py-1 bg-gray-200 rounded hover:bg-gray-300 focus:outline-none"
                    aria-expanded={allSidebarOpen}
                    aria-label="Open all categories menu"
                    ref={buttonRef}
                >
                    <img src={assets.menu} className="w-5" alt="" />
                    All
                </button>
                <div className="flex space-x-4 ml-4 overflow-x-auto whitespace-nowrap">
                    <Link to="/category1" className="px-4 py-2 text-sm hover:underline focus:outline-none">
                        Category 1
                    </Link>
                    <Link to="/category2" className="px-4 py-2 text-sm hover:underline focus:outline-none">
                        Category 2
                    </Link>
                    <Link to="/category3" className="px-4 py-2 text-sm hover:underline focus:outline-none">
                        Category 3
                    </Link>
                    <Link to="/today-deals" className="px-4 py-2 text-sm hover:underline focus:outline-none">
                        Today's Deals
                    </Link>
                    <Link to="/customer-service" className="px-4 py-2 text-sm hover:underline focus:outline-none">
                        Customer Service
                    </Link>
                </div>
            </div>

            {/* Sidebar */}
            {allSidebarOpen && (
                <div className="fixed inset-0 z-0">
                    <div ref={sidebarRef}>
                        <AllSidebar isOpen={allSidebarOpen} onClose={() => setAllSidebarOpen(false)} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default SecondaryNav;
