import axios from 'axios';
import userModel from '../models/userModel.js';
import orderModel from '../models/orderModel.js';
import productModel from '../models/productModel.js';
import cartModel from '../models/cartModel.js';
import { Category, Subcategory } from '../models/categoryModel.js';

export const getPersonalizedRecommendations = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get user data
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Get user's previous orders
        const orders = await orderModel.find({ userId })
            .sort({ createdAt: -1 })
            .limit(10);

        // Get user's current cart
        const cart = await cartModel.findOne({ userId });
        const cartItems = cart ? cart.items : {};

        // Get all active products with detailed information
        const allProducts = await productModel.find({ isActive: true })
            .select('_id name description price categoryId subcategoryId image stock sales bestseller')
            .populate('categoryId', 'name description')
            .populate('subcategoryId', 'name description');

        // If no orders and no cart items, return random products
        if (orders.length === 0 && Object.keys(cartItems).length === 0) {
            // Shuffle array and get first 10 products
            const shuffled = [...allProducts].sort(() => 0.5 - Math.random());
            const randomProducts = shuffled.slice(0, 10).map(product => ({
                ...product.toObject(),
                stockStatus: getStockStatus(product.stock)
            }));

            return res.json({
                success: true,
                recommendations: randomProducts,
                message: 'No user history found, showing random products'
            });
        }

        // Prepare data for recommendation engine
        const userData = {
            name: user.name,
            email: user.email,
            previousOrders: orders.map(order => ({
                items: order.items.map(item => ({
                    productId: item.productId,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    size: item.size
                })),
                date: order.createdAt
            })),
            currentCart: Object.entries(cartItems).map(([productId, sizes]) => ({
                productId,
                sizes: Object.entries(sizes).map(([size, quantity]) => ({
                    size,
                    quantity
                }))
            })),
            allProducts: allProducts.map(product => ({
                id: product._id.toString(),
                name: product.name,
                description: product.description,
                price: product.price,
                category: {
                    id: product.categoryId._id.toString(),
                    name: product.categoryId.name,
                    description: product.categoryId.description
                },
                subcategory: {
                    id: product.subcategoryId._id.toString(),
                    name: product.subcategoryId.name,
                    description: product.subcategoryId.description
                },
                image: product.image[0],
                stock: product.stock,
                sales: product.sales,
                bestseller: product.bestseller
            }))
        };

        try {
            // Check if Ollama server is running
            try {
                await axios.get('http://localhost:11434/api/tags', { timeout: 2000 });
            } catch (error) {
                console.error('Ollama server not available:', error.message);
                throw new Error('Ollama server is not running or not accessible');
            }

            // Call Ollama API with enhanced prompt and longer timeout
            const ollamaResponse = await axios.post('http://localhost:11434/api/generate', {
                model: 'llama3',
                prompt: `Based on the following user data, recommend 10 products that the user might be interested in. 
                Consider their previous orders, current cart items, and product categories/subcategories.
                Return only the product IDs in a JSON array.
                
                User Data: ${JSON.stringify(userData)}
                
                Return format: {"recommendedProductIds": ["id1", "id2", ...]}`,
                stream: false
            }, {
                timeout: 10000 // Increased timeout to 10 seconds
            });

            // Parse the response
            const recommendations = JSON.parse(ollamaResponse.data.response);

            // Get recommended products with stock status
            const recommendedProducts = await productModel.find({
                _id: { $in: recommendations.recommendedProductIds }
            })
                .populate('categoryId', 'name description')
                .populate('subcategoryId', 'name description')
                .map(product => ({
                    ...product.toObject(),
                    stockStatus: getStockStatus(product.stock)
                }));

            res.json({
                success: true,
                recommendations: recommendedProducts,
                message: 'Personalized recommendations generated successfully'
            });
        } catch (ollamaError) {
            console.error('Ollama API error:', ollamaError.message);

            // Return random products with appropriate message
            const shuffled = [...allProducts].sort(() => 0.5 - Math.random());
            const randomProducts = shuffled.slice(0, 10).map(product => ({
                ...product.toObject(),
                stockStatus: getStockStatus(product.stock)
            }));

            res.json({
                success: true,
                recommendations: randomProducts,
                message: ollamaError.message === 'Ollama server is not running or not accessible'
                    ? 'Ollama server is not available, showing random products'
                    : 'Failed to generate personalized recommendations, showing random products'
            });
        }

    } catch (error) {
        console.error('Error getting recommendations:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting recommendations',
            error: error.message
        });
    }
};

// Helper function to determine stock status
const getStockStatus = (stock) => {
    if (stock <= 0) {
        return 'Out of stock';
    } else if (stock <= 5) {
        return `Only ${stock} left in stock!`;
    } else {
        return 'In stock';
    }
}; 