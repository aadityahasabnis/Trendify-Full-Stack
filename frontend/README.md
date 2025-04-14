# Trendify Frontend

## Overview
The frontend of Trendify is a React-based e-commerce application that provides a seamless shopping experience for users.

## Features
- Modern UI with Tailwind CSS
- Responsive design
- Product browsing and search
- Shopping cart functionality
- User authentication
- Order management
- Product reviews and ratings
- Social sharing
- Newsletter subscription

## Dependencies
- React 19
- React Router DOM
- React Hot Toast
- Tailwind CSS
- Framer Motion
- React Share
- React Slick
- Axios
- JWT Decode

## Project Structure
```
src/
├── components/     # Reusable UI components
├── pages/         # Page components
├── context/       # React context providers
├── hooks/         # Custom React hooks
├── assets/        # Static assets
└── App.jsx        # Main application component
```

## Getting Started
1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a .env file with:
   ```
   VITE_BACKEND_URL=your_backend_url
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Building for Production
```bash
npm run build
```

## Deployment
The frontend can be deployed on Vercel or any static hosting service.
