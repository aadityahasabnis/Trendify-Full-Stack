import React, { useState, useEffect, useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import ProductGrid from '../components/ProductGrid';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';
import TrendingPageHeader from '../components/TrendingPageHeader';

const MoversShakersPage = () => {
    const { backendUrl } = useContext(ShopContext);
    const [trendingProducts, setTrendingProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDepartment, setSelectedDepartment] = useState('all');
    const [departments, setDepartments] = useState([]);
    const [timeRange, setTimeRange] = useState('24hours'); // '24hours', '48hours', '7days'

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

    // Fetch trending products
    useEffect(() => {
        const fetchTrendingProducts = async () => {
            try {
                const url = selectedDepartment === 'all'
                    ? `${backendUrl}/api/products/trending`
                    : `${backendUrl}/api/products/trending/${selectedDepartment}`;

                const response = await axios.get(url, {
                    params: { timeRange }
                });

                if (response.data.success) {
                    setTrendingProducts(response.data.products);
                }
            } catch (error) {
                console.error('Error fetching trending products:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTrendingProducts();
    }, [backendUrl, selectedDepartment, timeRange]);

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <TrendingPageHeader activeTab="movers-shakers" />

            <div className="container mx-auto px-4 py-8">
                {/* Description */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Amazon Movers & Shakers</h1>
                    <p className="text-gray-600">Our biggest gainers in sales rank over the past {timeRange === '24hours' ? '24 hours' : timeRange === '48hours' ? '48 hours' : '7 days'}. Updated frequently.</p>
                </div>

                <div className="flex gap-6">
                    {/* Sidebar */}
                    <div className="w-64 flex-shrink-0">
                        {/* Time Range Filter */}
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold mb-3">Time Range</h2>
                            <div className="space-y-2">
                                <button
                                    onClick={() => setTimeRange('24hours')}
                                    className={`w-full text-left px-3 py-2 rounded ${timeRange === '24hours'
                                        ? 'bg-orange-100 text-orange-700'
                                        : 'hover:bg-gray-100'
                                        }`}
                                >
                                    Last 24 Hours
                                </button>
                                <button
                                    onClick={() => setTimeRange('48hours')}
                                    className={`w-full text-left px-3 py-2 rounded ${timeRange === '48hours'
                                        ? 'bg-orange-100 text-orange-700'
                                        : 'hover:bg-gray-100'
                                        }`}
                                >
                                    Last 48 Hours
                                </button>
                                <button
                                    onClick={() => setTimeRange('7days')}
                                    className={`w-full text-left px-3 py-2 rounded ${timeRange === '7days'
                                        ? 'bg-orange-100 text-orange-700'
                                        : 'hover:bg-gray-100'
                                        }`}
                                >
                                    Last 7 Days
                                </button>
                            </div>
                        </div>

                        {/* Department Filter */}
                        <div>
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
                    </div>

                    {/* Product Grid */}
                    <div className="flex-1">
                        <ProductGrid
                            title={selectedDepartment === 'all' ? 'MOVERS & SHAKERS' : `MOVERS & SHAKERS IN ${departments.find(d => d._id === selectedDepartment)?.name.toUpperCase()}`}
                            products={trendingProducts}
                            showFilters={true}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MoversShakersPage; 