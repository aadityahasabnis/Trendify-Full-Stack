import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from 'stripe'
import nodemailer from 'nodemailer'
import jwt from 'jsonwebtoken';
import { decreaseStock } from "./productController.js";
import productModel from "../models/productModel.js";
import mongoose from 'mongoose';


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
            payment: false,
            timeline: [{
                text: 'Order Placed',
                type: 'event',
                timestamp: new Date()
            }]
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

// All orders data for admin panel - Updated with Pagination
const allOrders = async (req, res) => {
    try {
        // console.log("Hit allOrders endpoint"); // Commented out as requested
        // console.log("Request Body:", req.body); // Commented out as requested

        const page = parseInt(req.body.page) || 1;
        const limit = parseInt(req.body.limit) || 10;
        const skip = (page - 1) * limit;
        console.log(`Fetching page: ${page}, limit: ${limit}, skip: ${skip}`); // Keep this one for now

        // Get total count for pagination
        console.log("Counting documents..."); // Keep this one for now
        const totalCount = await orderModel.countDocuments({});
        console.log(`Total documents found: ${totalCount}`); // Keep this one for now

        // Fetch paginated orders
        console.log("Fetching orders with pagination..."); // Keep this one for now
        const orders = await orderModel.find({})
            .populate('userId', 'name email')
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit);
        console.log(`Fetched ${orders.length} orders for this page.`); // Keep this one for now

        console.log("Preparing response..."); // Keep this one for now
        return res.json({
            success: true,
            message: orders.length ? 'Orders retrieved successfully' : 'No orders found for this page',
            orders,
            totalCount,
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit)
        });

    } catch (error) {
        console.error("Error inside allOrders function:", error);
        return res.status(500).json({ success: false, message: 'Server error fetching orders' });
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
        const adminName = "Admin"; // Or req.user.name if available

        if (!orderId || !status) {
            return res.status(400).json({ success: false, message: "Missing orderId or status" });
        }
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ success: false, message: "Invalid Order ID format" });
        }

        // Find the order first to check current status and get user info for email
        const order = await orderModel.findById(orderId).populate('userId', 'name email');
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // Only proceed if status actually changes
        if (order.status === status) {
            return res.json({ success: true, message: "Status is already set.", order });
        }

        const previousStatus = order.status;

        // Create the timeline event for status change
        const statusChangeEvent = {
            type: 'status_change',
            text: `Status changed from ${previousStatus} to ${status}`,
            previousStatus: previousStatus,
            newStatus: status,
            addedBy: adminName,
            timestamp: new Date()
        };

        // Update status and push the event
        const updatedOrder = await orderModel.findByIdAndUpdate(
            orderId,
            {
                $set: { status: status },
                $push: { timeline: statusChangeEvent }
            },
            { new: true }
        ).populate('userId', 'name email');

        if (!updatedOrder) {
            return res.status(500).json({ success: false, message: "Failed to update order" });
        }

        // Send email notification
        if (updatedOrder.userId && updatedOrder.userId.email) {
            await sendStatusUpdateEmail(updatedOrder, updatedOrder.userId.email, updatedOrder.userId.name);
        } else {
            console.warn(`Could not send status update email for order ${orderId} - User data missing.`);
        }

        res.json({ success: true, message: "Status Updated", order: updatedOrder });

    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ success: false, message: error.message || "Server error updating status" });
    }
};

