import React, { useState } from "react";
import { assets } from "../assets/frontend_assets/assets";
import { Link, NavLink } from "react-router-dom";
import Searchbar from "./Searchbar";

const Navbar = () => {
    const [visible, setvisible] = useState(false);
    // const [searchQuery, setSearchQuery] = useState("");


    return (
        <div className="flex items-center justify-between py-4 font medium ">
            {/* Logo on left side */}
            <Link to={"/"}>
                <img src={assets.logo} className="w-36 min-w-[140px]" alt="" />
            </Link>

            {/* Un-ordered list of home, collection, about, contact */}
            <ul className="hidden gap-5 py-4 text-sm font-medium text-gray-700 sm:flex">
                <NavLink to="/" className="flex flex-col items-center gap-1">
                    <p>HOME</p>
                    <hr className="w-2/4 border-none h-[1.5px] bg-gray-700 hidden" />
                </NavLink>

                <NavLink to="/collection" className="flex flex-col items-center gap-1">
                    <p>COLLECTION</p>
                    <hr className="w-2/4 border-none h-[1.5px] bg-gray-700 hidden" />
                </NavLink>

                <NavLink to="/about" className="flex flex-col items-center gap-1">
                    <p>ABOUT</p>
                    <hr className="w-2/4 border-none h-[1.5px] bg-gray-700 hidden" />
                </NavLink>

                <NavLink to="/contact" className="flex flex-col items-center gap-1">
                    <p>CONTACT</p>
                    <hr className="w-2/4 border-none h-[1.5px] bg-gray-700 hidden" />
                </NavLink>
            </ul>

            <div className="flex items-center gap-6">
                {/* Search */}
                <Searchbar />


                {/* Profile:> Hover: my profile, orders, logout */}
                <div className="relative group">
                    <img className="w-5 cursor-pointer min-w-6" src={assets.profile_icon} alt="" />

                    <div className="absolute right-0 hidden pt-4 group-hover:block dropdown-menu">
                        <div className="flex flex-col gap-2 px-5 py-3 text-gray-500 rounded w-36 bg-slate-100">
                            <p className="cursor-pointer hover:text-black hover:font-medium">
                                My Profile
                            </p>
                            <p className="cursor-pointer hover:text-black hover:font-medium">
                                Orders
                            </p>
                            <p className="cursor-pointer hover:text-black hover:font-medium">
                                Logout
                            </p>
                        </div>
                    </div>
                </div>

                {/* Cart */}
                <Link to="/cart" className="relative">
                    <img src={assets.cart_icon} className="w-5 min-w-5" alt="" />
                    <p className="absolute right-[-5px] bottom-[-5px] w-4 text-center leading-4 bg-black text-white aspect-square rounded-full text-[8px]">
                        10
                    </p>
                </Link>

                {/* Menu Icon */}
                <img
                    onClick={() => {
                        setvisible(true);
                    }}
                    src={assets.menu_icon}
                    alt=""
                    className="w-5 cursor-pointer sm:hidden"
                />
            </div>

            {/* For Mobile View :::: Sidebar screen*/}
            <div
                className={`absolute top-0 right-0 bottom-0 overflow-hidden bg-white transition-all ${visible ? "w-full" : "w-0"
                    }`}
            >
                <div className="flex flex-col text-gray-600">
                    {/* Back Button */}
                    <div
                        onClick={() => {
                            setvisible(false);
                        }}
                        className="flex items-center gap-4 p-3 cursor-pointer"
                    >
                        <img className="h-4 rotate-180" src={assets.dropdown_icon} alt="" />
                        <p>Back</p>
                    </div>

                    {/* Routes */}
                    <NavLink
                        onClick={() => {
                            setvisible(false);
                        }}
                        className="py-2 pl-6 border"
                        to="/"
                    >
                        HOME
                    </NavLink>
                    <NavLink
                        onClick={() => {
                            setvisible(false);
                        }}
                        className="py-2 pl-6 border"
                        to="/collection"
                    >
                        COLLECTION
                    </NavLink>
                    <NavLink
                        onClick={() => {
                            setvisible(false);
                        }}
                        className="py-2 pl-6 border"
                        to="/about"
                    >
                        ABOUT
                    </NavLink>
                    <NavLink
                        onClick={() => {
                            setvisible(false);
                        }}
                        className="py-2 pl-6 border"
                        to="/contact"
                    >
                        CONTACT
                    </NavLink>
                </div>
            </div>
        </div>
    );
};

export default Navbar;
