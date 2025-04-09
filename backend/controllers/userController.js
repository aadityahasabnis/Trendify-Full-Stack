import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import orderModel from "../models/orderModel.js";
import reviewModel from "../models/reviewModel.js";
import cartModel from "../models/cartModel.js";
import newsletterModel from "../models/newsletterModel.js";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { toast } from "react-toastify";
import mongoose from "mongoose";

const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET);
};

// Route for user login
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await userModel.findOne({ email });
        if (!user) {
            return res.json({
                success: false,
                message: "User doesn't exists. Please Register.",
            });
        }
        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            const token = createToken(user._id);

            // Check if user has a cart in the cartModel
            let cart = await cartModel.findOne({ userId: user._id });

            // If cart doesn't exist but user has cartData, create a new cart
            if (!cart && user.cartData && Object.keys(user.cartData).length > 0) {
                cart = new cartModel({ userId: user._id, items: user.cartData });
                await cart.save();
                console.log('Created new cart from user.cartData during login:', user.cartData);
            }

            // If cart exists but user's cartData is empty, update user's cartData
            if (cart && (!user.cartData || Object.keys(user.cartData).length === 0)) {
                user.cartData = cart.items;
                await user.save();
                console.log('Updated user.cartData from cart during login:', cart.items);
            }

            res.json({ success: true, token });
        } else {
            res.json({ success: false, message: "Invalid credentials." });
        }
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            message: error.message,
        });
    }
};

// Route for user Register
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.json({
                success: false,
                message: "Name, email, and password are required",
            });
        }
        // Checking user already exist or not
        const exists = await userModel.findOne({ email });
        if (exists) {
            return res.json({ success: false, message: "User already exists" });
        }
        // Validating email format and strong password
        if (!validator.isEmail(email)) {
            return res.json({
                success: false,
                message: "Please enter a valid email",
            });
        }
        if (password.length < 8) {
            return res.json({
                success: false,
                message: "Please enter a Strong password",
            });
        }

        // Hashing user password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // New user creation
        const newUser = new userModel({
            name,
            email,
            password: hashedPassword,
            cartData: {} // Initialize empty cart data
        });
        const user = await newUser.save();
        console.log('Created new user with empty cartData');

        // Create an empty cart for the user
        const newCart = new cartModel({
            userId: user._id,
            items: {}
        });
        await newCart.save();
        console.log('Created empty cart for new user');

        // Token creation
        const token = createToken(user._id);

        // Send welcome email
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD,
            },
            tls: {
                rejectUnauthorized: false,
            },
            secure: false,
        });

        const mailOptions = {
            from: process.env.EMAIL_USERNAME,
            to: user.email,
            subject: "🎉 Welcome to Trendify!",
            html: `
                <div style="max-width:600px;margin:0 auto;padding:20px;background-color:#f4f4f4;font-family:Arial,sans-serif;">
                    <div style="background:#ffffff;padding:30px;border-radius:10px;box-shadow:0 2px 6px rgba(0,0,0,0.05);color:#333;">
                        <h1 style="color:#6c63ff;font-size:24px;text-align:center;">🎉 Welcome to Trendify, ${name}!</h1>
                        
                        <p style="font-size:16px;line-height:1.6;text-align:center;">
                            Thanks for joining the <strong>Trendify</strong> family! 🛍️<br/>
                            We're super excited to have you on board.
                        </p>
        
                        <p style="font-size:15px;line-height:1.6;text-align:center;">
                            Dive into our latest collections, discover new trends, and enjoy a seamless shopping experience. ✨
                        </p>
        
                        <div style="text-align:center;margin:30px 0;">
                            <a href="https://trendify-frontend-vercel.vercel.app" 
                               style="display:inline-block;padding:12px 24px;background-color:#6c63ff;color:#fff;
                                      border-radius:6px;text-decoration:none;font-weight:bold;font-size:16px;">
                                🔍 Start Exploring
                            </a>
                        </div>
        
                        <p style="font-size:14px;color:#555;text-align:center;">
                            If you have any questions, feel free to reach out to us at 
                            <a href="mailto:support@trendify.com" style="color:#6c63ff;">support@trendify.com</a> 💬
                        </p>
        
                        <hr style="margin:30px 0;border:none;border-top:1px solid #eee;" />
        
                        <p style="font-size:13px;color:#999;text-align:center;">
                            Made with ❤️ by Team Trendify
                        </p>
                    </div>
                </div>
            `,
        };


        await transporter.sendMail(mailOptions);

        // User Registered with token key
        res.json({ success: true, token });
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            message: error.message,
        });
    }
};

