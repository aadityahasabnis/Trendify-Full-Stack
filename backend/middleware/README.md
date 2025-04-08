# Middleware Directory

This directory contains all middleware functions used in the application. These middleware functions are utilized to perform operations between receiving a request and sending a response in the Express.js routing system.

## Authentication & Authorization

### `authMiddleware.js`

Contains all authentication and authorization middleware functions:

- **isAuth**: Verifies JWT token for regular user authentication
- **authUser**: Legacy version of user authentication for backward compatibility
- **isAdmin**: Enhanced admin authentication that supports different token types
- **adminAuth**: Legacy admin authentication for backward compatibility

## File Upload

### `multer.js`

Handles file upload functionality using the Multer library.

## Inventory Management

### `inventoryMiddleware.js`

Contains the middleware for logging inventory changes:

- **logInventoryChangeMiddleware**: Adds inventory logging function to request objects

## Usage Example

Here's how to use these middleware functions in your routes:

```javascript
import { authUser, isAdmin } from '../middleware/authMiddleware.js';
import { logInventoryChangeMiddleware } from '../middleware/inventoryMiddleware.js';

// User authentication
router.get('/user-profile', authUser, getUserProfile);

// Admin authentication
router.get('/admin-dashboard', isAdmin, getAdminDashboard);

// Logging inventory changes
router.post('/update-stock', isAdmin, logInventoryChangeMiddleware, updateStock);
``` 