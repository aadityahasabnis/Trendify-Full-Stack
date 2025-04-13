import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import ProductItem from './ProductItem';

const RelatedProducts = () => {
    const { productId } = useParams();
    const { fetchRelatedProducts, getStockStatus } = useContext(ShopContext);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const getRelatedProducts = async () => {
            try {
                setLoading(true);
                const data = await fetchRelatedProducts(productId);
                if (data.success) {
                    // Ensure each product has a valid image URL
                    const productsWithValidImages = data.relatedProducts.map(product => ({
                        ...product,
                        image: product.image || 'https://res.cloudinary.com/dn2rlrfwt/image/upload/v1712400000/default-product-image.jpg'
                    }));
                    setRelatedProducts(productsWithValidImages);
                } else {
                    setError('Failed to load related products');
                }
            } catch (err) {
                setError('Error loading related products');
                console.error('Error fetching related products:', err);
            } finally {
                setLoading(false);
            }
        };

        if (productId) {
            getRelatedProducts();
        }
    }, [productId, fetchRelatedProducts]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center text-red-500 p-4">
                {error}
            </div>
        );
    }

    if (relatedProducts.length === 0) {
        return null;
    }

    return (
        <div className="py-8">
            <h2 className="text-2xl font-semibold mb-6 text-center">
                You May Also Like
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {relatedProducts.map((product) => (
                    <div
                        key={product._id}
                        className="transition-all duration-300 hover:scale-105"
                    >
                        <ProductItem
                            id={product._id}
                            image={product.image}
                            name={product.name}
                            price={product.price}
                            stock={product.stock}
                            stockStatus={getStockStatus(product)}
                            bestseller={product.bestseller}
                            isActive={product.isActive}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RelatedProducts;