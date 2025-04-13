import axios from 'axios';
import userModel from '../models/userModel.js';
import orderModel from '../models/orderModel.js';
import productModel from '../models/productModel.js';
import cartModel from '../models/cartModel.js';
import { Category, Subcategory } from '../models/categoryModel.js';
import OpenAI from 'openai';
import { asyncHandler } from '../middleware/asyncHandler.js';

// Initialize OpenAI client with NVIDIA API
const openai = new OpenAI({
    apiKey: process.env.NVIDIA_API_KEY,
    baseURL: 'https://integrate.api.nvidia.com/v1',
});

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
                await axios.get('http://localhost:11434/api/tags', { timeout: 2000 });
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
            const ollamaResponse = await axios.post('http://localhost:11434/api/generate', {
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

// Function to get detailed product data
const getProductData = async (productId) => {
    try {
        const product = await productModel.findById(productId)
            .populate('categoryId', 'name slug')
            .populate('subcategoryId', 'name slug')
            .lean();

        if (!product) return null;

        return {
            name: product.name,
            description: product.description,
            price: product.price,
            category: product.categoryId?.name || 'Unknown Category',
            subcategory: product.subcategoryId?.name || 'Unknown Subcategory',
            features: product.features || [],
            tags: product.tags || [],
            rating: product.rating || 0,
            reviews: product.reviews || [],
            inStock: product.stock > 0,
            discount: product.discount || 0,
            bestseller: product.bestseller || false,
            stock: product.stock || 0
        };
    } catch (error) {
        console.error('Error fetching product data:', error);
        return null;
    }
};

// Function to get all products for analysis
const getAllProducts = async () => {
    try {
        const products = await productModel.find({})
            .populate('categoryId', 'name slug')
            .populate('subcategoryId', 'name slug')
            .select('name description price image categoryId subcategoryId bestseller stock sales isActive')
            .lean();

        return products.map(product => ({
            _id: product._id,
            name: product.name,
            description: product.description,
            price: product.price,
            image: product.image,
            category: product.categoryId?.name || 'Unknown Category',
            subcategory: product.subcategoryId?.name || 'Unknown Subcategory',
            bestseller: product.bestseller || false,
            stock: product.stock || 0,
            sales: product.sales || 0,
            isActive: product.isActive !== false
        }));
    } catch (error) {
        console.error('Error fetching all products:', error);
        return [];
    }
};

// Function to analyze products and find related items
const analyzeRelatedProducts = async (currentProduct, allProducts) => {
    try {
        // Prepare product data for AI analysis
        const productData = {
            currentProduct,
            allProducts: allProducts.filter(p => p._id.toString() !== currentProduct._id.toString())
        };

        // Create prompt for AI analysis
        const prompt = `Analyze the following product data and find the most related products based on:
1. Similar category and subcategory
2. Similar features and tags
3. Similar price range
4. Complementary products
5. Popular combinations
6. Customer preferences from reviews

Current Product:
${JSON.stringify(currentProduct, null, 2)}

Available Products:
${JSON.stringify(productData.allProducts, null, 2)}

Return a list of 6 most related product IDs in order of relevance. Format the response as a JSON array of product IDs only.`;

        // Get AI analysis
        const completion = await openai.chat.completions.create({
            model: "nvidia/llama-3.1-nemotron-70b-instruct",
            messages: [
                {
                    role: "system",
                    content: "You are a product recommendation system. Analyze product data and return related product IDs in JSON format."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 500,
            response_format: { type: "json_object" }
        });

        // Parse the response
        const response = JSON.parse(completion.choices[0].message.content);
        return response.relatedProducts || [];
    } catch (error) {
        console.error('Error analyzing related products:', error);
        return [];
    }
};

// Get related products endpoint
export const getRelatedProducts = asyncHandler(async (req, res) => {
    try {
        const { productId } = req.params;

        // Get current product data
        const currentProduct = await productModel.findById(productId)
            .populate('categoryId', 'name slug')
            .populate('subcategoryId', 'name slug')
            .select('name description price image categoryId subcategoryId bestseller stock sales isActive')
            .lean();

        if (!currentProduct) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Get related products based on category and subcategory
        const relatedProducts = await productModel.find({
            _id: { $ne: productId },
            categoryId: currentProduct.categoryId._id,
            isActive: true
        })
            .populate('categoryId', 'name slug')
            .populate('subcategoryId', 'name slug')
            .select('name description price image categoryId subcategoryId bestseller stock sales isActive')
            .limit(8)
            .lean();

        // If not enough related products, get more from the same subcategory
        if (relatedProducts.length < 4) {
            const additionalProducts = await productModel.find({
                _id: { $nin: [...relatedProducts.map(p => p._id), productId] },
                subcategoryId: currentProduct.subcategoryId._id,
                isActive: true
            })
                .populate('categoryId', 'name slug')
                .populate('subcategoryId', 'name slug')
                .select('name description price image categoryId subcategoryId bestseller stock sales isActive')
                .limit(8 - relatedProducts.length)
                .lean();

            relatedProducts.push(...additionalProducts);
        }

        // Format the image URLs
        const formattedProducts = relatedProducts.map(product => ({
            ...product,
            image: Array.isArray(product.image) && product.image.length > 0
                ? product.image[0]
                : 'https://res.cloudinary.com/dn2rlrfwt/image/upload/v1712400000/default-product-image.jpg'
        }));

        res.json({
            success: true,
            relatedProducts: formattedProducts
        });
    } catch (error) {
        console.error('Error getting related products:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting related products',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}); 