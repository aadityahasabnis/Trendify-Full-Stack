import React, { useState, useEffect, useContext } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { assets } from "../assets/frontend_assets/assets";
import Searchbar from "./Searchbar";
import { ShopContext } from "../context/ShopContext";
import { toast } from "react-toastify";

const Navbar = () => {
	const [menuVisible, setMenuVisible] = useState(false);
	const [searchOpen, setSearchOpen] = useState(false);
	const [screenWidth, setScreenWidth] = useState(window.innerWidth);
	const [locationModalOpen, setLocationModalOpen] = useState(false);
	const [userLocation, setUserLocation] = useState({
		city: "Pune",
		pincode: "411007"
	});
	const [inputPincode, setInputPincode] = useState("");
	const { getCartCount, navigate, token, setToken, setCartItems } = useContext(ShopContext);
	const location = useLocation();

	const showLocationToast = () => {
		if (location.pathname === '/') {
			toast.success("Location updated successfully!");
		}
	};

	const getCurrentLocation = () => {
		if (!navigator.geolocation) {
			toast.error("Geolocation is not supported by your browser");
			return;
		}

		navigator.geolocation.getCurrentPosition(
			async (position) => {
				try {
					const { latitude, longitude } = position.coords;
					// Using OpenStreetMap Nominatim API for reverse geocoding
					const response = await fetch(
						`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
					);
					const data = await response.json();

					// Extract city and pincode from the response
					const city = data.address.city || data.address.town || data.address.village || "Unknown";
					const pincode = data.address.postcode || "Unknown";

					setUserLocation({ city, pincode });
					showLocationToast();
				} catch (error) {
					console.error("Error getting location:", error);
					toast.error("Failed to get location details");
				}
			},
			(error) => {
				console.error("Error getting location:", error);
				toast.error("Failed to get your location. Please enable location services.");
			}
		);
	};

	const handleLocationUpdate = () => {
		getCurrentLocation();
		setLocationModalOpen(false);
	};

	const validateIndianPincode = (pincode) => {
		const pincodeRegex = /^[1-9][0-9]{5}$/;
		return pincodeRegex.test(pincode);
	};

	const getLocationFromPincode = async (pincode) => {
		try {
			// Using India Post API to get location details from pincode
			const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
			const data = await response.json();

			if (data[0].Status === "Success") {
				const locationInfo = data[0].PostOffice[0];
				setUserLocation({
					city: locationInfo.District,
					pincode: pincode
				});
				showLocationToast();
				setLocationModalOpen(false);
			} else {
				toast.error("Invalid pincode. Please enter a valid Indian pincode.");
			}
		} catch (error) {
			console.error("Error fetching location:", error);
			toast.error("Failed to fetch location details. Please try again.");
		}
	};

	const handlePincodeSubmit = () => {
		if (!validateIndianPincode(inputPincode)) {
			toast.error("Please enter a valid 6-digit Indian pincode");
			return;
		}
		getLocationFromPincode(inputPincode);
	};

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

	// Get location when component mounts
	useEffect(() => {
		getCurrentLocation();
	}, []);

	return (
		<div className="flex items-center justify-between h-16 px-4 font-medium bg-white fixed top-0 left-0 right-0 z-50 shadow-sm">
			{/* Logo */}
			<div className="flex items-center">
				<img
					onClick={() => token ? null : navigate('/login')}
					src={assets.logo || "/fallback-logo.png"}
					className="h-8 w-auto min-w-[120px] max-w-[140px] object-contain"
					alt="Logo"
				/>
			</div>

			{/* Location tag */}
			<div
				className="hidden md:flex flex-col items-start justify-center cursor-pointer max-w-[200px] lg:max-w-[300px] px-2"
				onClick={() => {
					setLocationModalOpen(true);
					setSearchOpen(false);
				}}
			>
				<p className="text-xs lg:text-sm truncate w-full pr-4">
					<span className="text-gray-600 lg:text-s">Delivering to</span> <br /> <span className="lg:text-base">{userLocation.city} {userLocation.pincode}</span>
				</p>
				<p className=" hidden text-xs lg:text-sm text-blue-400 underline">Update location</p>
			</div>

			{/* Desktop Menu (Hidden when search is open) */}
			<ul className={`hidden gap-4 lg:gap-6 text-xs lg:text-sm font-medium text-gray-700 md:flex ${searchOpen && screenWidth < 768 ? "hidden" : "flex"}`}>
				<NavLink to="/" className="flex flex-col items-center gap-1 hover:text-orange-500">
					<p>HOME</p>
				</NavLink>
				<NavLink to="/collections" className="flex flex-col items-center gap-1 hover:text-orange-500">
					<p>COLLECTION</p>
				</NavLink>
				<NavLink to="/about" className="flex flex-col items-center gap-1 hover:text-orange-500">
					<p>ABOUT</p>
				</NavLink>
				<NavLink to="/contact" className="flex flex-col items-center gap-1 hover:text-orange-500">
					<p>CONTACT</p>
				</NavLink>
			</ul>

			{/* Search Bar - Always Visible on Large Screens */}
			<div className={`flex-grow max-w-[300px] xl:max-w-md mx-2 lg:mx-4 transition-all duration-300 ${searchOpen || screenWidth >= 768 ? "flex" : "hidden"}`}>
				<Searchbar searchOpen={searchOpen} setSearchOpen={setSearchOpen} />
			</div>

			{/* Right Side Icons */}
			<div className="flex items-center gap-2 md:gap-3 lg:gap-4 xl:gap-6 ml-auto">
				{/* Profile Icon and Dropdown */}
				<div className="relative group">
					<img
						className="w-6 h-6 md:w-8 md:h-8 cursor-pointer min-w-[24px]"
						src={assets.profile_icon}
						alt="Profile"
						onClick={() => !token && navigate('/login')}
					/>
					{token && (
						<div className="absolute right-0 hidden pt-4 group-hover:block z-50">
							<div className="bg-white rounded-lg shadow-lg py-2 w-48 border">
								<div
									onClick={() => navigate('/profile')}
									className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
								>
									<img src={assets.profile_icon} alt="Profile" className="w-5 h-5" />
									My Profile
								</div>
								<div
									onClick={() => navigate('/orders')}
									className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
								>
									<img src={assets.cart_icon} alt="Orders" className="w-5 h-5" />
									Orders
								</div>
								<hr className="my-1" />
								<div
									onClick={logout}
									className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2 text-red-600"
								>
									<img src={assets.menu_icon} alt="Logout" className="w-5 h-5" />
									Logout
								</div>
							</div>
						</div>
					)}
				</div>

				{/* Cart Icon */}
				<Link to={token ? "/cart" : "/login"} className="relative">
					<img
						src={assets.cart_icon || "/fallback-cart.png"}
						className="w-6 h-6 md:w-8 md:h-8 min-w-[24px]"
						alt="Cart"
					/>
					{token && (
						<p className="absolute -right-1 -bottom-1 w-4 h-4 flex items-center justify-center bg-black text-white rounded-full text-[10px]">
							{getCartCount()}
						</p>
					)}
				</Link>

				{/* Search Icon (Only on Small Screens) */}
				{screenWidth < 768 && (
					<div
						onClick={() => setSearchOpen(!searchOpen)}
						className="p-1.5 md:p-2 bg-orange-500 rounded-full cursor-pointer hover:bg-orange-600 transition"
					>
						<img
							src={assets.search_icon || "/fallback-search.png"}
							alt="Search"
							className="w-4 h-4 md:w-6 md:h-6"
						/>
					</div>
				)}

				{/* Mobile Menu Icon */}
				{!searchOpen && (
					<img
						onClick={() => setMenuVisible(true)}
						src={assets.menu_icon || "/fallback-menu.png"}
						alt="Menu"
						className="w-6 h-6 md:w-8 md:h-8 cursor-pointer md:hidden min-w-[24px]"
					/>
				)}
			</div>

			{/* Location Modal */}
			{locationModalOpen && (
				<>
					{/* Background Overlay */}
					<div
						className="fixed inset-0 bg-black opacity-50 z-[60] transition-opacity"
						onClick={(e) => {
							if (e.target === e.currentTarget) setLocationModalOpen(false);
						}}
					></div>

					{/* Modal Box */}
					<div className="fixed inset-0 flex items-center justify-center z-[70] px-4">
						<div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md relative">
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
							<button
								onClick={handleLocationUpdate}
								className="w-full bg-yellow-300 active:bg-yellow-400 text-black py-2 rounded-full font-semibold mb-3 hover:bg-yellow-400 transition-colors"
							>
								Use my current location
							</button>
							<input
								type="text"
								value={inputPincode}
								onChange={(e) => setInputPincode(e.target.value.slice(0, 6))}
								placeholder="Enter an Indian pincode"
								className="w-full p-2 border border-gray-300 rounded-md mb-3 focus:border-orange-500 focus:outline-none"
								maxLength={6}
							/>
							<button
								onClick={handlePincodeSubmit}
								className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md transition-colors"
							>
								Apply
							</button>
						</div>
					</div>
				</>
			)}

			{/* Mobile Sidebar */}
			<div className={`fixed top-0 right-0 bottom-0 bg-white transition-all duration-300 shadow-lg ${menuVisible ? "w-64" : "w-0"} overflow-hidden z-[80]`}>
				<div className="flex flex-col text-gray-600">
					{/* Back Button */}
					<div onClick={() => setMenuVisible(false)} className="flex items-center gap-4 p-4 cursor-pointer border-b">
						<img className="h-4 rotate-180" src={assets.dropdown_icon || "/fallback-dropdown.png"} alt="Back" />
						<p>Back</p>
					</div>

					{/* Mobile Menu Links */}
					<NavLink onClick={() => setMenuVisible(false)} className="py-3 px-6 border-b hover:bg-gray-50" to="/">
						HOME
					</NavLink>
					<NavLink onClick={() => setMenuVisible(false)} className="py-3 px-6 border-b hover:bg-gray-50" to="/collections">
						COLLECTION
					</NavLink>
					<NavLink onClick={() => setMenuVisible(false)} className="py-3 px-6 border-b hover:bg-gray-50" to="/about">
						ABOUT
					</NavLink>
					<NavLink onClick={() => setMenuVisible(false)} className="py-3 px-6 border-b hover:bg-gray-50" to="/contact">
						CONTACT
					</NavLink>
				</div>
			</div>
		</div>
	);
};

export default Navbar;
