import React from "react";
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
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Verify from "./pages/Verify";
import UserProfile from "./pages/UserProfile";
import ResetPassword from "./pages/ResetPassword";
import CategoryPage from "./pages/CategoryPage";
import SubcategoryPage from "./pages/SubcategoryPage";
import BestsellersPage from "./pages/BestsellersPage";
import NewReleasesPage from "./pages/NewReleasesPage";
import MoversShakersPage from "./pages/MoversShakersPage";
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
      <Navbar />
      <main className="flex-grow pt-16">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/collections" element={<Collection />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/product/:productId" element={<Product />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<Login />} />
          <Route path="/place-order" element={<PlaceOrder />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/category/:categorySlug" element={<CategoryPage />} />
          <Route path="/category/:categorySlug/:subcategorySlug" element={<SubcategoryPage />} />
          <Route path="/best-sellers" element={<BestsellersPage />} />
          <Route path="/new-releases" element={<NewReleasesPage />} />
          <Route path="/movers-shakers" element={<MoversShakersPage />} />
          <Route path="/shop" element={<Navigate to="/collections" replace />} />
        </Routes>
      </main>
      <Footer />
      <ToastContainer />
    </div>
  );
}

export default App;
