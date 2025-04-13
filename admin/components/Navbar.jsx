import React from 'react'
import { assets } from '../assets/assets'
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const Navbar = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        toast.success('Logged out successfully');
        navigate('/admin/login');
    };

    return (
        <div className='flex items-center py-2 px-[4%] justify-between'>
            <img onClick={() => navigate('/')} className='w-[max(10%,80px)] cursor-pointer ' src={assets.logo} alt="logo" />
            <button onClick={handleLogout} className='bg-gray-600 text-white px-5 py-2 sm:px-7 sm:py-2 rounded-full text-xs sm:text-sm'>Logout</button>
        </div>
    )
}

export default Navbar