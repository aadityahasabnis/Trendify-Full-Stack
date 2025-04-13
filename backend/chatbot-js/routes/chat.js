import express from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import Conversation from '../models/Conversation.js';

dotenv.config();

const router = express.Router();

// Initialize OpenAI client with NVIDIA API
const openai = new OpenAI({
    apiKey: process.env.NVIDIA_API_KEY,
    baseURL: 'https://integrate.api.nvidia.com/v1',
});

// Project context and data
const TRENDIFY_CONTEXT = `
You are a helpful assistant for Trendify, an e-commerce platform. Your role is to provide brief, accurate, and friendly answers about products and user-facing features. You help customers explore and understand the catalog.

1. Product Information:
- Each product includes a name, description, price, image, stock status, and unique ID
- Products belong to categories and subcategories
- Products can be tagged as bestsellers, trending, featured, or new arrivals
- Products may include variants (e.g., sizes, colors)
- Stock levels indicate availability (In Stock, Low Stock, Out of Stock)
- Some products may be on sale or have discounts

2. Categories and Navigation:
- Products are organized under main categories (e.g., Men, Women, Kids, Accessories)
- Categories have subcategories (e.g., T-Shirts, Dresses, Hoodies, Footwear)
- Users can browse by category, subcategory, or collection (e.g., "Summer Essentials")
- Filter options include price range, size, color, availability, and ratings
- Sorting options include: price (low to high, high to low), newest, popularity

3. User-Focused Features:
- Users can search for products using keywords
- Product pages include detailed descriptions, specifications, and image galleries
- Wishlist and cart features allow users to save or buy later
- Users can read or leave product reviews
- Promotions, coupon codes, and discounts may be available
- Recommendations may appear based on user preferences or history

4. Important Behavior Rules:
- Keep answers short, helpful, and user-friendly
- Never discuss admin features. If asked, respond: "I cannot provide information about admin features."
- Do not mention backend or technical systems
- Always try to assist the user in finding or understanding products
- If a user provides their name, address them by name

5. Common Questions You Can Answer:
- Is this product available?
- What are the price and category of this item?
- Is this a new release or a bestseller?
- What sizes/colors does this product come in?
- Are there any discounts or offers?
- What's in stock for a specific category or subcategory?

Remember:
- Be concise
- Focus on the product and customer experience
- Personalize when possible
- Never mention admin-only or backend functionality
`;

