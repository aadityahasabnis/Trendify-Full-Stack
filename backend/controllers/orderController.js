import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from 'stripe'
import nodemailer from 'nodemailer'
import jwt from 'jsonwebtoken';
import { decreaseStock } from "./productController.js";
import productModel from "../models/productModel.js";


// Global variables
const currency = 'inr';
const deliveryCharge = 10;
// Gateway initialization
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)


// Placing orders using COD method
const placeOrder = async (req, res) => {
    try {
        // console.log('Request Body:', req.body); // Debugging log
        const token = req.headers.token;

        if (!token) {
            return res.status(401).json({ success: false, message: "No token provided" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        const { items, amount, address } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }

        // Create the order first to get the orderId
        const orderData = {
            userId,
            items,
            amount,
            address,
            date: Date.now(),
            paymentMethod: "COD",
            payment: false
        };
        const newOrder = new orderModel(orderData);
        await newOrder.save();

        // Decrease product stock after creating the order
        console.log('Decreasing stock for items:', items);
        const stockUpdateResult = await decreaseStock(items, newOrder._id);

        if (!stockUpdateResult.success) {
            // If stock update fails, delete the order and return error
            await orderModel.findByIdAndDelete(newOrder._id);
            return res.status(400).json({
                success: false,
                message: stockUpdateResult.message || 'Failed to update product stock'
            });
        }

        await userModel.findByIdAndUpdate(userId, { cartData: {} });

        // Find user email
        const user = await userModel.findById(userId);
        // Send order confirmation email
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD,
            },
            tls: {
                rejectUnauthorized: false,
            },
            secure: false,
        });

        const mailOptions = {
            from: process.env.EMAIL_USERNAME,
            to: user.email,
            subject: "🧾 Order Confirmation - Trendify",
            html: `
                <div style="max-width:600px;margin:0 auto;padding:20px;background-color:#f4f4f4;font-family:Arial,sans-serif;">
                    <div style="background:#ffffff;padding:30px;border-radius:10px;box-shadow:0 2px 6px rgba(0,0,0,0.05);color:#333;">
                        <h1 style="color:#6c63ff;font-size:24px;text-align:center;">🛍️ Thank you for your order!</h1>
        
                        <p style="font-size:16px;line-height:1.6;text-align:center;">
                            Your order has been placed successfully and will be delivered within <strong>3 days</strong>. 🚚
                        </p>
        
                        <h2 style="font-size:18px;color:#6c63ff;margin-top:30px;">🧾 Order Summary:</h2>
                        <div style="font-size:15px;line-height:1.6;background-color:#f9f9f9;padding:15px;border-radius:6px;">
                            ${items.map(item => `
                                <div style="margin-bottom:10px;">
                                    <strong>${item.name}</strong><br/>
                                    Quantity: ${item.quantity}<br/>
                                    Price: ₹${item.price}
                                </div>
                            `).join('')}
                            <hr style="border: none; border-top: 1px solid #ddd;" />
                            <strong>Total: ₹${amount}</strong>
                        </div>
        
                        <div style="text-align:center;margin:30px 0;">
                            <a href="https://trendify-frontend-vercel.vercel.app/orders" 
                               style="display:inline-block;padding:12px 24px;background-color:#6c63ff;color:#fff;
                                      border-radius:6px;text-decoration:none;font-weight:bold;font-size:16px;">
                                📦 Track Your Order
                            </a>
                        </div>
        
                        <p style="font-size:14px;color:#555;text-align:center;">
                            Got questions? Reach out to us at 
                            <a href="mailto:support@trendify.com" style="color:#6c63ff;">support@trendify.com</a>
                        </p>
        
                        <hr style="margin:30px 0;border:none;border-top:1px solid #eee;" />
        
                        <p style="font-size:13px;color:#999;text-align:center;">
                            Thank you for shopping with Trendify ❤️
                        </p>
                    </div>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);


        res.status(200).json({ success: true, message: 'Order placed successfully', orderId: newOrder._id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


// Placing orders using Stripe method
const placeStripe = async (req, res) => {
    try {
        const { userId, items, amount, address } = req.body;
        const { origin } = req.headers;

        // Check stock availability without reducing it yet
        console.log('Checking stock for Stripe order items:', items);
        const stockCheckResult = await checkStockAvailability(items);

        if (!stockCheckResult.success) {
            return res.status(400).json({
                success: false,
                message: stockCheckResult.message || 'Insufficient stock for some items',
                insufficientItems: stockCheckResult.insufficientItems
            });
        }

        const orderData = {
            userId,
            items,
            amount,
            address,
            date: Date.now(),
            paymentMethod: "Stripe",
            payment: false
        }

        const newOrder = new orderModel(orderData);
        await newOrder.save();

        const line_items = items.map((item) => ({
            price_data: {
                currency: currency,
                product_data: {
                    name: item.name
                },
                unit_amount: item.price * 100
            },
            quantity: item.quantity
        }));

        line_items.push({
            price_data: {
                currency: currency,
                product_data: {
                    name: "Delivery Charges"
                },
                unit_amount: deliveryCharge * 100
            },
            quantity: 1
        });


        const session = await stripe.checkout.sessions.create({
            success_url: `${origin}/verify?success=true&orderId=${newOrder._id}`,
            cancel_url: `${origin}/verify?success=false&orderId=${newOrder._id}`,
            line_items,
            mode: 'payment'
        })

        res.json({ success: true, session_url: session.url })

    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
}

// Function to check stock availability without decreasing it
const checkStockAvailability = async (orderedItems) => {
    try {
        // Track which products don't have enough stock
        let insufficientStockItems = [];

        // Check stock for each item
        for (const item of orderedItems) {
            const product = await productModel.findById(item.productId);
            if (!product) {
                console.error(`Product not found: ${item.productId}`);
                continue;
            }

            // Check if stock is sufficient
            if ((product.stock || 0) < item.quantity) {
                insufficientStockItems.push({
                    productId: item.productId,
                    name: item.name,
                    requestedQty: item.quantity,
                    availableQty: product.stock || 0
                });
            }
        }

        // If any product has insufficient stock, return error
        if (insufficientStockItems.length > 0) {
            console.error('Insufficient stock for items:', insufficientStockItems);
            return {
                success: false,
                message: 'Some products have insufficient stock',
                insufficientItems: insufficientStockItems
            };
        }

        return { success: true };
    } catch (error) {
        console.error("Error checking stock availability:", error);
        return {
            success: false,
            message: error.message || 'Failed to check stock availability'
        };
    }
}

// Verify Stripe
const verifyStripe = async (req, res) => {
    const { orderId, success, userId } = req.body;
    try {
        if (success === 'true') {
            // Get the order details
            const order = await orderModel.findById(orderId);
            if (!order) {
                return res.json({ success: false, message: 'Order not found' });
            }

            // Update order payment status
            order.payment = true;
            await order.save();

            // Now decrease stock since payment was successful
            console.log('Payment successful, decreasing stock for items:', order.items);
            const stockUpdateResult = await decreaseStock(order.items, orderId);

            if (!stockUpdateResult.success) {
                console.error('Failed to update stock after payment:', stockUpdateResult.message);
                // Continue anyway since payment was successful
            }

            // Clear user's cart
            await userModel.findByIdAndUpdate(userId, { cartData: {} });

            res.json({ success: true });
        } else {
            // Payment failed, delete the order
            await orderModel.findByIdAndDelete(orderId);
            res.json({ success: false, message: 'Payment failed or canceled' });
        }
    } catch (error) {
        console.error('Error verifying Stripe payment:', error);
        res.json({ success: false, message: error.message || 'Error processing payment verification' });
    }
}

// Placing orders using COD method
const placeRazorpay = async (req, res) => {

}

// All orders data for admin panel
const allOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({}).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: orders.length ? 'Orders retrieved successfully' : 'No orders found',
            orders
        });

    } catch (error) {
        console.error("Error fetching orders:", error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};


// User orders data
const userOrders = async (req, res) => {
    try {
        // const { userId } = req.body;
        const token = req.headers.token;

        if (!token) {
            return res.status(401).json({ success: false, message: "No token provided" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const orders = await orderModel.find({ userId }).sort({ date: -1 });
        if (orders.length === 0) {
            return res.status(200).json({ success: false, message: 'No orders found' });
        }
        res.status(200).json({ success: true, orders });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });

    }
}

// Update order status from admin panel
const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body;

        console.log("Received orderId:", orderId, "New status:", status);

        // Validate orderId
        if (!orderId) {
            return res.json({ success: false, message: "Missing orderId" });
        }

        // Check if order exists before updating
        const order = await orderModel.findById(orderId);
        if (!order) {
            return res.json({ success: false, message: "Order not found" });
        }

        console.log("Existing Order Status:", order.status);

        // Perform update
        const updatedOrder = await orderModel.findByIdAndUpdate(
            orderId,
            { status },
            { new: true } // Return updated document
        );

        // console.log("Updated Order:", updatedOrder);

        if (!updatedOrder) {
            return res.json({ success: false, message: "Update failed" });
        }

        res.json({ success: true, message: "Status Updated", order: updatedOrder });
    } catch (error) {
        console.error("Error updating order:", error);
        res.json({ success: false, message: error.message });
    }
};


export { verifyStripe, placeOrder, placeStripe, placeRazorpay, allOrders, userOrders, updateOrderStatus };