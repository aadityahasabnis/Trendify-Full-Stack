import React, { useState, useRef, useEffect } from 'react';
import ProductItem from './ProductItem';
import Title from './Title';

const ProductCarousel = ({ title, subtitle, products, itemsPerPage = 5 }) => {
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const carouselRef = useRef(null);

    useEffect(() => {
        if (products && products.length > 0) {
            setTotalPages(Math.ceil(products.length / itemsPerPage));
        }
    }, [products, itemsPerPage]);

    const nextPage = () => {
        setCurrentPage((prevPage) => (prevPage + 1) % totalPages);
    };

    const prevPage = () => {
        setCurrentPage((prevPage) => (prevPage - 1 + totalPages) % totalPages);
    };

    const goToPage = (pageIndex) => {
        setCurrentPage(pageIndex);
    };

    // Get current page products
    const getCurrentPageProducts = () => {
        if (!products || products.length === 0) return [];

        const startIndex = currentPage * itemsPerPage;
        return products.slice(startIndex, startIndex + itemsPerPage);
    };

    return (
        <div className="my-16 px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
                <Title text1={title} text2={subtitle} />
                <p className="w-3/4 mx-auto text-sm text-gray-600 mt-2">
                    Discover our curated selection of premium products
                </p>
            </div>

            <div className="relative">
                {/* Product Grid */}
                <div
                    ref={carouselRef}
                    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
                >
                    {getCurrentPageProducts().map((item, index) => (
                        <ProductItem
                            key={index}
                            id={item._id}
                            image={item.image}
                            name={item.name}
                            price={item.price}
                            stock={item.stock}
                            stockStatus={item.stockStatus}
                            bestseller={item.bestseller}
                            isActive={item.isActive}
                        />
                    ))}
                </div>

                {/* Navigation Arrows */}
                {totalPages > 1 && (
                    <>
                        <button
                            className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md z-10 -ml-4"
                            onClick={prevPage}
                            aria-label="Previous page"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button
                            className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md z-10 -mr-4"
                            onClick={nextPage}
                            aria-label="Next page"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </>
                )}

                {/* Pagination Dots */}
                {totalPages > 1 && (
                    <div className="flex justify-center mt-8 space-x-2">
                        {Array.from({ length: totalPages }).map((_, index) => (
                            <button
                                key={index}
                                className={`w-3 h-3 rounded-full ${index === currentPage ? "bg-gray-800" : "bg-gray-300"
                                    }`}
                                onClick={() => goToPage(index)}
                                aria-label={`Go to page ${index + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductCarousel; 