import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from 'stripe'

// Global variables
const currency = 'inr';
const deliveryCharge = 10;
// Gateway initialization
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)


// Placing orders using COD method
const placeOrder = async (req, res) => {
    try {

        const { userId, items, amount, address } = req.body;
        const orderData = {
            userId,
            items,
            amount,
            address,
            date: Date.now(),
            paymentMethod: "COD",
            payment: false
        }
        const newOrder = new orderModel(orderData);
        await newOrder.save();

        await userModel.findByIdAndUpdate(userId, { cartData: {} })

        res.status(200).json({ success: true, message: 'Order placed successfully', orderId: newOrder._id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });

    }
}
// Placing orders using COD method
const placeStripe = async (req, res) => {
    try {
        const { userId, items, amount, address } = req.body;
        const { origin } = req.headers;
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
                currency: currency, // <-- Missing comma added
                product_data: {
                    name: item.name
                },
                unit_amount: item.price * 100
            },
            quantity: item.quantity
        }));

        line_items.push({
            price_data: {
                currency: currency, // <-- Missing comma added
                product_data: {
                    name: "Delivery Charges"
                },
                unit_amount: deliveryCharge * 100
            },
            quantity: 1 // <-- Fixed: `item.quantity` does not apply to delivery charge
        });


        const session = await stripe.checkout.sessions.create({
            success_url: `${origin}/verify?success=true&orderId=${newOrder._id}`,
            cancel_url: `${origin}/verify?success=false&orderId=${newOrder._id}`,
            line_items,
            mode: 'payment'
        })

        res.json({success:true, session_url:session.url})

    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });

    }
}

// Verify Stripe
const verifyStripe = async (req, res)=> {
    const { orderId, success, userId } = req.body;
    try {
        if(success === 'true') {
            await orderModel.findByIdAndUpdate(orderId, {payment:true});
            await userModel.findByIdAndUpdate(userId, {cartData:{}})
            res.json({success:true})
        }
        else {
            await orderModel.findByIdAndDelete(orderId);
            res.json({success:false})
        }
    } catch (error) {
        
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
        const { userId } = req.body;
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