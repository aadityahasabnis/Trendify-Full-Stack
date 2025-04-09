import React, { useContext } from 'react'
import { ShopContext } from '../context/ShopContext'
import { useNavigate } from 'react-router-dom'

const PersonalizedRecommendations = () => {
    const { token } = useContext(ShopContext);
    const navigate = useNavigate();

    const handleSignIn = () => {
        navigate('/login');
    };

    const handleStartHere = () => {
        navigate('/login', { state: { initialState: 'Sign Up' } });
    };

    // If user is already logged in, don't show this component
    if (token) {
        return null;
    }

    return (
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 my-8">
            <div className='flex flex-col items-center gap-5 py-12 sm:py-16 md:py-20 text-center border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300'>
                <p className='text-xl sm:text-2xl font-medium text-gray-800'>See personalized recommendations</p>

                <div className='flex flex-col w-full sm:w-1/2 md:w-1/3 lg:w-1/4 gap-5'>
                    <button
                        className='px-8 sm:px-12 py-2 bg-orange-400 hover:bg-orange-500 text-white font-medium cursor-pointer rounded-2xl transition-colors duration-300'
                        type='button'
                        onClick={handleSignIn}
                    >
                        Sign in
                    </button>
                    <div className="flex items-center justify-center gap-1 text-center">
                        <p className="text-gray-600">New Customer?</p>
                        <p
                            className='text-blue-700 underline underline-offset-2 cursor-pointer hover:text-blue-800 transition-colors duration-300'
                            onClick={handleStartHere}
                        >
                            Start here
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PersonalizedRecommendations