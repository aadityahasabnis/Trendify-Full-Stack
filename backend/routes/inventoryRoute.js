import express from 'express';
import {
    getProductInventoryHistory,
    getAllInventoryHistory,
    exportInventoryHistory,
    getInventoryStats,
    exportInventoryExcel
} from '../controllers/inventoryController.js';
import { isAdmin } from '../middlewares/authMiddleware.js';

const inventoryRouter = express.Router();

// Get inventory history for a specific product - Admin only
inventoryRouter.get('/history/product/:productId', isAdmin, getProductInventoryHistory);

// Get all inventory history with filtering - Admin only
inventoryRouter.get('/history', isAdmin, getAllInventoryHistory);

// Export inventory history as CSV - Admin only
inventoryRouter.get('/export/csv', isAdmin, exportInventoryHistory);

// Export inventory as Excel - Admin only
inventoryRouter.get('/export/excel', isAdmin, exportInventoryExcel);

// Get inventory statistics for dashboard - Admin only
inventoryRouter.get('/stats', isAdmin, getInventoryStats);

export default inventoryRouter; 