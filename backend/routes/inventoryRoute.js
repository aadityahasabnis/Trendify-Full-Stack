import express from 'express';
import {
    getProductInventoryHistory,
    getAllInventoryHistory,
    exportInventoryHistory,
    getInventoryStats,
    exportInventoryExcel,
    createInventoryHistory
} from '../controllers/inventoryController.js';
import { isAdmin, adminAuth } from '../middleware/authMiddleware.js';
import { logInventoryChangeMiddleware } from '../middleware/inventoryMiddleware.js';

const inventoryRouter = express.Router();

// Apply admin authentication to all routes
inventoryRouter.use(adminAuth);

// Routes for inventory history
inventoryRouter.post('/history', logInventoryChangeMiddleware, createInventoryHistory);
inventoryRouter.get('/history', getAllInventoryHistory);
inventoryRouter.get('/history/:productId', getProductInventoryHistory);

// Export inventory history as CSV - Admin only
inventoryRouter.get('/export/csv', adminAuth, exportInventoryHistory);

// Export inventory as Excel - Admin only
inventoryRouter.get('/export/excel', adminAuth, exportInventoryExcel);

// Get inventory statistics for dashboard - Admin only
inventoryRouter.get('/stats', adminAuth, getInventoryStats);

export default inventoryRouter; 