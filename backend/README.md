# Trendify Backend

## Overview
The backend of Trendify is a Node.js/Express API server that handles all the business logic, database operations, and integrations for the e-commerce platform.

## Features
- RESTful API
- JWT Authentication
- MongoDB Database
- File Upload with Cloudinary
- Payment Integration (Razorpay/Stripe)
- Email Notifications
- User Management
- Product Management
- Order Processing
- Newsletter Management

## Dependencies
- Express.js
- MongoDB
- JWT
- Bcrypt
- Nodemailer
- Cloudinary
- Razorpay
- Stripe
- Multer
- Validator

## Project Structure
```
backend/
├── controllers/   # Route controllers
├── models/        # Database models
├── routes/        # API routes
├── middleware/    # Custom middleware
├── config/        # Configuration files
└── server.js      # Main server file
```

## API Endpoints

### User Management
- POST /api/user/register - User registration
- POST /api/user/login - User login
- POST /api/user/admin - Admin login
- GET /api/user/profile - Get user profile
- POST /api/user/reset-password - Request password reset
- POST /api/user/reset-password/:token - Reset password

### Product Management
- GET /api/products - Get all products
- GET /api/products/:id - Get product details
- POST /api/products - Create product (admin)
- PUT /api/products/:id - Update product (admin)
- DELETE /api/products/:id - Delete product (admin)

### Order Management
- POST /api/orders - Create order
- GET /api/orders - Get user orders
- GET /api/orders/:id - Get order details
- PUT /api/orders/:id - Update order status (admin)

### Newsletter
- POST /api/newsletter/subscribe - Subscribe to newsletter
- POST /api/newsletter/unsubscribe - Unsubscribe from newsletter

## Getting Started
1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a .env file with:
   ```
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   EMAIL_USERNAME=your_email
   EMAIL_PASSWORD=your_email_password
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_key
   CLOUDINARY_API_SECRET=your_cloudinary_secret
   RAZORPAY_KEY_ID=your_razorpay_key
   RAZORPAY_KEY_SECRET=your_razorpay_secret
   ```

3. Start the development server:
   ```bash
   npm run server
   ```

## Deployment
The backend can be deployed on any Node.js hosting service like Heroku, DigitalOcean, or AWS. 