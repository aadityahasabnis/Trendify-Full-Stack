import React, { useState, useEffect, useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';
import { Link } from 'react-router-dom';

const UserProfile = () => {
    const { backendUrl, token } = useContext(ShopContext);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await axios.get(`${backendUrl}/api/user/profile`, {
                    headers: { token }
                });
                if (response.data.success) {
                    setUserData(response.data.user);
                    console.log("User data:", response.data.user);
                } else {
                    setError(response.data.message);
                }
            } catch (error) {
                console.error("Profile fetch error:", error);
                setError(error.response?.data?.message || 'Error fetching user data');
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchUserData();
        } else {
            setLoading(false);
            setError("Please login to view your profile");
        }
    }, [token, backendUrl]);

    if (loading) return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
    
    if (error) {
        return (
            <div className="flex flex-col justify-center items-center min-h-screen">
                <p className="text-red-500 mb-4">{error}</p>
                {!token && (
                    <Link to="/login" className="bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600">
                        Login
                    </Link>
                )}
            </div>
        );
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'N/A';
        return date.toDateString();
    };

    return (
        <div className="max-w-4xl mx-auto p-6 pt-16">
            <h1 className="text-3xl font-bold mb-8 text-center">My Profile</h1>
            
            {userData && (
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-gray-600 block">Name</label>
                                    <p className="font-medium text-lg">{userData.name}</p>
                                </div>
                                <div>
                                    <label className="text-gray-600 block">Email</label>
                                    <p className="font-medium text-lg">{userData.email}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <h2 className="text-xl font-semibold mb-4">Account Summary</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-gray-600 block">Member Since</label>
                                    <p className="font-medium text-gray-500">
                                        {formatDate(userData.createdAt)}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-gray-600 block">Total Orders</label>
                                    <p className="font-medium text-lg">{userData.orderCount || 0}</p>
                                </div>
                                <div className="mt-6">
                                    <Link 
                                        to="/orders" 
                                        className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
                                    >
                                        View My Orders
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfile;