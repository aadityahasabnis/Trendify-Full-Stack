import React, { useState, useCallback, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { ShopContext } from '../context/ShopContext';
import ProductItem from './ProductItem';

// Memoized Product Card component
const ProductCard = memo(({ product, onClick, showStockStatus }) => {
    const { getStockStatus } = React.useContext(ShopContext);
    const stockStatus = getStockStatus(product);

    const getImageUrl = (image) => {
        if (!image) return 'https://via.placeholder.com/300x400?text=No+Image';
        if (Array.isArray(image)) return image[0];
        if (typeof image === 'string') {
            const urls = image.split(',');
            return urls[0].trim();
        }
        return 'https://via.placeholder.com/300x400?text=No+Image';
    };

    const imageUrl = getImageUrl(product.image);

    return (
        <div
            className="relative group cursor-pointer px-2"
            onClick={() => onClick(product._id)}
        >
            <div className="relative overflow-hidden rounded-lg">
                <img
                    src={imageUrl}
                    alt={product.name}
                    className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/300x400?text=No+Image';
                    }}
                />
                {showStockStatus && stockStatus && (
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
                    <div className="absolute top-1 left-2 px-2 py-1 rounded-full text-xl font-medium text-white">
                        🔥
                    </div>
                )}
            </div>
            <div className="mt-2">
                <h3 className="text-sm font-medium text-gray-900 truncate">{product.name}</h3>
                <p className="text-sm text-gray-500">₹{product.price}</p>
            </div>
        </div>
    );
});

const ProductCarousel = ({ title, subtitle, products, showStockStatus = false }) => {
    const [startIndex, setStartIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const navigate = useNavigate();

    // Calculate total pages based on screen size
    const getItemsPerPage = () => {
        if (window.innerWidth < 640) return 1; // Mobile
        if (window.innerWidth < 768) return 2; // Small tablets
        if (window.innerWidth < 1024) return 3; // Tablets
        return 5; // Desktop
    };

    const [itemsPerPage, setItemsPerPage] = useState(getItemsPerPage());

    // Update items per page on window resize
    React.useEffect(() => {
        const handleResize = () => {
            setItemsPerPage(getItemsPerPage());
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const totalPages = Math.ceil(products.length / itemsPerPage);
    const currentPage = Math.floor(startIndex / itemsPerPage);

    const visibleProducts = useMemo(() => {
        return products.slice(startIndex, startIndex + itemsPerPage);
    }, [products, startIndex, itemsPerPage]);

    const handlePrev = useCallback(() => {
        if (isAnimating || startIndex === 0) return;
        setIsAnimating(true);
        setStartIndex(prev => Math.max(0, prev - itemsPerPage));
        setTimeout(() => setIsAnimating(false), 300);
    }, [startIndex, isAnimating, itemsPerPage]);

    const handleNext = useCallback(() => {
        if (isAnimating || startIndex + itemsPerPage >= products.length) return;
        setIsAnimating(true);
        setStartIndex(prev => Math.min(products.length - itemsPerPage, prev + itemsPerPage));
        setTimeout(() => setIsAnimating(false), 300);
    }, [products.length, startIndex, isAnimating, itemsPerPage]);

    const handleProductClick = useCallback((productId) => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        navigate(`/product/${productId}`);
    }, [navigate]);

    const productItems = useMemo(() =>
        visibleProducts.map(product => (
            <ProductCard
                key={product._id}
                product={product}
                onClick={handleProductClick}
                showStockStatus={showStockStatus}
            />
        )), [visibleProducts, handleProductClick, showStockStatus]);

    return (
        <div className="w-full bg-white py-8">
            <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 font-serif tracking-wide">{title}</h2>
                        {subtitle && (
                            <>
                                <span className="text-lg text-gray-600 font-light hidden sm:block">|</span>
                                <p className="text-lg text-gray-600 hidden sm:block">{subtitle}</p>
                            </>
                        )}
                    </div>

                    <div className="hidden sm:flex items-center gap-3">
                        <div className="flex space-x-1">
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i}
                                    className={`w-2 h-2 rounded-full ${i === currentPage ? 'bg-gray-900' : 'bg-gray-300'}`}
                                    onClick={() => {
                                        if (isAnimating) return;
                                        setIsAnimating(true);
                                        setStartIndex(i * itemsPerPage);
                                        setTimeout(() => setIsAnimating(false), 300);
                                    }}
                                    aria-label={`Go to page ${i + 1}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="relative">
                    {startIndex > 0 && (
                        <button
                            onClick={handlePrev}
                            disabled={isAnimating}
                            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Previous page"
                        >
                            <FaChevronLeft className="w-5 h-5" />
                        </button>
                    )}

                    <div className="overflow-hidden">
                        <div
                            className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 transition-transform duration-300 ease-in-out`}
                            style={{
                                transform: `translateX(${isAnimating ? '0' : '0'})`
                            }}
                        >
                            {productItems}
                        </div>
                    </div>

                    {startIndex + itemsPerPage < products.length && (
                        <button
                            onClick={handleNext}
                            disabled={isAnimating}
                            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Next page"
                        >
                            <FaChevronRight className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default memo(ProductCarousel);
