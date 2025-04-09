import React, { useState, useEffect, useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import ProductGrid from '../components/ProductGrid';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';
import TrendingPageHeader from '../components/TrendingPageHeader';

const BestsellersPage = () => {
    const { backendUrl } = useContext(ShopContext);
    const [bestsellerProducts, setBestsellerProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDepartment, setSelectedDepartment] = useState('all');
    const [departments, setDepartments] = useState([]);

    // Fetch departments
    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const response = await axios.get(`${backendUrl}/api/departments`);
                if (response.data.success) {
                    setDepartments(response.data.departments);
                }
            } catch (error) {
                console.error('Error fetching departments:', error);
            }
        };

        fetchDepartments();
    }, [backendUrl]);

    // Fetch bestseller products
    useEffect(() => {
        const fetchBestsellers = async () => {
            try {
                const url = selectedDepartment === 'all'
                    ? `${backendUrl}/api/products/bestsellers`
                    : `${backendUrl}/api/products/bestsellers/${selectedDepartment}`;

                const response = await axios.get(url);
                if (response.data.success) {
                    setBestsellerProducts(response.data.products);
                }
            } catch (error) {
                console.error('Error fetching bestsellers:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBestsellers();
    }, [backendUrl, selectedDepartment]);

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <TrendingPageHeader activeTab="bestsellers" />

            <div className="container mx-auto px-4 py-8">
                {/* Description */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Amazon Bestsellers</h1>
                    <p className="text-gray-600">Our most popular products based on sales. Updated frequently.</p>
                </div>

                <div className="flex gap-6">
                    {/* Department Sidebar */}
                    <div className="w-64 flex-shrink-0">
                        <h2 className="text-lg font-semibold mb-3">Any Department</h2>
                        <div className="space-y-2">
                            <button
                                onClick={() => setSelectedDepartment('all')}
                                className={`w-full text-left px-3 py-2 rounded ${selectedDepartment === 'all'
                                    ? 'bg-orange-100 text-orange-700'
                                    : 'hover:bg-gray-100'
                                    }`}
                            >
                                All Departments
                            </button>
                            {departments.map(dept => (
                                <button
                                    key={dept._id}
                                    onClick={() => setSelectedDepartment(dept._id)}
                                    className={`w-full text-left px-3 py-2 rounded ${selectedDepartment === dept._id
                                        ? 'bg-orange-100 text-orange-700'
                                        : 'hover:bg-gray-100'
                                        }`}
                                >
                                    {dept.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Product Grid */}
                    <div className="flex-1">
                        <ProductGrid
                            title={selectedDepartment === 'all' ? 'BESTSELLERS' : `BESTSELLERS IN ${departments.find(d => d._id === selectedDepartment)?.name.toUpperCase()}`}
                            products={bestsellerProducts}
                            showFilters={true}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BestsellersPage; 