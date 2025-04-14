# Trendify - Full Stack E-Commerce Platform

## Overview
Trendify is a modern e-commerce platform built with React, Node.js, and MongoDB. It features a complete shopping experience with user authentication, product management, order processing, and admin controls.

## Project Structure
```
Trendify/
├── frontend/     # React-based customer-facing application
├── admin/        # React-based admin dashboard
└── backend/      # Node.js/Express API server
```

## Features

### User Features
1. **Authentication & Profile**
   - User registration and login
   - Password reset functionality
   - Profile management
   - Newsletter subscription

2. **Shopping Experience**
   - Product browsing and search
   - Category-based navigation
   - Product details with size selection
   - Shopping cart management

3. **Order Management**
   - Secure checkout process
   - Multiple payment methods
   - Order tracking
   - Order history
   - Review and rating system

4. **Social Features**
   - Product sharing via WhatsApp
   - Product reviews and ratings
   - Newsletter subscription

### Admin Features
1. **Dashboard**
   - Sales analytics
   - User management
   - Order tracking
   - Inventory management

2. **Product Management**
   - Add/Edit/Delete products
   - Category management
   - Inventory tracking
   - Product image management

3. **User Management**
   - User list and details
   - Block/Unblock users
   - Newsletter management
   - Order management

4. **Content Management**
   - Newsletter management
   - Category management
   - Product categorization

## Technology Stack

### Frontend
- React 19
- React Router DOM
- React Hot Toast
- Tailwind CSS
- Framer Motion
- React Share
- React Slick

### Admin Panel
- React 18
- React Router DOM
- React Hot Toast
- Tailwind CSS
- Recharts
- React Quill

### Backend
- Node.js
- Express.js
- MongoDB
- JWT Authentication
- Nodemailer
- Cloudinary
- Razorpay/Stripe

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB
- npm or yarn

### Installation
1. Clone the repository
2. Install dependencies for each directory:
   ```bash
   # Frontend
   cd frontend
   npm install

   # Admin
   cd admin
   npm install

   # Backend
   cd backend
   npm install
   ```

3. Create .env files in each directory with required environment variables

4. Start the development servers:
   ```bash
   # Frontend
   cd frontend
   npm run dev

   # Admin
   cd admin
   npm run dev

   # Backend
   cd backend
   npm run server
   ```

## Deployment
The application can be deployed using Vercel for frontend and admin, and any Node.js hosting service for the backend.

## Contributing
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License
This project is licensed under the ISC License.
