import { v2 as cloudinary } from 'cloudinary';
import productModel from '../models/productModel.js';


// Function to add product
const addProduct = async (req, res) => {
    // console.log("req.body:", req.body); // Add this line
    try {
        const { name, description, price, category, subCategory, sizes, bestseller } = req.body;
        const image1 = req.files.image1 && req.files.image1[0];
        const image2 = req.files.image2 && req.files.image2[0];
        const image3 = req.files.image3 && req.files.image3[0];
        const image4 = req.files.image4 && req.files.image4[0];

        const images = [image1, image2, image3, image4].filter((item) => item !== undefined);

        let imagesUrl = await Promise.all(
            images.map(async (item) => {
                let res = await cloudinary.uploader.upload(item.path, { resource_type: 'image' })
                return res.secure_url;
            })
        )


        const productData = {
            name,
            description,
            price: Number(price),
            image: imagesUrl,
            category,
            subCategory,
            sizes: JSON.parse(sizes),  // Parsing 'size'
            bestseller: bestseller === "true" ? true : false,
            date: Date.now()
        }
        // console.log("productData:", productData); // Add this line


        const product = new productModel(productData);
        await product.save();

        res.json({ success: true, message: "Product Added Successfully" })
        // console.log(imagesUrl);

        // res.json({})
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }

}
// Function to list product
const listProduct = async (req, res) => {

    try {
        const products = await productModel.find({});
        res.json({ success: true, products })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
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
        const product = await productModel.findById(productId);
        res.json({ success: true, product });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

export { addProduct, listProduct, removeProduct, singleProduct }