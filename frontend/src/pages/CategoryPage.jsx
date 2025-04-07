import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import ProductGrid from '../components/ProductGrid';
import axios from 'axios';

const CategoryPage = () => {
    const { categorySlug } = useParams();
    const [categoryProducts, setCategoryProducts] = useState([]);
    const [categoryName, setCategoryName] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategoryProducts = async () => {
            try {
                const response = await axios.get(`/api/categories/${categorySlug}/products`);
                if (response.data.success) {
                    setCategoryProducts(response.data.products);
                    setCategoryName(response.data.category.name);
                }
            } catch (error) {
                console.error('Error fetching category products:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCategoryProducts();
    }, [categorySlug]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <ProductGrid
            title={categoryName.toUpperCase()}
            products={categoryProducts}
            showFilters={true}
        />
    );
};

export default CategoryPage; 