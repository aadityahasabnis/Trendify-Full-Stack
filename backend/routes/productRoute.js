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
import Product from '../models/productModel.js';

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

// Add new route for Open Graph meta tags
productRouter.get('/og/:productId', async (req, res) => {
    try {
        const product = await Product.findById(req.params.productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const siteUrl = process.env.FRONTEND_URL || 'https://trendify.com';
        const ogHtml = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta property="og:title" content="${product.name}" />
                <meta property="og:description" content="${product.description.substring(0, 160)}" />
                <meta property="og:image" content="${siteUrl}${product.image[0]}" />
                <meta property="og:url" content="${siteUrl}/product/${product._id}" />
                <meta property="og:type" content="product" />
                <meta property="product:price:amount" content="${product.price}" />
                <meta property="product:price:currency" content="USD" />
                <meta http-equiv="refresh" content="0; URL=${siteUrl}/product/${product._id}" />
            </head>
            <body></body>
            </html>
        `;

        res.send(ogHtml);
    } catch (error) {
        console.error('Error generating OG tags:', error);
        res.status(500).json({ success: false, message: 'Error generating share link' });
    }
});

export default productRouter;