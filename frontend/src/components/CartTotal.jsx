import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import { toast } from "react-hot-toast";

const CartTotal = () => {
    const navigate = useNavigate();
    const { cartItems, products, token, getTotalCartAmount, currency } = useContext(ShopContext);

    const calculateSubtotal = () => {
        return Object.entries(cartItems).reduce((total, [productId, items]) => {
            const product = products.find((p) => p._id === productId);
            if (!product) return total;

            return (
                total +
                Object.entries(items).reduce((itemTotal, [, quantity]) => {
                    return itemTotal + product.price * quantity;
                }, 0)
            );
        }, 0);
    };

    const subtotal = calculateSubtotal();
    const { total, shipping } = getTotalCartAmount();

    const handleCheckout = () => {
        if (!token) {
            toast.error("Please login to proceed to checkout");
            navigate("/login");
            return;
        }

        if (Object.keys(cartItems).length === 0) {
            toast.error("Your cart is empty");
            return;
        }

        navigate("/checkout");
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-6">Order Summary</h2>

            <div className="space-y-4">
                <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">
                        {currency}{subtotal.toFixed(2)}
                    </span>
                </div>

                <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium">
                        {shipping === 0 ? "Free" : `${currency}${shipping.toFixed(2)}`}
                    </span>
                </div>

                <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-semibold">
                        <span>Total</span>
                        <span>{currency}{total.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <button
                onClick={handleCheckout}
                disabled={subtotal === 0}
                className={`w-full mt-6 py-3 px-4 rounded-md text-white font-medium transition-colors
                    ${subtotal === 0
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-black hover:bg-gray-800"
                    }`}
            >
                Proceed to Checkout
            </button>
        </div>
    );
};

export default CartTotal;