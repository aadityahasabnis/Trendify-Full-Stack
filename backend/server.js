import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/mongodb.js';
import connectCloudinary from './config/cloudinary.js';
import userRouter from './routes/userRoute.js';
import productRouter from './routes/productRoute.js';
import cartRouter from './routes/cartRoute.js';
import orderRouter from './routes/orderRoute.js';

// App config

const app = express();
const port = process.env.PORT || 4000;
connectDB();
connectCloudinary()

// Middlewares
app.use(express.json());
app.use(cors());

const allowedOrigins = ['http://localhost:5174', 'http://localhost:5173', 'https://trendify-admin-rose.vercel.app', 'https://trendify-frontend-vercel.vercel.app' ]; // Add your frontend URLs

const corsOptions = {
    origin: (origin, callback) => {
        if (allowedOrigins.includes(origin) || !origin) { // Allow specific origins and requests with no origin (e.g., mobile apps)
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // If you need to handle cookies or authorization headers
    optionsSuccessStatus: 204, // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));

// API endpoints
app.use(
    '/api/user',
    userRouter
)
app.use(
    '/api/product',
    productRouter
)

app.use(
    '/api/cart',
    cartRouter
)
app.use(
    '/api/order',
    orderRouter
)
app.get(
    '/',
    (req, res)=> {
        res.send("API working.")
    }
)

app.listen(
    port,
    ()=> {
        console.log("Server started on port: " + port)
    }
)