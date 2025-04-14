import React, { useContext, useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import RelatedProducts from '../components/RelatedProducts';
import CustomMagnifier from '../components/CustomMagnifier';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { FaStar, FaStarHalfAlt, FaRegStar, FaShoppingCart, FaBolt, FaFacebookF, FaTwitter, FaPinterestP, FaWhatsapp, FaLink } from 'react-icons/fa';
import { IoMdCheckmark, IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';
import { Tab } from '@headlessui/react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { FacebookShareButton, TwitterShareButton, PinterestShareButton } from 'react-share';
import { toast } from 'react-hot-toast';
import useScrollToTop from '../hooks/useScrollToTop';


// Breadcrumb Component
const Breadcrumb = ({ category, name }) => (
	<nav className="flex mb-8" aria-label="Breadcrumb">
		<ol className="inline-flex items-center space-x-1 md:space-x-3">
			<li className="inline-flex items-center">
				<Link to="/" className="text-gray-500 hover:text-orange-500">Home</Link>
			</li>
			<li>
				<div className="flex items-center">
					<span className="mx-2 text-gray-400">/</span>
					<Link to="/shop" className="text-gray-500 hover:text-orange-500">Shop</Link>
				</div>
			</li>
			{category && (
				<li>
					<div className="flex items-center">
						<span className="mx-2 text-gray-400">/</span>
						<Link to={`/category/${category}`} className="text-gray-500 hover:text-orange-500">
							{category}
						</Link>
					</div>
				</li>
			)}
			<li>
				<div className="flex items-center">
					<span className="mx-2 text-gray-400">/</span>
					<span className="text-gray-700 line-clamp-1 md:line-clamp-none">
						{name.split(' ').slice(0, 3).join(' ')}
						{name.split(' ').length > 3 && <span className="md:hidden">...</span>}
					</span>
				</div>
			</li>
		</ol>
	</nav>
);

// Trust Badges Component
const TrustBadges = () => (
	<div className="flex items-center justify-around border-t border-b py-4 mt-6">
		<div className="flex items-center space-x-2">
			<svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
			<span className="text-sm">Secure Payment</span>
		</div>
		<div className="flex items-center space-x-2">
			<svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
			<span className="text-sm">24/7 Support</span>
		</div>
		<div className="flex items-center space-x-2">
			<svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
			</svg>
			<span className="text-sm">Money Back</span>
		</div>
	</div>
);

// Social Share Component
const SocialShare = ({ url, title, image, price, currency, sizes }) => {
	const [isCopied, setIsCopied] = useState(false);

	const handleCopyLink = () => {
		navigator.clipboard.writeText(url);
		setIsCopied(true);
		setTimeout(() => setIsCopied(false), 2000);
	};

	const handleWhatsAppShare = () => {
		const sizeText = sizes && sizes.length > 0 ? `\n*Sizes:* ${sizes.join(', ')}` : '';
		const message = `*Check out this product on Trendify!*\n\n*${title}*\n*Price:* ${currency}${price}${sizeText}\n\n_${url}_`;
		const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}&media=${encodeURIComponent(image)}`;
		window.open(whatsappUrl, '_blank');
	};

	return (
		<div className="flex items-center space-x-4 mt-6">
			<span className="text-sm font-medium text-gray-700">Share:</span>
			<FacebookShareButton url={url} quote={title}>
				<div className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700">
					<FaFacebookF size={16} />
				</div>
			</FacebookShareButton>
			<button
				onClick={handleWhatsAppShare}
				className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600"
			>
				<FaWhatsapp size={16} />
			</button>
			<button
				onClick={handleCopyLink}
				className="p-2 bg-gray-500 text-white rounded-full hover:bg-gray-600 relative"
			>
				<FaLink size={16} />
				{isCopied && (
					<span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded">
						Link Copied!
					</span>
				)}
			</button>
		</div>
	);
};

// Quantity Selector Component
const QuantitySelector = ({ quantity, setQuantity, max }) => (
	<div className="flex items-center border rounded-lg overflow-hidden w-32">
		<button
			onClick={() => setQuantity(Math.max(1, quantity - 1))}
			className="px-3 py-2 bg-gray-100 hover:bg-gray-200 transition-colors"
			aria-label="Decrease quantity"
		>
			<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
			</svg>
		</button>
		<input
			type="number"
			min="1"
			max={max}
			value={quantity}
			onChange={(e) => {
				const val = parseInt(e.target.value);
				if (!isNaN(val)) {
					setQuantity(Math.min(max, Math.max(1, val)));
				}
			}}
			className="w-12 text-center border-none focus:ring-0"
		/>
		<button
			onClick={() => setQuantity(Math.min(max, quantity + 1))}
			className="px-3 py-2 bg-gray-100 hover:bg-gray-200 transition-colors"
			aria-label="Increase quantity"
		>
			<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
			</svg>
		</button>
	</div>
);

// Live Chat Widget Component
const LiveChatWidget = () => (
	<div className="fixed bottom-4 right-4 z-50">
		<button
			className="bg-orange-500 text-white p-4 rounded-full shadow-lg hover:bg-orange-600 transition-colors"
			aria-label="Open live chat"
		>
			<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
			</svg>
		</button>
	</div>
);

// Lightbox Component
const Lightbox = ({ isOpen, onClose, images, currentIndex, setCurrentIndex }) => {
	useEffect(() => {
		const handleKeyDown = (e) => {
			if (!isOpen) return;

			switch (e.key) {
				case 'Escape':
					onClose();
					break;
				case 'ArrowLeft':
					setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
					break;
				case 'ArrowRight':
					setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
					break;
				default:
					break;
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [isOpen, images.length, onClose, setCurrentIndex]);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md bg-opacity-90 flex items-center justify-center">
			<button
				onClick={onClose}
				className="absolute top-4 right-4 text-white hover:text-orange-500"
				aria-label="Close lightbox"
			>
				<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
			<button
				onClick={() => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
				className="absolute left-4 text-white hover:text-orange-500"
				aria-label="Previous image"
			>
				<IoIosArrowBack className="w-8 h-8" />
			</button>
			<button
				onClick={() => setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
				className="absolute right-4 text-white hover:text-orange-500"
				aria-label="Next image"
			>
				<IoIosArrowForward className="w-8 h-8" />
			</button>
			<div className="max-w-4xl w-full h-full flex items-center justify-center p-4">
				<img
					src={images[currentIndex]}
					alt={`Product image ${currentIndex + 1}`}
					className="max-h-full max-w-full object-contain"
				/>
			</div>
			<div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
				{images.map((_, index) => (
					<button
						key={index}
						onClick={() => setCurrentIndex(index)}
						className={`w-2 h-2 rounded-full transition-colors ${index === currentIndex ? 'bg-orange-500' : 'bg-white/50 hover:bg-white/75'
							}`}
						aria-label={`Go to image ${index + 1}`}
					/>
				))}
			</div>
		</div>
	);
};

const Product = () => {
	useScrollToTop();
	const { productId } = useParams();
	const { currency, addToCart, backendUrl, token } = useContext(ShopContext);
	const [productData, setProductData] = useState(null);
	const [image, setImage] = useState(null);
	const [size, setSize] = useState('');
	const [reviews, setReviews] = useState([]);
	const [averageRating, setAverageRating] = useState('0');
	const [totalReviews, setTotalReviews] = useState(0);
	const [selectedColor, setSelectedColor] = useState('');
	const [quantity, setQuantity] = useState(1);
	const [isLoading, setIsLoading] = useState(true);
	const [errorMessage, setErrorMessage] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [newReview, setNewReview] = useState({ rating: 0, comment: '' });
	const [editingReview, setEditingReview] = useState(null);
	const [showStickyAdd, setShowStickyAdd] = useState(false);
	const addToCartRef = useRef(null);
	const productContentRef = useRef(null);

	// New state variables
	const [isLightboxOpen, setIsLightboxOpen] = useState(false);
	const [lightboxIndex, setLightboxIndex] = useState(0);

	// Decode the token to get the user ID
	const userId = token ? jwtDecode(token).id : null;

	// Scroll handler for sticky add to cart
	useEffect(() => {
		const handleScroll = () => {
			if (addToCartRef.current) {
				const rect = addToCartRef.current.getBoundingClientRect();
				setShowStickyAdd(rect.bottom < 0);
			}
		};

		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	// Function to render star ratings
	const renderStars = (rating) => {
		const stars = [];
		const fullStars = Math.floor(rating);
		const hasHalfStar = rating % 1 !== 0;

		for (let i = 0; i < fullStars; i++) {
			stars.push(<FaStar key={`full-${i}`} className="text-yellow-400" />);
		}

		if (hasHalfStar) {
			stars.push(<FaStarHalfAlt key="half" className="text-yellow-400" />);
		}

		const remainingStars = 5 - Math.ceil(rating);
		for (let i = 0; i < remainingStars; i++) {
			stars.push(<FaRegStar key={`empty-${i}`} className="text-yellow-400" />);
		}

		return stars;
	};

	const fetchReviews = async () => {
		try {
			const [reviewsResponse, statsResponse] = await Promise.all([
				axios.get(`${backendUrl}/api/reviews/product/${productId}`),
				axios.get(`${backendUrl}/api/reviews/stats/${productId}`)
			]);

			// Handle reviews
			if (reviewsResponse.data.success) {
				setReviews(reviewsResponse.data.reviews);
			} else {
				setReviews([]);
			}

			// Handle stats
			if (statsResponse.data.success) {
				const { averageRating, totalReviews } = statsResponse.data.stats;
				setAverageRating(averageRating?.toFixed(1) || '0');
				setTotalReviews(totalReviews || 0);
			} else {
				setAverageRating('0');
				setTotalReviews(0);
			}
		} catch (error) {
			if (error.response?.status === 404) {
				// No reviews found, set default stats
				setReviews([]);
				setAverageRating('0');
				setTotalReviews(0);
				console.log('No reviews found for this product');
			} else {
				console.error("Error fetching reviews or stats:", error);
				setErrorMessage('Failed to load reviews');
			}
		}
	};

	const fetchProduct = async () => {
		try {
			const response = await axios.post(`${backendUrl}/api/product/single`, { productId });
			if (response.data.success) {
				// Handle image format - ensure it's always an array
				const productData = response.data.product;
				if (typeof productData.image === 'string') {
					productData.image = productData.image.split(',').map(url => url.trim());
				} else if (!Array.isArray(productData.image)) {
					productData.image = [productData.image];
				}
				setProductData(productData);
				setImage(productData.image[0]);
				setErrorMessage('');
			} else {
				setErrorMessage('Product not found');
			}
		} catch (error) {
			if (error.response?.status === 404) {
				setErrorMessage('Product not found');
			} else {
				setErrorMessage('Failed to load product');
				console.error('Error fetching product:', error);
			}
		} finally {
			setIsLoading(false);
		}
	};

	// Add or edit a review
	// Update the handleReviewSubmit function
	const handleReviewSubmit = async () => {
		if (!userId) {
			setErrorMessage('You need to be logged in to submit a review.');
			return;
		}

		if (!newReview.rating || !newReview.comment) {
			setErrorMessage('Please provide both rating and comment.');
			return;
		}

		setIsSubmitting(true);
		try {
			if (editingReview) {
				const response = await axios.put(
					`${backendUrl}/api/reviews/update/${editingReview._id}`,
					{
						userId,
						rating: parseInt(newReview.rating),
						comment: newReview.comment,
						productId
					},
					{
						headers: { token }
					}
				);

				if (!response.data.success) {
					throw new Error(response.data.message);
				}
			} else {
				await axios.post(
					`${backendUrl}/api/reviews/add`,
					{
						userId,
						productId,
						rating: parseInt(newReview.rating),
						comment: newReview.comment
					},
					{ headers: { token } }
				);
			}

			setNewReview({ rating: 0, comment: '' });
			setEditingReview(null);
			await fetchReviews();
			setIsSubmitting(false);
			setErrorMessage('');
		} catch (error) {
			console.error('Error submitting review:', error);
			setErrorMessage(error.response?.data?.message || error.message);
			setIsSubmitting(false);
		}
	};

	// Update the delete review function
	const handleDeleteReview = async (reviewId) => {
		try {
			const response = await axios.delete(`${backendUrl}/api/reviews/delete/${reviewId}`, {
				headers: { token },
				data: { userId, productId }
			});

			if (response.data.success) {
				await fetchReviews();
				setErrorMessage('');
			} else {
				throw new Error(response.data.message);
			}
		} catch (error) {
			console.error('Error deleting review:', error);
			setErrorMessage(error.response?.data?.message || 'Error deleting your review. Please try again later.');
		}
	};

	// Add this effect to populate the form when editing
	useEffect(() => {
		if (editingReview) {
			setNewReview({
				rating: editingReview.rating,
				comment: editingReview.comment
			});
		}
	}, [editingReview]);

	useEffect(() => {
		fetchProduct();
		fetchReviews();
	}, [productId, backendUrl]);

	const navigate = useNavigate();

	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
			</div>
		);
	}

	if (!productData) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<h2 className="text-2xl font-semibold text-gray-900 mb-2">Product not found</h2>
					<p className="text-gray-600 mb-4">The product you're looking for doesn't exist or has been removed.</p>
					<Link to="/shop" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700">
						Return to Shop
					</Link>
				</div>
			</div>
		);
	}

	return productData ? (
		<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" ref={productContentRef}>
			{/* Breadcrumb */}
			<Breadcrumb category={productData.category} name={productData.name} />

			<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
				{/* Left Column - Product Images */}
				<div className="space-y-4">
					<div className="relative aspect-w-1 aspect-h-1 rounded-lg overflow-hidden bg-gray-100">
						<CustomMagnifier src={image} alt={productData.name} />
						<button
							onClick={() => setIsLightboxOpen(true)}
							className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
							aria-label="Open fullscreen view"
						>
							<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
							</svg>
						</button>
					</div>
					<div className="grid grid-cols-4 gap-4">
						{productData.image.map((img, index) => (
							<button
								key={index}
								onClick={() => {
									setImage(img);
									setLightboxIndex(index);
								}}
								className={`relative rounded-md overflow-hidden transition-all duration-200 transform hover:scale-105 ${image === img ? 'ring-2 ring-orange-500' : ''
									}`}
								onMouseEnter={() => setImage(img)}
							>
								<img
									src={img}
									alt={`Product ${index + 1}`}
									className="w-full h-full object-center object-cover"
									loading="lazy"
								/>
							</button>
						))}
					</div>
				</div>

				{/* Right Column - Product Info */}
				<div className="space-y-6">
					<h1 className="text-3xl font-bold text-gray-900">{productData.name}</h1>

					{/* Rating Section */}
					<div className="flex items-center space-x-2">
						<div className="flex items-center">
							{renderStars(parseFloat(averageRating))}
						</div>
						<span className="text-sm text-gray-500">
							{averageRating} out of 5 | {totalReviews} ratings
						</span>
					</div>

					{/* Price */}
					<div className="border-t border-b py-4">
						<div className="flex items-baseline">
							<span className="text-3xl font-bold text-gray-900">{currency}{productData.price}</span>
							{productData.originalPrice && (
								<>
									<span className="ml-2 text-lg text-gray-500 line-through">
										{currency}{productData.originalPrice}
									</span>
									<span className="ml-2 text-sm text-green-600">
										Save {currency}{(productData.originalPrice - productData.price).toFixed(2)} ({Math.round((1 - productData.price / productData.originalPrice) * 100)}% off)
									</span>
								</>
							)}
						</div>
					</div>

					{/* Stock Status */}
					<div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
						${!productData.stockStatus?.inStock
							? 'bg-red-100 text-red-800'
							: productData.stockStatus?.lowStock
								? 'bg-orange-100 text-orange-800'
								: 'bg-green-100 text-green-800'
						}`}
					>
						<IoMdCheckmark className={`mr-1 ${productData.stockStatus?.inStock ? 'visible' : 'invisible'}`} />
						{productData.stockStatus?.message ||
							(productData.stock > 0 ? 'In Stock' : 'Out of Stock')}
					</div>

					{/* Color Selection (if available) */}
					{productData.colors && productData.colors.length > 0 && (
						<div className="space-y-3">
							<label className="block text-sm font-medium text-gray-700">Select Color</label>
							<div className="flex space-x-2">
								{productData.colors.map((color) => (
									<button
										key={color}
										onClick={() => setSelectedColor(color)}
										className={`w-8 h-8 rounded-full border-2 ${selectedColor === color ? 'border-orange-500' : 'border-gray-300'
											}`}
										style={{ backgroundColor: color }}
										aria-label={`Select ${color} color`}
									/>
								))}
							</div>
						</div>
					)}

					{/* Size Selection - Only show if sizes are available */}
					{productData.sizes && productData.sizes.length > 0 && (
						<div className="space-y-3">
							<label className="block text-sm font-medium text-gray-700">Select Size</label>
							<div className="grid grid-cols-4 gap-2">
								{productData.sizes.map((item) => (
									<button
										key={item}
										onClick={() => setSize(item)}
										className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200
											${item === size
												? 'bg-orange-500 text-white'
												: 'bg-gray-100 text-gray-900 hover:bg-gray-200'
											}`}
									>
										{item}
									</button>
								))}
							</div>
						</div>
					)}

					{/* Quantity Selector */}
					<div className="space-y-3">
						<label className="block text-sm font-medium text-gray-700">Quantity</label>
						<QuantitySelector
							quantity={quantity}
							setQuantity={setQuantity}
							max={productData.stock}
						/>
					</div>

					{/* Add to Cart and Buy Now Buttons */}
					<div className="flex flex-row gap-4" ref={addToCartRef}>
						<button
							onClick={() => {
								if (productData.sizes && productData.sizes.length > 0) {
									if (size) {
										addToCart(productId, size, quantity);
									} else {
										toast.error('Please select a size');
									}
								} else {
									addToCart(productId, null, quantity);
								}
							}}
							disabled={productData.sizes && productData.sizes.length > 0 ? !size : false}
							className={`w-full py-3 px-8 rounded-md text-white text-lg font-medium transition-all duration-200
								${productData.sizes && productData.sizes.length > 0 ? (!size ? 'bg-gray-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600') : 'bg-orange-500 hover:bg-orange-600'}`}
						>
							<FaShoppingCart className="inline-block mr-2" />
							Add to Cart
						</button>
						<button
							onClick={() => {
								if (productData.sizes && productData.sizes.length > 0) {
									if (size) {
										addToCart(productId, size, quantity);
										navigate('/cart');
									} else {
										toast.error('Please select a size');
									}
								} else {
									addToCart(productId, null, quantity);
									navigate('/cart');
								}
							}}
							disabled={productData.sizes && productData.sizes.length > 0 ? !size : false}
							className={`w-full py-3 px-8 rounded-md text-white text-lg font-medium transition-all duration-200
								${productData.sizes && productData.sizes.length > 0 ? (!size ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700') : 'bg-blue-600 hover:bg-blue-700'}`}
						>
							<FaBolt className="inline-block mr-2" />
							Buy Now
						</button>
					</div>

					{/* Trust Badges */}
					<TrustBadges />

					{/* Social Share */}
					<SocialShare
						url={window.location.href}
						title={productData.name}
						image={productData.image[0]}
						price={productData.price}
						currency={currency}
						sizes={productData.sizes}
					/>
				</div>
			</div>

			{/* Sticky Add to Cart */}
			{showStickyAdd && (
				<div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t p-4 z-40">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						<div className="flex items-center justify-between">
							<div className="flex items-center space-x-4">
								<img src={image} alt={productData.name} className="w-16 h-16 object-cover rounded" />
								<div>
									<h3 className="text-sm font-medium text-gray-900 line-clamp-1 md:line-clamp-none">
										{productData.name.split(' ').slice(0, 3).join(' ')}
										{productData.name.split(' ').length > 3 && <span className="md:hidden">...</span>}
									</h3>
									<p className="text-sm font-bold text-gray-900">{currency}{productData.price}</p>
								</div>
							</div>
							<div className="flex items-center space-x-4">
								{productData.sizes && productData.sizes.length > 0 && (
									<div className="flex items-center space-x-2">
										<label className="text-sm font-medium text-gray-700">Size:</label>
										<div className="flex space-x-2">
											{productData.sizes.map((item) => (
												<button
													key={item}
													onClick={() => setSize(item)}
													className={`px-2 py-1 text-xs font-medium rounded-md transition-all duration-200
														${item === size
															? 'bg-orange-500 text-white'
															: 'bg-gray-100 text-gray-900 hover:bg-gray-200'
														}`}
												>
													{item}
												</button>
											))}
										</div>
									</div>
								)}
								<button
									onClick={() => {
										if (productData.sizes && productData.sizes.length > 0) {
											if (size) {
												addToCart(productId, size, quantity);
											} else {
												toast.error('Please select a size');
												addToCartRef.current?.scrollIntoView({ behavior: 'smooth' });
											}
										} else {
											addToCart(productId, null, quantity);
										}
									}}
									disabled={productData.sizes && productData.sizes.length > 0 ? !size : false}
									className="bg-orange-500 text-white px-6 py-2 rounded-md hover:bg-orange-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
								>
									Add to Cart
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Live Chat Widget */}
			<LiveChatWidget />

			{/* Product Information Tabs */}
			<div className="mt-16">
				<Tab.Group>
					<Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1">
						<Tab
							className={({ selected }) =>
								`w-full rounded-lg py-2.5 text-sm font-medium leading-5
								${selected
									? 'bg-white text-orange-600 shadow'
									: 'text-gray-700 hover:bg-white/[0.12] hover:text-orange-600'
								}`
							}
						>
							Description
						</Tab>
						<Tab
							className={({ selected }) =>
								`w-full rounded-lg py-2.5 text-sm font-medium leading-5
								${selected
									? 'bg-white text-orange-600 shadow'
									: 'text-gray-700 hover:bg-white/[0.12] hover:text-orange-600'
								}`
							}
						>
							Reviews ({totalReviews})
						</Tab>
					</Tab.List>
					<Tab.Panels className="mt-8">
						<Tab.Panel className="rounded-xl bg-white p-3">
							<div className="prose max-w-none">
								<p className="text-gray-600 whitespace-pre-line">
									{productData.description}
								</p>
							</div>
						</Tab.Panel>
						<Tab.Panel className="rounded-xl bg-white p-3">
							<div className="space-y-6">
								{/* Review Form */}
								{userId && (
									<div className="bg-gray-50 p-4 rounded-lg" id="review-form">
										<h3 className="text-lg font-medium text-gray-900 mb-4">Write a Review</h3>
										{errorMessage && (
											<p className="text-red-600 text-sm mb-4">{errorMessage}</p>
										)}
										<div className="space-y-4">
											<div className="flex items-center space-x-2">
												<label className="text-sm font-medium text-gray-700">Rating:</label>
												<div className="flex items-center space-x-1">
													{[1, 2, 3, 4, 5].map((star) => (
														<button
															key={star}
															onClick={() => setNewReview({ ...newReview, rating: star })}
															className={`text-2xl ${star <= newReview.rating ? 'text-yellow-400' : 'text-gray-300'
																}`}
														>
															★
														</button>
													))}
												</div>
											</div>
											<textarea
												value={newReview.comment}
												onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
												placeholder="Write your review here..."
												rows="4"
												className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
											/>
											<button
												onClick={handleReviewSubmit}
												disabled={isSubmitting}
												className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
											>
												{isSubmitting ? 'Submitting...' : editingReview ? 'Update Review' : 'Submit Review'}
											</button>
										</div>
									</div>
								)}

								{/* Reviews List */}
								<div className="space-y-4">
									{reviews.map((review) => (
										<div key={review._id} className="border-b pb-4">
											<div className="flex justify-between items-start">
												<div>
													<div className="flex items-center">
														{renderStars(review.rating)}
														<span className="ml-2 text-sm text-gray-500">
															by {review.userId?.name || "Anonymous"}
														</span>
													</div>
													<p className="mt-2 text-gray-600">{review.comment}</p>
												</div>
												{review.userId?._id === userId && (
													<div className="flex space-x-2">
														<button
															onClick={() => setEditingReview(review)}
															className="text-sm text-blue-600 hover:text-blue-800"
														>
															Edit
														</button>
														<button
															onClick={() => handleDeleteReview(review._id)}
															className="text-sm text-red-600 hover:text-red-800"
														>
															Delete
														</button>
													</div>
												)}
											</div>
										</div>
									))}
									{reviews.length === 0 && (
										<p className="text-gray-500 text-center py-4">
											No reviews yet. Be the first to review this product!
										</p>
									)}
								</div>
							</div>
						</Tab.Panel>
					</Tab.Panels>
				</Tab.Group>
			</div>

			{/* Lightbox */}
			<Lightbox
				isOpen={isLightboxOpen}
				onClose={() => setIsLightboxOpen(false)}
				images={productData.image}
				currentIndex={lightboxIndex}
				setCurrentIndex={setLightboxIndex}
			/>

			{/* Related Products */}
			<div className="mt-16">
				<RelatedProducts category={productData.category} subCategory={productData.subCategory} />
			</div>
		</div>
	) : null;
};

export default Product;
