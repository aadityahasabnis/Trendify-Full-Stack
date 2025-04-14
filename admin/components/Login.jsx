import React, { useState } from 'react'
import axios from 'axios'
import { backendUrl } from '../src/App';
import { toast } from 'react-hot-toast';

// Input Field Component
const InputField = ({ type, value, onChange, placeholder, required, icon, error }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const inputType = type === 'password' && showPassword ? 'text' : type;

    return (
        <div className="relative w-full">
            <div className={`relative flex items-center border ${isFocused ? 'border-orange-500' : 'border-gray-300'} rounded-lg transition-all duration-200 ${error ? 'border-red-500' : ''}`}>
                {icon && (
                    <div className="absolute left-3 text-gray-400">
                        <span className="material-icons text-xl">{icon}</span>
                    </div>
                )}
                <input
                    type={inputType}
                    value={value}
                    onChange={onChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={placeholder}
                    required={required}
                    className={`w-full px-4 py-3 ${icon ? 'pl-10' : ''} ${type === 'password' ? 'pr-10' : ''} bg-white rounded-lg focus:outline-none text-gray-700`}
                />
                {type === 'password' && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                        <span className="material-icons text-xl">
                            {showPassword ? 'visibility_off' : 'visibility'}
                        </span>
                    </button>
                )}
            </div>
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
};

// Button Component
const Button = ({ children, onClick, type = 'button', className = '', disabled = false }) => {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center ${disabled ? 'opacity-70 cursor-not-allowed' : ''} ${className}`}
        >
            {children}
        </button>
    );
};

const Login = ({ setToken }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const onSubmitHandler = async (e) => {
        try {
            e.preventDefault();
            const response = await axios.post(backendUrl + '/api/user/admin', { email, password });

            if (response.data.success) {
                setToken(response.data.token);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <div className='min-h-screen flex items-center justify-center bg-gray-50 py-6 px-4 sm:px-6 lg:px-8'>
            <div className='max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg'>
                <div className="text-center">
                    <h1 className='font-bold text-2xl mb-4'>Admin Panel</h1>
                </div>
                <form onSubmit={onSubmitHandler} className="mt-8 space-y-6">
                    <InputField
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                        icon="email"
                    />
                    <InputField
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                        icon="lock"
                    />
                    <Button type="submit">
                        Login
                    </Button>
                </form>
            </div>
        </div>
    );
}

export default Login