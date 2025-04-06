import orderModel from '../models/orderModel.js';
import productModel from '../models/productModel.js';
import reviewModel from '../models/reviewModel.js';

// Function to get total sales
const getTotalSales = async (req, res) => {
    try {
        const totalSales = await orderModel.aggregate([
            { $match: { status: "Delivered" } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        res.json({ success: true, totalSales: totalSales[0]?.total || 0 });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Function to get pending orders
const getPendingOrders = async (req, res) => {
    try {
        const pendingOrders = await orderModel.find({ status: "Pending" });
        res.json({ success: true, pendingOrders });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Function to get low stock alerts
const getLowStockAlerts = async (req, res) => {
    try {
        const lowStockProducts = await productModel.find({ stock: { $lt: 10 } });
        res.json({ success: true, lowStockProducts });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Function to get top products
const getTopProducts = async (req, res) => {
    try {
        const topProducts = await productModel.find().sort({ sales: -1 }).limit(5);
        res.json({ success: true, topProducts });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Function to get reviews
const getReviews = async (req, res) => {
    try {
        const reviews = await reviewModel.find().populate('productId', 'name');
        res.json({ success: true, reviews });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export { getTotalSales, getPendingOrders, getLowStockAlerts, getTopProducts, getReviews };