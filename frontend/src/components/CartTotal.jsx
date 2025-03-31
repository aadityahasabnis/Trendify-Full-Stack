import React, { useContext } from 'react';
import Title from './Title';
import { ShopContext } from '../context/ShopContext';

const CartTotal = () => {
    const { currency, delivery_fee, getCartAmount } = useContext(ShopContext);
    const cartAmount = getCartAmount();
    const totalAmount = cartAmount === 0 ? 0 : cartAmount + delivery_fee;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-2xl mb-4">
                <Title text1="CART" text2="TOTALS" />
            </div>

            <div className="text-sm">
                <div className="flex justify-between mb-2">
                    <p className="text-gray-600">Subtotal</p>
                    <p>{currency} {cartAmount}.00</p>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between mb-4">
                    <p className="text-gray-600">Shipping Fee</p>
                    <p>{currency} {delivery_fee}.00</p>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between font-semibold text-lg">
                    <p>Total</p>
                    <p>{currency} {totalAmount}.00</p>
                </div>
            </div>
        </div>
    );
};

export default CartTotal;