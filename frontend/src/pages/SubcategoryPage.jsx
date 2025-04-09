import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import ProductGrid from '../components/ProductGrid';
import axios from 'axios';

const SubcategoryPage = () => {
    const { categorySlug, subcategorySlug } = useParams();
    const { backendUrl } = useContext(ShopContext);
    const [subcategoryProducts, setSubcategoryProducts] = useState([]);
    const [subcategoryName, setSubcategoryName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSubcategoryProducts = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await axios.get(`${backendUrl}/api/categories/${categorySlug}/${subcategorySlug}/products`);

                if (response.data && response.data.success) {
                    setSubcategoryProducts(response.data.products || []);
                    if (response.data.subcategory && response.data.subcategory.name) {
                        setSubcategoryName(response.data.subcategory.name);
                    } else {
                        setSubcategoryName(subcategorySlug);
                    }
                } else {
                    setError('Failed to fetch subcategory data');
                }
            } catch (error) {
                console.error('Error fetching subcategory products:', error);
                setError('Error loading subcategory products');
            } finally {
                setLoading(false);
            }
        };

        fetchSubcategoryProducts();
    }, [categorySlug, subcategorySlug, backendUrl]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-red-500">{error}</div>
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