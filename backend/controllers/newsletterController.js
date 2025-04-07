import newsletterModel from '../models/newsletterModel.js';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';

// Subscribe to newsletter
const subscribe = async (req, res) => {
    try {
        // console.log('Received subscription request:', req.body);
        const { email } = req.body;
        const token = req.headers.token;
        let userId = null;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        // If user is logged in, get their ID
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            userId = decoded.id;
        }

        // Check if email already exists
        const existingSubscription = await newsletterModel.findOne({ email });
        // console.log('Existing subscription:', existingSubscription);

        if (existingSubscription) {
            if (existingSubscription.isSubscribed) {
                return res.status(400).json({
                    success: false,
                    message: 'This email is already subscribed to our newsletter'
                });
            } else {
                // If they were unsubscribed, resubscribe them
                existingSubscription.isSubscribed = true;
                await existingSubscription.save();
                return res.status(200).json({
                    success: true,
                    message: 'Welcome back! You have been resubscribed to our newsletter'
                });
            }
        }

        // Create new subscription
        const newSubscription = new newsletterModel({
            email,
            userId
        });
        // console.log('Creating new subscription:', newSubscription);

        await newSubscription.save();
        // console.log('Subscription saved successfully');

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
            to: email,
            subject: "Welcome to Trendify Newsletter! 🎉",
            html: `
                <div style="max-width:600px;margin:0 auto;padding:20px;background-color:#f4f4f4;font-family:Arial,sans-serif;">
                    <div style="background:#ffffff;padding:30px;border-radius:10px;box-shadow:0 2px 6px rgba(0,0,0,0.05);color:#333;">
                        <h1 style="color:#6c63ff;font-size:24px;text-align:center;">🎉 Welcome to Trendify Newsletter!</h1>
                        
                        <p style="font-size:16px;line-height:1.6;text-align:center;">
                            Thank you for subscribing to our newsletter. You'll be the first to know about:
                        </p>

                        <ul style="font-size:15px;line-height:1.6;margin:20px 0;padding-left:20px;">
                            <li>New product launches</li>
                            <li>Exclusive deals and discounts</li>
                            <li>Fashion trends and tips</li>
                            <li>Special promotions</li>
                        </ul>

                        <p style="font-size:14px;color:#666;margin-top:30px;text-align:center;">
                            As a welcome gift, use code <strong>WELCOME20</strong> to get 20% off on your next purchase!
                        </p>

                        <hr style="margin:30px 0;border:none;border-top:1px solid #eee;" />

                        <p style="font-size:13px;color:#999;text-align:center;">
                            You can unsubscribe at any time by clicking <a href="${process.env.FRONTEND_URL}/unsubscribe?email=${email}" style="color:#6c63ff;">here</a>
                        </p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        // console.log('Welcome email sent successfully');

        res.status(200).json({
            success: true,
            message: 'Successfully subscribed to newsletter'
        });
    } catch (error) {
        console.error('Newsletter subscription error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error subscribing to newsletter'
        });
    }
};

// Unsubscribe from newsletter
const unsubscribe = async (req, res) => {
    try {
        const { email } = req.body;
        const subscription = await newsletterModel.findOne({ email });

        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'Subscription not found'
            });
        }

        subscription.isSubscribed = false;
        await subscription.save();

        res.status(200).json({
            success: true,
            message: 'Successfully unsubscribed from newsletter'
        });
    } catch (error) {
        console.error('Newsletter unsubscribe error:', error);
        res.status(500).json({
            success: false,
            message: 'Error unsubscribing from newsletter'
        });
    }
};

// Send newsletter (admin only)
const sendNewsletter = async (req, res) => {
    try {
        const { subject, content } = req.body;

        // Get all subscribed emails
        const subscribers = await newsletterModel.find({ isSubscribed: true });

        if (subscribers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No subscribers found'
            });
        }

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

        // Send emails in batches of 50 to avoid rate limiting
        const batchSize = 50;
        for (let i = 0; i < subscribers.length; i += batchSize) {
            const batch = subscribers.slice(i, i + batchSize);
            const emails = batch.map(subscriber => subscriber.email);

            const mailOptions = {
                from: process.env.EMAIL_USERNAME,
                bcc: emails,
                subject: subject,
                html: `
                    <div style="max-width:600px;margin:0 auto;padding:20px;background-color:#f4f4f4;font-family:Arial,sans-serif;">
                        <div style="background:#ffffff;padding:30px;border-radius:10px;box-shadow:0 2px 6px rgba(0,0,0,0.05);color:#333;">
                            ${content}
                            <hr style="margin:30px 0;border:none;border-top:1px solid #eee;" />
                            <p style="font-size:13px;color:#999;text-align:center;">
                                You received this email because you're subscribed to Trendify newsletter.
                                <br>
                                You can unsubscribe at any time by clicking <a href="${process.env.FRONTEND_URL}/unsubscribe" style="color:#6c63ff;">here</a>
                            </p>
                        </div>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);

            // Add a small delay between batches
            if (i + batchSize < subscribers.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        res.status(200).json({
            success: true,
            message: `Newsletter sent successfully to ${subscribers.length} subscribers`
        });
    } catch (error) {
        console.error('Send newsletter error:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending newsletter'
        });
    }
};

// Get all subscribers (admin only)
const getAllSubscribers = async (req, res) => {
    try {
        const subscribers = await newsletterModel.find()
            .sort({ subscriptionDate: -1 })
            .populate('userId', 'name email');

        res.status(200).json({
            success: true,
            subscribers
        });
    } catch (error) {
        console.error('Get subscribers error:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting subscribers'
        });
    }
};

export { subscribe, unsubscribe, sendNewsletter, getAllSubscribers }; 