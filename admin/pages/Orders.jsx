import React, { useEffect, useState } from 'react'
import axios from 'axios';
import { backendUrl, currency } from './../src/App';
import { toast } from 'react-toastify';
import { assets } from '../assets/assets';
const Orders = ({ token }) => {
  const [orders, setOrders] = useState([]);
  const fetchOrders = async () => {
    if (!token) {
      return null
    }
    try {
      // console.log(backendUrl);

      const response = await axios.post(backendUrl + '/api/order/list', {}, { headers: { token } });
      if (response.data.success) {
        setOrders(response.data.orders);
      }
      else {
        toast.error(response.data.message);
      }
      // console.log(response.data);
    } catch (error) {
      // console.error("Error fetching orders:", error);
      toast.error("Error fetching orders:", error.message);
    }
  }

  const statusHandler = async (event, orderId) => {
    try {
      const newStatus = event.target.value;
      // console.log("Updating order:", orderId, "to status:", newStatus);

      const response = await axios.post(
        `${backendUrl}/api/order/status`,
        { orderId, status: newStatus },
        { headers: { token } }
      );

      // console.log("API Response:", response.data);

      if (response.data.success) {
        toast.success("Order status updated successfully");
        await fetchOrders();  // Fetch the updated order list
      } else {
        toast.error("Failed to update order status: " + response.data.message);
      }
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Error updating order: " + error.message);
    }
  };

  useEffect(() => {
    fetchOrders()
  }, [token]);

  return (
    <div>

      <h3>Order page</h3>

      <div>
        {
          orders.map((order, index) => (
            <div key={index} className='grid sm:grid-cols-[0.5fr_2fr_1fr] lg:grid-cols-[0.5fr_2fr_1fr_1fr_1fr] gap-3 items-start border-2 border-gray-200 p-5 md:p-8 my-3 md:py-4 text-xs sm:text-s text-gray-700'>
              <img src={assets.parcel_icon} alt="" className='w-12'/>
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
              <select onChange={(event) => statusHandler(event, order._id)} value={order.status} className='p-2 font-medium' name="" id="">
                <option value="Order Placed">Order Placed</option>
                <option value="Packing">Packing</option>
                <option value="Shipped">Shipped</option>
                <option value="Out for delivery">Out for delivery</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>
          ))
        }
      </div>
    </div>
  )
}

export default Orders