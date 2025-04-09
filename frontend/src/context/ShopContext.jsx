import { createContext, useEffect, useState } from "react";
// import { secondaryNavItems, products, subcategories, categories } from "../assets/frontend_assets/assets";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axios from 'axios';


// eslint-disable-next-line react-refresh/only-export-components
export const ShopContext = createContext();

const ShopContextProvider = (props) => {
	const currency = "₹";
	const delivery_fee = 10;
	const backendUrl = import.meta.env.VITE_BACKEND_URL;
	const [search, setSearch] = useState("");
	const [showSearch, setShowSearch] = useState(true);
	const [cartItems, setCartItems] = useState({});
	const navigate = useNavigate();
	const [products, setProducts] = useState([]);
	// const [categories, setCategories] = useState([]);
	// const [subcategories, setSubcategories] = useState([]);
	const [token, setToken] = useState('');
	const [isLoading, setIsLoading] = useState(true);


	// console.log(token)
	const getStockStatus = (product) => {
		if (!product) return null;

		// Check if product has stock status from API
		if (product.stockStatus) {
			return product.stockStatus;
		}

		// Ensure stock is a number for proper comparison
		const stock = typeof product.stock === 'number' ? product.stock : 0;
		const isActive = product.isActive !== false; // Default to true if not specified
		const lowStockThreshold = product.lowStockThreshold || 10;

		return {
			inStock: stock > 0 && isActive,
			lowStock: stock > 0 && stock <= lowStockThreshold,
			message: !isActive ? "Not available" :
				stock === 0 ? "Out of stock" :
					stock <= lowStockThreshold ? `Only ${stock} left in stock!` :
						"In stock"
		};
	}

	const addToCart = async (productId, size, quantity = 1) => {
		try {
			if (token) {
				const response = await axios.post(
					`${backendUrl}/api/cart/add`,
					{ productId, size, quantity },
					{ headers: { token } }
				);
				if (response.data.success) {
					setCartItems(response.data.cartData);
					toast.success('Item added to cart');
				}
			} else {
				// If not logged in, redirect to login
				toast.error('Please login to add items to cart');
				navigate('/login');
			}
		} catch (error) {
			console.error('Error adding to cart:', error);
			toast.error('Failed to add item to cart');
		}
	};


	const getCartCount = () => { // Corrected function name
		let totalcount = 0;
		for (const items in cartItems) {
			for (const item in cartItems[items]) {
				if (cartItems[items][item] > 0) {
					totalcount += cartItems[items][item];
				}
			}
		}
		return totalcount;
	};

	const updateQuantity = async (productId, size, quantity) => {
		try {
			if (token) {
				const response = await axios.put(
					`${backendUrl}/api/cart/update`,
					{ productId, size, quantity },
					{ headers: { token } }
				);
				if (response.data.success) {
					setCartItems(response.data.cartData);
				}
			} else {
				// If not logged in, redirect to login
				toast.error('Please login to update cart');
				navigate('/login');
			}
		} catch (error) {
			console.error('Error updating quantity:', error);
			toast.error('Failed to update quantity');
		}
	};

	const removeFromCart = async (productId, size) => {
		try {
			if (token) {
				const response = await axios.delete(
					`${backendUrl}/api/cart/remove`,
					{
						data: { productId, size },
						headers: { token }
					}
				);
				if (response.data.success) {
					setCartItems(response.data.cartData);
					toast.success('Item removed from cart');
				}
			} else {
				// If not logged in, redirect to login
				toast.error('Please login to remove items from cart');
				navigate('/login');
			}
		} catch (error) {
			console.error('Error removing from cart:', error);
			toast.error('Failed to remove item from cart');
		}
	};

	const getCartAmount = () => {
		let totalAmount = 0;
		for (const itemId in cartItems) {
			const itemInfo = products.find((product) => product._id === itemId);

			if (!itemInfo) {
				console.warn(`Product with ID ${itemId} not found in products array.`);
				continue; // Skip this item if it's not found
			}

			for (const size in cartItems[itemId]) {
				try {
					if (cartItems[itemId][size] > 0) {
						totalAmount += itemInfo.price * cartItems[itemId][size];
					}
				} catch (error) {
					console.error("Error calculating cart total:", error);
				}
			}
		}
		return totalAmount;
	};


	// 
	const getProductsData = async () => {
		try {
			const response = await axios.get(backendUrl + "/api/product/list");
			if (response.data.success) {
				setProducts(response.data.products);
			} else {
				toast.error("Failed to fetch products data");
			}
		} catch (error) {
			console.log(error);

		}
	}

	// const getCategoriesData = async () => {
	// 	try {
	// 		const response = await axios.get(backendUrl + "/api/product/category");
	// 		if (response.data.success) {
	// 			setCategories(response.data.categories);
	// 		} else {
	// 			toast.error("Failed to fetch categories data");
	// 		}
	// 	} catch (error) {
	// 		console.log(error);
	// 	}
	// }

	// const getSubcategoriesData = async () => {
	// 	try {
	// 		const response = await axios.get(backendUrl + "/api/product/subcategory");
	// 		if (response.data.success) {
	// 			setSubcategories(response.data.subcategories);
	// 		} else {
	// 			toast.error("Failed to fetch subcategories data");
	// 		}
	// 	} catch (error) {
	// 		console.log(error);
	// 	}
	// }

	// useEffect(() => {
	// 	getCategoriesData();
	// 	getSubcategoriesData();
	// }, [])


	const getUserCart = async (token) => {
		setIsLoading(true);
		try {
			const response = await axios.get(`${backendUrl}/api/cart`,
				{ headers: { token } }
			);
			if (response.data.success) {
				// Only update cart items if we got valid data from the server
				if (response.data.cartData && typeof response.data.cartData === 'object') {
					setCartItems(response.data.cartData);
					console.log('Cart data loaded from server:', response.data.cartData);
				} else {
					console.warn('Received empty or invalid cart data from server');
					setCartItems({});
				}
			} else {
				toast.error("Failed to fetch cart data");
				setCartItems({});
			}
		} catch (error) {
			console.error('Error fetching cart data:', error);
			if (error.response?.status === 401) {
				setToken(null);
				localStorage.removeItem('token');
			}
			setCartItems({});
		} finally {
			setIsLoading(false);
		}
	}

	// Add this function to sync cart data with the server
	const syncCartWithServer = async () => {
		if (!token) return;

		try {
			// Get the current cart data from the server
			const response = await axios.get(`${backendUrl}/api/cart`, {
				headers: { token }
			});

			if (response.data.success && response.data.cartData) {
				// Update the local cart data with the server data
				setCartItems(response.data.cartData);
				console.log('Synced cart data with server:', response.data.cartData);
			}
		} catch (error) {
			console.error('Error syncing cart with server:', error);
		}
	};

	// Initialize token from localStorage on component mount
	useEffect(() => {
		const storedToken = localStorage.getItem('token');
		if (storedToken) {
			setToken(storedToken);
			// If we have a token, we'll fetch cart data from the server
			// This will happen in the useEffect below that watches for token changes
		} else {
			// If no token, set empty cart
			setCartItems({});
		}
		setIsLoading(false);
	}, []);

	// Fetch cart data whenever token changes
	useEffect(() => {
		if (token) {
			getUserCart(token);
		} else {
			setCartItems({});
		}
	}, [token]);

	// Sync cart data with the server periodically
	useEffect(() => {
		if (token) {
			// Sync immediately
			syncCartWithServer();

			// Then sync every 5 minutes
			const intervalId = setInterval(syncCartWithServer, 5 * 60 * 1000);

			// Clean up the interval when the component unmounts
			return () => clearInterval(intervalId);
		}
	}, [token]);

	// Fetch products on component mount
	useEffect(() => {
		getProductsData();
	}, []);

	// Add this function to clear cart data
	const clearCart = async () => {
		if (!token) return;

		try {
			const response = await axios.delete(`${backendUrl}/api/cart/clear`, {
				headers: { token }
			});

			if (response.data.success) {
				setCartItems({});
				console.log('Cart cleared successfully');
			}
		} catch (error) {
			console.error('Error clearing cart:', error);
		}
	};

	const value = {
		backendUrl,
		delivery_fee,
		navigate,
		getCartAmount,
		updateQuantity,
		cartItems,
		addToCart,
		getCartCount,
		setCartItems,
		search,
		setSearch,
		showSearch,
		setShowSearch,
		// categories,
		// subcategories,
		products,
		currency,
		token, setToken,
		getStockStatus,
		isLoading,
		removeFromCart,
		clearCart
	};

	return <ShopContext.Provider value={value}>{props.children}</ShopContext.Provider>;
};

export default ShopContextProvider;