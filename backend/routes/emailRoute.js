import express from 'express';
import nodemailer from 'nodemailer';
import { authUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// Send invoice email
router.post('/send-invoice', authUser, async (req, res) => {
    try {
        const {
            email,
            subject,
            html,
            orderId,
            orderNumber,
            customerName,
            orderDate,
            totalAmount
        } = req.body;

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

        // Enhanced email template
        const enhancedHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
                    <h2 style="color: #333; margin-bottom: 20px;">${subject}</h2>
                    <p style="color: #666; margin-bottom: 10px;">Dear ${customerName},</p>
                    <p style="color: #666; margin-bottom: 10px;">Thank you for your order! Your invoice details are below:</p>
                    <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <p style="margin: 5px 0;"><strong>Order Number:</strong> ${orderNumber}</p>
                        <p style="margin: 5px 0;"><strong>Order Date:</strong> ${orderDate}</p>
                        <p style="margin: 5px 0;"><strong>Total Amount:</strong> $${totalAmount.toFixed(2)}</p>
                    </div>
                    <p style="color: #666; margin-bottom: 10px;">Please find your detailed invoice attached below:</p>
                    ${html}
                    <p style="color: #666; margin-top: 20px;">If you have any questions, please contact our support team.</p>
                    <p style="color: #666; margin-top: 20px;">Best regards,<br>The Trendify Team</p>
                </div>
            </div>
        `;

        // Email options
        const mailOptions = {
            from: process.env.EMAIL_USERNAME,
            to: email,
            subject: subject,
            html: enhancedHtml,
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
            message: 'Failed to send invoice email',
            error: error.message
        });
    }
});

export default router; 