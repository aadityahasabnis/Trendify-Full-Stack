import React, { useState, useContext } from 'react';
import axios from 'axios';
import { ShopContext } from '../context/ShopContext';

import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

const ResetPassword = () => {
    const { backendUrl } = useContext(ShopContext);

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const { token } = useParams();
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        try {
            const response = await axios.post(backendUrl+'/api/user/reset-password/confirm', {
                token,
                newPassword
            });

            if (response.data.success) {
                toast.success('Password has been reset successfully');
                navigate('/login');
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error('Error resetting password:', error);
            toast.error('Failed to reset password');
        }
    };

    return (
        <form onSubmit={handleSubmit} className='flex flex-col items-center w-[90%] sm:max-w-96 m-auto mt-14 gap-4 text-gray-800'>
            <h2 className='text-3xl mb-4'>Reset Password</h2>
            <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className='w-full px-3 py-2 border border-gray-800'
                required
            />
            <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className='w-full px-3 py-2 border border-gray-800'
                required
            />
            <button type="submit" className='bg-black text-white font-light px-8 py-2 mt-4'>
                Reset Password
            </button>
        </form>
    );
};

export default ResetPassword;