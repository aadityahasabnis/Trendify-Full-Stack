import { logInventoryChange } from '../controllers/inventoryController.js';

/**
 * Middleware to add the logInventoryChange function to the request object
 * This allows controllers to log inventory changes without directly importing
 * the function in each controller
 */
export const logInventoryChangeMiddleware = (req, res, next) => {
    // Add the logInventoryChange function to the request object
    req.logInventoryChange = logInventoryChange;
    next();
}; 