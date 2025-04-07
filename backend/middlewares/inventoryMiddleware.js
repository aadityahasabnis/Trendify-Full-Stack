import { logInventoryChange } from '../controllers/inventoryController.js';

// Middleware to add the logInventoryChange function to the request object
export const logInventoryChangeMiddleware = (req, res, next) => {
    // Add the logInventoryChange function to the request object
    req.logInventoryChange = logInventoryChange;
    next();
}; 