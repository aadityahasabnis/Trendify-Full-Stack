import express from 'express'
import cors from 'cors'
import 'dotenv/config';
import connectDB from './config/mongodb.js';
import connectCloudinary from './config/cloudinary.js';
import userRouter from './routes/userRoute.js';
import productRouter from './routes/productRoute.js';
import cartRouter from './routes/cartRoute.js';
import orderRouter from './routes/orderRoute.js';
import reviewRouter from './routes/reviewRoute.js';
import analyticsRouter from './routes/analyticsRoute.js';
import newsletterRouter from './routes/newsletterRoute.js';
import categoryRouter from './routes/categoryRoute.js';
import adminRouter from './routes/adminRoute.js';
import inventoryRouter from './routes/inventoryRoute.js';
import emailRouter from './routes/emailRoute.js';
import recommendationRoute from './routes/recommendationRoutes.js';
import chatbotRoute from './routes/chatbotRoute.js';
import mongoose from 'mongoose';

// App config
const app = express();

// Middlewares
app.use(express.json());

const allowedOrigins = [

    'trendify.aadityahasabnis.site',
    'http://localhost:5174',
    'http://localhost:5173',
    'https://trendify-admin-rose.vercel.app',
    'https://trendify-frontend-vercel.vercel.app',
    'https://trendify-frontend-jrmmlhvbh-aaditya-hasabnis.vercel.app',
    'https://trendify-frontend.vercel.app'
];

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'token', 'x-requested-with'],
    credentials: true,
    optionsSuccessStatus: 204,
    preflightContinue: false,
    maxAge: 86400 // 24 hours
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Connect to MongoDB and Cloudinary
connectDB();
connectCloudinary();

// API endpoints
app.use('/api/user', userRouter);
app.use('/api/product', productRouter);
app.use('/api/cart', cartRouter);
app.use('/api/order', orderRouter);
app.use('/api/reviews', reviewRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/newsletter', newsletterRouter);
app.use('/api', categoryRouter);
app.use('/api/admin', adminRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/email', emailRouter);
app.use('/api/recommendations', recommendationRoute);
app.use('/api/chatbot', chatbotRoute);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'trendify-backend',
        environment: process.env.NODE_ENV,
        mongoStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'API is running',
        environment: process.env.NODE_ENV
    });
});

// Export the Express API
export default app;

// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});