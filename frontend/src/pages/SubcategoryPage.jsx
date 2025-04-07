import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ProductGrid from '../components/ProductGrid';
import axios from 'axios';

const SubcategoryPage = () => {
    const { categorySlug, subcategorySlug } = useParams();
    const [subcategoryProducts, setSubcategoryProducts] = useState([]);
    const [subcategoryName, setSubcategoryName] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSubcategoryProducts = async () => {
            try {
                const response = await axios.get(`/api/categories/${categorySlug}/${subcategorySlug}/products`);
                if (response.data.success) {
                    setSubcategoryProducts(response.data.products);
                    setSubcategoryName(response.data.subcategory.name);
                }
            } catch (error) {
                console.error('Error fetching subcategory products:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSubcategoryProducts();
    }, [categorySlug, subcategorySlug]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <ProductGrid
            title={subcategoryName.toUpperCase()}
            products={subcategoryProducts}
            showFilters={true}
        />
    );
};

export default SubcategoryPage; 