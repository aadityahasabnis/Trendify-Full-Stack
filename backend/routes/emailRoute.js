import express from 'express';
import nodemailer from 'nodemailer';
import { authUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// Send invoice email
router.post('/send-invoice', authUser, async (req, res) => {
    try {
        const { email, subject, html, orderId } = req.body;

        if (!email || !subject || !html) {
            return res.status(400).json({
                success: false,
                message: 'Email, subject, and content are required'
            });
        }

        // Set up email transporter
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

        // Email options
        const mailOptions = {
            from: process.env.EMAIL_USERNAME,
            to: email,
            subject: subject,
            html: html,
        };

        // Send email
        await transporter.sendMail(mailOptions);

        res.status(200).json({
            success: true,
            message: 'Invoice sent successfully'
        });
    } catch (error) {
        console.error('Error sending invoice email:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error sending invoice email'
        });
    }
});

export default router; 