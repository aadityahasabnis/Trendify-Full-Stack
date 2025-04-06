import express from "express";
import { addToCart, getCart, updateCart, removeFromCart } from "../controllers/cartController.js";
import authUser from "../middleware/auth.js";

const cartRouter = express.Router();

// Add item to cart
cartRouter.post('/add', authUser, addToCart);

// Get cart items
cartRouter.get('/get', authUser, getCart);

// Update cart item
cartRouter.post('/update', authUser, updateCart);

// Remove from cart
cartRouter.delete('/remove', authUser, removeFromCart);

export default cartRouter;