// Bulk update order statuses from admin panel
const bulkUpdateOrderStatus = async (req, res) => {
    try {
        const { orderIds, status } = req.body;
        const adminName = "Admin"; // Or req.user.name

        if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0 || !status) {
            return res.status(400).json({ success: false, message: "Invalid input: orderIds array and status are required" });
        }

        // Find orders to get user details and check if status needs changing
        const ordersToUpdate = await orderModel.find({
            _id: { $in: orderIds },
            status: { $ne: status } // Only fetch orders where status will actually change
        }).populate('userId', 'name email');

        if (ordersToUpdate.length === 0) {
            return res.json({ success: true, message: "No orders required status change.", modifiedCount: 0 });
        }

        const validOrderIdsToUpdate = ordersToUpdate.map(o => o._id);

        // 1. Perform bulk status update
        const updateResult = await orderModel.updateMany(
            { _id: { $in: validOrderIdsToUpdate } },
            { $set: { status: status } }
        );

        // 2. Add timeline events and send emails
        const timelinePromises = [];
        const emailPromises = [];

        for (const order of ordersToUpdate) {
            const statusChangeEvent = {
                type: 'status_change',
                text: `Status changed from ${order.status} to ${status}`, // Use the status fetched *before* updateMany
                previousStatus: order.status,
                newStatus: status,
                addedBy: adminName,
                timestamp: new Date()
            };
            // Add timeline event update to promises
            timelinePromises.push(
                orderModel.findByIdAndUpdate(order._id, { $push: { timeline: statusChangeEvent } })
            );

            // Add email sending to promises
            if (order.userId && order.userId.email) {
                emailPromises.push(sendStatusUpdateEmail({ ...order.toObject(), status: status }, order.userId.email, order.userId.name));
            } else {
                console.warn(`Could not send bulk status update email for order ${order._id} - User data missing.`);
            }
        }

        await Promise.all(timelinePromises);
        await Promise.all(emailPromises);

        res.json({
            success: true,
            message: `Updated ${updateResult.modifiedCount} orders to ${status}`,
            modifiedCount: updateResult.modifiedCount
        });
    } catch (error) {
        console.error("Error in bulk status update:", error);
        res.status(500).json({ success: false, message: error.message || "Server error during bulk update" });
    }
};

// --- Add Order Note ---
const addOrderNote = async (req, res) => {
    try {
        const { orderId, note } = req.body;
        const adminName = "Admin"; // Or get from req.user if you have admin auth setup

        if (!orderId || !note) {
            return res.status(400).json({ success: false, message: "Missing orderId or note text" });
        }
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ success: false, message: "Invalid Order ID format" });
        }

        const order = await orderModel.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // Create the timeline event for the note
        const noteEvent = {
            type: 'note',
            text: note,
            addedBy: adminName,
            timestamp: new Date()
        };

        // Push the note event to the timeline
        const updatedOrder = await orderModel.findByIdAndUpdate(
            orderId,
            { $push: { timeline: noteEvent } },
            { new: true } // Return the updated document
        );

        if (!updatedOrder) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // Return the specific note event that was added
        res.json({ success: true, message: "Note added successfully", note: updatedOrder.timeline[updatedOrder.timeline.length - 1] });

    } catch (error) {
        console.error("Error adding order note:", error);
        res.status(500).json({ success: false, message: error.message || "Server error adding note" });
    }
};

// --- Get Order Timeline/Notes ---
const getOrderTimeline = async (req, res) => {
    try {
        const { orderId } = req.params;

        if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ success: false, message: "Invalid or missing orderId parameter" });
        }

        // Select the 'timeline' field
        const order = await orderModel.findById(orderId).select('timeline'); // Only need the timeline array

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // The timeline array should already be sorted implicitly by push order,
        // but sorting explicitly ensures newest first if needed.
        const sortedTimeline = (order.timeline || []).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        res.json({ success: true, timeline: sortedTimeline });

    } catch (error) {
        console.error("Error fetching order timeline:", error);
        res.status(500).json({ success: false, message: error.message || "Server error fetching timeline" });
    }
};

// --- Mark COD Order as Paid ---
const markCodAsPaid = async (req, res) => {
    try {
        const { orderId } = req.params;
        const adminName = "Admin"; // Or req.user.name if available

        if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ success: false, message: "Invalid or missing orderId parameter" });
        }

        const order = await orderModel.findById(orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // Check if it's a COD order and if it's currently unpaid
        if (order.paymentMethod !== "COD") {
            return res.status(400).json({ success: false, message: "This action is only applicable to COD orders." });
        }
        if (order.payment === true) {
            return res.status(400).json({ success: false, message: "This order is already marked as paid." });
        }

        // Create the timeline event for payment confirmation
        const paymentEvent = {
            type: 'event', // Or 'payment_confirmation' if you prefer more specific types
            text: `COD payment confirmed by ${adminName}`,
            addedBy: adminName,
            timestamp: new Date()
        };

        // Update payment status and push the event
        order.payment = true;
        order.timeline.push(paymentEvent);

        const updatedOrder = await order.save();

        res.json({ success: true, message: "COD order marked as paid successfully", order: updatedOrder });

    } catch (error) {
        console.error("Error marking COD order as paid:", error);
        res.status(500).json({ success: false, message: error.message || "Server error marking COD as paid" });
    }
};

