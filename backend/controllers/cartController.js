
import userModel from '../models/userModel.js';
// Add product to cart
const addToCart = async (req, res) => {
    try {
        const { userId, itemId, size } = req.body;

        const userData = await userModel.findById(userId);
        if (!userData) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        let cartData = userData.cartData;
        if (cartData[itemId]) {
            if (cartData[itemId][size]) {
                cartData[itemId][size] += 1;
            } else {
                cartData[itemId][size] = 1;
            }
        } else {
            cartData[itemId] = {};
            cartData[itemId][size] = 1;
        }

        await userModel.findByIdAndUpdate(userId, { cartData }, { new: true });
        res.status(200).json({ success: true, message: "Product added to cart successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
}

// Update user cart
const updateCart = async (req, res) => {


    try {
        const { userId, itemId, size, quantity } = req.body;

        const userData = await userModel.findById(userId);
        if (!userData) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        let cartData = userData.cartData;
        cartData[itemId][size] = quantity;
        await userModel.findByIdAndUpdate(userId, { cartData }, { new: true });
        res.status(200).json({ success: true, message: "Cart updated successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });

    }
}

// Get User cart data
const getUserCart = async (req, res) => {
    try {
        const { userId } = req.body;
        const userData = await userModel.findById(userId);
        if (!userData) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        const cartData = userData.cartData;
        res.status(200).json({ success: true, cartData });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
}

export { addToCart, updateCart, getUserCart };