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

	const addToCart = async (itemId, size, quantity = 1) => {
		if (!size) {
			toast.error("Select Product Size");
			return;
		}

		if (!token) {
			toast.error("Login to add items to cart");
			navigate("/login");
			return;
		}

		let cartData = structuredClone(cartItems);
		const product = products.find((p) => p._id === itemId);

		if (!product) {
			toast.error("Product not found");
			return;
		}

		// Check if product is in stock
		const stockStatus = getStockStatus(product);
		if (!stockStatus || stockStatus.inStock === false) {
			toast.error(stockStatus?.message || "Product is out of stock");
			return;
		}

		// Get current quantity in cart for this product+size
		const currentQty = cartData[itemId]?.[size] || 0;

		// Check if adding quantity would exceed available stock
		if (currentQty + quantity > product.stock) {
			toast.warning(`Sorry, only ${product.stock} items available in stock`);
			return;
		}

		try {
			const response = await axios.post(
				`${backendUrl}/api/cart/add`,
				{
					productId: itemId,
					size,
					quantity
				},
				{
					headers: {
						'Content-Type': 'application/json',
						token: `${token}`
					}
				}
			);

			if (response.data.success) {
				cartData[itemId] = cartData[itemId] || {};
				cartData[itemId][size] = (cartData[itemId][size] || 0) + quantity;
				setCartItems(cartData);
				toast.success("Added to cart successfully");
			} else {
				throw new Error(response.data.message);
			}
		} catch (error) {
			console.log(error);
			if (error.response?.status === 401) {
				toast.error("Please login again");
				setToken(null);
				localStorage.removeItem('token');
				navigate("/login");
			} else {
				toast.error(error.response?.data?.message || "Error adding item to cart");
			}
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

	const updateQuantity = async (itemId, size, quantity) => {
		let cartData = structuredClone(cartItems);
		const product = products.find((p) => p._id === itemId);

		if (!product) {
			toast.error("Product not found");
			return;
		}

		// Check stock availability
		if (quantity > product.stock) {
			toast.warning(`Sorry, only ${product.stock} items available in stock`);
			return;
		}

		if (token) {
			try {
				const response = await axios.put(
					`${backendUrl}/api/cart/update`,
					{ productId: itemId, size, quantity },
					{
						headers: {
							'Content-Type': 'application/json',
							token
						}
					}
				);

				if (response.data.success) {
					if (quantity <= 0) {
						if (cartData[itemId]) {
							delete cartData[itemId][size];
							if (Object.keys(cartData[itemId]).length === 0) {
								delete cartData[itemId];
							}
						}
					} else {
						cartData[itemId] = cartData[itemId] || {};
						cartData[itemId][size] = quantity;
					}
					setCartItems(cartData);
					toast.success("Cart updated successfully");
				} else {
					throw new Error(response.data.message);
				}
			} catch (error) {
				console.log(error);
				if (error.response?.status === 401) {
					toast.error("Please login again");
					setToken(null);
					localStorage.removeItem('token');
					navigate("/login");
				} else {
					toast.error("Error updating cart");
				}
			}
		} else {
			toast.error("Login to update items in cart");
			navigate("/login");
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
		try {
			const response = await axios.get(`${backendUrl}/api/cart`,
				{ headers: { token } }
			);
			if (response.data.success) {
				setCartItems(response.data.cartData);
			} else {
				toast.error("Failed to fetch cart data");
			}
		} catch (error) {
			console.log(error);
			if (error.response?.status === 401) {
				setToken(null);
				localStorage.removeItem('token');
			}
		}
	}


	useEffect(() => {
		if (token) {
			getUserCart(token);
		} else if (localStorage.getItem('token')) {
			const storedToken = localStorage.getItem('token');
			setToken(storedToken);
			getUserCart(storedToken);
		}
	}, [token]);


	useEffect(() => {
		getProductsData();
	}, []);

	// useEffect(() => {
	//   console.log(cartItems);
	//   console.log(getCartCount()); //added console log, to see the total count.
	// }, [cartItems]);

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
		getStockStatus

	};

	return <ShopContext.Provider value={value}>{props.children}</ShopContext.Provider>;
};

export default ShopContextProvider;