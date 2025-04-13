import React, { useState, useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import { toast } from "react-hot-toast";
import axios from "axios";

const NewsletterBox = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { backendUrl } = useContext(ShopContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await axios.post(`${backendUrl}/api/newsletter/subscribe`, {
        email
      });
      if (response.data.success) {
        toast.success('Successfully subscribed to newsletter');
        setEmail('');
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      toast.error('Failed to subscribe. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="text-center">
      <p className="text-2xl font-medium text-gray-800">
        Subscribe Now & get 20% Off!
      </p>
      <p className="mt-3 text-gray-400">
        Stay updated with our latest trends, exclusive deals, and fashion tips.
        Subscribe to our newsletter and get 20% off on your first purchase!
      </p>

      <form onSubmit={handleSubmit} className="flex items-center w-full gap-3 pl-3 mx-auto my-5 border sm:w-1/2">
        <input
          className="w-full outline-none sm:flex-1"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          className={`px-10 py-4 text-xs text-white bg-black hover:bg-gray-800 transition-colors ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {isLoading ? "SUBSCRIBING..." : "SUBSCRIBE"}
        </button>
      </form>
    </div>
  );
};

export default NewsletterBox;
