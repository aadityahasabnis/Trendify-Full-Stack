import orderModel from '../models/orderModel.js';
import productModel from '../models/productModel.js';
import reviewModel from '../models/reviewModel.js';
import userModel from '../models/userModel.js';
import { Category } from '../models/categoryModel.js';

export const getDashboardStats = async (req, res) => {
    try {
        // Get total sales
        const totalSales = await orderModel.aggregate([
            { $match: { payment: true } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        // Get pending orders count
        const pendingOrders = await orderModel.countDocuments({
            status: { $in: ["Order Placed", "Packing", "Shipped", "Out for delivery"] }
        });

        // Get low stock products count
        const lowStockProducts = await productModel.countDocuments({
            stock: { $lt: 10 }
        });

        // Get total reviews count
        const totalReviews = await reviewModel.countDocuments();

        // Get daily sales for last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const dailySales = await orderModel.aggregate([
            {
                $match: {
                    payment: true,
                    date: { $gte: sevenDaysAgo.getTime() }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: { $toDate: "$date" } }
                    },
                    total: { $sum: "$amount" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Get category-wise sales
        const categorySales = await orderModel.aggregate([
            { $match: { payment: true } },
            { $unwind: "$items" },
            {
                $lookup: {
                    from: "products",
                    localField: "items.productId",
                    foreignField: "_id",
                    as: "product"
                }
            },
            { $unwind: "$product" },
            {
                $lookup: {
                    from: "categories",
                    localField: "product.categoryId",
                    foreignField: "_id",
                    as: "category"
                }
            },
            { $unwind: "$category" },
            {
                $group: {
                    _id: "$category.name",
                    value: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
                }
            }
        ]);

        // Get user registration trend for last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const userRegistrations = await userModel.aggregate([
            {
                $match: {
                    createdAt: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Get top products by sales
        const topProducts = await orderModel.aggregate([
            { $match: { payment: true } },
            { $unwind: "$items" },
            {
                $lookup: {
                    from: "products",
                    localField: "items.productId",
                    foreignField: "_id",
                    as: "product"
                }
            },
            { $unwind: "$product" },
            {
                $group: {
                    _id: "$product._id",
                    name: { $first: "$product.name" },
                    image: { $first: "$product.image" },
                    category: { $first: "$product.category" },
                    stock: { $first: "$product.stock" },
                    sales: { $sum: "$items.quantity" }
                }
            },
            { $sort: { sales: -1 } },
            { $limit: 5 }
        ]);

        // Get product performance metrics
        const productPerformance = await orderModel.aggregate([
            { $match: { payment: true } },
            { $unwind: "$items" },
            {
                $lookup: {
                    from: "products",
                    localField: "items.productId",
                    foreignField: "_id",
                    as: "product"
                }
            },
            { $unwind: "$product" },
            {
                $group: {
                    _id: "$product._id",
                    name: { $first: "$product.name" },
                    performance: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
                }
            },
            { $sort: { performance: -1 } },
            { $limit: 5 }
        ]);

        // Format the response
        const stats = {
            totalSales: totalSales[0]?.total || 0,
            pendingOrders,
            lowStockProducts,
            totalReviews,
            topProducts: await Promise.all(topProducts.map(async (product) => {
                const category = await Category.findById(product.category);
                return {
                    ...product,
                    category: category?.name || 'Unknown',
                    _id: product._id.toString()
                };
            })),
            analytics: {
                dailySales: dailySales.map(item => ({
                    date: item._id,
                    total: item.total,
                    count: item.count
                })),
                categorySales: categorySales.map(item => ({
                    name: item._id,
                    value: item.value
                })),
                userRegistrations: userRegistrations.map(item => ({
                    date: item._id,
                    count: item.count
                })),
                productPerformance: productPerformance.map(item => ({
                    name: item.name,
                    performance: item.performance
                }))
            }
        };

        res.json({ success: true, stats });
    } catch (error) {
        console.error('Error in getDashboardStats:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getProductAnalytics = async (req, res) => {
    try {
        const { productId } = req.params;
        const product = await productModel.findById(productId)
            .populate('categoryId', 'name')
            .populate('subcategoryId', 'name');

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Get product reviews
        const reviews = await reviewModel.find({ productId })
            .populate('userId', 'name')
            .sort({ date: -1 });

        // Calculate average rating
        const averageRating = reviews.length > 0
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
            : 0;

        // Get sales data
        const orders = await orderModel.find({
            'items.productId': productId,
            payment: true
        });

        const salesData = {
            totalSales: product.sales,
            totalRevenue: product.sales * product.price,
            averageOrderValue: orders.length > 0
                ? orders.reduce((sum, order) => sum + order.amount, 0) / orders.length
                : 0
        };

        res.json({
            success: true,
            analytics: {
                product: {
                    _id: product._id,
                    name: product.name,
                    category: product.categoryId?.name || 'Uncategorized',
                    subcategory: product.subcategoryId?.name || 'Uncategorized',
                    stock: product.stock,
                    price: product.price
                },
                sales: salesData,
                reviews: {
                    total: reviews.length,
                    averageRating,
                    recentReviews: reviews.slice(0, 5).map(review => ({
                        _id: review._id,
                        user: review.userId.name,
                        rating: review.rating,
                        comment: review.comment,
                        date: review.date
                    }))
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getInventoryAlerts = async (req, res) => {
    try {
        // Get low stock products
        const lowStockProducts = await productModel.find({ stock: { $lt: 10 } })
            .select('name image stock categoryId')
            .populate('categoryId', 'name');

        // Get out of stock products
        const outOfStockProducts = await productModel.find({ stock: 0 })
            .select('name image categoryId')
            .populate('categoryId', 'name');

        res.json({
            success: true,
            alerts: {
                lowStock: lowStockProducts.map(product => ({
                    _id: product._id,
                    name: product.name,
                    image: product.image,
                    stock: product.stock,
                    category: product.categoryId?.name || 'Uncategorized'
                })),
                outOfStock: outOfStockProducts.map(product => ({
                    _id: product._id,
                    name: product.name,
                    image: product.image,
                    category: product.categoryId?.name || 'Uncategorized'
                }))
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}; 