import mongoose from 'mongoose';
import InventoryHistory from '../models/inventoryHistoryModel.js';
import productModel from '../models/productModel.js';
import { Category, Subcategory } from '../models/categoryModel.js';

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

// Get inventory history for a specific product
export const getProductInventoryHistory = async (req, res) => {
    try {
        const { productId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ success: false, message: "Invalid product ID" });
        }

        // Get the product first to check if it exists
        const product = await productModel.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // Get the product's category and subcategory information
        const [category, subcategory] = await Promise.all([
            Category.findById(product.categoryId),
            Subcategory.findById(product.subcategoryId)
        ]);

        // Fetch product's inventory history
        const history = await InventoryHistory.find({ productId })
            .sort({ timestamp: -1 })
            .populate('userId', 'name email')
            .populate('orderId', 'status payment paymentMethod')
            .limit(100); // Limiting to last 100 entries for performance

        res.json({
            success: true,
            product: {
                _id: product._id,
                name: product.name,
                stock: product.stock,
                image: product.image[0],
                categoryName: category ? category.name : 'Unknown Category',
                subcategoryName: subcategory ? subcategory.name : 'Unknown Subcategory',
                isActive: product.isActive
            },
            history
        });
    } catch (error) {
        console.error('Error fetching product inventory history:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all inventory history with filtering options
export const getAllInventoryHistory = async (req, res) => {
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
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching inventory history:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Export inventory history to CSV
export const exportInventoryHistory = async (req, res) => {
    try {
        const {
            productId,
            action,
            startDate,
            endDate
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

        // Fetch history data with populated fields
        const history = await InventoryHistory.find(filter)
            .sort({ timestamp: -1 })
            .limit(5000) // Limiting export to 5000 records
            .populate('productId', 'name')
            .populate('userId', 'name email')
            .populate('orderId');

        // Format data for CSV
        const csvData = history.map(record => {
            const productName = record.productId ? record.productId.name : 'Unknown Product';
            const username = record.userId ? record.userId.name : 'System';
            const orderNumber = record.orderId ? record.orderId._id : 'N/A';

            return {
                date: new Date(record.timestamp).toISOString(),
                product: productName,
                action: record.action,
                previousStock: record.previousStock,
                newStock: record.newStock,
                change: record.change > 0 ? `+${record.change}` : record.change,
                user: username,
                orderId: orderNumber,
                note: record.note
            };
        });

        // Set headers for CSV download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=inventory_history_${new Date().toISOString().split('T')[0]}.csv`);

        // Write CSV header
        res.write(Object.keys(csvData[0]).join(',') + '\n');

        // Write CSV data rows
        csvData.forEach(row => {
            const values = Object.values(row).map(value => {
                // Handle values with commas by wrapping in quotes
                if (typeof value === 'string' && value.includes(',')) {
                    return `"${value}"`;
                }
                return value;
            });
            res.write(values.join(',') + '\n');
        });

        res.end();
    } catch (error) {
        console.error('Error exporting inventory history:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get inventory statistics for dashboard
export const getInventoryStats = async (req, res) => {
    try {
        // Get count of products by stock status
        const [lowStockCount, outOfStockCount, recentChanges] = await Promise.all([
            // Low stock products (1-10 items)
            productModel.countDocuments({ stock: { $gt: 0, $lte: 10 } }),

            // Out of stock products
            productModel.countDocuments({ stock: 0 }),

            // Recent inventory changes
            InventoryHistory.find()
                .sort({ timestamp: -1 })
                .limit(10)
                .populate('productId', 'name image')
                .populate('userId', 'name')
        ]);

        // Calculate in-stock count
        const inStockCount = await productModel.countDocuments({ stock: { $gt: 10 } });

        res.json({
            success: true,
            stats: {
                inStock: inStockCount,
                lowStock: lowStockCount,
                outOfStock: outOfStockCount,
                recentChanges
            }
        });
    } catch (error) {
        console.error('Error fetching inventory stats:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Export inventory to Excel
export const exportInventoryExcel = async (req, res) => {
    try {
        // Get all products
        const products = await productModel.find({}).lean();

        // Get categories and subcategories
        const categories = await Category.find({}).lean();
        const subcategories = await Subcategory.find({}).lean();

        // Create a map for faster category lookup
        const categoryMap = categories.reduce((map, cat) => {
            map[cat._id.toString()] = cat.name;
            return map;
        }, {});

        // Create a map for faster subcategory lookup
        const subcategoryMap = subcategories.reduce((map, subcat) => {
            map[subcat._id.toString()] = subcat.name;
            return map;
        }, {});

        // Format products for Excel
        const productData = products.map(product => ({
            id: product._id.toString(),
            name: product.name,
            category: categoryMap[product.categoryId?.toString()] || 'Unknown',
            subcategory: subcategoryMap[product.subcategoryId?.toString()] || 'Unknown',
            price: product.price,
            stock: product.stock || 0,
            status: product.isActive ? 'Active' : 'Inactive',
            createdAt: product.createdAt ? new Date(product.createdAt).toISOString() : '',
            updatedAt: product.updatedAt ? new Date(product.updatedAt).toISOString() : ''
        }));

        // Prepare Excel data
        let excelData;

        // Import excel4node if needed
        try {
            const xl = require('excel4node');

            // Create workbook and sheet
            const wb = new xl.Workbook();
            const ws = wb.addWorksheet('Inventory');

            // Define styles
            const headerStyle = wb.createStyle({
                font: {
                    bold: true,
                    color: '#ffffff',
                    size: 12
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

            const bodyStyle = wb.createStyle({
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

            // Define headers
            const headers = ['ID', 'Product Name', 'Category', 'Subcategory', 'Price', 'Stock', 'Status', 'Created', 'Updated'];

            // Add headers
            headers.forEach((header, i) => {
                ws.cell(1, i + 1).string(header).style(headerStyle);
            });

            // Add data rows
            productData.forEach((product, i) => {
                const row = i + 2;
                ws.cell(row, 1).string(product.id).style(bodyStyle);
                ws.cell(row, 2).string(product.name).style(bodyStyle);
                ws.cell(row, 3).string(product.category).style(bodyStyle);
                ws.cell(row, 4).string(product.subcategory).style(bodyStyle);
                ws.cell(row, 5).number(product.price).style(bodyStyle);
                ws.cell(row, 6).number(product.stock).style(bodyStyle);
                ws.cell(row, 7).string(product.status).style(bodyStyle);
                ws.cell(row, 8).string(product.createdAt).style(bodyStyle);
                ws.cell(row, 9).string(product.updatedAt).style(bodyStyle);
            });

            // Write to buffer
            const buffer = await new Promise((resolve, reject) => {
                wb.writeToBuffer().then(buffer => {
                    resolve(buffer);
                }).catch(err => {
                    reject(err);
                });
            });

            // Set headers for Excel download
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=inventory_export_${new Date().toISOString().split('T')[0]}.xlsx`);

            // Send buffer
            res.send(buffer);

        } catch (excelError) {
            console.error('Excel library not available, falling back to CSV:', excelError);

            // If excel4node is not available, fall back to CSV
            const headers = ['ID', 'Product Name', 'Category', 'Subcategory', 'Price', 'Stock', 'Status', 'Created', 'Updated'];

            // Format data for CSV
            const csvData = [
                headers.join(','),
                ...productData.map(product => [
                    product.id,
                    `"${product.name.replace(/"/g, '""')}"`, // Escape quotes
                    `"${product.category.replace(/"/g, '""')}"`,
                    `"${product.subcategory.replace(/"/g, '""')}"`,
                    product.price,
                    product.stock,
                    product.status,
                    product.createdAt,
                    product.updatedAt
                ].join(','))
            ].join('\n');

            // Set headers for CSV download
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=inventory_export_${new Date().toISOString().split('T')[0]}.csv`);

            // Send CSV
            res.send(csvData);
        }
    } catch (error) {
        console.error('Error exporting inventory to Excel:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}; 