import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FaTrash } from 'react-icons/fa';
import { ShopContext } from '../context/ShopContext';
import Title from '../components/Title';
import CartTotal from '../components/CartTotal';

const Cart = () => {
	const { products, currency, cartItems, updateQuantity, removeFromCart, isLoading, clearCart } = useContext(ShopContext);
	const [cartData, setCartData] = useState([]);

	useEffect(() => {
		console.log('Cart Items:', cartItems); // Debug log
		console.log('Products:', products); // Debug log

		const tempData = [];
		if (cartItems && typeof cartItems === 'object') {
			Object.entries(cartItems).forEach(([productId, sizes]) => {
				if (sizes && typeof sizes === 'object') {
					Object.entries(sizes).forEach(([size, quantity]) => {
						if (quantity > 0) {
							tempData.push({
								_id: productId,
								size: size,
								quantity: quantity
							});
						}
					});
				}
			});
		}
		console.log('Processed Cart Data:', tempData); // Debug log
		setCartData(tempData);

		// Show toast when cart items change (except on initial load)
		if (tempData.length > 0 && cartData.length === 0) {
			toast.success('Item added to cart');
		}
	}, [cartItems, products]);

	const handleQuantityChange = async (productId, size, newQuantity) => {
		try {
			if (newQuantity > 0) {
				await updateQuantity(productId, size, newQuantity);
			}
		} catch (error) {
			console.error('Error updating quantity:', error);
			toast.error('Failed to update quantity');
		}
	};

	const handleRemoveItem = async (productId, size) => {
		try {
			await removeFromCart(productId, size);
			toast.success('Item removed from cart');
		} catch (error) {
			console.error('Error removing item:', error);
			toast.error('Failed to remove item');
		}
	};

	const handleClearCart = async () => {
		try {
			await clearCart();
			toast.success('Cart cleared successfully');
		} catch (error) {
			console.error('Error clearing cart:', error);
			toast.error('Failed to clear cart');
		}
	};

	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
			</div>
		);
	}

	if (!cartData || cartData.length === 0) {
		return (
			<div className="min-h-screen flex flex-col items-center justify-center p-4">
				<h2 className="text-2xl font-semibold mb-4">Your cart is empty</h2>
				<p className="text-gray-600 mb-6">Looks like you haven't added any items to your cart yet.</p>
				<Link
					to="/products"
					className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary/90 transition-colors"
				>
					Continue Shopping
				</Link>
			</div>
		);
	}

	return (
		<div className="border-t pt-14 px-4 sm:px-0">
			<div className="text-2xl mb-6">
				<Title text1="Your" text2="CART" />
			</div>
			<div className="space-y-4">
				{cartData.map((item, index) => {
					const productData = products.find((product) => product._id === item._id);
					if (!productData) {
						console.log('Product not found:', item._id); // Debug log
						return null;
					}

					return (
						<div
							key={`${item._id}-${item.size}-${index}`}
							className="py-4 border-t border-b text-gray-700 grid grid-cols-[4fr_2fr_0.5fr] items-center gap-4"
						>
							<div className="flex items-start gap-6">
								<Link to={`/product/${item._id}`}>
									<img
										className="w-16 sm:w-20 rounded-md"
										src={productData.image[0]} alt={productData.name}
									/>
								</Link>
								<div>
									<Link
										to={`/product/${item._id}`}
										className="text-xs sm:text-lg font-medium hover:text-primary"
									>
										{productData.name}
									</Link>
									<div className="flex items-center gap-5 mt-2">
										<p>{currency}{productData.price}</p>
										<p className="px-2 sm:px-3 sm:py-1 border bg-slate-50 rounded-md">{item.size}</p>
									</div>
								</div>
							</div>
							<input
								onChange={(e) => {
									const value = parseInt(e.target.value);
									if (value > 0) {
										handleQuantityChange(item._id, item.size, value);
									}
								}}
								type="number"
								className="border max-w-10 sm:max-w-20 px-1 sm:px-2 py-1 rounded-md"
								min={1}
								defaultValue={item.quantity}
							/>
							<button
								onClick={() => handleRemoveItem(item._id, item.size)}
								className="p-2 text-red-500 hover:bg-red-50 rounded-full"
							>
								<FaTrash />
							</button>
						</div>
					);
				})}
			</div>
			<div className="flex justify-between my-20">
				<button
					onClick={handleClearCart}
					className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
				>
					Clear Cart
				</button>
				<div className="w-full sm:w-[450px]">
					<CartTotal />
				</div>
			</div>
		</div>
	);
};

export default Cart;