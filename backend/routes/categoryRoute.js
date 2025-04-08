import express from 'express';
import { adminAuth } from '../middleware/authMiddleware.js';
import upload from '../middleware/multer.js';
import {
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getAllSubcategories,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
    getSubcategoriesByCategory,
    getProductsByCategory,
    getProductsBySubcategory
} from '../controllers/categoryController.js';

const router = express.Router();

// Public routes
router.get('/categories', getAllCategories);
router.get('/categories/:categorySlug/products', getProductsByCategory);
router.get('/categories/:categorySlug/:subcategorySlug/products', getProductsBySubcategory);
router.get('/categories/:categoryId/subcategories', getSubcategoriesByCategory);
router.get('/subcategories', getAllSubcategories);

// Admin routes - protected
router.post('/categories', adminAuth, upload.single('image'), createCategory);
router.put('/categories/:id', adminAuth, upload.single('image'), updateCategory);
router.delete('/categories/:id', adminAuth, deleteCategory);

router.post('/subcategories', adminAuth, upload.single('image'), createSubcategory);
router.put('/subcategories/:id', adminAuth, upload.single('image'), updateSubcategory);
router.delete('/subcategories/:id', adminAuth, deleteSubcategory);

export default router; 