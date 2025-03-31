import React, { useState, useEffect, useContext } from "react";
import { Link, NavLink } from "react-router-dom";
import { assets } from "../assets/frontend_assets/assets";
import Searchbar from "./Searchbar";
import { ShopContext } from "../context/ShopContext";

const Navbar = () => {
	const [menuVisible, setMenuVisible] = useState(false);
	const [searchOpen, setSearchOpen] = useState(false);
	const [screenWidth, setScreenWidth] = useState(window.innerWidth);
	const [locationModalOpen, setLocationModalOpen] = useState(false);
	const { getCartCount, navigate, token, setToken, setCartItems } = useContext(ShopContext);

	const logout = () => {
		setToken('')
		localStorage.removeItem('token')
		setCartItems({})
		navigate('/login')
	}
	// Update screen width only when it actually changes
	useEffect(() => {
		const handleResize = () => {
			if (window.innerWidth !== screenWidth) {
				setScreenWidth(window.innerWidth);
			}
		};
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, [screenWidth]);

	return (
		<div className="flex items-center justify-between px-4 py-4 font-medium">
			{/* Logo */}

			<img onClick={() => token ? null : navigate('/login')} src={assets.logo || "/fallback-logo.png"} className="w-36 min-w-[140px]" alt="Logo" />


			{/* Location tag */}
			<div
				className="cursor-pointer hidden lg:flex lg:flex-col gap-y-0 text-sm text-black"
				onClick={() => {
					setLocationModalOpen(true);
					setSearchOpen(false);
				}}
			>
				<p className="text-sm">Delivering to Pune 411007</p>
				<p className="text-blue-400 underline">Update location</p>
			</div>

			{/* Desktop Menu (Hidden when search is open) */}
			<ul className={`hidden gap-6 text-sm font-medium text-gray-700 sm:flex ${searchOpen && screenWidth < 768 ? "hidden" : "flex"}`}>
				<NavLink to="/" className="flex flex-col items-center gap-1">
					<p>HOME</p>
				</NavLink>
				<NavLink to="/collections" className="flex flex-col items-center gap-1">
					<p>COLLECTION</p>
				</NavLink>
				<NavLink to="/about" className="flex flex-col items-center gap-1">
					<p>ABOUT</p>
				</NavLink>
				<NavLink to="/contact" className="flex flex-col items-center gap-1">
					<p>CONTACT</p>
				</NavLink>
			</ul>

			{/* Search Bar - Always Visible on Large Screens */}
			<div className={`flex-grow max-w-md transition-all duration-300 ${searchOpen || screenWidth > 768 ? "flex" : "hidden"}`}>
				<Searchbar searchOpen={searchOpen} setSearchOpen={setSearchOpen} />
			</div>

			{/* Right Side Icons */}
			<div className="flex items-center gap-6">
				{/* Profile Icon */}
				{!searchOpen && (
					<div className="relative group">
						<Link to={'/login'}>
							<img className="w-8 h-8 cursor-pointer" src={assets.profile_icon} alt="Profile" />
						</Link>
						{token &&
							<div className="absolute right-0 hidden pt-4 transition group-hover:block z-50">
								<div className="flex flex-col gap-2 px-5 py-3 text-gray-500 bg-white rounded shadow-lg w-36">
									<p className="cursor-pointer hover:text-black">My Profile</p>
									<p onClick={()=>navigate('/orders')} className="cursor-pointer hover:text-black">Orders</p>
									<p onClick={logout} className="cursor-pointer hover:text-black">Logout</p>

								</div>
							</div>}
					</div>
				)}

				{/* Cart Icon */}
				{!searchOpen && (
					<Link to="/cart" className="relative">
						<img src={assets.cart_icon || "/fallback-cart.png"} className="w-8 h-8" alt="Cart" />
						<p className="absolute right-[-5px] bottom-[-5px] w-4 text-center leading-4 bg-black text-white rounded-full text-[10px]">
							{getCartCount()}
						</p>
					</Link>
				)}

				{/* Search Icon (Only on Small Screens) */}
				{screenWidth < 768 && (
					<div
						onClick={() => setSearchOpen(!searchOpen)}
						className="p-2 bg-orange-500 rounded-full cursor-pointer hover:bg-orange-600 transition"
					>
						<img src={assets.search_icon || "/fallback-search.png"} alt="Search" className="w-6 h-6" />
					</div>
				)}

				{/* Mobile Menu Icon */}
				{!searchOpen && (
					<img
						onClick={() => setMenuVisible(true)}
						src={assets.menu_icon || "/fallback-menu.png"}
						alt="Menu"
						className="w-8 h-8 cursor-pointer sm:hidden"
					/>
				)}
			</div>

			{/* Location Modal */}
			{locationModalOpen && (
				<>
					{/* Background Overlay */}
					<div
						className="fixed inset-0 bg-black opacity-50 z-10 transition-opacity"
						onClick={(e) => {
							if (e.target === e.currentTarget) setLocationModalOpen(false);
						}}
					></div>

					{/* Modal Box */}
					<div className="fixed inset-0 flex items-center justify-center z-20">
						<div className="bg-white p-6 rounded-lg shadow-lg w-96 relative">
							<button
								className="text-3xl absolute top-2 right-4 text-gray-500 hover:text-gray-800 hover:rotate-90 transition"
								onClick={() => setLocationModalOpen(false)}
							>
								&times;
							</button>
							<h2 className="text-lg font-semibold mb-4">Choose your location</h2>
							<p className="text-sm text-gray-600 mb-4">
								Select a delivery location to see product availability and delivery options.
							</p>
							<button className="w-full bg-yellow-300 active:bg-yellow-400 text-black py-2 rounded-full font-semibold mb-3">
								Sign in to see your addresses
							</button>
							<input
								type="text"
								placeholder="Enter an Indian pincode"
								className="w-full p-2 border border-gray-300 rounded-md mb-3"
							/>
							<button className="w-full bg-blue-500 text-white py-2 rounded-md">Apply</button>
						</div>
					</div>
				</>
			)}

			{/* Mobile Sidebar */}
			<div className={`fixed top-0 right-0 bottom-0 bg-white transition-all duration-300 shadow-md ${menuVisible ? "w-64" : "w-0"} overflow-hidden`}>
				<div className="flex flex-col text-gray-600">
					{/* Back Button */}
					<div onClick={() => setMenuVisible(false)} className="flex items-center gap-4 p-3 cursor-pointer">
						<img className="h-4 rotate-180" src={assets.dropdown_icon || "/fallback-dropdown.png"} alt="Back" />
						<p>Back</p>
					</div>

					{/* Mobile Menu Links */}
					<NavLink onClick={() => setMenuVisible(false)} className="py-2 pl-6 border" to="/">
						HOME
					</NavLink>
					<NavLink onClick={() => setMenuVisible(false)} className="py-2 pl-6 border" to="/collections">
						COLLECTION
					</NavLink>
					<NavLink onClick={() => setMenuVisible(false)} className="py-2 pl-6 border" to="/about">
						ABOUT
					</NavLink>
					<NavLink onClick={() => setMenuVisible(false)} className="py-2 pl-6 border" to="/contact">
						CONTACT
					</NavLink>
				</div>
			</div>
		</div>
	);
};

export default Navbar;
