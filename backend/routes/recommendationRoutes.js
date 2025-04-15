import express from 'express';
import { getPersonalizedRecommendations, getRelatedProducts, testOllamaConnection } from '../controllers/recommendationController.js';
import { authUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// Test Ollama connection (no auth required)
router.get('/test-ollama', testOllamaConnection);

// Check if either Ollama or NVIDIA AI is available
router.get('/check-ai', async (req, res) => {
    try {
        // Check Ollama
        const ollamaCheck = await fetch('http://localhost:11434/api/tags', { timeout: 2000 });
        const ollamaAvailable = ollamaCheck.ok;

        // Check NVIDIA
        const nvidiaAvailable = !!process.env.NVIDIA_API_KEY;

        res.json({
            success: true,
            ollamaAvailable,
            nvidiaAvailable,
            message: `AI services status: Ollama ${ollamaAvailable ? 'available' : 'unavailable'}, NVIDIA ${nvidiaAvailable ? 'available' : 'unavailable'}`
        });
    } catch (error) {
        res.json({
            success: false,
            ollamaAvailable: false,
            nvidiaAvailable: !!process.env.NVIDIA_API_KEY,
            message: 'Error checking AI services'
        });
    }
});

// Get personalized recommendations (requires auth)
router.get('/', authUser, getPersonalizedRecommendations);

// Get related products (requires auth)
router.get('/related/:productId', authUser, getRelatedProducts);

export default router; 