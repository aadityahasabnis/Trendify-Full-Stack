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
    }
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