// Function to fetch data from backend APIs
const fetchBackendData = async (endpoint, token = null) => {
    try {
        const baseUrl = process.env.BACKEND_URL.endsWith('/')
            ? process.env.BACKEND_URL.slice(0, -1)
            : process.env.BACKEND_URL;

        const url = `${baseUrl}/api${endpoint}`;
        console.log('Fetching data from:', url);

        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };

        if (token) {
            headers['token'] = token;
        }

        const response = await fetch(url, { headers });

        if (!response.ok) {
            console.error(`API error: ${response.status} ${response.statusText}`);
            return null;
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error fetching data from ${endpoint}:`, error.message);
        return null;
    }
};

// Function to fetch user details
const fetchUserDetails = async (token) => {
    try {
        console.log('Fetching user details with token:', token);
        const userData = await fetchBackendData('/user/profile', token);
        console.log('User data received:', userData);

        if (userData && userData.success && userData.user) {
            return {
                name: userData.user.name,
                email: userData.user.email,
                _id: userData.user._id
            };
        }
        console.log('No user data found or invalid response');
        return null;
    } catch (error) {
        console.error('Error fetching user details:', error);
        return null;
    }
};

// Initial welcome message
const WELCOME_MESSAGE = "Hello! Welcome to Trendify! I'm your shopping assistant. We have the following categories:\n\n1. Men's Clothing\n2. Women's Clothing\n3. Electronics\n4. Home and Kitchen\n5. Sports & Outdoors\n6. Toys & Games\n7. Books & Stationery\n8. Pet Supplies\n9. Baby & Kids\n\nLet me know if you'd like to explore any of these further!";

// Function to get products by category
const getProductsByCategory = async (categorySlug, token) => {
    try {
        // First get the category details
        const categoryResponse = await fetchBackendData(`/categories/${encodeURIComponent(categorySlug)}`, token);
        if (!categoryResponse?.success || !categoryResponse?.category) {
            return { products: [], categoryName: 'Unknown Category', categorySlug };
        }

        // Then get products for this category
        const productsResponse = await fetchBackendData(`/categories/${encodeURIComponent(categorySlug)}/products`, token);
        if (productsResponse?.success && productsResponse?.products) {
            return {
                products: productsResponse.products,
                categoryName: categoryResponse.category.name,
                categorySlug,
                subcategories: categoryResponse.category.subcategories || []
            };
        }
        return { products: [], categoryName: categoryResponse.category.name, categorySlug, subcategories: [] };
    } catch (error) {
        console.error('Error fetching category products:', error);
        return { products: [], categoryName: 'Unknown Category', categorySlug, subcategories: [] };
    }
};

// Function to get product details
const getProductDetails = async (productId, token) => {
    try {
        // Get product details with populated category and subcategory
        const productResponse = await fetchBackendData(`/product/details/${productId}`, token);
        console.log('Product response:', productResponse); // Debug log

        if (!productResponse?.success || !productResponse?.product) {
            console.error('Product not found:', productId);
            return null;
        }

        const product = productResponse.product;

        // Use the categoryName and subcategoryName directly from the product response
        return {
            ...product,
            categoryName: product.categoryName || 'Unknown Category',
            subcategoryName: product.subcategoryName || 'Unknown Subcategory'
        };
    } catch (error) {
        console.error('Error fetching product details:', error);
        return null;
    }
};

// Function to get products by subcategory
const getProductsBySubcategory = async (categorySlug, subcategorySlug, token) => {
    try {
        // First get the subcategory details
        const subcategoryResponse = await fetchBackendData(`/subcategories/${encodeURIComponent(subcategorySlug)}`, token);
        if (!subcategoryResponse?.success || !subcategoryResponse?.subcategory) {
            return { products: [], subcategoryName: 'Unknown Subcategory', subcategorySlug };
        }

        // Then get products for this subcategory
        const productsResponse = await fetchBackendData(`/categories/${encodeURIComponent(categorySlug)}/${encodeURIComponent(subcategorySlug)}/products`, token);
        if (productsResponse?.success && productsResponse?.products) {
            return {
                products: productsResponse.products,
                subcategoryName: subcategoryResponse.subcategory.name,
                subcategorySlug,
                categoryName: subcategoryResponse.subcategory.categoryId?.name || 'Unknown Category'
            };
        }
        return {
            products: [],
            subcategoryName: subcategoryResponse.subcategory.name,
            subcategorySlug,
            categoryName: subcategoryResponse.subcategory.categoryId?.name || 'Unknown Category'
        };
    } catch (error) {
        console.error('Error fetching subcategory products:', error);
        return { products: [], subcategoryName: 'Unknown Subcategory', subcategorySlug, categoryName: 'Unknown Category' };
    }
};

// Function to get conversation history
const getConversationHistory = async (userId) => {
    try {
        const conversation = await Conversation.findOne({ userId })
            .sort({ 'messages.timestamp': -1 })
            .limit(1);

        return conversation?.messages || [];
    } catch (error) {
        console.error('Error fetching conversation history:', error);
        return [];
    }
};

// Function to save conversation
const saveConversation = async (userId, message) => {
    try {
        await Conversation.findOneAndUpdate(
            { userId },
            {
                $push: {
                    messages: {
                        role: message.role,
                        content: message.content,
                        timestamp: message.timestamp
                    }
                }
            },
            { upsert: true, new: true }
        );
    } catch (error) {
        console.error('Error saving conversation:', error);
    }
};

// Build context for the AI
const buildContext = (userContext, conversationHistory, currentPage, currentProductId) => {
    let context = `User: ${userContext.name} (${userContext.email})\n`;
    context += `Current Page: ${currentPage}\n`;

    if (currentPage === 'product' && currentProductId) {
        context += `Current Product: ${currentProductId}\n`;
    }

    if (conversationHistory.length > 0) {
        context += '\nPrevious Conversation:\n';
        conversationHistory.forEach(msg => {
            context += `${msg.role}: ${msg.content}\n`;
        });
    }

    // Add category and subcategory information if available
    if (userContext.category) {
        context += `\nCategory: ${userContext.category.name}\n`;
        if (userContext.category.subcategories?.length > 0) {
            context += 'Available Subcategories:\n';
            userContext.category.subcategories.forEach(sub => {
                context += `- ${sub.name}\n`;
            });
        }
    }

    if (userContext.subcategory) {
        context += `\nSubcategory: ${userContext.subcategory.name}\n`;
        context += `Parent Category: ${userContext.subcategory.categoryName}\n`;
    }

    // Add product information if available
    if (userContext.product) {
        context += `\nCurrent Product:\n`;
        context += `Name: ${userContext.product.name}\n`;
        context += `Price: $${userContext.product.price}\n`;
        context += `Category: ${userContext.product.categoryName}\n`;
        if (userContext.product.subcategoryName) {
            context += `Subcategory: ${userContext.product.subcategoryName}\n`;
        }
    }

    return context;
};

router.post('/', async (req, res) => {
    try {
        const { message, userId, currentPage, currentProductId } = req.body;
        const token = req.headers.token;

        // Get user details if token is provided
        let userDetails = null;
        if (token) {
            try {
                userDetails = await fetchUserDetails(token);
            } catch (error) {
                console.error('Error fetching user details:', error);
            }
        }

        // Get conversation history from database
        const history = await getConversationHistory(userId);

        // Add current message to history
        if (userId) {
            await saveConversation(userId, {
                role: 'user',
                content: message,
                timestamp: new Date().toISOString()
            });
        }

        // Fetch relevant data based on the query and current page
        let dataContext = '';

        // If we're on a product page, fetch and include product details
        if (currentProductId) {
            try {
                const productDetails = await getProductDetails(currentProductId, token);
                if (productDetails) {
                    dataContext += `\nCurrent Product Context:
Product Name: ${productDetails.name}
Price: ₹${productDetails.price}
Description: ${productDetails.description}
Category: ${productDetails.categoryName}
Subcategory: ${productDetails.subcategoryName}
${productDetails.inStock ? 'In Stock' : 'Out of Stock'}
${productDetails.discount > 0 ? `Discount: ${productDetails.discount}% off` : ''}`;
                }
            } catch (error) {
                console.error('Error fetching product details:', error);
            }
        }

        // Check for category query
        const categoryMatch = message.match(/products? in (?:the )?([a-zA-Z\s]+) category/i);
        if (categoryMatch) {
            const categoryName = categoryMatch[1].trim();
            const products = await getProductsByCategory(categoryName, token);
            if (products.products.length > 0) {
                dataContext += `\nProducts in ${products.categoryName} category: ${products.products.length} products available.`;
            }
        }

        // Check for subcategory query
        const subcategoryMatch = message.match(/products? in (?:the )?([a-zA-Z\s]+) subcategory/i);
        if (subcategoryMatch) {
            const subcategoryName = subcategoryMatch[1].trim();
            const products = await getProductsBySubcategory('all', subcategoryName, token);
            if (products.products.length > 0) {
                dataContext += `\nProducts in ${products.subcategoryName} subcategory: ${products.products.length} products available.`;
            }
        }

        // Check for product details query
        const productMatch = message.match(/details? about (?:product )?([a-zA-Z0-9\s]+)/i);
        if (productMatch) {
            const productName = productMatch[1].trim();
            const product = await getProductDetails(productName, token);
            if (product) {
                dataContext += `\nProduct Details: ${product.name} - ${product.description}. Price: ${product.price}.`;
            }
        }

        // Get conversation history for context
        let historyContext = '';
        if (history.length > 0) {
            historyContext = '\nPrevious conversation context:';
            history.slice(-3).forEach(msg => {
                historyContext += `\n${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`;
            });
        }

        // Combine all contexts
        const fullPrompt = `${TRENDIFY_CONTEXT}\n\nCurrent Data:${dataContext}${userDetails ? `\nUser Context: The user's name is ${userDetails.name} and email is ${userDetails.email}.` : ''}${historyContext}\n\nUser Question: ${message}\n\nAssistant:`;

        try {
            const completion = await openai.chat.completions.create({
                model: "nvidia/llama-3.1-nemotron-70b-instruct",
                messages: [
                    {
                        role: "system",
                        content: `You are a helpful assistant for Trendify, an e-commerce platform. Follow these response guidelines:
                        1. Keep responses concise and to the point
                        2. Use simple formatting without asterisks or markdown
                        3. Break down information into short, easy-to-read sentences
                        4. Focus on the most relevant information
                        5. Use bullet points only when listing multiple items
                        6. Keep responses under 3-4 sentences unless specifically asked for more details
                        7. Use friendly, conversational tone
                        8. Never use markdown formatting or special characters
                        9. If user's name is available, address them by name in your response
                        10. If user's name is not available, don't ask for it - just provide the requested information
                        11. When discussing products, include key details like price and availability
                        12. When discussing categories, mention the number of products available
                        13. Use previous conversation context to provide more relevant answers`
                    },
                    {
                        role: "user",
                        content: fullPrompt
                    }
                ],
                temperature: 1,
                top_p: 1,
                max_tokens: 512,
                stream: false
            });

            let response = completion.choices[0].message.content;

            // Format the response for better readability
            response = response
                .replace(/\*/g, '') // Remove existing asterisks
                .replace(/\*\*/g, '') // Remove existing double asterisks
                .replace(/\n\s*\n/g, '\n') // Remove extra newlines
                .replace(/\[.*?\]/g, '') // Remove markdown links
                .replace(/\(.*?\)/g, '') // Remove parentheses
                .trim();

            // Add bold formatting to key points
            response = response
                .split('\n')
                .map(line => {
                    // Add bold to important information
                    if (line.includes('Price:')) return `**${line}**`;
                    if (line.includes('Category:')) return `**${line}**`;
                    if (line.includes('Available:')) return `**${line}**`;
                    if (line.includes('Discount:')) return `**${line}**`;
                    if (line.includes('Stock:')) return `**${line}**`;
                    if (line.includes('Rating:')) return `**${line}**`;
                    if (line.includes('Features:')) return `**${line}**`;
                    return line;
                })
                .join('\n');

            // If response is too long, truncate it
            if (response.length > 300) {
                const sentences = response.split(/[.!?]+/);
                response = sentences.slice(0, 2).join('. ') + '.';
            }

            // Add spacing between sections
            response = response.replace(/\n/g, '\n\n');

            // Add newsletter promotion after every 3rd message
            const messageCount = history.length + 1; // +1 for current message
            if (messageCount % 3 === 0) {
                response += "\n\n**Pro Tip:** Stay updated with our latest products and exclusive offers by subscribing to our newsletter! You'll get early access to sales, new arrivals, and special discounts.";
            }

            // Store assistant's response in database
            if (userId) {
                await saveConversation(userId, {
                    role: 'assistant',
                    content: response,
                    timestamp: new Date().toISOString()
                });
            }

            res.json({
                success: true,
                response: response
            });
        } catch (error) {
            console.error('NVIDIA API error:', error);
            throw new Error('Failed to get response from AI model');
        }
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing chat request',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

export default router;