// Route for admin login
const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (
            email === process.env.ADMIN_EMAIL &&
            password === process.env.ADMIN_PASSWORD
        ) {
            const token = jwt.sign(email + password, process.env.JWT_SECRET);
            res.json({ success: true, token });
        } else {
            res.json({ success: false, message: "Invalid credentials" });
        }
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            message: error.message,
        });
    }
};

// Add this new function to userController.js
const getUserProfile = async (req, res) => {
    try {
        const token = req.headers.token;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const user = await userModel.findById(userId);

        if (!user) {
            return res
                .status(404)
                .json({ success: false, message: "User not found" });
        }

        // If createdAt is null, use current date or account creation date
        const createdAt = user.createdAt || new Date();

        // Get order count
        const orderCount = await orderModel
            .countDocuments({
                userId: userId.toString(),
            })
            .catch(() => 0);

        res.json({
            success: true,
            user: {
                name: user.name,
                email: user.email,
                _id: user._id,
                orderCount: orderCount || 0,
                createdAt: createdAt,
            },
        });
    } catch (error) {
        console.error("Profile Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Add to your exports
// Request password reset
const requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;

        // Find user with the provided email
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.json({
                success: false,
                message: "User with this email does not exist",
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(20).toString("hex");

        // Set token expiration (1 hour from now)
        const resetTokenExpiration = Date.now() + 3600000; // 1 hour in milliseconds

        // Save token to user document
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = resetTokenExpiration;
        await user.save();

        // Create reset URL - adjust the URL based on your frontend
        const resetUrl = `${process.env.FRONTEND_URL || "https://trendify-frontend-vercel.vercel.app"
            }/reset-password/${resetToken}`;

        console.log("Email Username:", process.env.EMAIL_USERNAME);
        console.log("Email Password:", process.env.EMAIL_PASSWORD);
        // Configure email transporter with secure: false and rejectUnauthorized: false
        const transporter = nodemailer.createTransport({
            service: "gmail", // or your preferred email service
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD,
            },
            tls: {
                rejectUnauthorized: false,
            },
            secure: false,
        });

        // Email content
        const mailOptions = {
            from: process.env.EMAIL_USERNAME,
            to: user.email,
            subject: "🔐 Trendify Password Reset Request",
            html: `
                <div style="max-width:600px;margin:0 auto;padding:20px;background-color:#f9f9f9;font-family:Arial,sans-serif;color:#333;">
                    <div style="background:#fff;padding:30px;border-radius:8px;">
                        <h1 style="text-align:center;color:#6c63ff;font-size:24px;">🔑 Password Reset Request</h1>
                        <p style="font-size:16px;">Hi there! 👋</p>
                        <p style="font-size:15px;line-height:1.6;">
                            We received a request to reset your <strong>Trendify</strong> account password. 🔁<br>
                            Tap the button below to set a new password. This link will expire in <strong>1 hour</strong>. ⏳
                        </p>
                        <div style="margin:30px 0;text-align:center;">
                            <a href="${resetUrl}" 
                                style="display:inline-block;width:100%;max-width:300px;background-color:#6c63ff;color:#ffffff;
                                       padding:14px 0;text-align:center;border-radius:6px;text-decoration:none;
                                       font-size:16px;font-weight:bold;">
                                🔐 Reset My Password
                            </a>
                        </div>
                        <p style="font-size:14px;line-height:1.5;color:#555;">
                            Didn't request this? No worries. Just ignore this email, and your password will stay the same. 🚫
                        </p>
                        <hr style="margin:30px 0;border:none;border-top:1px solid #ddd;">
                        <p style="text-align:center;font-size:13px;color:#888;">
                            💡 Need help? Contact us at 
                            <a href="mailto:support@trendify.com" style="color:#6c63ff;text-decoration:none;">support@trendify.com</a><br>
                            Made with ❤️ by Team Trendify
                        </p>
                    </div>
                </div>
            `,
        };



        // Send email
        await transporter.sendMail(mailOptions);
        toast.success("Email sent!");

        res.json({
            success: true,
            message: "Password reset email sent",
        });
    } catch (error) {
        console.error("Password reset error:", error);
        res.json({
            success: false,
            message: error.message,
        });
    }
};

// Reset password with token
const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        // Find user with the provided token and check if token is still valid
        const user = await userModel.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.json({
                success: false,
                message: "Password reset token is invalid or has expired",
            });
        }

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password and clear reset token fields
        user.password = hashedPassword;
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;

        await user.save();

        res.json({
            success: true,
            message: "Password has been reset successfully",
        });
    } catch (error) {
        console.error("Password reset completion error:", error);
        res.json({
            success: false,
            message: error.message,
        });
    }
};

