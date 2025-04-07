import { Category, Subcategory } from '../models/categoryModel.js';
import Product from '../models/productModel.js';
import slugify from 'slugify';
import { v2 as cloudinary } from 'cloudinary';

// Category Controllers
export const createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        const slug = slugify(name, { lower: true });
        let imageUrl = '';

        // Upload image to cloudinary if provided
        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, {
                resource_type: 'image'
            });
            imageUrl = result.secure_url;
        }

        const category = await Category.create({
            name,
            slug,
            description,
            image: imageUrl
        });

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            category
        });
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const updateCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        const updateData = {
            name,
            description
        };

        // Update slug if name is provided
        if (name) {
            updateData.slug = slugify(name, { lower: true });
        }

        // Upload image to cloudinary if provided
        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, {
                resource_type: 'image'
            });
            updateData.image = result.secure_url;
        }

        const category = await Category.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Category updated successfully',
            category
        });
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if category has products
        const products = await Product.find({ categoryId: id });
        if (products.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete category with existing products'
            });
        }

        const category = await Category.findByIdAndDelete(id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        // Delete all subcategories
        await Subcategory.deleteMany({ categoryId: id });

        res.json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getAllCategories = async (req, res) => {
    try {
        // console.log('Fetching all categories...');
        const categories = await Category.find()
            .populate({
                path: 'subcategories',
                select: 'name slug description'
            });

        // console.log('Categories fetched successfully:', categories.length);
        res.json({
            success: true,
            categories
        });
    } catch (error) {
        console.error('Error in getAllCategories:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error while fetching categories'
        });
    }
};

// Subcategory Controllers
export const createSubcategory = async (req, res) => {
    try {
        const { name, description, categoryId } = req.body;
        const slug = slugify(name, { lower: true });
        let imageUrl = '';

        // Upload image to cloudinary if provided
        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, {
                resource_type: 'image'
            });
            imageUrl = result.secure_url;
        }

        const subcategory = await Subcategory.create({
            name,
            slug,
            description,
            categoryId,
            image: imageUrl
        });

        res.status(201).json({
            success: true,
            message: 'Subcategory created successfully',
            subcategory
        });
    } catch (error) {
        console.error('Error creating subcategory:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const updateSubcategory = async (req, res) => {
    try {
        const { name, description, categoryId } = req.body;
        const updateData = {
            name,
            description,
            categoryId
        };

        // Update slug if name is provided
        if (name) {
            updateData.slug = slugify(name, { lower: true });
        }

        // Upload image to cloudinary if provided
        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, {
                resource_type: 'image'
            });
            updateData.image = result.secure_url;
        }

        const subcategory = await Subcategory.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!subcategory) {
            return res.status(404).json({
                success: false,
                message: 'Subcategory not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Subcategory updated successfully',
            subcategory
        });
    } catch (error) {
        console.error('Error updating subcategory:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const deleteSubcategory = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if subcategory has products
        const products = await Product.find({ subcategoryId: id });
        if (products.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete subcategory with existing products'
            });
        }

        const subcategory = await Subcategory.findByIdAndDelete(id);
        if (!subcategory) {
            return res.status(404).json({
                success: false,
                message: 'Subcategory not found'
            });
        }

        res.json({
            success: true,
            message: 'Subcategory deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getSubcategoriesByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const subcategories = await Subcategory.find({ categoryId });

        res.json({
            success: true,
            subcategories
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get products by category or subcategory
export const getProductsByCategory = async (req, res) => {
    try {
        const { categorySlug } = req.params;
        const category = await Category.findOne({ slug: categorySlug });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        const products = await Product.find({ categoryId: category._id })
            .populate('subcategoryId', 'name slug');

        res.json({
            success: true,
            products
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getProductsBySubcategory = async (req, res) => {
    try {
        const { categorySlug, subcategorySlug } = req.params;
        const category = await Category.findOne({ slug: categorySlug });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        const subcategory = await Subcategory.findOne({
            slug: subcategorySlug,
            categoryId: category._id
        });

        if (!subcategory) {
            return res.status(404).json({
                success: false,
                message: 'Subcategory not found'
            });
        }

        const products = await Product.find({ subcategoryId: subcategory._id });

        res.json({
            success: true,
            products
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getAllSubcategories = async (req, res) => {
    try {
        // console.log('Fetching all subcategories...');
        const subcategories = await Subcategory.find()
            .populate('categoryId', 'name slug');

        // console.log('Subcategories fetched successfully:', subcategories.length);
        res.json({
            success: true,
            subcategories
        });
    } catch (error) {
        console.error('Error in getAllSubcategories:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error while fetching subcategories'
        });
    }
}; 