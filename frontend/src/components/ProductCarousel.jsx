import React, { useState, useCallback, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { ShopContext } from '../context/ShopContext';
import ProductItem from './ProductItem';
import Title from './Title';

// Memoized Product Card component
const ProductCard = memo(({ product, onClick, showStockStatus }) => {
    const { getStockStatus } = React.useContext(ShopContext);
    const stockStatus = getStockStatus(product);

    return (
        <div
            className="relative group cursor-pointer"
            onClick={() => onClick(product._id)}
        >
            <div className="relative overflow-hidden rounded-lg">
                <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
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

const ProductCarousel = ({ title, subtitle, products, itemsPerPage = 5, showStockStatus = false }) => {
    const [currentPage, setCurrentPage] = useState(0);
    const navigate = useNavigate();

    // Memoize paginated products
    const paginatedProducts = useMemo(() => {
        const start = currentPage * itemsPerPage;
        return products.slice(start, start + itemsPerPage);
    }, [products, currentPage, itemsPerPage]);

    // Memoize navigation handlers
    const handlePrev = useCallback(() => {
        setCurrentPage(prev => Math.max(0, prev - 1));
    }, []);

    const handleNext = useCallback(() => {
        setCurrentPage(prev => Math.min(Math.ceil(products.length / itemsPerPage) - 1, prev + 1));
    }, [products.length, itemsPerPage]);

    const handleProductClick = useCallback((productId) => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        navigate(`/product/${productId}`);
    }, [navigate]);

    // Memoize product items
    const productItems = useMemo(() =>
        paginatedProducts.map(product => (
            <ProductCard
                key={product._id}
                product={product}
                onClick={handleProductClick}
                showStockStatus={showStockStatus}
            />
        )), [paginatedProducts, handleProductClick, showStockStatus]);

    return (
        <div className="bg-white py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-4">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
                    <p className="mt-2 text-md text-gray-600">{subtitle}</p>
                </div>

                <div className="relative">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {productItems}
                    </div>

                    {products.length > itemsPerPage && (
                        <div className="flex justify-between mt-6">
                            <button
                                onClick={handlePrev}
                                disabled={currentPage === 0}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
                            >
                                Previous
                            </button>
                            <button
                                onClick={handleNext}
                                disabled={currentPage >= Math.ceil(products.length / itemsPerPage) - 1}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default memo(ProductCarousel); 