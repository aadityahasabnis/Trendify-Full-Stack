import express from "express";
import { 
    loginUser, 
    registerUser, 
    adminLogin, 
    getUserProfile, 
    requestPasswordReset, 
    resetPassword 
} from "../controllers/userController.js";
import authUser from "../middleware/auth.js";

const userRouter = express.Router();

userRouter.post('/register', registerUser);
userRouter.post('/login', loginUser);
userRouter.post('/admin', adminLogin);
userRouter.get('/profile', authUser, getUserProfile);

// Password reset routes
userRouter.post('/reset-password', requestPasswordReset);
userRouter.post('/reset-password/confirm', resetPassword);

export default userRouter;