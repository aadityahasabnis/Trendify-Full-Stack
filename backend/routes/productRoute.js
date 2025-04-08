import express from "express";
import {
    addProduct,
    listProduct,
    removeProduct,
    singleProduct,
    updateStock,
    updateProductStatus,
    getProductOrders,
    getProductDetails
} from "../controllers/productController.js";
import upload from "../middleware/multer.js";
import { isAdmin, adminAuth } from "../middleware/authMiddleware.js";
import { logInventoryChangeMiddleware } from "../middleware/inventoryMiddleware.js";

const productRouter = express.Router();

// Public endpoints
productRouter.get('/list', listProduct);
productRouter.post('/single', singleProduct);
productRouter.get('/details/:productId', getProductDetails);

// Admin endpoints
productRouter.post(
    '/add',
    adminAuth,
    upload.fields([{ name: 'image1', maxCount: 1 }, { name: 'image2', maxCount: 1 }, { name: 'image3', maxCount: 1 }, { name: 'image4', maxCount: 1 }]),
    addProduct
);

productRouter.post(
    '/remove',
    adminAuth,
    removeProduct
);

productRouter.post(
    '/update-stock',
    adminAuth,
    logInventoryChangeMiddleware,
    updateStock
);

productRouter.post(
    '/update-status',
    adminAuth,
    logInventoryChangeMiddleware,
    updateProductStatus
);

// Get orders for a specific product (admin only)
productRouter.get(
    '/:productId/orders',
    adminAuth,
    getProductOrders
);

export default productRouter;