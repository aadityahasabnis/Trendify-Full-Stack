import axios from 'axios';
import userModel from '../models/userModel.js';
import orderModel from '../models/orderModel.js';
import productModel from '../models/productModel.js';
import cartModel from '../models/cartModel.js';
import { Category, Subcategory } from '../models/categoryModel.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

// Initialize NVIDIA AI client
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1';

// Helper function to get recommendations from NVIDIA AI
const getNvidiaRecommendations = async (userData) => {
    if (!NVIDIA_API_KEY) {
        console.log('NVIDIA API key not found, skipping NVIDIA recommendations');
        throw new Error('NVIDIA API key not configured');
    }

    try {
        console.log('Attempting NVIDIA AI recommendations...');
        const response = await axios.post(`${NVIDIA_API_URL}/chat/completions`, {
            model: "mixtral-8x7b-instruct-v0.1",
            messages: [
                {
                    role: "system",
                    content: "You are an expert e-commerce recommendation system. Analyze the user data and recommend products they would like."
                },
                {
                    role: "user",
                    content: `Recommend 5 products for user ${userData.name} based on:
- Categories: ${userData.preferences.categories.join(', ')}
- Price range: $${userData.preferences.priceRange.min}-$${userData.preferences.priceRange.max}
- Cart items: ${userData.currentCart.length} items
- Previous orders: ${userData.previousOrders.length} orders

Return ONLY a JSON array of 5 product IDs in this format:
{"recommendedProductIds": ["id1", "id2", "id3", "id4", "id5"]}`
                }
            ],
            temperature: 0.5,
            max_tokens: 150
        }, {
            headers: {
                'Authorization': `Bearer ${NVIDIA_API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });

        console.log('NVIDIA AI response received');
        const content = response.data.choices[0].message.content;

        try {
            const recommendations = JSON.parse(content);
            if (!recommendations.recommendedProductIds || !Array.isArray(recommendations.recommendedProductIds)) {
                throw new Error('Invalid response format from NVIDIA AI');
            }
            console.log('NVIDIA AI recommendations parsed successfully');
            return recommendations;
        } catch (parseError) {
            console.error('Error parsing NVIDIA AI response:', parseError);
            console.error('Raw response:', content);
            throw new Error('Failed to parse NVIDIA AI response');
        }
    } catch (error) {
        console.error('NVIDIA AI recommendation failed:', error.message);
        throw error;
    }
};

export const getPersonalizedRecommendations = async (req, res) => {
    console.log('=== Starting recommendation process ===');
    try {
        const userId = req.user.id;
        console.log('Step 1: User ID:', userId);

        // Get user data
        console.log('Step 2: Fetching user data...');
        const user = await userModel.findById(userId);
        if (!user) {
            console.log('User not found:', userId);
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        console.log('Step 2: User found:', user.email);

        // Get user's previous orders
        console.log('Step 3: Fetching user orders...');
        const orders = await orderModel.find({ userId })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('items.productId', 'name description categoryId subcategoryId');
        console.log('Step 3: Found orders:', orders.length);

        // Get user's current cart
        console.log('Step 4: Fetching user cart...');
        const cart = await cartModel.findOne({ userId })
            .populate('items.productId', 'name description categoryId subcategoryId');
        const cartItems = cart ? cart.items : {};
        console.log('Step 4: Cart items:', Object.keys(cartItems).length);

        // Get all active products
        console.log('Step 5: Fetching all products...');
        const allProducts = await productModel.find({ isActive: true })
            .select('_id name description price categoryId subcategoryId image stock sales bestseller')
            .populate('categoryId', 'name description')
            .populate('subcategoryId', 'name description');
        console.log('Step 5: Found products:', allProducts.length);

        // If no orders and no cart items, return random products
        if (orders.length === 0 && Object.keys(cartItems).length === 0) {
            console.log('No user history found, returning random products');
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
        console.log('Step 6: Analyzing user preferences...');
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

        // Try to get recommendations from Ollama first
        let recommendedProducts;
        let recommendationSource = 'simple_algorithm';

        try {
            console.log('Checking Ollama server...');
            const ollamaCheck = await axios.get('http://localhost:11434/api/tags', { timeout: 2000 });
            console.log('Ollama server status:', {
                status: ollamaCheck.status,
                models: ollamaCheck.data.models
            });

            const ollamaPrompt = `Recommend 5 products for user ${userData.name} based on:
- Categories: ${userData.preferences.categories.join(', ')}
- Price range: $${userData.preferences.priceRange.min}-$${userData.preferences.priceRange.max}
- Cart items: ${userData.currentCart.length} items
- Previous orders: ${userData.previousOrders.length} orders

Return ONLY: {"recommendedProductIds": ["id1", "id2", "id3", "id4", "id5"]}`;

            const ollamaResponse = await axios.post('http://localhost:11434/api/generate', {
                model: 'llama3',
                prompt: ollamaPrompt,
                stream: false,
                options: {
                    temperature: 0.5,
                    top_p: 0.5,
                    num_predict: 50
                }
            }, {
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const recommendations = JSON.parse(ollamaResponse.data.response);
            if (recommendations.recommendedProductIds && Array.isArray(recommendations.recommendedProductIds)) {
                recommendedProducts = await productModel.find({
                    _id: { $in: recommendations.recommendedProductIds }
                })
                    .populate('categoryId', 'name description')
                    .populate('subcategoryId', 'name description')
                    .map(product => ({
                        ...product.toObject(),
                        stockStatus: getStockStatus(product.stock)
                    }));
                recommendationSource = 'ollama';
                console.log('Ollama recommendations generated successfully');
            }
        } catch (ollamaError) {
            console.log('Ollama recommendation failed, trying NVIDIA AI...');
            try {
                const completion = await axios.post(`${NVIDIA_API_URL}/chat/completions`, {
                    model: "mixtral-8x7b-instruct-v0.1",
                    messages: [
                        {
                            role: "system",
                            content: "You are an expert e-commerce recommendation system. Analyze the user data and recommend products they would like."
                        },
                        {
                            role: "user",
                            content: `Recommend 5 products for user ${userData.name} based on:
- Categories: ${userData.preferences.categories.join(', ')}
- Price range: $${userData.preferences.priceRange.min}-$${userData.preferences.priceRange.max}
- Cart items: ${userData.currentCart.length} items
- Previous orders: ${userData.previousOrders.length} orders

Return ONLY a JSON array of 5 product IDs in this format:
{"recommendedProductIds": ["id1", "id2", "id3", "id4", "id5"]}`
                        }
                    ],
                    temperature: 0.5,
                    max_tokens: 150
                }, {
                    headers: {
                        'Authorization': `Bearer ${NVIDIA_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000
                });

                const recommendations = JSON.parse(completion.data.choices[0].message.content);
                if (recommendations.recommendedProductIds && Array.isArray(recommendations.recommendedProductIds)) {
                    recommendedProducts = await productModel.find({
                        _id: { $in: recommendations.recommendedProductIds }
                    })
                        .populate('categoryId', 'name description')
                        .populate('subcategoryId', 'name description')
                        .map(product => ({
                            ...product.toObject(),
                            stockStatus: getStockStatus(product.stock)
                        }));
                    recommendationSource = 'nvidia';
                    console.log('NVIDIA AI recommendations generated successfully');
                }
            } catch (nvidiaError) {
                console.error('NVIDIA AI recommendation failed:', nvidiaError.message);
                // Don't throw here, let it fall through to the smart algorithm
            }
        }

        // If both AI methods failed, use smart algorithm
        if (!recommendedProducts || recommendedProducts.length === 0) {
            console.log('Using smart recommendation algorithm');

            // Get products from user's favorite categories and subcategories
            const categoryProducts = allProducts.filter(product =>
                userPreferences.categories.has(product.categoryId._id.toString()) ||
                userPreferences.subcategories.has(product.subcategoryId._id.toString())
            );

            // Get products from user's cart
            const cartProductIds = new Set(Object.keys(cartItems));

            // Sort by relevance (cart items, bestseller, sales, stock, price range)
            const sortedProducts = categoryProducts.sort((a, b) => {
                let scoreA = 0;
                let scoreB = 0;

                // Cart items bonus (highest priority)
                if (cartProductIds.has(a._id.toString())) scoreA += 5;
                if (cartProductIds.has(b._id.toString())) scoreB += 5;

                // Same category as cart items
                const cartCategories = new Set(
                    Array.from(cartProductIds)
                        .map(id => allProducts.find(p => p._id.toString() === id)?.categoryId._id.toString())
                        .filter(Boolean)
                );
                if (cartCategories.has(a.categoryId._id.toString())) scoreA += 3;
                if (cartCategories.has(b.categoryId._id.toString())) scoreB += 3;

                // Same subcategory as cart items
                const cartSubcategories = new Set(
                    Array.from(cartProductIds)
                        .map(id => allProducts.find(p => p._id.toString() === id)?.subcategoryId._id.toString())
                        .filter(Boolean)
                );
                if (cartSubcategories.has(a.subcategoryId._id.toString())) scoreA += 2;
                if (cartSubcategories.has(b.subcategoryId._id.toString())) scoreB += 2;

                // Bestseller bonus
                if (a.bestseller) scoreA += 2;
                if (b.bestseller) scoreB += 2;

                // Sales bonus
                scoreA += (a.sales || 0) * 0.1;
                scoreB += (b.sales || 0) * 0.1;

                // Stock bonus
                if (a.stock > 0) scoreA += 1;
                if (b.stock > 0) scoreB += 1;

                // Price range bonus
                const priceRange = userPreferences.priceRange;
                const priceA = a.price;
                const priceB = b.price;

                if (priceA >= priceRange.min && priceA <= priceRange.max) scoreA += 2;
                if (priceB >= priceRange.min && priceB <= priceRange.max) scoreB += 2;

                // Recently viewed bonus
                if (userPreferences.recentlyViewed.has(a._id.toString())) scoreA += 1;
                if (userPreferences.recentlyViewed.has(b._id.toString())) scoreB += 1;

                return scoreB - scoreA;
            });

            // Take top 10 products
            recommendedProducts = sortedProducts.slice(0, 10).map(product => ({
                ...product.toObject(),
                stockStatus: getStockStatus(product.stock)
            }));
            recommendationSource = 'smart_algorithm';
        }

        return res.json({
            success: true,
            recommendations: recommendedProducts,
            message: `Recommendations generated using ${recommendationSource}`,
            source: recommendationSource
        });

    } catch (error) {
        console.error('Recommendation process failed:', {
            error: error.message,
            stack: error.stack
        });
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

        // Get AI analysis from Ollama
        const ollamaResponse = await axios.post('http://localhost:11434/api/generate', {
            model: 'llama3',
            prompt: prompt,
            stream: false
        }, {
            timeout: 10000
        });

        // Parse the response
        const response = JSON.parse(ollamaResponse.data.response);
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

// Test Ollama connection
export const testOllamaConnection = async (req, res) => {
    try {
        console.log('Testing Ollama connection...');

        // Check if Ollama server is running
        const tagsResponse = await axios.get('http://localhost:11434/api/tags', { timeout: 2000 });
        console.log('Ollama tags response:', tagsResponse.data);

        // Test model generation
        const generateResponse = await axios.post('http://localhost:11434/api/generate', {
            model: 'llama3',
            prompt: 'Hello, are you working?',
            stream: false
        }, {
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('Ollama generate response:', generateResponse.data);

        res.json({
            success: true,
            message: 'Ollama connection successful',
            tags: tagsResponse.data,
            generate: generateResponse.data
        });
    } catch (error) {
        console.error('Ollama test failed:', {
            message: error.message,
            code: error.code,
            response: error.response?.data || 'No response data',
            stack: error.stack
        });

        res.status(500).json({
            success: false,
            message: 'Ollama connection failed',
            error: error.message
        });
    }
}; 