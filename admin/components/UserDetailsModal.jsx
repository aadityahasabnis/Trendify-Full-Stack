import React, { useState } from 'react';
import axios from 'axios';
import { backendUrl } from '../src/App'; // Adjust path if necessary, removed unused currency
import { toast } from 'react-toastify';

const UserDetailsModal = ({ userDetails, onClose, token }) => {
    const [isSubscribed, setIsSubscribed] = useState(userDetails?.newsletter?.isSubscribed || false);
    const [isUpdatingSubscription, setIsUpdatingSubscription] = useState(false);

    // Function to handle newsletter toggle
    const handleNewsletterToggle = async () => {
        if (!userDetails?.user?.email) {
            toast.error("User email not found.");
            return;
        }
        setIsUpdatingSubscription(true);
        try {
            const response = await axios.post(`${backendUrl}/api/newsletter/admin/manage`,
                {
                    email: userDetails.user.email,
                    subscribe: !isSubscribed // Send the desired *new* state
                },
                { headers: { token } }
            );
            if (response.data.success) {
                setIsSubscribed(!isSubscribed); // Update local state on success
                toast.success(response.data.message);
            } else {
                toast.error(response.data.message || 'Failed to update subscription.');
            }
        } catch (err) {
            toast.error(`Error: ${err.response?.data?.message || err.message}`);
        } finally {
            setIsUpdatingSubscription(false);
        }
    };

    if (!userDetails) return null; // Don't render if no details

    // Format date helper
    const formatDate = (timestamp) => timestamp ? new Date(timestamp).toLocaleDateString() : 'N/A';
    const formatDateTime = (timestamp) => timestamp ? new Date(timestamp).toLocaleString() : 'N/A';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40 p-4">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-4xl w-full mx-4 border border-gray-200 max-h-[90vh] overflow-y-auto flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center mb-4 pb-3 border-b">
                    <h3 className="text-xl font-semibold text-gray-800">User Details: {userDetails.user?.name}</h3>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700 rounded-md">
                        <i className="material-icons">close</i>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-grow space-y-6">
                    {/* Basic Info & Newsletter */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-medium text-gray-700 mb-3">Profile Information</h4>
                            <p><strong>ID:</strong> {userDetails.user?._id}</p>
                            <p><strong>Email:</strong> {userDetails.user?.email}</p>
                            <p><strong>Joined:</strong> {formatDate(userDetails.user?.createdAt)}</p>
                            <p><strong>Status:</strong> <span className={`font-semibold ${userDetails.user?.isBlocked ? 'text-red-600' : 'text-green-600'}`}>{userDetails.user?.isBlocked ? 'Blocked' : 'Active'}</span></p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg flex flex-col justify-between">
                            <div>
                                <h4 className="font-medium text-gray-700 mb-3">Newsletter Subscription</h4>
                                <p className='mb-2'>Email: {userDetails.newsletter?.email || 'N/A'}</p>
                                <p>Status: <span className={`font-semibold ${isSubscribed ? 'text-green-600' : 'text-gray-500'}`}>{isSubscribed ? 'Subscribed' : 'Not Subscribed'}</span></p>
                            </div>
                            <button
                                onClick={handleNewsletterToggle}
                                disabled={isUpdatingSubscription}
                                className={`mt-4 px-4 py-2 rounded-md text-sm text-white ${isSubscribed ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} disabled:opacity-50 w-full`}
                            >
                                {isUpdatingSubscription ? 'Updating...' : (isSubscribed ? 'Unsubscribe User' : 'Subscribe User')}
                            </button>
                        </div>
                    </div>

                    {/* Orders */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-700 mb-3">Orders ({userDetails.orders?.length || 0})</h4>
                        {userDetails.orders?.length > 0 ? (
                            <div className='max-h-60 overflow-y-auto'>
                                <table className="min-w-full text-sm">
                                    <thead className='bg-gray-200'><tr><th className='p-1 text-left'>ID</th><th className='p-1 text-left'>Date</th><th className='p-1 text-left'>Status</th><th className='p-1 text-right'>Amount</th><th className='p-1 text-center'>Payment</th></tr></thead>
                                    <tbody>
                                        {userDetails.orders.map(order => (
                                            <tr key={order._id} className='border-b'>
                                                <td className='p-1'>...{order._id.slice(-6)}</td>
                                                <td className='p-1'>{formatDate(order.date)}</td>
                                                <td className='p-1'>{order.status}</td>
                                                {/* Using $ as placeholder since currency import was removed */}
                                                <td className='p-1 text-right'>${order.amount}</td>
                                                <td className={`p-1 text-center ${order.payment ? 'text-green-600' : 'text-yellow-600'}`}>{order.payment ? 'Paid' : 'Pending'} ({order.paymentMethod})</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : <p className='text-gray-500 text-sm'>No orders found for this user.</p>}
                    </div>

                    {/* Reviews */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-700 mb-3">Reviews ({userDetails.reviews?.length || 0})</h4>
                        {userDetails.reviews?.length > 0 ? (
                            <ul className='space-y-2 max-h-40 overflow-y-auto'>
                                {userDetails.reviews.map(review => (
                                    <li key={review._id} className='text-sm border-b pb-1'>
                                        <p><strong>Product:</strong> {review.productId?.name || 'N/A'} ({'⭐'.repeat(review.rating)})</p>
                                        <p className='text-xs text-gray-500'>[{formatDateTime(review.date)}]</p>
                                        <p className='italic text-gray-700 mt-1'>"{review.comment}"</p>
                                    </li>
                                ))}
                            </ul>
                        ) : <p className='text-gray-500 text-sm'>No reviews found for this user.</p>}
                    </div>

                    {/* Cart - Display items */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-700 mb-3">Cart Items</h4>
                        {userDetails.cart && Object.keys(userDetails.cart).length > 0 ? (
                            <div className='text-xs bg-white p-3 rounded max-h-40 overflow-y-auto space-y-2'>
                                {Object.entries(userDetails.cart).map(([productId, sizes]) => (
                                    <div key={productId} className="border-b pb-1.5 mb-1.5 last:border-b-0 last:mb-0">
                                        <p><strong>Product ID:</strong> <span className="font-mono">{productId}</span></p>
                                        {Object.entries(sizes).map(([size, quantity]) => (
                                            <p key={size} className="pl-4">Size: <span className="font-semibold">{size}</span>, Quantity: <span className="font-semibold">{quantity}</span></p>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        ) : <p className='text-gray-500 text-sm'>User cart is empty.</p>}
                    </div>

                </div> {/* Closing tag for Body */}

                {/* Footer */}
                <div className="pt-4 border-t mt-4 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserDetailsModal;
