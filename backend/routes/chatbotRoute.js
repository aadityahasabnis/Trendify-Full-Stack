import express from 'express';
import { chat } from '../controllers/chatbotController.js';
import { isAuth } from '../middleware/authMiddleware.js';
import Conversation from '../models/conversationModel.js';

const router = express.Router();

// Health check endpoint
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Chatbot API is running'
    });
});

// Chat endpoint - protected route
router.post('/chat', isAuth, chat);

// History endpoint - protected route
router.get('/history', isAuth, async (req, res) => {
    try {
        // Get user ID from token
        const userId = req.user.id;

        // Get conversation history from database
        const conversation = await Conversation.findOne({ userId })
            .sort({ 'messages.timestamp': -1 })
            .limit(1);

        res.json({
            success: true,
            messages: conversation?.messages || []
        });
    } catch (error) {
        console.error('Error fetching conversation history:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching conversation history',
            error: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred'
        });
    }
});

// Error handling middleware for this route
router.use((err, req, res, next) => {
    console.error('Chatbot route error:', err);
    res.status(500).json({
        success: false,
        message: 'Error in chatbot route',
        error: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
    });
});

export default router; 