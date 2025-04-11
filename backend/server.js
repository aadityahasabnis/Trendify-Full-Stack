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
import recommendationRoute from './routes/recommendationRoute.js';

// App config
const app = express();
const port = process.env.PORT;
connectDB();
connectCloudinary();

// Middlewares
app.use(express.json());

const allowedOrigins = [
    'http://localhost:5174',
    'http://localhost:5173',
    'https://trendify-admin-rose.vercel.app',
    'https://trendify-frontend-vercel.vercel.app',
    'https://trendify-frontend-jrmmlhvbh-aaditya-hasabnis.vercel.app'
];

const corsOptions = {
    origin: (origin, callback) => {
        if (allowedOrigins.includes(origin) || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'token', 'x-requested-with'],
    credentials: true,
    optionsSuccessStatus: 204,
    preflightContinue: false,
    maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Add a middleware to ensure CORS headers are set for all responses
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, token, x-requested-with');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    next();
});

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

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

app.get('/', (req, res) => {
    res.send("API working.");
});

app.listen(port, () => {
    console.log("Server started on port: " + port);
});