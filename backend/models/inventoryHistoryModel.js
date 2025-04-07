import mongoose from "mongoose";

const inventoryHistorySchema = new mongoose.Schema({
    // Product being modified
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
        index: true
    },
    // Previous stock value
    previousStock: {
        type: Number,
        required: true
    },
    // New stock value
    newStock: {
        type: Number,
        required: true
    },
    // Change amount (can be positive or negative)
    change: {
        type: Number,
        required: true
    },
    // Type of action that caused the change
    action: {
        type: String,
        required: true,
        enum: ["manual_update", "order_placed", "system_update", "status_change"],
        index: true
    },
    // For status changes
    previousStatus: {
        type: Boolean,
        default: null
    },
    newStatus: {
        type: Boolean,
        default: null
    },
    // Who made the change
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    // Related order ID if the change was due to an order
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        default: null
    },
    // Additional note about the change
    note: {
        type: String,
        default: ""
    },
    // Timestamp for when the change occurred
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true
});

// Create compound index for efficient filtering
inventoryHistorySchema.index({ productId: 1, timestamp: -1 });

const InventoryHistory = mongoose.models.InventoryHistory || mongoose.model("InventoryHistory", inventoryHistorySchema);

export default InventoryHistory; 