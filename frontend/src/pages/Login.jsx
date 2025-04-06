import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const Login = () => {

	const [currentState, setCurrentState] = useState('Login')
	const { token, setToken, backendUrl } = useContext(ShopContext);

	const [name, setName] = useState('');
	const [password, setPassword] = useState('');
	const [email, setEmail] = useState('');
	const [resetEmail, setResetEmail] = useState('');

	const navigate = useNavigate();

	
	const onSubmitHandler = async (event) => {
		event.preventDefault();
		try {
			if (currentState === 'Sign Up') {
				const response = await axios.post(backendUrl + '/api/user/register', { name, email, password });
				if (response.data.success) {
					setToken(response.data.token)
					localStorage.setItem('token', response.data.token)
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
				const response = await axios.post(backendUrl + '/api/user/login', { email, password });
				if (response.data.success) {
					setToken(response.data.token)
					localStorage.setItem('token', response.data.token)
				}
				else {
					toast.error(response.data.message);
				}
			}
		} catch (error) {
			console.log(error);
			toast.error(error.message)

		}
	}

	const handleForgotPassword = () => {
		setCurrentState('Reset Password');
	}

	useEffect(()=>{
		if (token) {
			navigate('/')
		}
	}, [token, navigate])
	return (
		<form onSubmit={onSubmitHandler} className='flex flex-col items-center w-[90%] sm:max-w-96 m-auto mt-14 gap-4 text-gray-800'>
			<div className='inline-flex items-center gap-2 mb-2 mt-10'>
				<p className='prata-regular text-3xl'>{currentState}</p>
				<hr className='border-none h-[1.5px] w-8 bg-gray-800' />
			</div>

			{currentState === 'Reset Password' ? (
				<>
					<p className="text-sm text-gray-600 mb-2">Enter your email address to receive a password reset link</p>
					<input 
						onChange={(e) => setResetEmail(e.target.value)} 
						value={resetEmail} 
						type="email" 
						className='w-full px-3 py-2 border border-gray-800' 
						placeholder='Email' 
						required 
					/>
				</>
			) : (
				<>
					{currentState === 'Login' ? '' : <input onChange={(e) => setName(e.target.value)} value={name} type="text" className='w-full px-3 py-2 border border-gray-800' placeholder='Name' required />}
					<input onChange={(e) => setEmail(e.target.value)} value={email} type="email" className='w-full px-3 py-2 border border-gray-800' placeholder='Email' required />
					<input onChange={(e) => setPassword(e.target.value)} value={password} type="password" className='w-full px-3 py-2 border border-gray-800' placeholder='Password' required />
				</>
			)}
			
			{currentState !== 'Reset Password' && (
				<div className='w-full flex justify-between text-sm mt-[-8px]'>
					<p onClick={handleForgotPassword} className="cursor-pointer">Forget your password</p>
					{
						currentState === 'Login'
							?
							<p onClick={() => setCurrentState('Sign Up')} className='cursor-pointer'>Create account</p>
							:
							<p onClick={() => setCurrentState('Login')} className='cursor-pointer'>Login here</p>
					}
				</div>
			)}
			
			{currentState === 'Reset Password' && (
				<div className='w-full flex justify-end text-sm mt-[-8px]'>
					<p onClick={() => setCurrentState('Login')} className='cursor-pointer'>Back to login</p>
				</div>
			)}
			
			<button className='bg-black text-white font-light px-8 py-2 mt-4 '>
				{currentState === 'Login' ? 'Sign In' : currentState === 'Sign Up' ? 'Sign Up' : 'Send Reset Link'}
			</button>
		</form>
	)
}

export default Login