import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Collection from "./pages/Collection";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Product from "./pages/Product";
import Cart from "./pages/Cart";
import Login from "./pages/Login";
import PlaceOrder from "./pages/PlaceOrder";
import Orders from "./pages/Orders";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Verify from "./pages/Verify";
import UserProfile from "./pages/UserProfile";
import ResetPassword from "./pages/ResetPassword";
import CategoryPage from "./pages/CategoryPage";
import SubcategoryPage from "./pages/SubcategoryPage";
import BestsellersPage from "./pages/BestsellersPage";
import NewReleasesPage from "./pages/NewReleasesPage";
import MoversShakersPage from "./pages/MoversShakersPage";
import { Toaster } from 'react-hot-toast';
import LoadingSpinner from './components/LoadingSpinner';
import Chatbot from './components/Chatbot';

// Lazy load pages
const HomeLazy = React.lazy(() => import('./pages/Home'));
const ProductLazy = React.lazy(() => import('./pages/Product'));
const LoginLazy = React.lazy(() => import('./pages/Login'));
const UserProfileLazy = React.lazy(() => import('./pages/UserProfile'));

function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: '8px',
          },
        }}
      />
      <Navbar />
      <main className="flex-grow pt-16 px-4">
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<HomeLazy />} />
            <Route path="/collections" element={<Collection />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/product/:productId" element={<ProductLazy />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/login" element={<LoginLazy />} />
            <Route path="/place-order" element={<PlaceOrder />} />
            <Route path="/checkout" element={<PlaceOrder />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/profile" element={<UserProfileLazy />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/category/:categorySlug" element={<CategoryPage />} />
            <Route path="/category/:categorySlug/:subcategorySlug" element={<SubcategoryPage />} />
            <Route path="/best-sellers" element={<BestsellersPage />} />
            <Route path="/new-releases" element={<NewReleasesPage />} />
            <Route path="/movers-shakers" element={<MoversShakersPage />} />
            <Route path="/shop" element={<Navigate to="/collections" replace />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <Chatbot />
    </div>
  );
}

export default App;
