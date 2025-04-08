import mongoose from 'mongoose';
import InventoryHistory from '../models/inventoryHistoryModel.js';
import productModel from '../models/productModel.js';
import { Category, Subcategory } from '../models/categoryModel.js';
import asyncHandler from "express-async-handler";
import Product from "../models/productModel.js";

// Function to log any inventory change
export const logInventoryChange = async (changeData) => {
    try {
        const {
            productId,
            previousStock,
            newStock,
            action,
            userId = null,
            orderId = null,
            note = "",
            previousStatus = null,
            newStatus = null
        } = changeData;

        // Calculate the change in stock
        const change = newStock - previousStock;

        // Create a new inventory history record
        const historyEntry = new InventoryHistory({
            productId,
            previousStock,
            newStock,
            change,
            action,
            userId,
            orderId,
            note,
            previousStatus,
            newStatus,
            timestamp: new Date()
        });

        await historyEntry.save();
        return { success: true, historyEntry };
    } catch (error) {
        console.error('Error logging inventory change:', error);
        return { success: false, message: error.message };
    }
};

// @desc    Create inventory history entry
// @route   POST /api/inventory/history
// @access  Admin
export const createInventoryHistory = asyncHandler(async (req, res) => {
    const {
        productId,
        previousStock,
        newStock,
        change,
        action,
        previousStatus,
        newStatus,
        orderId,
        note
    } = req.body;

    // Validate required fields
    if (!productId || previousStock === undefined || newStock === undefined || !action) {
        res.status(400);
        throw new Error("Required fields missing");
    }

    const product = await Product.findById(productId);

    if (!product) {
        res.status(404);
        throw new Error("Product not found");
    }

    const history = await InventoryHistory.create({
        productId,
        previousStock,
        newStock,
        change: change || (newStock - previousStock),
        action,
        previousStatus,
        newStatus,
        userId: req.user ? req.user._id : null,
        orderId,
        note,
        timestamp: new Date()
    });

    if (history) {
        res.status(201).json(history);
    } else {
        res.status(500);
        throw new Error("Failed to create inventory history");
    }
});

// @desc    Get inventory history for a product
// @route   GET /api/inventory/history/:productId
// @access  Admin
export const getProductInventoryHistory = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    const product = await Product.findById(productId);

    if (!product) {
        res.status(404);
        throw new Error("Product not found");
    }

    const history = await InventoryHistory.find({ productId })
        .sort({ timestamp: -1 })
        .populate('userId', 'name')
        .populate('orderId', 'orderNumber');

    if (history) {
        res.status(200).json(history);
    } else {
        res.status(500);
        throw new Error("Failed to fetch inventory history");
    }
});

// @desc    Get all inventory history with pagination
// @route   GET /api/inventory/history
// @access  Admin
export const getAllInventoryHistory = asyncHandler(async (req, res) => {
    const pageSize = 10;
    const page = Number(req.query.page) || 1;

    const count = await InventoryHistory.countDocuments();

    const history = await InventoryHistory.find({})
        .sort({ timestamp: -1 })
        .limit(pageSize)
        .skip(pageSize * (page - 1))
        .populate('productId', 'name image')
        .populate('userId', 'name')
        .populate('orderId', 'orderNumber');

    res.status(200).json({
        history,
        page,
        pages: Math.ceil(count / pageSize),
        total: count
    });
});

