import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import { backendUrl } from '../config';

const Product = () => {
    const { productId } = useParams();
    const { getStockStatus } = useContext(ShopContext);
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reviewStats, setReviewStats] = useState({
        averageRating: 0,
        totalReviews: 0
    });

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await axios.get(`${backendUrl}/api/product/${productId}`);
                if (response.data.success) {
                    // Handle image format - ensure it's always an array
                    const productData = response.data.product;
                    if (typeof productData.image === 'string') {
                        productData.image = productData.image.split(',').map(url => url.trim());
                    } else if (!Array.isArray(productData.image)) {
                        productData.image = [productData.image];
                    }
                    setProduct(productData);
                }
            } catch (error) {
                setError('Failed to load product');
                console.error('Error fetching product:', error);
            } finally {
                setLoading(false);
            }
        };

        const fetchReviews = async () => {
            try {
                const response = await axios.get(`${backendUrl}/api/reviews/stats/${productId}`);
                if (response.data.success) {
                    setReviewStats(response.data.stats);
                }
            } catch (error) {
                if (error.response?.status === 404) {
                    // No reviews found, set default stats
                    setReviewStats({
                        averageRating: 0,
                        totalReviews: 0
                    });
                    console.log('No reviews found for this product');
                } else {
                    console.error("Error fetching reviews or stats:", error);
                }
            }
        };

        fetchProduct();
        fetchReviews();
    }, [productId]);

    if (loading) {
        return <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        </div>;
    }

    if (error) {
        return <div className="text-center text-red-600">{error}</div>;
    }

    if (!product) {
        return <div className="text-center text-gray-600">Product not found</div>;
    }

    const stockStatus = getStockStatus(product);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Product Images */}
                <div className="space-y-4">
                    <div className="relative aspect-square overflow-hidden rounded-lg">
                        <img
                            src={Array.isArray(product.image) ? product.image[0] : product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/500x500?text=No+Image';
                            }}
                        />
                        {stockStatus && (
                            <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${stockStatus.inStock
                                ? stockStatus.lowStock
                                    ? 'bg-yellow-500 text-white'
                                    : 'bg-green-500 text-white'
                                : 'bg-red-500 text-white'
                                }`}>
                                {stockStatus.message}
                            </div>
                        )}
                        {product.bestseller && (
                            <div className="absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium bg-orange-500 text-white">
                                🔥 Bestseller
                            </div>
                        )}
                    </div>
                    {/* Additional images grid */}
                    {Array.isArray(product.image) && product.image.length > 1 && (
                        <div className="grid grid-cols-4 gap-2">
                            {product.image.slice(1).map((img, index) => (
                                <div key={index} className="aspect-square overflow-hidden rounded-lg">
                                    <img
                                        src={img}
                                        alt={`${product.name} - ${index + 2}`}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.src = 'https://via.placeholder.com/200x200?text=No+Image';
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Product Details */}
                <div className="space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
                        <div className="mt-2 flex items-center">
                            <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                    <svg
                                        key={i}
                                        className={`h-5 w-5 ${i < Math.round(reviewStats.averageRating)
                                            ? 'text-yellow-400'
                                            : 'text-gray-300'
                                            }`}
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                ))}
                            </div>
                            <span className="ml-2 text-sm text-gray-500">
                                ({reviewStats.totalReviews} reviews)
                            </span>
                        </div>
                    </div>

                    <div className="text-2xl font-bold text-gray-900">
                        ₹{product.price}
                    </div>

                    <div className="prose max-w-none">
                        <p className="text-gray-600">{product.description}</p>
                    </div>

                    {/* Add to cart section */}
                    <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                            <button
                                className="px-6 py-3 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
                                disabled={!stockStatus?.inStock}
                            >
                                Add to Cart
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Product; 