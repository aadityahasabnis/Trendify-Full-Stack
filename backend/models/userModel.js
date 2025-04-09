import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    resetPasswordToken: {
        type: String,
        default: null
    },
    resetPasswordExpires: {
        type: Date,
        default: null
    },
    cartData: {
        type: Object,
        default: {}
    },
    isBlocked: {
        type: Boolean,
        default: false,
        required: true
    }

}, {
    minimize: false,
    timestamps: true // This adds createdAt and updatedAt fields automatically
})

const userModel = mongoose.models.User || mongoose.model("User", userSchema);

export default userModel;