// Get all inventory history with filtering options
export const getAllInventoryHistoryFiltered = async (req, res) => {
    try {
        const {
            productId,
            action,
            startDate,
            endDate,
            page = 1,
            limit = 20
        } = req.query;

        // Build filter object
        const filter = {};

        if (productId && mongoose.Types.ObjectId.isValid(productId)) {
            filter.productId = productId;
        }

        if (action) {
            filter.action = action;
        }

        // Date range filter
        if (startDate || endDate) {
            filter.timestamp = {};
            if (startDate) filter.timestamp.$gte = new Date(startDate);
            if (endDate) filter.timestamp.$lte = new Date(endDate);
        }

        // Count total documents for pagination
        const total = await InventoryHistory.countDocuments(filter);

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Fetch history with pagination
        const history = await InventoryHistory.find(filter)
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('productId', 'name image')
            .populate('userId', 'name email')
            .populate('orderId', 'status payment paymentMethod');

        res.json({
            success: true,
            history,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching inventory history:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Export inventory history as CSV
export const exportInventoryHistory = async (req, res) => {
    try {
        const inventoryHistory = await InventoryHistory.find({})
            .sort({ timestamp: -1 })
            .populate('productId', 'name')
            .populate('userId', 'name email')
            .populate('orderId', 'orderNumber');

        if (!inventoryHistory || inventoryHistory.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No inventory history found'
            });
        }

        // Create CSV header
        const csvHeader = [
            'Date',
            'Product',
            'Action',
            'Previous Stock',
            'New Stock',
            'Change',
            'User',
            'Order ID',
            'Note'
        ].join(',');

        // Format data for CSV
        const csvRows = inventoryHistory.map(record => {
            const date = new Date(record.timestamp).toLocaleString();
            const productName = record.productId ? record.productId.name : 'Unknown Product';
            const userName = record.userId ? record.userId.name : 'System';
            const orderNumber = record.orderId ? record.orderId.orderNumber : '';

            // Escape any commas in the text fields
            const note = record.note ? `"${record.note.replace(/"/g, '""')}"` : '';

            return [
                date,
                `"${productName}"`,
                record.action,
                record.previousStock,
                record.newStock,
                record.change,
                `"${userName}"`,
                orderNumber,
                note
            ].join(',');
        });

        // Combine header and rows
        const csvContent = [csvHeader, ...csvRows].join('\n');

        // Set headers for file download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=inventory_history_${new Date().toISOString().split('T')[0]}.csv`);

        // Send CSV response
        res.send(csvContent);
    } catch (error) {
        console.error('Error exporting inventory history:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get inventory statistics for admin dashboard
export const getInventoryStats = async (req, res) => {
    try {
        // Calculate total products
        const totalProducts = await productModel.countDocuments();

        // Calculate out of stock products
        const outOfStock = await productModel.countDocuments({ stock: 0 });

        // Calculate low stock products (5 or fewer)
        const lowStock = await productModel.countDocuments({
            stock: { $gt: 0, $lte: 5 }
        });

        // Calculate in stock products
        const inStock = await productModel.countDocuments({
            stock: { $gt: 5 }
        });

        // Get recent inventory activities
        const recentActivities = await InventoryHistory.find({})
            .sort({ timestamp: -1 })
            .limit(5)
            .populate('productId', 'name')
            .populate('userId', 'name');

        res.json({
            success: true,
            stats: {
                totalProducts,
                outOfStock,
                lowStock,
                inStock,
                recentActivities: recentActivities.map(activity => ({
                    _id: activity._id,
                    date: activity.timestamp,
                    product: activity.productId ? activity.productId.name : 'Unknown Product',
                    action: activity.action,
                    change: activity.change,
                    user: activity.userId ? activity.userId.name : 'System'
                }))
            }
        });
    } catch (error) {
        console.error('Error fetching inventory stats:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Export inventory as Excel file
export const exportInventoryExcel = async (req, res) => {
    try {
        // Get all products with their categories
        const products = await productModel.find({})
            .populate('categoryId', 'name')
            .sort({ name: 1 });

        if (!products || products.length === 0) {
            return res.status(404).json({ success: false, message: 'No products found' });
        }

        // Get xl from the excel4node module
        const xl = require('excel4node');

        // Create a new instance of a Workbook class
        const workbook = new xl.Workbook();

        // Add a worksheet
        const worksheet = workbook.addWorksheet('Inventory');

        // Create styles
        const headerStyle = workbook.createStyle({
            font: {
                color: '#FFFFFF',
                size: 12,
                bold: true
            },
            fill: {
                type: 'pattern',
                patternType: 'solid',
                fgColor: '#4472C4'
            },
            border: {
                left: {
                    style: 'thin',
                    color: '#000000'
                },
                right: {
                    style: 'thin',
                    color: '#000000'
                },
                top: {
                    style: 'thin',
                    color: '#000000'
                },
                bottom: {
                    style: 'thin',
                    color: '#000000'
                }
            }
        });

        const cellStyle = workbook.createStyle({
            border: {
                left: {
                    style: 'thin',
                    color: '#000000'
                },
                right: {
                    style: 'thin',
                    color: '#000000'
                },
                top: {
                    style: 'thin',
                    color: '#000000'
                },
                bottom: {
                    style: 'thin',
                    color: '#000000'
                }
            }
        });

        const lowStockStyle = workbook.createStyle({
            font: {
                color: '#FF0000',
                bold: true
            }
        });

        // Set up headers
        const headers = ['Product ID', 'Product Name', 'Category', 'Price', 'Stock', 'Status'];
        headers.forEach((header, i) => {
            worksheet.cell(1, i + 1).string(header).style(headerStyle);
        });

        // Add product data
        products.forEach((product, i) => {
            const rowIndex = i + 2;

            worksheet.cell(rowIndex, 1).string(product._id.toString()).style(cellStyle);
            worksheet.cell(rowIndex, 2).string(product.name).style(cellStyle);
            worksheet.cell(rowIndex, 3).string(product.categoryId ? product.categoryId.name : 'Uncategorized').style(cellStyle);
            worksheet.cell(rowIndex, 4).number(product.price).style(cellStyle);

            // Apply different style for low stock
            const stockCell = worksheet.cell(rowIndex, 5).number(product.stock || 0).style(cellStyle);
            if ((product.stock || 0) <= 5) {
                stockCell.style(lowStockStyle);
            }

            worksheet.cell(rowIndex, 6).string(product.isActive ? 'Active' : 'Inactive').style(cellStyle);
        });

        // Set column widths
        worksheet.column(1).setWidth(25);
        worksheet.column(2).setWidth(40);
        worksheet.column(3).setWidth(20);
        worksheet.column(4).setWidth(10);
        worksheet.column(5).setWidth(10);
        worksheet.column(6).setWidth(15);

        // Write to buffer and send as response
        workbook.writeToBuffer().then(buffer => {
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=inventory_export_${new Date().toISOString().split('T')[0]}.xlsx`);
            res.send(buffer);
        });
    } catch (error) {
        console.error('Error exporting inventory to Excel:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}; 