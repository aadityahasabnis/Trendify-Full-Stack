import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { backendUrl } from '../src/App';

const Dashboard = ({ token }) => {
    const [totalSales, setTotalSales] = useState(0);
    const [pendingOrders, setPendingOrders] = useState([]);
    const [lowStockProducts, setLowStockProducts] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [reviews, setReviews] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const salesResponse = await axios.get(`${backendUrl}/api/analytics/total-sales`, { headers: { token } });
                const ordersResponse = await axios.get(`${backendUrl}/api/analytics/pending-orders`, { headers: { token } });
                const stockResponse = await axios.get(`${backendUrl}/api/analytics/low-stock-alerts`, { headers: { token } });
                const productsResponse = await axios.get(`${backendUrl}/api/analytics/top-products`, { headers: { token } });
                const reviewsResponse = await axios.get(`${backendUrl}/api/analytics/reviews`, { headers: { token } });

                if (salesResponse.data.success) setTotalSales(salesResponse.data.totalSales);
                if (ordersResponse.data.success) setPendingOrders(ordersResponse.data.pendingOrders);
                if (stockResponse.data.success) setLowStockProducts(stockResponse.data.lowStockProducts);
                if (productsResponse.data.success) setTopProducts(productsResponse.data.topProducts);
                if (reviewsResponse.data.success) setReviews(reviewsResponse.data.reviews);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            }
        };

        fetchData();
    }, [token]);

    return (
        <div>
            <h1>Dashboard</h1>
            <p>Total Sales: {totalSales}</p>
            <p>Pending Orders: {pendingOrders.length}</p>
            <p>Low Stock Products: {lowStockProducts.length}</p>
            <p>Top Products: {topProducts.map(product => product.name).join(', ')}</p>
            <p>Reviews: {reviews.length}</p>
            {/* Add more dashboard components here */}
        </div>
    );
};

export default Dashboard;