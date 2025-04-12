import React, { useState, useCallback, useMemo, memo, useEffect } from 'react';
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
            className="relative cursor-pointer overflow-hidden rounded-lg bg-white shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col"
            onClick={() => onClick(product._id)}
        >
            <div className="relative overflow-hidden flex-grow">
                <img
                    src={imageUrl}
                    alt={product.name}
                    className="w-full h-85 object-cover transition-transform duration-300 hover:scale-105"
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
                    <div className="absolute top-2 left-2 px-2 py-1 rounded-full text-white text-2xl font-medium">
                        🔥
                    </div>
                )}
            </div>
            <div className="p-5">
                <h3 className="text-base font-semibold text-gray-800 truncate font-serif tracking-wide">{product.name}</h3>
                <p className="text-base text-gray-600 mt-2 font-light">₹{product.price}</p>
            </div>
        </div>
    );
});

const ProductCarousel = ({ title, subtitle, products, itemsPerPage = 5, showStockStatus = false }) => {
    const [currentPage, setCurrentPage] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const navigate = useNavigate();

    // Fixed number of pages - always 3
    const numPages = 3;
    const totalProducts = Math.min(products.length, numPages * itemsPerPage);

    // Calculate optimal items per row based on screen width
    const [itemsPerRow, setItemsPerRow] = useState(5);

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            if (width >= 1536) { // 2xl
                setItemsPerRow(5);
            } else if (width >= 1280) { // xl
                setItemsPerRow(5);
            } else if (width >= 1024) { // lg
                setItemsPerRow(5);
            } else if (width >= 768) { // md
                setItemsPerRow(4);
            } else if (width >= 640) { // sm
                setItemsPerRow(3);
            } else {
                setItemsPerRow(2);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Get the visible products for the current page
    const visibleProducts = useMemo(() => {
        const startIndex = currentPage * itemsPerPage;
        return products.slice(startIndex, Math.min(startIndex + itemsPerPage, totalProducts));
    }, [products, currentPage, itemsPerPage, totalProducts]);

    const handlePrev = useCallback(() => {
        if (isAnimating || currentPage === 0) return;
        setIsAnimating(true);
        setCurrentPage(prev => prev - 1);
        setTimeout(() => setIsAnimating(false), 300);
    }, [currentPage, isAnimating]);

    const handleNext = useCallback(() => {
        if (isAnimating || currentPage >= numPages - 1 || currentPage * itemsPerPage + itemsPerPage >= totalProducts) return;
        setIsAnimating(true);
        setCurrentPage(prev => prev + 1);
        setTimeout(() => setIsAnimating(false), 300);
    }, [currentPage, isAnimating, itemsPerPage, numPages, totalProducts]);

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

    // Determine grid columns based on items per row
    const gridColsClass = useMemo(() => {
        return `grid-cols-${itemsPerRow}`;
    }, [itemsPerRow]);

    // Calculate transform for swiping transition
    const transformStyle = useMemo(() => {
        if (!isAnimating) return {};
        return {
            transform: `translateX(${currentPage * -100}%)`,
            transition: 'transform 300ms ease-out'
        };
    }, [currentPage, isAnimating]);

    return (
        <div className="w-full bg-white py-8">
            <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <h2 className="text-3xl font-bold text-gray-900 font-serif tracking-wide">{title}</h2>
                        {subtitle && (
                            <>
                                <span className="text-lg text-gray-600 font-light">|</span>
                                <p className="text-lg text-gray-600 font-light italic">{subtitle}</p>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex space-x-2">
                            {[...Array(Math.min(numPages, Math.ceil(totalProducts / itemsPerPage)))].map((_, i) => (
                                <button
                                    key={i}
                                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i === currentPage ? 'bg-gray-800 scale-110' : 'bg-gray-300 hover:bg-gray-400'}`}
                                    onClick={() => {
                                        if (isAnimating) return;
                                        setIsAnimating(true);
                                        setCurrentPage(i);
                                        setTimeout(() => setIsAnimating(false), 300);
                                    }}
                                    aria-label={`Go to page ${i + 1}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="relative group">
                    {currentPage > 0 && (
                        <button
                            onClick={handlePrev}
                            disabled={isAnimating}
                            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-900 opacity-0 group-hover:opacity-100 group-hover:-translate-x-6 disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Previous page"
                        >
                            <FaChevronLeft className="w-5 h-5" />
                        </button>
                    )}

                    <div className="overflow-hidden">
                        <div className={`grid ${gridColsClass} gap-4 md:gap-6`} style={transformStyle}>
                            {productItems}
                        </div>
                    </div>

                    {currentPage < Math.min(numPages - 1, Math.ceil(totalProducts / itemsPerPage) - 1) && (
                        <button
                            onClick={handleNext}
                            disabled={isAnimating}
                            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-900 opacity-0 group-hover:opacity-100 group-hover:translate-x-6 disabled:opacity-50 disabled:cursor-not-allowed"
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
