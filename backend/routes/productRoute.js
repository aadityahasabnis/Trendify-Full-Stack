import express from "express";
import {
    addProduct,
    listProduct,
    removeProduct,
    singleProduct,
    updateStock,
    updateProductStatus,
    getProductOrders,
    getProductDetails,
    getBestsellers,
    getNewReleases,
    getTrendingProducts,
    updateProduct
} from "../controllers/productController.js";
import upload from "../middleware/multer.js";
import { isAdmin, adminAuth } from "../middleware/authMiddleware.js";
import { logInventoryChangeMiddleware } from "../middleware/inventoryMiddleware.js";

const productRouter = express.Router();

// Public endpoints
productRouter.get('/list', listProduct);
productRouter.post('/single', singleProduct);
productRouter.get('/details/:productId', getProductDetails);
productRouter.get('/bestsellers', getBestsellers);
productRouter.get('/bestsellers/:departmentId', getBestsellers);
productRouter.get('/new-releases', getNewReleases);
productRouter.get('/new-releases/:departmentId', getNewReleases);
productRouter.get('/trending', getTrendingProducts);
productRouter.get('/trending/:departmentId', getTrendingProducts);

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

productRouter.put(
    '/update/:id',
    adminAuth,
    upload.fields([{ name: 'image1', maxCount: 1 }, { name: 'image2', maxCount: 1 }, { name: 'image3', maxCount: 1 }, { name: 'image4', maxCount: 1 }]),
    updateProduct
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