// --- Admin: Get All Users ---
const getAllUsers = async (req, res) => {
    try {
        const users = await userModel.find({}, '-password'); // Exclude password
        // Optional: Add counts for orders/reviews if needed for the list view
        // This can be slow for many users. Consider doing it in getUserDetails instead.
        res.json({ success: true, users });
    } catch (error) {
        console.error("Error fetching all users:", error);
        res.status(500).json({ success: false, message: "Failed to fetch users" });
    }
};

// --- Admin: Get Detailed User Info ---
const getUserDetailsAdmin = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: "Invalid User ID" });
        }

        const user = await userModel.findById(userId, '-password'); // Exclude password
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Fetch related data
        const orders = await orderModel.find({ userId }).sort({ date: -1 });
        const reviews = await reviewModel.find({ userId }).populate('productId', 'name').sort({ date: -1 });
        const cart = await cartModel.findOne({ userId }); // Assuming one cart per user
        const newsletterSub = await newsletterModel.findOne({ email: user.email });

        res.json({
            success: true,
            details: {
                user: user.toObject(), // Convert to plain object
                orders,
                reviews,
                cart: cart ? cart.items : {},
                newsletter: {
                    isSubscribed: newsletterSub ? newsletterSub.isSubscribed : false,
                    email: user.email // Include email for management
                }
            }
        });

    } catch (error) {
        console.error("Error fetching user details (admin):", error);
        res.status(500).json({ success: false, message: "Failed to fetch user details" });
    }
};

// --- Admin: Block/Unblock User ---
const toggleBlockUser = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: "Invalid User ID" });
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Prevent blocking the main admin account (important!)
        if (user.email === process.env.ADMIN_EMAIL) {
            return res.status(403).json({ success: false, message: "Cannot block the primary admin account." });
        }

        user.isBlocked = !user.isBlocked;
        await user.save();

        // Send email notification if user is blocked
        if (user.isBlocked) {
            try {
                const transporter = nodemailer.createTransport({
                    service: "gmail",
                    auth: {
                        user: process.env.EMAIL_USERNAME,
                        pass: process.env.EMAIL_PASSWORD,
                    },
                    tls: {
                        rejectUnauthorized: false,
                    },
                    secure: false,
                });
                const mailOptions = {
                    from: `"Trendify Admin" <${process.env.EMAIL_USERNAME}>`,
                    to: user.email,
                    subject: "🚨 Your Trendify Account Has Been Temporarily Blocked",
                    html: `
                        <p>Hello ${user.name},</p>
                        <p>Your Trendify account has been temporarily blocked due to a violation of our terms of service or community guidelines.</p>
                        <p>While blocked, you may not be able to log in or interact with certain features, and your reviews may be hidden.</p>
                        <p>If you believe this is an error, please contact support at <a href="mailto:${process.env.SUPPORT_EMAIL || 'support@trendify.com'}">${process.env.SUPPORT_EMAIL || 'support@trendify.com'}</a>.</p>
                        <p>Sincerely,<br/>The Trendify Team</p>
                    `
                };
                await transporter.sendMail(mailOptions);
            } catch (emailError) {
                console.error("Failed to send block notification email:", emailError);
                // Don't fail the whole request if email fails, but log it.
            }
        }

        res.json({
            success: true,
            message: `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully.`,
            user: { _id: user._id, isBlocked: user.isBlocked } // Return updated status
        });

    } catch (error) {
        console.error("Error toggling user block status:", error);
        res.status(500).json({ success: false, message: "Failed to update user status" });
    }
};

// --- Admin: Delete User ---
const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: "Invalid User ID" });
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Prevent deleting the main admin account (important!)
        if (user.email === process.env.ADMIN_EMAIL) {
            return res.status(403).json({ success: false, message: "Cannot delete the primary admin account." });
        }

        // Perform cascading deletes (or decide how to handle associated data)
        await reviewModel.deleteMany({ userId });
        await cartModel.deleteOne({ userId });
        await newsletterModel.deleteOne({ email: user.email });
        // Orders are usually kept for records

        await userModel.findByIdAndDelete(userId);

        res.json({ success: true, message: "User deleted successfully." });

    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ success: false, message: "Failed to delete user" });
    }
};

// Update exports to include new functions
export {
    loginUser,
    registerUser,
    adminLogin,
    getUserProfile,
    requestPasswordReset,
    resetPassword,
    getAllUsers,          // <-- Add
    getUserDetailsAdmin,  // <-- Add
    toggleBlockUser,      // <-- Add
    deleteUser            // <-- Add
};
