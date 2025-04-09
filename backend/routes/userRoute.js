import express from "express";
import {
    loginUser,
    registerUser,
    adminLogin,
    getUserProfile,
    requestPasswordReset,
    resetPassword,
    getAllUsers,          // <-- Import
    getUserDetailsAdmin,  // <-- Import
    toggleBlockUser,      // <-- Import
    deleteUser            // <-- Import
} from "../controllers/userController.js";
import { authUser, adminAuth } from "../middleware/authMiddleware.js"; // <-- Import adminAuth

const userRouter = express.Router();

// --- Public Routes ---
userRouter.post('/register', registerUser);
userRouter.post('/login', loginUser);
userRouter.post('/admin', adminLogin); // Admin login (specific credentials)
userRouter.post('/reset-password', requestPasswordReset);
userRouter.post('/reset-password/confirm', resetPassword);

// --- Authenticated User Routes ---
userRouter.get('/profile', authUser, getUserProfile);

// --- Admin Only Routes ---
userRouter.get('/list-all', adminAuth, getAllUsers); // New route for admin
userRouter.get('/details/:userId', adminAuth, getUserDetailsAdmin); // New route for admin
userRouter.patch('/toggle-block/:userId', adminAuth, toggleBlockUser); // New route for admin (use PATCH for partial update)
userRouter.delete('/delete/:userId', adminAuth, deleteUser); // New route for admin

export default userRouter;