import userModel from '../models/userModel.js';
import cartModel from "../models/cartModel.js";
import jwt from 'jsonwebtoken';

// Add to cart
const addToCart = async (req, res) => {
    try {
        const { productId, size, quantity = 1 } = req.body;
        const token = req.headers.token;

        if (!token) {
            return res.status(401).json({ success: false, message: "No token provided" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        let cart = await cartModel.findOne({ userId });
        if (!cart) {
            cart = new cartModel({ userId, items: {} });
            console.log('Created new cart for user:', userId);
        }

        // Initialize product in cart if it doesn't exist
        if (!cart.items[productId]) {
            cart.items[productId] = {};
        }

        // Update quantity for the specific size
        cart.items[productId][size] = (cart.items[productId][size] || 0) + quantity;

        await cart.save();
        console.log('Saved cart data:', cart.items);

        // Also update the user's cartData field
        user.cartData = cart.items;
        await user.save();
        console.log('Updated user.cartData:', user.cartData);

        res.json({ success: true, cartData: cart.items });
    } catch (error) {
        console.error("Add to cart error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get cart items
const getCartItems = async (req, res) => {
    try {
        const token = req.headers.token;
        if (!token) {
            return res.status(401).json({ success: false, message: "No token provided" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        // Get user data
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Get cart data
        let cart = await cartModel.findOne({ userId });

        // If cart doesn't exist but user has cartData, create a new cart
        if (!cart && user.cartData && Object.keys(user.cartData).length > 0) {
            cart = new cartModel({ userId, items: user.cartData });
            await cart.save();
            console.log('Created new cart from user.cartData:', user.cartData);
        }

        // If cart exists but user's cartData is empty, update user's cartData
        if (cart && (!user.cartData || Object.keys(user.cartData).length === 0)) {
            user.cartData = cart.items;
            await user.save();
            console.log('Updated user.cartData from cart:', cart.items);
        }

        // If no cart exists and user has no cartData, return empty cart
        if (!cart) {
            return res.json({ success: true, cartData: {} });
        }

        console.log('Returning cart data:', cart.items);
        res.json({ success: true, cartData: cart.items });
    } catch (error) {
        console.error("Get cart items error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update cart item quantity
const updateCartItem = async (req, res) => {
    try {
        const { productId, size, quantity } = req.body;
        const token = req.headers.token;

        if (!token) {
            return res.status(401).json({ success: false, message: "No token provided" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const cart = await cartModel.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found" });
        }

        // If quantity is 0 or less, remove the item
        if (quantity <= 0) {
            if (cart.items[productId] && cart.items[productId][size]) {
                delete cart.items[productId][size];
                // If no sizes left for this product, remove the product
                if (Object.keys(cart.items[productId]).length === 0) {
                    delete cart.items[productId];
                }
            }
        } else {
            // Update quantity for the specific size
            if (!cart.items[productId]) {
                cart.items[productId] = {};
            }
            cart.items[productId][size] = quantity;
        }

        await cart.save();
        console.log('Updated cart data:', cart.items);

        // Also update the user's cartData field
        const user = await userModel.findById(userId);
        if (user) {
            user.cartData = cart.items;
            await user.save();
            console.log('Updated user.cartData:', user.cartData);
        }

        res.json({ success: true, cartData: cart.items });
    } catch (error) {
        console.error("Update cart item error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Remove from cart
const removeFromCart = async (req, res) => {
    try {
        const { productId, size } = req.body;
        const token = req.headers.token;

        if (!token) {
            return res.status(401).json({ success: false, message: "No token provided" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const cart = await cartModel.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found" });
        }

        // Remove the specific size from the product
        if (cart.items[productId] && cart.items[productId][size]) {
            delete cart.items[productId][size];
            // If no sizes left for this product, remove the product
            if (Object.keys(cart.items[productId]).length === 0) {
                delete cart.items[productId];
            }
        }

        await cart.save();
        console.log('Removed item from cart:', cart.items);

        // Also update the user's cartData field
        const user = await userModel.findById(userId);
        if (user) {
            user.cartData = cart.items;
            await user.save();
            console.log('Updated user.cartData after removal:', user.cartData);
        }

        res.json({ success: true, cartData: cart.items });
    } catch (error) {
        console.error("Remove from cart error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Clear cart
const clearCart = async (req, res) => {
    try {
        const token = req.headers.token;
        if (!token) {
            return res.status(401).json({ success: false, message: "No token provided" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        // Get user data
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Clear user's cartData
        user.cartData = {};
        await user.save();
        console.log('Cleared user.cartData');

        // Find and update cart
        const cart = await cartModel.findOne({ userId });
        if (cart) {
            cart.items = {};
            await cart.save();
            console.log('Cleared cart data');
        }

        res.json({ success: true, cartData: {} });
    } catch (error) {
        console.error("Clear cart error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export { addToCart, getCartItems, updateCartItem, removeFromCart, clearCart };