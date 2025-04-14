import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import useScrollToTop from '../hooks/useScrollToTop';

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

const Login = () => {
	useScrollToTop();
	const location = useLocation();
	const [currentState, setCurrentState] = useState(location.state?.initialState || 'Login')
	const { token, setToken, backendUrl } = useContext(ShopContext);

	const [name, setName] = useState('');
	const [password, setPassword] = useState('');
	const [email, setEmail] = useState('');
	const [resetEmail, setResetEmail] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [errors, setErrors] = useState({});

	const navigate = useNavigate();

	const validateForm = () => {
		const newErrors = {};

		if (currentState === 'Sign Up') {
			if (!name.trim()) newErrors.name = 'Name is required';
			if (name.length < 3) newErrors.name = 'Name must be at least 3 characters';
		}

		if (!email.trim()) {
			newErrors.email = 'Email is required';
		} else if (!/\S+@\S+\.\S+/.test(email)) {
			newErrors.email = 'Email is invalid';
		}

		if (currentState !== 'Reset Password') {
			if (!password) {
				newErrors.password = 'Password is required';
			} else if (password.length < 6) {
				newErrors.password = 'Password must be at least 6 characters';
			}
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const onSubmitHandler = async (event) => {
		event.preventDefault();

		if (!validateForm()) return;

		setIsLoading(true);
		try {
			if (currentState === 'Sign Up') {
				const response = await axios.post(backendUrl + '/api/user/register', { name, email, password });
				if (response.data.success) {
					setToken(response.data.token)
					localStorage.setItem('token', response.data.token)
					toast.success('Account created successfully!');
					window.location.reload()
				}
				else {
					toast.error(response.data.message);
				}
			}
			else if (currentState === 'Reset Password') {
				const response = await axios.post(backendUrl + '/api/user/reset-password', { email: resetEmail });
				if (response.data.success) {
					toast.success('Password reset link sent to your email');
					setCurrentState('Login');
				}
				else {
					toast.error(response.data.message || 'Failed to send reset link');
				}
			}
			else {
				try {
					const response = await axios.post(backendUrl + '/api/user/login', { email, password });
					if (response.data.success) {
						setToken(response.data.token)
						localStorage.setItem('token', response.data.token)
						toast.success('Logged in successfully!');
						navigate('/');
					}
					else {
						toast.error(response.data.message);
					}
				} catch (error) {
					const errorMessage = error.response?.data?.message?.toLowerCase() || '';
					if (errorMessage.includes('user doesn\'t exist') || errorMessage.includes('user not found')) {
						toast.info('Account not found. Redirecting to registration...');
						setTimeout(() => {
							switchToSignUp();
						}, 1500);
					} else {
						toast.error(error.response?.data?.message || 'An error occurred. Please try again.');
					}
				}
			}
		} catch (error) {
			console.log(error);
			toast.error(error.response?.data?.message || 'An error occurred. Please try again.');
		} finally {
			setIsLoading(false);
		}
	}

	const handleForgotPassword = () => {
		setCurrentState('Reset Password');
		setErrors({});
	}

	const switchToSignUp = () => {
		setCurrentState('Sign Up');
		setErrors({});
		// Pre-fill email if available
		if (email) {
			setEmail(email);
		}
	}

	const switchToLogin = () => {
		setCurrentState('Login');
		setErrors({});
	}

	useEffect(() => {
		if (token) {
			navigate('/')
		}
	}, [token, navigate])

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
			<div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
				<div className="text-center">
					<h2 className="text-3xl font-extrabold text-gray-900 mb-2">{currentState}</h2>
					<p className="text-sm text-gray-600">
						{currentState === 'Login'
							? 'Welcome back! Please sign in to your account'
							: currentState === 'Sign Up'
								? 'Create a new account to get started'
								: 'Enter your email to reset your password'}
					</p>
				</div>

				<form onSubmit={onSubmitHandler} className="mt-8 space-y-6">
					{currentState === 'Reset Password' ? (
						<InputField
							type="email"
							value={resetEmail}
							onChange={(e) => setResetEmail(e.target.value)}
							placeholder="Email address"
							required
							icon="email"
							error={errors.email}
						/>
					) : (
						<>
							{currentState === 'Sign Up' && (
								<InputField
									type="text"
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder="Full name"
									required
									icon="person"
									error={errors.name}
								/>
							)}
							<InputField
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="Email address"
								required
								icon="email"
								error={errors.email}
							/>
							<InputField
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="Password"
								required
								icon="lock"
								error={errors.password}
							/>
						</>
					)}

					<div className="flex items-center justify-between text-sm">
						{currentState === 'Login' && (
							<button
								type="button"
								onClick={handleForgotPassword}
								className="text-orange-500 hover:text-orange-600 font-medium"
							>
								Forgot your password?
							</button>
						)}
						<div className="ml-auto">
							{currentState === 'Login' ? (
								<button
									type="button"
									onClick={switchToSignUp}
									className="text-orange-500 hover:text-orange-600 font-medium"
								>
									Create account
								</button>
							) : currentState === 'Sign Up' ? (
								<button
									type="button"
									onClick={switchToLogin}
									className="text-orange-500 hover:text-orange-600 font-medium"
								>
									Already have an account? Sign in
								</button>
							) : (
								<button
									type="button"
									onClick={switchToLogin}
									className="text-orange-500 hover:text-orange-600 font-medium"
								>
									Back to login
								</button>
							)}
						</div>
					</div>

					<Button type="submit" disabled={isLoading}>
						{isLoading ? (
							<>
								<svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
									<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
									<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								Processing...
							</>
						) : (
							currentState === 'Login' ? 'Sign In' : currentState === 'Sign Up' ? 'Create Account' : 'Send Reset Link'
						)}
					</Button>
				</form>
			</div>
		</div>
	)
}

export default Login