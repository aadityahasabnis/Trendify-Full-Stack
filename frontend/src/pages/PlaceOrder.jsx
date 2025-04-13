import React, { useContext, useState } from 'react'
import Title from '../components/Title';
import CartTotal from '../components/CartTotal';
import { assets } from '../assets/frontend_assets/assets';
import { ShopContext } from '../context/ShopContext';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const PlaceOrder = () => {

	const [method, setMethod] = useState('cod');
	const { navigate, backendUrl, token, cartItems, setCartItems, getCartAmount, delivery_fee, products } = useContext(ShopContext);
	const [formData, setFormData] = useState({
		firstName: '',
		lastName: '',
		email: '',
		street: '',
		city: '',
		state: '',
		zipcode: '',
		country: '',
		phone: ''
	})
	const onChangeHandler = (event) => {
		const name = event.target.name;
		const value = event.target.value;
		setFormData((prevData) => ({
			...prevData,
			[name]: value
		}));
	}

	const onSubmitHandler = async (event) => {
		event.preventDefault();
		try {
			let orderItems = [];

			for (const items in cartItems) {
				for (const size in cartItems[items]) {
					if (cartItems[items][size] > 0) {
						const itemInfo = structuredClone(products.find((product) => product._id === items));
						if (itemInfo) {
							orderItems.push({
								productId: itemInfo._id,
								name: itemInfo.name,
								price: itemInfo.price,
								image: itemInfo.image[0],
								size: size,
								quantity: cartItems[items][size]
							});
						}
					}
				}
			}

			if (orderItems.length === 0) {
				toast.error("Cart is empty! Add items before placing an order.");
				return;
			}

			if (!token) {
				toast.error("Login required to place an order!");
				return;
			}

			const cartAmount = getCartAmount() || 0; // Ensure it's a number
			const totalAmount = cartAmount + delivery_fee;

			let orderData = {
				address: formData,
				items: orderItems,
				amount: totalAmount,
			};

			switch (method) {
				case 'cod': {
					const response = await axios.post(backendUrl + '/api/order/place', orderData, { headers: { token } });

					if (response.data.success) {
						setCartItems({});
						navigate('/orders');
						toast.success("Order placed successfully!");
					} else {
						toast.error("Failed to place order.");
					}
					break;
				}
				case 'stripe': {
					const responseStripe = await axios.post(backendUrl + '/api/order/stripe', orderData, { headers: { token } })
					if (responseStripe.data.success) {
						const { session_url } = responseStripe.data;
						window.location.replace(session_url)
					} else {
						toast.error(responseStripe.data.message)
					}
					break
				}
			}

		} catch (error) {
			console.error("Error placing order:", error);
			toast.error("Something went wrong! Try again.");
		}
	};


	return (
		<form onSubmit={onSubmitHandler} className='flex flex-col sm:flex-row justify-between gap-4 pt-5 sm:pt-14 min-h-[80vh] border-t mx-9'>
			{/* Left Side */}
			<div className='flex flex-col gap-4 w-full sm:max-w-[480px]'>

				<div className='text-xl my-3 sm:text-2xt'>
					<Title text1={"DELIVERY"} text2={"INFORMATION"} />
				</div>
				<div className='flex gap-3'>
					<input required onChange={onChangeHandler} name='firstName' value={formData.firstName} placeholder='First name' type="text" className='border border-gray-300 rounded py-1.5 px-3.5 w-full' />
					<input required onChange={onChangeHandler} name='lastName' value={formData.lastName} placeholder='Last name' type="text" className='border border-gray-300 rounded py-1.5 px-3.5 w-full' />
				</div>
				<input required onChange={onChangeHandler} name='email' value={formData.email} placeholder='Email address' type="email" className='border border-gray-300 rounded py-1.5 px-3.5 w-full' />
				<input required onChange={onChangeHandler} name='street' value={formData.street} placeholder='Street' type="text" className='border border-gray-300 rounded py-1.5 px-3.5 w-full' />
				<div className='flex gap-3'>
					<input required onChange={onChangeHandler} name='city' value={formData.city} placeholder='City' type="text" className='border border-gray-300 rounded py-1.5 px-3.5 w-full' />
					<input required onChange={onChangeHandler} name='state' value={formData.state} placeholder='State' type="text" className='border border-gray-300 rounded py-1.5 px-3.5 w-full' />
				</div>
				<div className='flex gap-3'>
					<input required onChange={onChangeHandler} name='zipcode' value={formData.zipcode} placeholder='Zipcode' type="number" className='border border-gray-300 rounded py-1.5 px-3.5 w-full' />
					<input required onChange={onChangeHandler} name='country' value={formData.country} placeholder='Country' type="text" className='border border-gray-300 rounded py-1.5 px-3.5 w-full' />
				</div>
				<input required onChange={onChangeHandler} name='phone' value={formData.phone} placeholder='Phone' type="number" className='border border-gray-300 rounded py-1.5 px-3.5 w-full' />

			</div>

			{/* Right Side */}
			<div className='flex flex-col mt-8'>

				<div className='mt-8 min-w-80'>
					<CartTotal />
				</div>
				<div className='mt-12'>
					<Title text1={"PAYMENT"} text2={"METHOD"} />
					{/* Payment Selection method */}
					<div className='flex gap-3 flex-com lg:flex-row'>
						<div onClick={() => setMethod('stripe')} className={`flex items-center gap-3 border-2 border-gray-400 p-2 px-3 cursor-pointer ${method === 'stripe' ? 'border-green-400 border-2' : ''}`}>
							<p className={`min-w-3.5 h-3.5 border border-gray-400 rounded-full ${method === 'stripe' ? 'bg-green-400' : ''}`}></p>
							<img className='h-5 mx-4' src={assets.stripe_logo} alt="" />
						</div>
						<div onClick={() => setMethod('razorpay')} className={`flex items-center gap-3 border-2 border-gray-400 p-2 px-3 cursor-pointer ${method === 'razorpay' ? 'border-green-400 border-2' : ''}`}>
							<p className={`min-w-3.5 h-3.5 border border-gray-400 rounded-full ${method === 'razorpay' ? 'bg-green-400' : ''}`}></p>
							<img className='h-5 mx-4' src={assets.razorpay_logo} alt="" />
						</div>
						<div onClick={() => setMethod('cod')} className={`flex items-center gap-3 border-2 border-gray-400 p-2 px-3 cursor-pointer ${method === 'cod' ? 'border-green-400 border-2' : ''}`}>
							<p className={`min-w-3.5 h-3.5 border border-gray-400 rounded-full ${method === 'cod' ? 'bg-green-400' : ''}`}></p>
							<p className='text-gray-500'>CASH ON DELIVERY</p>						</div>

					</div>

				</div>
				<div className='w-full text-end mt-8'>
					<button type='submit' className='bg-black text-white px-16 py-3 text-sm'>PLACE ORDER</button>
				</div>
			</div>
		</form>
	)
}

export default PlaceOrder