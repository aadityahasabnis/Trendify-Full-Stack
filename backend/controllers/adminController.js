import orderModel from '../models/orderModel.js';
import productModel from '../models/productModel.js';
import reviewModel from '../models/reviewModel.js';

export const getDashboardStats = async (req, res) => {
    try {
        // Get total sales
        const orders = await orderModel.find({ payment: true });
        const totalSales = orders.reduce((sum, order) => sum + order.amount, 0);

        // Get pending orders
        const pendingOrders = await orderModel.countDocuments({
            status: { $in: ['Order Placed', 'Packing', 'Shipped', 'Out for delivery'] }
        });

        // Get low stock products
        const lowStockProducts = await productModel.countDocuments({ stock: { $lt: 10 } });

        // Get top products
        const topProducts = await productModel.find()
            .sort({ sales: -1 })
            .limit(5)
            .select('name image sales stock categoryId')
            .populate('categoryId', 'name');

        // Get total reviews
        const totalReviews = await reviewModel.countDocuments();

        res.json({
            success: true,
            stats: {
                totalSales,
                pendingOrders,
                lowStockProducts,
                topProducts: topProducts.map(product => ({
                    _id: product._id,
                    name: product.name,
                    image: product.image,
                    sales: product.sales,
                    stock: product.stock,
                    category: product.categoryId?.name || 'Uncategorized'
                })),
                totalReviews
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
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