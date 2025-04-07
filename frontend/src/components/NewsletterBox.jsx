import React, { useState, useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import { toast } from "react-toastify";
import axios from "axios";

const NewsletterBox = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { backendUrl } = useContext(ShopContext);

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        `${backendUrl}/api/newsletter/subscribe`,
        { email }
      );

      if (response.data.success) {
        toast.success("Successfully subscribed to newsletter!");
        setEmail("");
      } else {
        toast.error(response.data.message || "Failed to subscribe");
      }
    } catch (error) {
      console.error("Newsletter subscription error:", error);
      toast.error(
        error.response?.data?.message ||
        "Error subscribing to newsletter. Please try again."
      );
    } finally {
      setLoading(false);
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

      <form onSubmit={onSubmitHandler} className="flex items-center w-full gap-3 pl-3 mx-auto my-5 border sm:w-1/2">
        <input
          className="w-full outline-none sm:flex-1"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className={`px-10 py-4 text-xs text-white bg-black hover:bg-gray-800 transition-colors ${loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
        >
          {loading ? "SUBSCRIBING..." : "SUBSCRIBE"}
        </button>
      </form>
    </div>
  );
};

export default NewsletterBox;
