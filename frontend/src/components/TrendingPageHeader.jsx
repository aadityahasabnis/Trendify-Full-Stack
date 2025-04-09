import React from 'react';
import { Link } from 'react-router-dom';

const TrendingPageHeader = ({ activeTab }) => {
    return (
        <div className="bg-white">
            <div className="container ">
                {/* Navigation Tabs */}
                <div className="flex border-b">
                    <Link
                        to="/best-sellers"
                        className={`px-6 py-3 text-sm font-medium ${activeTab === 'bestsellers'
                            ? 'text-orange-500 border-b-2 border-orange-500'
                            : 'text-gray-600 hover:text-orange-500'
                            }`}
                    >
                        Bestsellers
                    </Link>
                    <Link
                        to="/new-releases"
                        className={`px-6 py-3 text-sm font-medium ${activeTab === 'new-releases'
                            ? 'text-orange-500 border-b-2 border-orange-500'
                            : 'text-gray-600 hover:text-orange-500'
                            }`}
                    >
                        Hot New Releases
                    </Link>
                    <Link
                        to="/movers-shakers"
                        className={`px-6 py-3 text-sm font-medium ${activeTab === 'movers-shakers'
                            ? 'text-orange-500 border-b-2 border-orange-500'
                            : 'text-gray-600 hover:text-orange-500'
                            }`}
                    >
                        Movers & Shakers
                    </Link>
                    
                </div>
            </div>
        </div>
    );
};

export default TrendingPageHeader; 