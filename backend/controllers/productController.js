import { v2 as cloudinary } from 'cloudinary';
import productModel from '../models/productModel.js';
import orderModel from '../models/orderModel.js';
import mongoose from 'mongoose';
import { Category, Subcategory } from '../models/categoryModel.js';


// Function to add product
const addProduct = async (req, res) => {
    console.log("req.body:", req.body); // Add debugging
    try {
        const { name, description, price, category, subCategory, sizes, bestseller, stock, isActive } = req.body;
        const image1 = req.files.image1 && req.files.image1[0];
        const image2 = req.files.image2 && req.files.image2[0];
        const image3 = req.files.image3 && req.files.image3[0];
        const image4 = req.files.image4 && req.files.image4[0];

        const images = [image1, image2, image3, image4].filter((item) => item !== undefined);

        if (images.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one product image is required"
            });
        }

        let imagesUrl = await Promise.all(
            images.map(async (item) => {
                let result = await cloudinary.uploader.upload(item.path, { resource_type: 'image' })
                return result.secure_url;
            })
        )


        const productData = {
            name,
            description,
            price: Number(price),
            image: imagesUrl,
            categoryId: category, // Map category to categoryId
            subcategoryId: subCategory, // Map subCategory to subcategoryId
            sizes: JSON.parse(sizes),
            bestseller: bestseller === "true" ? true : false,
            stock: Number(stock || 0),
            isActive: isActive === "true" ? true : false,
            date: Date.now()
        }
        console.log("productData:", productData); // Add debugging


        const product = new productModel(productData);
        await product.save();

        res.status(201).json({ success: true, message: "Product Added Successfully" })
    } catch (error) {
        console.error("Error adding product:", error);
        res.status(500).json({ success: false, message: error.message })
    }

}
// Function to list product
const listProduct = async (req, res) => {
    try {
        // Check if this is an admin request (has token) or frontend request
        const token = req.headers.token;
        const isAdminRequest = !!token;

        let query = {};

        // For frontend requests, only show active products with stock > 0
        if (!isAdminRequest) {
            query = {
                isActive: true,
                stock: { $gt: 0 }
            };
        }

        const products = await productModel.find(query);

        // For frontend requests, add stock availability information
        const productsWithAvailability = products.map(product => {
            const productObj = product.toObject({ virtuals: true });

            // Add stock message for frontend display
            if (!isAdminRequest) {
                productObj.stockStatus = {
                    inStock: productObj.inStock,
                    lowStock: productObj.lowStock,
                    message: productObj.stockMessage
                };
            }

            return productObj;
        });

        res.json({ success: true, products: productsWithAvailability });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}
// Function to remove product
const removeProduct = async (req, res) => {
    try {
        // console.log(req.body)
        // console.log("Received ID:", req.body.id);
        const product = await productModel.findByIdAndDelete(req.body.id);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }
        res.json({ success: true, message: "Product Removed" });
        console.log(product);
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}
// Function to view single product
const singleProduct = async (req, res) => {
    try {
        const { productId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ success: false, message: "Invalid product ID" });
        }

        // Check if this is an admin request (has token) or frontend request
        const token = req.headers.token;
        const isAdminRequest = !!token;

        // For frontend requests, only allow active products with stock
        let query = { _id: productId };
        if (!isAdminRequest) {
            query.isActive = true;
            query.stock = { $gt: 0 };
        }

        const product = await productModel.findOne(query);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // Convert to object to include virtuals
        const productObj = product.toObject({ virtuals: true });

        // Add stock availability information
        if (!isAdminRequest) {
            productObj.stockStatus = {
                inStock: productObj.inStock,
                lowStock: productObj.lowStock,
                message: productObj.stockMessage
            };
        }

        // Get reviews for this product
        const reviews = await mongoose.model('Review').find({ productId })
            .populate('userId', 'name')
            .sort({ date: -1 });

        productObj.reviews = reviews;

        res.status(200).json({ success: true, product: productObj });
    } catch (error) {
        console.error("Error fetching single product:", error);
        res.status(500).json({ success: false, message: "Failed to fetch product" });
    }
};

