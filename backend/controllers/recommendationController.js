import axios from 'axios';
import userModel from '../models/userModel.js';
import orderModel from '../models/orderModel.js';
import productModel from '../models/productModel.js';
import cartModel from '../models/cartModel.js';
import { Category, Subcategory } from '../models/categoryModel.js';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

// Get Ollama API URL from environment variables
const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'http://localhost:11434';

export const getPersonalizedRecommendations = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get user data
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Get user's previous orders with more details
        const orders = await orderModel.find({ userId })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('items.productId', 'name description categoryId subcategoryId');

        // Get user's current cart with product details
        const cart = await cartModel.findOne({ userId })
            .populate('items.productId', 'name description categoryId subcategoryId');
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

        // Analyze user preferences
        const userPreferences = {
            categories: new Set(),
            subcategories: new Set(),
            priceRange: { min: Infinity, max: 0 },
            frequentlyPurchased: new Set(),
            recentlyViewed: new Set()
        };

        // Analyze orders
        orders.forEach(order => {
            order.items.forEach(item => {
                const product = item.productId;
                if (product) {
                    userPreferences.categories.add(product.categoryId._id.toString());
                    userPreferences.subcategories.add(product.subcategoryId._id.toString());
                    userPreferences.frequentlyPurchased.add(product._id.toString());
                    userPreferences.priceRange.min = Math.min(userPreferences.priceRange.min, product.price);
                    userPreferences.priceRange.max = Math.max(userPreferences.priceRange.max, product.price);
                }
            });
        });

        // Analyze cart
        Object.entries(cartItems).forEach(([productId, sizes]) => {
            userPreferences.recentlyViewed.add(productId);
        });

        // Prepare data for recommendation engine
        const userData = {
            name: user.name,
            email: user.email,
            preferences: {
                categories: Array.from(userPreferences.categories),
                subcategories: Array.from(userPreferences.subcategories),
                priceRange: userPreferences.priceRange,
                frequentlyPurchased: Array.from(userPreferences.frequentlyPurchased),
                recentlyViewed: Array.from(userPreferences.recentlyViewed)
            },
            previousOrders: orders.map(order => ({
                items: order.items.map(item => ({
                    productId: item.productId._id.toString(),
                    name: item.productId.name,
                    description: item.productId.description,
                    price: item.price,
                    quantity: item.quantity,
                    size: item.size,
                    category: item.productId.categoryId.name,
                    subcategory: item.productId.subcategoryId.name
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
                await axios.get(`${OLLAMA_API_URL}/api/tags`, { timeout: 2000 });
            } catch (error) {
                console.error('Ollama server not available:', error.message);
                throw new Error('Ollama server is not running or not accessible');
            }

            // Enhanced Ollama prompt
            const ollamaPrompt = `You are an expert e-commerce recommendation system. Analyze the following user data and recommend 10 products that the user would be most interested in.

User Profile:
- Name: ${userData.name}
- Email: ${userData.email}

User Preferences:
- Favorite Categories: ${userData.preferences.categories.join(', ')}
- Favorite Subcategories: ${userData.preferences.subcategories.join(', ')}
- Price Range: $${userData.preferences.priceRange.min} - $${userData.preferences.priceRange.max}
- Frequently Purchased Items: ${userData.preferences.frequentlyPurchased.length} items
- Recently Viewed Items: ${userData.preferences.recentlyViewed.length} items

Order History:
${userData.previousOrders.map(order => `
Order Date: ${new Date(order.date).toLocaleDateString()}
Items: ${order.items.map(item => `${item.name} (${item.quantity}x)`).join(', ')}
`).join('\n')}

Current Cart:
${userData.currentCart.map(item => `Product ID: ${item.productId}`).join('\n')}

Available Products:
${userData.allProducts.length} products in total

Please analyze this data and recommend 10 products that:
1. Match the user's preferred categories and subcategories
2. Fall within their price range
3. Complement their previous purchases
4. Are similar to items in their cart
5. Consider product descriptions and features
6. Include some bestsellers and high-selling items
7. Ensure variety in recommendations
8. Consider stock availability

Return only the product IDs in a JSON array.
Format: {"recommendedProductIds": ["id1", "id2", ...]}`;

            // Call Ollama API with enhanced prompt
            const ollamaResponse = await axios.post(`${OLLAMA_API_URL}/api/generate`, {
                model: 'llama3',
                prompt: ollamaPrompt,
                stream: false
            }, {
                timeout: 10000
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