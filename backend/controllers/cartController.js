
import userModel from '../models/userModel.js';
import cartModel from "../models/cartModel.js";
import jwt from 'jsonwebtoken';

// Add to cart
const addToCart = async (req, res) => {
    try {
        const { productId, size } = req.body;
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
        }

        // Update cart items
        cart.items[productId] = cart.items[productId] || {};
        cart.items[productId][size] = (cart.items[productId][size] || 0) + 1;

        await cart.save();
        
        res.json({ success: true, cartData: cart.items });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get cart items
const getCart = async (req, res) => {
    try {
        const token = req.headers.token;
        if (!token) {
            return res.status(401).json({ success: false, message: "No token provided" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const cart = await cartModel.findOne({ userId });
        if (!cart) {
            return res.json({ success: true, cartData: {} });
        }
        
        res.json({ success: true, cartData: cart.items });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update cart
const updateCart = async (req, res) => {
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

        if (quantity <= 0) {
            if (cart.items[productId] && cart.items[productId][size]) {
                delete cart.items[productId][size];
                if (Object.keys(cart.items[productId]).length === 0) {
                    delete cart.items[productId];
                }
            }
        } else {
            cart.items[productId] = cart.items[productId] || {};
            cart.items[productId][size] = quantity;
        }

        await cart.save();
        res.json({ success: true, cartData: cart.items });
    } catch (error) {
        console.error(error);
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

        if (cart.items[productId] && cart.items[productId][size]) {
            delete cart.items[productId][size];
            if (Object.keys(cart.items[productId]).length === 0) {
                delete cart.items[productId];
            }
        }

        await cart.save();
        res.json({ success: true, cartData: cart.items });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export { addToCart, getCart, updateCart, removeFromCart };