// Function to update product stock
const updateStock = async (req, res) => {
    try {
        const { productId, stock, note } = req.body;

        // Get the current product to know previous stock
        const currentProduct = await productModel.findById(productId);
        if (!currentProduct) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        const previousStock = currentProduct.stock;

        // Update the stock
        const product = await productModel.findByIdAndUpdate(
            productId,
            { stock: Number(stock) },
            { new: true }
        );

        // Log the inventory change
        if (req.logInventoryChange) {
            await req.logInventoryChange({
                productId,
                previousStock,
                newStock: Number(stock),
                action: 'manual_update',
                note: note || 'Manual stock update by admin'
            });
        }

        res.json({ success: true, message: "Stock updated successfully", product });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Add this new function after updateStock
const updateProductStatus = async (req, res) => {
    try {
        const { productId, isActive } = req.body;

        // Get the current product status
        const currentProduct = await productModel.findById(productId);
        if (!currentProduct) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        const previousStatus = currentProduct.isActive;

        // Update the product status
        const product = await productModel.findByIdAndUpdate(
            productId,
            { isActive },
            { new: true }
        );

        // Log the status change if there was a change
        if (previousStatus !== isActive && req.logInventoryChange) {
            await req.logInventoryChange({
                productId,
                previousStock: product.stock,
                newStock: product.stock, // Stock doesn't change
                action: 'status_change',
                previousStatus,
                newStatus: isActive,
                note: `Product ${isActive ? 'activated' : 'deactivated'} by admin`
            });
        }

        res.json({ success: true, message: `Product ${isActive ? 'activated' : 'deactivated'} successfully`, product });
    } catch (error) {
        console.error("Error updating product status:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Add this new function to get orders for a specific product
const getProductOrders = async (req, res) => {
    try {
        const { productId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ success: false, message: "Invalid product ID" });
        }

        // Find orders that contain this product - using string comparison since the items array
        // in orders might have productId stored as a string
        const orders = await orderModel.find({
            items: { $elemMatch: { productId: productId } }
        }).sort({ date: -1 });

        res.json({
            success: true,
            orders
        });
    } catch (error) {
        console.error("Error fetching product orders:", error);
        res.status(500).json({ success: false, message: "Failed to fetch orders" });
    }
};

// Function to get product details with populated category and subcategory
const getProductDetails = async (req, res) => {
    try {
        const { productId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ success: false, message: "Invalid product ID" });
        }

        const product = await productModel.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // Get category and subcategory details
        const [category, subcategory] = await Promise.all([
            Category.findById(product.categoryId),
            Subcategory.findById(product.subcategoryId)
        ]);

        // Combine data
        const productDetails = {
            ...product.toObject(),
            categoryName: category ? category.name : 'Unknown Category',
            subcategoryName: subcategory ? subcategory.name : 'Unknown Subcategory'
        };

        res.status(200).json({
            success: true,
            product: productDetails
        });
    } catch (error) {
        console.error("Error fetching product details:", error);
        res.status(500).json({ success: false, message: "Failed to fetch product details" });
    }
};

// Function to decrease product stock when an order is placed
const decreaseStock = async (orderedItems, orderId = null) => {
    try {
        console.log('Starting stock decrease for', orderedItems.length, 'items');

        // Track which products couldn't be updated due to insufficient stock
        let insufficientStockItems = [];
        let updatedProducts = [];

        // First check if all products have sufficient stock
        for (const item of orderedItems) {
            const product = await productModel.findById(item.productId);
            if (!product) {
                console.error(`Product not found: ${item.productId}`);
                continue;
            }

            // Check if stock is sufficient
            if ((product.stock || 0) < item.quantity) {
                insufficientStockItems.push({
                    productId: item.productId,
                    name: item.name,
                    requestedQty: item.quantity,
                    availableQty: product.stock || 0
                });
            }
        }

        // If any product has insufficient stock, return error
        if (insufficientStockItems.length > 0) {
            console.error('Insufficient stock for items:', insufficientStockItems);
            return {
                success: false,
                message: 'Some products have insufficient stock',
                insufficientItems: insufficientStockItems
            };
        }

        // Import and use the log function 
        let logInventoryChange;
        try {
            const { logInventoryChange: logFunc } = await import('../controllers/inventoryController.js');
            logInventoryChange = logFunc;
        } catch (error) {
            console.error("Could not import logInventoryChange function:", error);
            // Continue even if logging is not available
        }

        // If all stock checks pass, proceed with updates
        for (const item of orderedItems) {
            // Get the current product
            const product = await productModel.findById(item.productId);
            if (!product) continue;

            // Calculate new stock (ensure it doesn't go below 0)
            const previousStock = product.stock || 0;
            const newStock = Math.max(0, previousStock - item.quantity);
            console.log(`Decreasing stock for ${product.name} (${item.productId}): ${previousStock} -> ${newStock}`);

            // Update the product stock
            const updatedProduct = await productModel.findByIdAndUpdate(
                item.productId,
                { stock: newStock },
                { new: true }
            );

            if (updatedProduct) {
                updatedProducts.push({
                    id: updatedProduct._id,
                    name: updatedProduct.name,
                    oldStock: previousStock,
                    newStock: updatedProduct.stock,
                    deducted: item.quantity
                });

                // Log this stock change
                if (logInventoryChange) {
                    try {
                        await logInventoryChange({
                            productId: updatedProduct._id,
                            previousStock,
                            newStock: updatedProduct.stock,
                            action: 'order_placed',
                            orderId,
                            note: `Order placed - Stock decreased by ${item.quantity}`
                        });
                    } catch (logError) {
                        console.error("Error logging inventory change:", logError);
                        // Continue even if logging fails
                    }
                }
            }
        }

        console.log('Successfully updated stock for products:', updatedProducts);
        return {
            success: true,
            message: 'Stock updated successfully',
            updatedProducts
        };
    } catch (error) {
        console.error("Error decreasing stock:", error);
        return {
            success: false,
            message: error.message || 'Failed to update stock'
        };
    }
};

export { addProduct, listProduct, removeProduct, singleProduct, updateStock, updateProductStatus, getProductOrders, getProductDetails, decreaseStock }