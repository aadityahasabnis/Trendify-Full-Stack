import React, { useEffect, useState } from 'react'
import axios from 'axios';
import { backendUrl, currency } from './../src/App';
import { toast } from 'react-toastify';
import { assets } from '../assets/assets';

const Orders = ({ token }) => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState(null);

  const fetchOrders = async () => {
    if (!token) {
      return null
    }
    setLoading(true);
    try {
      const response = await axios.post(`${backendUrl}/api/order/list`, {}, { headers: { token } });
      if (response.data.success) {
        setOrders(response.data.orders);
        setFilteredOrders(response.data.orders);
      }
      else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error("Error fetching orders: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  const openStatusConfirmation = (event, orderId) => {
    // Prevent the default action of the select element
    event.preventDefault();
    event.stopPropagation();

    // Find the current order
    const order = orders.find(o => o._id === orderId);
    if (!order) return;

    // Get the selected status
    const newStatus = event.target.value;

    // If it's the same status, do nothing
    if (order.status === newStatus) return;

    // Set pending update and show confirmation
    setPendingUpdate({ orderId, newStatus, currentStatus: order.status });
    setShowConfirm(true);
  };

  const cancelStatusUpdate = () => {
    setShowConfirm(false);
    setPendingUpdate(null);
  };

  const confirmStatusUpdate = async () => {
    if (!pendingUpdate) return;

    setIsUpdating(true);
    try {
      const response = await axios.post(
        `${backendUrl}/api/order/status`,
        { orderId: pendingUpdate.orderId, status: pendingUpdate.newStatus },
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success("Order status updated successfully");
        await fetchOrders();
      } else {
        toast.error("Failed to update order status: " + response.data.message);
      }
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Error updating order: " + error.message);
    } finally {
      setIsUpdating(false);
      setShowConfirm(false);
      setPendingUpdate(null);
    }
  };

  useEffect(() => {
    fetchOrders()
  }, [token]);

  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter(order => order.status === statusFilter));
    }
  }, [statusFilter, orders]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Orders</h2>
        <div className="flex gap-3">
          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
          >
            <i className="material-icons" style={{ fontSize: '18px' }}>refresh</i>
            Refresh
          </button>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 border rounded-md"
          >
            <option value="all">All Orders</option>
            <option value="Order Placed">Order Placed</option>
            <option value="Packing">Packing</option>
            <option value="Shipped">Shipped</option>
            <option value="Out for delivery">Out for delivery</option>
            <option value="Delivered">Delivered</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order, index) => (
            <div key={index} className='grid sm:grid-cols-[0.5fr_2fr_1fr] lg:grid-cols-[0.5fr_2fr_1fr_1fr_1fr] gap-3 items-start border-2 border-gray-200 p-5 md:p-8 my-3 md:py-4 text-xs sm:text-s text-gray-700'>
              <img src={assets.parcel_icon} alt="" className='w-12' />
              <div>
                <div>
                  {order.items.map((item, index) => {
                    if (index === order.items.length - 1) {
                      return <p className='py-0.5' key={index}> {item.name} X {item.quantity} <span> {item.size} </span></p>
                    }
                    else {
                      return <p className='py-0.5' key={index}> {item.name} X {item.quantity} <span> {item.size} </span> , </p>
                    }
                  })}
                </div>
                <p className='mt-3 mb-2 font-medium'>{order.address.firstName + " " + order.address.lastName}</p>
                <div>
                  <p>{order.address.street + ", "}</p>
                  <p>{order.address.city + ", " + order.address.state + ", " + order.address.country + ", " + order.address.zipcode}</p>
                </div>
                <p>{order.address.phone}</p>
              </div>
              <div>
                <p className='text-sm sm:text-[15px]'>Items : {order.items.length}</p>
                <p className='mt-3'>Method : {order.paymentMethod}</p>
                <p>Payment : {order.payment ? "Done" : "Pending"}</p>
                <p>Date: {new Date(order.date).toLocaleDateString()}</p>
              </div>
              <p className='text-sm sm:text-[15px]'>{currency} {order.amount}</p>
              <select
                onChange={(event) => openStatusConfirmation(event, order._id)}
                value={order.status}
                className='p-2 font-medium border rounded-md'
              >
                <option value="Order Placed">Order Placed</option>
                <option value="Packing">Packing</option>
                <option value="Shipped">Shipped</option>
                <option value="Out for delivery">Out for delivery</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <i className="material-icons text-gray-300 text-5xl mb-2">shopping_bag</i>
            <p className="text-xl">No orders found</p>
            {statusFilter !== 'all' && (
              <button
                onClick={() => setStatusFilter('all')}
                className="mt-4 text-blue-500 hover:text-blue-600"
              >
                View all orders
              </button>
            )}
          </div>
        )}
      </div>

      {/* Status Change Confirmation Modal */}
      {showConfirm && pendingUpdate && (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-semibold mb-2">Update Order Status</h2>
            <p className="text-gray-600 mb-4">
              Are you sure you want to change the order status from
              <span className="font-semibold"> {pendingUpdate.currentStatus} </span>
              to
              <span className="font-semibold"> {pendingUpdate.newStatus}</span>?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={cancelStatusUpdate}
                disabled={isUpdating}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusUpdate}
                disabled={isUpdating}
                className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:bg-orange-300"
              >
                {isUpdating ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Updating...
                  </div>
                ) : (
                  'Update Status'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Orders