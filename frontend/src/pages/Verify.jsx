import React, { useContext, useEffect } from 'react'
import { ShopContext } from '../context/ShopContext'
import { useSearchParams } from 'react-router-dom';
import axios from 'axios'
import { toast } from 'react-hot-toast';

const Verify = () => {
    const { navigate, token, setCartItems, backendUrl } = useContext(ShopContext);
    const [searchParams] = useSearchParams();

    const success = searchParams.get('success');
    const orderId = searchParams.get('orderId');

    const verifyPayment = async () => {
        try {
            if (!token) {
                return null;
            }

            const response = await axios.post(
                backendUrl + '/api/order/verifyStripe',
                { success, orderId },
                { headers: { token } }
            );

            if (response.data.success) {
                setCartItems({});
                navigate('/orders');
                toast.success('Payment successful! Your order has been placed.');
            } else {
                navigate('/cart');
                toast.error('Payment failed or was canceled.');
            }
        } catch (error) {
            console.error('Error verifying payment:', error);
            toast.error(error.response?.data?.message || 'Error verifying payment');
            navigate('/cart');
        }
    }

    useEffect(() => {
        verifyPayment();
    }, [token]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <h2 className="text-2xl font-semibold mb-4">Verifying Payment</h2>
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-gray-600">Please wait while we process your payment...</p>
            </div>
        </div>
    );
}

export default Verify;