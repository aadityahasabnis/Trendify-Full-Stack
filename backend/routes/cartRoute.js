import express from "express";
import { getCartItems, addToCart, updateCartItem, removeFromCart } from "../controllers/cartController.js";
import { authUser } from "../middleware/authMiddleware.js";

const cartRouter = express.Router();

// Apply authentication middleware to all cart routes
cartRouter.use(authUser);

// Route to get cart items for a user
cartRouter.get('/', getCartItems);

// Route to add item to cart
cartRouter.post('/add', addToCart);

// Route to update cart item quantity
cartRouter.put('/update', updateCartItem);

// Route to remove item from cart
cartRouter.delete('/remove', removeFromCart);

export default cartRouter;
