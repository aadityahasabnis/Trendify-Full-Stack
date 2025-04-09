import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { backendUrl } from '../src/App'; // Corrected path, removed unused currency
import { toast } from 'react-toastify';
import UserDetailsModal from '../components/UserDetailsModal'; // Import the modal

const Users = ({ token }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedUserDetails, setSelectedUserDetails] = useState(null); // State for detailed data
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [isFetchingDetails, setIsFetchingDetails] = useState(false); // Loading state for details

    // --- Pagination State ---
    const [currentPage, setCurrentPage] = useState(1);
    const [usersPerPage] = useState(15); // Number of users per page

    // --- Search/Filter State ---
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'blocked'

    // --- Fetch All Users ---
    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${backendUrl}/api/user/list-all`, {
                headers: { token }
            });
            if (response.data.success) {
                setUsers(response.data.users);
            } else {
                throw new Error(response.data.message || 'Failed to fetch users');
            }
        } catch (err) {
            setError(err.message);
            toast.error(`Error fetching users: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchUsers();
        }
    }, [token]);

    // --- View Details ---
    const handleViewDetails = async (userId) => {
        setIsFetchingDetails(true);
        setSelectedUserDetails(null); // Clear previous details
        try {
            const response = await axios.get(`${backendUrl}/api/user/details/${userId}`, {
                headers: { token }
            });
            if (response.data.success) {
                setSelectedUserDetails(response.data.details);
                setShowDetailsModal(true);
            } else {
                toast.error(response.data.message || 'Failed to fetch user details.');
            }
        } catch (err) {
            toast.error(`Error fetching details: ${err.response?.data?.message || err.message}`);
        } finally {
            setIsFetchingDetails(false);
        }
    };

    // --- Block/Unblock ---
    const handleBlockToggle = async (userId, currentStatus) => {
        if (!window.confirm(`Are you sure you want to ${currentStatus ? 'unblock' : 'block'} this user? ${currentStatus ? '' : 'Their reviews will be hidden.'}`)) return;
        try {
            const response = await axios.patch(`${backendUrl}/api/user/toggle-block/${userId}`, {}, { headers: { token } });
            if (response.data.success) {
                toast.success(response.data.message);
                setUsers(prevUsers => prevUsers.map(u => u._id === userId ? { ...u, isBlocked: !currentStatus } : u));
                // If modal is open for this user, update its state too
                if (selectedUserDetails && selectedUserDetails.user._id === userId) {
                    setSelectedUserDetails(prev => ({ ...prev, user: { ...prev.user, isBlocked: !currentStatus } }));
                }
            } else {
                toast.error(response.data.message || 'Failed to update status');
            }
        } catch (err) {
            toast.error(`Error: ${err.response?.data?.message || err.message}`);
        }
    };

    // --- Delete User ---
    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Are you sure you want to permanently delete this user? This action cannot be undone.")) return;
        try {
            const response = await axios.delete(`${backendUrl}/api/user/delete/${userId}`, { headers: { token } });
            if (response.data.success) {
                toast.success(response.data.message);
                setUsers(prevUsers => prevUsers.filter(u => u._id !== userId));
                // Close details modal if it was open for the deleted user
                if (selectedUserDetails && selectedUserDetails.user._id === userId) {
                    setShowDetailsModal(false);
                    setSelectedUserDetails(null);
                }
            } else {
                toast.error(response.data.message || 'Failed to delete user');
            }
        } catch (err) {
            toast.error(`Error: ${err.response?.data?.message || err.message}`);
        }
    };

    // --- Filtering Logic (Frontend-side) ---
    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'active' && !user.isBlocked) ||
            (statusFilter === 'blocked' && user.isBlocked);
        return matchesSearch && matchesStatus;
    });

    // --- Pagination Logic ---
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);


    // --- Render Logic ---
    return (
        <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">User Management</h2>

            {/* Filters and Search */}
            <div className="mb-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col sm:flex-row gap-4 items-center">
                <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-4 py-2 border rounded-md flex-grow w-full sm:w-auto"
                />
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border rounded-md w-full sm:w-auto"
                >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="blocked">Blocked</option>
                </select>
                <button onClick={fetchUsers} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-1" disabled={loading}>
                    <i className="material-icons" style={{ fontSize: '18px' }}>refresh</i>
                    <span>Refresh</span>
                </button>
            </div>

            {/* Loading and Error States */}
            {loading && <p className="text-center py-10">Loading users...</p>}
            {!loading && error && <p className="text-center py-10 text-red-500">Error: {error}</p>}

            {/* User Table */}
            {!loading && !error && (
                <>
                    <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg shadow-sm">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Email</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Joined</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {currentUsers.length > 0 ? currentUsers.map(user => (
                                    <tr key={user._id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{new Date(user.createdAt).toLocaleDateString()}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isBlocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                                {user.isBlocked ? 'Blocked' : 'Active'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium space-x-2">
                                            <button onClick={() => handleViewDetails(user._id)} className="text-indigo-600 hover:text-indigo-900" disabled={isFetchingDetails}>Details</button>
                                            <button onClick={() => handleBlockToggle(user._id, user.isBlocked)} className={user.isBlocked ? "text-green-600 hover:text-green-900" : "text-yellow-600 hover:text-yellow-900"}>
                                                {user.isBlocked ? 'Unblock' : 'Block'}
                                            </button>
                                            <button onClick={() => handleDeleteUser(user._id)} className="text-red-600 hover:text-red-900">Delete</button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="5" className="text-center py-10 text-gray-500">No users found matching your criteria.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="mt-4 flex justify-center items-center space-x-1">
                            <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 border rounded-md hover:bg-gray-100 disabled:opacity-50">Prev</button>
                            {[...Array(totalPages).keys()].map(number => (
                                // Simple pagination - Consider optimizing for many pages
                                <button key={number + 1} onClick={() => paginate(number + 1)} className={`px-3 py-1 border rounded-md ${currentPage === number + 1 ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>
                                    {number + 1}
                                </button>
                            ))}
                            <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 border rounded-md hover:bg-gray-100 disabled:opacity-50">Next</button>
                        </div>
                    )}
                </>
            )}

            {/* User Details Modal */}
            {showDetailsModal && selectedUserDetails && (
                <UserDetailsModal
                    userDetails={selectedUserDetails}
                    onClose={() => setShowDetailsModal(false)}
                    token={token}
                />
            )}
        </div>
    );
};

export default Users;
