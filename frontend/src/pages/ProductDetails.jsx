import React from 'react';
import RelatedProducts from '../components/RelatedProducts';
import useScrollToTop from '../hooks/useScrollToTop';

const ProductDetails = () => {
    useScrollToTop();

    return (
        <div className="container mx-auto px-4 py-8">
            {/* ... existing product details ... */}
            <RelatedProducts />
        </div>
    );
};

export default ProductDetails; 