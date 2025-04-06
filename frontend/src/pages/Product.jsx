import React, { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import RelatedProducts from '../components/RelatedProducts';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const Product = () => {
	const [averageRating, setAverageRating] = useState(0);
	const [totalReviews, setTotalReviews] = useState(0);
	const { productId } = useParams();
	const { products, currency, addToCart, backendUrl, token } = useContext(ShopContext);
	const [productData, setProductData] = useState(null);
	const [image, setImage] = useState(null);
	const [size, setSize] = useState('');
	const [activeTab, setActiveTab] = useState('description');
	const [reviews, setReviews] = useState([]);
	const [newReview, setNewReview] = useState({ rating: 0, comment: '' });
	const [editingReview, setEditingReview] = useState(null);
	const [isSubmitting, setIsSubmitting] = useState(false); // Track submission state
	const [errorMessage, setErrorMessage] = useState(''); // To show error messages
	const [isLoading, setIsLoading] = useState(true);

	// Decode the token to get the user ID
	const userId = token ? jwtDecode(token).id : null;

	// Fetch reviews and stats
	const fetchReviews = async () => {
		try {
			// Fetch reviews
			const response = await axios.get(`${backendUrl}/api/reviews/product/${productId}`);
			if (response.data.success) {
				setReviews(response.data.reviews);
			} else {
				setReviews([]);
				console.warn(response.data.message);
			}

			// Fetch review stats
			const statsResponse = await axios.get(`${backendUrl}/api/reviews/stats/${productId}`);
			if (statsResponse.data.success) {
				const { averageRating, totalReviews } = statsResponse.data.stats;
				setAverageRating(averageRating.toFixed(1)); // Round to 1 decimal place
				setTotalReviews(totalReviews);
			}
		} catch (error) {
			console.error("Error fetching reviews or stats:", error);
		}
	};

	// Fetch product data
	const fetchProductData = async () => {
		setIsLoading(true);
		let foundProduct = products.find((item) => item._id === productId);

		if (!foundProduct) {
			try {
				const response = await axios.post(`${backendUrl}/api/products/single`, { productId });
				if (response.data.success) {
					foundProduct = response.data.product;
				} else {
					console.warn(response.data.message);
				}
			} catch (error) {
				console.error("Error fetching product data from backend:", error);
			}
		}

		if (foundProduct && foundProduct.image && foundProduct.image.length > 0) {
			setProductData(foundProduct);
			setImage(foundProduct.image[0]);
		} else {
			setProductData(null);
			setImage(null);
		}
		setIsLoading(false);
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
		fetchProductData();
		fetchReviews();
	}, [productId]);

	// if (productData === null) {
	// 	return <div>Product not found.</div>;
	// }


	if (isLoading) {
		return <div>Loading...</div>;
	}

	if (!productData) {
		return <div>Product not found.</div>;
	}
	
	return productData ? (
		<div className='border-t-2 pt-10 transition-opacity ease-in duration-500 opacity-100'>
			{/* Product Data */}
			<div className='flex gap-12 sm:gap-12 flex-col sm:flex-row'>
				{/* Product Images */}
				<div className='flex-1 flex flex-col-reverse gap-3 sm:flex-row'>
					<div className='flex sm:flex-col overflow-x-auto sm:overflow-y-scroll justify-between sm:justify-normal sm:w-[18.7%] w-full'>
						{productData.image.map((item, index) => (
							<img
								onClick={() => setImage(item)}
								src={item}
								key={index}
								className={`w-[24%] sm:w-full sm:mb-3 flex-shrink-0 cursor-pointer ${image === item ? 'border-2 border-blue-500' : ''}`}
								alt={`Product thumbnail ${index + 1}`}
							/>
						))}
					</div>
					<div className='w-full sm:w-[80%]'>
						<img className='w-full h-auto' src={image} alt="" />
					</div>
				</div>

				{/* Product Info */}
				<div className='flex-1'>
					<h1 className='font-medium text-2xl mt-2'>{productData.name}</h1>
					<div className="flex items-center gap-1 mt-2">
						<p className="text-lg font-medium">{averageRating} / 5</p>
						<p className="text-gray-500">({totalReviews} reviews)</p>
					</div>
					<p className='mt-5 text-3xl font-medium'>
						{currency}{productData.price}
					</p>
					<p className='mt-5 text-gray-500 md:w-4/5'>
						{productData.description}
					</p>
					<div className='flex flex-col gap-4 my-8'>
						<p>Select Size</p>
						<div className='flex gap-2'>
							{productData.sizes.map((item, index) => (
								<button onClick={() => setSize(item)} key={index} className={`border text-xl py-2 px-4 bg-gray-100 ${item === size ? "border-orange-500 bg-orange-400 font-bold text-white" : ""}`}>{item}</button>
							))}
						</div>
					</div>

					<button onClick={() => addToCart(productData._id, size)} className='bg-black text-white px-8 py-3 text-sm active:bg-gray-700'>ADD TO CART</button>
					<hr className='mt-8 sm:w-4/5' />
					<div className='text-sm text-gray-500 mt-5 flex flex-col gap-1'>
						<p>100% Original Product.</p>
						<p>Cash on delivery available on this product.</p>
						<p>Easy return and exchange policy in 7 days.</p>
					</div>
				</div>
			</div>

			{/* Description & Review Section */}
			<div className='mt-20'>
				<div className='flex'>
					<b
						className={`border px-5 py-3 text-sm cursor-pointer ${activeTab === 'description' ? 'bg-gray-200' : ''}`}
						onClick={() => setActiveTab('description')}
					>
						Description
					</b>
					<p
						className={`border px-5 py-3 text-sm cursor-pointer ${activeTab === 'reviews' ? 'bg-gray-200' : ''}`}
						onClick={() => setActiveTab('reviews')}
					>
						Reviews
					</p>
				</div>
				<div className='flex flex-col gap-4 border px-6 py-6 text-sm text-gray-500'>
					{activeTab === 'description' ? (
						<p className='text-gray-600 whitespace-pre-line'>
							{productData.description}
						</p>
					) : (
						<div>
							{/* Review Form */}
							<div className='mb-4'>
								<h3 className='text-lg font-medium'>Add a Review</h3>
								{errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}
								<div className='flex items-center gap-2 mt-2'>
									<input
										type='number'
										min='1'
										max='5'
										value={newReview.rating}
										onChange={(e) => setNewReview({ ...newReview, rating: e.target.value })}
										placeholder='Rating (1-5)'
										className='border px-2 py-1 w-16'
									/>
									<textarea
										value={newReview.comment}
										onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
										placeholder='Write your review...'
										className='border px-2 py-1 w-full'
									/>
									<button
										onClick={handleReviewSubmit}
										className='bg-blue-500 text-white px-4 py-2'
										disabled={isSubmitting}
									>
										{isSubmitting ? 'Submitting...' : editingReview ? 'Update' : 'Submit'}
									</button>
								</div>
							</div>

							{/* Reviews List */}
							<h3 className='text-lg font-medium'>Customer Reviews</h3>
							<ul className='list-disc pl-5'>
								{reviews && reviews.length > 0 ? (
									reviews.map((review) => (
										<li key={review._id} className='mb-2'>
											<div className='flex justify-between'>
												<p>
													<strong>{review.userId?.name || "Anonymous"}</strong> - {review.rating} / 5
												</p>
												<div>
													{review.userId?._id === userId && (
														<>
															<button
																onClick={() => setEditingReview(review)}
																className='text-blue-500 mr-2'
															>
																Edit
															</button>
															<button
																onClick={() => handleDeleteReview(review._id)}
																className='text-red-500'
															>
																Delete
															</button>
														</>
													)}
												</div>
											</div>
											<p>{review.comment}</p>
										</li>
									))
								) : (
									<p>No reviews yet. Be the first to review this product!</p>
								)}
							</ul>
						</div>
					)}
				</div>
			</div>

			{/* Display related products */}
			<RelatedProducts category={productData.category} subCategory={productData.subCategory} />
		</div>
	) : (
		<div className='opacity-0'></div>
	);
};

export default Product;
