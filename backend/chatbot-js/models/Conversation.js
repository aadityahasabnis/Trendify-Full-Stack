import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    messages: [{
        role: {
            type: String,
            enum: ['user', 'assistant'],
            required: true
        },
        content: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
conversationSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

// Add index for faster queries
conversationSchema.index({ userId: 1, 'messages.timestamp': -1 });

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation; 