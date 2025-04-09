import React, { useState, useEffect, useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import ProductGrid from '../components/ProductGrid';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';
import TrendingPageHeader from '../components/TrendingPageHeader';

const NewReleasesPage = () => {
    const { backendUrl } = useContext(ShopContext);
    const [newProducts, setNewProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDepartment, setSelectedDepartment] = useState('all');
    const [departments, setDepartments] = useState([]);
    const [timeFilter, setTimeFilter] = useState('last30days'); // 'last30days', 'last90days', 'comingSoon'

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

    // Fetch new releases
    useEffect(() => {
        const fetchNewReleases = async () => {
            try {
                const url = selectedDepartment === 'all'
                    ? `${backendUrl}/api/products/new-releases`
                    : `${backendUrl}/api/products/new-releases/${selectedDepartment}`;

                const response = await axios.get(url, {
                    params: { timeFilter }
                });

                if (response.data.success) {
                    setNewProducts(response.data.products);
                }
            } catch (error) {
                console.error('Error fetching new releases:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchNewReleases();
    }, [backendUrl, selectedDepartment, timeFilter]);

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <TrendingPageHeader activeTab="new-releases" />

            <div className="container mx-auto px-4 py-8">
                {/* Description */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Hot New Releases</h1>
                    <p className="text-gray-600">Our bestselling new and future releases. Updated frequently.</p>
                </div>

                <div className="flex gap-6">
                    {/* Sidebar */}
                    <div className="w-64 flex-shrink-0">
                        {/* Time Filter */}
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold mb-3">Time Period</h2>
                            <div className="space-y-2">
                                <button
                                    onClick={() => setTimeFilter('last30days')}
                                    className={`w-full text-left px-3 py-2 rounded ${timeFilter === 'last30days'
                                        ? 'bg-orange-100 text-orange-700'
                                        : 'hover:bg-gray-100'
                                        }`}
                                >
                                    Last 30 Days
                                </button>
                                <button
                                    onClick={() => setTimeFilter('last90days')}
                                    className={`w-full text-left px-3 py-2 rounded ${timeFilter === 'last90days'
                                        ? 'bg-orange-100 text-orange-700'
                                        : 'hover:bg-gray-100'
                                        }`}
                                >
                                    Last 90 Days
                                </button>
                                <button
                                    onClick={() => setTimeFilter('comingSoon')}
                                    className={`w-full text-left px-3 py-2 rounded ${timeFilter === 'comingSoon'
                                        ? 'bg-orange-100 text-orange-700'
                                        : 'hover:bg-gray-100'
                                        }`}
                                >
                                    Coming Soon
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
                            title={selectedDepartment === 'all' ? 'NEW RELEASES' : `NEW RELEASES IN ${departments.find(d => d._id === selectedDepartment)?.name.toUpperCase()}`}
                            products={newProducts}
                            showFilters={true}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewReleasesPage;
