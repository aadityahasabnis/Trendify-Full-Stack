import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import { useNavigate } from 'react-router-dom'
import ProductCarousel from './ProductCarousel'
import { toast } from 'react-toastify'

const PersonalizedRecommendations = () => {
    const { token, backendUrl, getStockStatus } = useContext(ShopContext);
    const navigate = useNavigate();
    const [recommendedProducts, setRecommendedProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRecommendations = async () => {
            if (!token) return;

            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch(`${backendUrl}/api/recommendations`, {
                    headers: {
                        'token': token
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();

                if (data.success) {
                    const productsWithStockStatus = data.recommendations.map(product => ({
                        ...product,
                        stockStatus: getStockStatus(product)
                    }));
                    setRecommendedProducts(productsWithStockStatus);
                } else {
                    setError('Failed to load recommendations');
                    toast.error('Failed to load recommendations');
                }
            } catch (error) {
                console.error('Error fetching recommendations:', error);
                setError('Error loading recommendations');
                toast.error('Error loading recommendations');
            } finally {
                setIsLoading(false);
            }
        };

        fetchRecommendations();
    }, [token, backendUrl, getStockStatus]);

    if (!token) {
        return (
            <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 my-8">
                <div className='flex flex-col items-center gap-5 py-12 sm:py-16 md:py-20 text-center border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300'>
                    <p className='text-xl sm:text-2xl font-medium text-gray-800'>See personalized recommendations</p>

                    <div className='flex flex-col w-full sm:w-1/2 md:w-1/3 lg:w-1/4 gap-5'>
                        <button
                            className='px-8 sm:px-12 py-2 bg-orange-400 hover:bg-orange-500 text-white font-medium cursor-pointer rounded-2xl transition-colors duration-300'
                            type='button'
                            onClick={() => navigate('/login')}
                        >
                            Sign in
                        </button>
                        <div className="flex items-center justify-center gap-1 text-center">
                            <p className="text-gray-600">New Customer?</p>
                            <p
                                className='text-blue-700 underline underline-offset-2 cursor-pointer hover:text-blue-800 transition-colors duration-300'
                                onClick={() => navigate('/login', { state: { initialState: 'Sign Up' } })}
                            >
                                Start here
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 my-8">
                <div className="text-center text-red-600">
                    {error}
                </div>
            </div>
        );
    }

    if (recommendedProducts.length === 0) {
        return null;
    }

    return (
        <ProductCarousel
            title="PERSONALIZED"
            subtitle="RECOMMENDATIONS"
            products={recommendedProducts}
            itemsPerPage={5}
        // showStockStatus={true}
        />
    );
}

export default PersonalizedRecommendations