// --- Helper Function to Send Status Update Email ---
const sendStatusUpdateEmail = async (order, userEmail, userName) => {
    // Only proceed if email is provided
    if (!userEmail) {
        console.warn(`Attempted to send status update email for order ${order._id}, but no user email provided.`);
        return; // Exit if no email
    }

    // Configure transporter (using environment variables)
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD,
        },
        tls: {
            rejectUnauthorized: false, // Often needed for local development with Gmail
        },
        secure: false,
    });

    // Determine subject and main message based on status
    let subject = `📦 Your Trendify Order Status Updated: ${order.status}`;
    let message = `Hello ${userName || 'Customer'},<br/><br/>The status of your Trendify order #${order._id.toString().slice(-8)} has been updated to: <strong>${order.status}</strong>.`;

    if (order.status === 'Shipped') {
        message += `<br/><br/>Your items are on their way! You can typically expect delivery within 2-3 business days.`;
        subject = `🚚 Your Trendify Order #${order._id.toString().slice(-8)} Has Shipped!`;
    } else if (order.status === 'Out for delivery') {
        message += `<br/><br/>Your order is out for delivery today! 🚀`;
        subject = `✨ Your Trendify Order #${order._id.toString().slice(-8)} is Out For Delivery!`;
    } else if (order.status === 'Delivered') {
        message += `<br/><br/>We hope you enjoy your purchase! 😊`;
        subject = `✅ Your Trendify Order #${order._id.toString().slice(-8)} Has Been Delivered!`;
    } else if (order.status === 'Cancelled') {
        message = `Hello ${userName || 'Customer'},<br/><br/>We're sorry to inform you that your Trendify order #${order._id.toString().slice(-8)} has been cancelled. If you have any questions, please contact support.`;
        subject = `❌ Your Trendify Order #${order._id.toString().slice(-8)} Has Been Cancelled`;
    }

    // Email HTML structure
    const mailOptions = {
        from: `"Trendify Orders" <${process.env.EMAIL_USERNAME}>`, // Nicer sender name
        to: userEmail,
        subject: subject,
        html: `
            <div style="max-width:600px;margin:0 auto;padding:20px;background-color:#f4f4f4;font-family:Arial,sans-serif;">
                <div style="background:#ffffff;padding:30px;border-radius:10px;box-shadow:0 2px 6px rgba(0,0,0,0.05);color:#333;">
                    <h1 style="color:#6c63ff;font-size:24px;text-align:center;">${subject}</h1>
                    <p style="font-size:16px;line-height:1.6;">
                        ${message}
                    </p>
                    <div style="text-align:center;margin:30px 0;">
                        <a href="https://trendify-frontend-vercel.vercel.app/myorders" 
                           style="display:inline-block;padding:12px 24px;background-color:#6c63ff;color:#fff;border-radius:6px;text-decoration:none;font-weight:bold;font-size:16px;">
                            View Order Details
                        </a>
                    </div>
                    <hr style="margin:30px 0;border:none;border-top:1px solid #eee;" />
                    <p style="font-size:13px;color:#999;text-align:center;">
                        Thank you for shopping with Trendify ❤️
                    </p>
                </div>
            </div>
        `,
    };

    // Send the email
    try {
        await transporter.sendMail(mailOptions);
        console.log(`Status update email sent successfully to ${userEmail} for order ${order._id}`);
    } catch (emailError) {
        console.error(`Failed to send status update email for order ${order._id} to ${userEmail}:`, emailError);
        // Decide if you want to throw the error or just log it
        // throw emailError; // Uncomment if you want the main function to know about the email failure
    }
};
// --- End Helper Function ---

// --- Export Functions ---
export {
    verifyStripe,
    placeOrder,
    placeStripe,
    placeRazorpay,
    allOrders,
    userOrders,
    updateOrderStatus,
    bulkUpdateOrderStatus,
    addOrderNote,
    getOrderTimeline,
    markCodAsPaid
};