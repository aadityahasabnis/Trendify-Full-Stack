import express from 'express';
import { subscribe, unsubscribe, sendNewsletter, getAllSubscribers, adminManageSubscription } from '../controllers/newsletterController.js';
import { adminAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/subscribe', subscribe);
router.post('/unsubscribe', unsubscribe);

// Admin only routes
router.post('/send', adminAuth, sendNewsletter);
router.get('/subscribers', adminAuth, getAllSubscribers);
router.post('/admin/manage', adminAuth, adminManageSubscription);

export default router; 