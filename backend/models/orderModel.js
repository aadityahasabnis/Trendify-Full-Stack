import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    size: {
        type: String,
        required: true
    },
    image: {
        type: Array
    }
});

// --- Rename to timelineEventSchema and add type ---
const timelineEventSchema = new mongoose.Schema({
    text: { // Can store note text OR status change description
        type: String,
        required: true
    },
    type: { // Differentiate event types
        type: String,
        required: true,
        enum: ['note', 'status_change', 'event'], // Types of timeline entries
        default: 'note'
    },
    // Store previous/new status specifically for status_change events
    previousStatus: {
        type: String,
        default: null
    },
    newStatus: {
        type: String,
        default: null
    },
    addedBy: {
        type: String, // Could be ObjectId ref:'Admin' if you have an Admin model
        default: 'System' // Default to 'System' for automatic events
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { _id: false }); // Don't create separate IDs for timeline events

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    items: [orderItemSchema],
    amount: {
        type: Number,
        required: true,
    },
    address: {
        type: Object,
        required: true,
    },
    status: {
        type: String,
        required: true,
        default: "Order Placed",
        enum: ["Order Placed", "Packing", "Shipped", "Out for delivery", "Delivered", "Cancelled"]
    },
    paymentMethod: {
        type: String,
        required: true,
    },
    payment: {
        type: Boolean,
        default: false,
        required: true,
    },
    date: {
        type: Number,
        required: true
    },
    timeline: [timelineEventSchema] // <-- Rename 'notes' to 'timeline' and use new schema
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Add virtual for user information
orderSchema.virtual('user', {
    ref: 'User',
    localField: 'userId',
    foreignField: '_id',
    justOne: true
});

// Add a method to get product information for the order
orderSchema.methods.getProducts = async function () {
    const productIds = this.items.map(item => item.productId);
    const products = await mongoose.model('Product').find({
        _id: { $in: productIds }
    });

    return products;
};

const orderModel = mongoose.models.Order || mongoose.model("Order", orderSchema);

export default orderModel;