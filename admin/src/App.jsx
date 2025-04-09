import React, { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { Route, Routes } from 'react-router-dom'
import Add from './../pages/Add';
import Dashboard from './../pages/Dashboard'
import Inventory from './../pages/Inventory'
import List from './../pages/List';
import Orders from './../pages/Orders';
import Login from '../components/Login';
import Newsletter from './../pages/Newsletter';
import Categories from './../pages/Categories';
import Subcategories from './../pages/Subcategories';
import Users from '../pages/Users';
import { ToastContainer } from 'react-toastify';

export const backendUrl = import.meta.env.VITE_BACKEND_URL;
export const currency = "₹";
const App = () => {

	const [token, setToken] = useState(localStorage.getItem('token') ? localStorage.getItem('token') : '');

	useEffect(() => {
		localStorage.setItem('token', token)
	}, [token])
	return (
		<div className='bg-gray-50 min-h-screen'>
			<ToastContainer />
			{token === ''
				? <Login setToken={setToken} />
				:
				<>
					<Navbar setToken={setToken} />

					<hr />
					<div className='flex w-full'>
						<Sidebar />
						<div className='w-[70%] mx-auto ml-[max(5vw,25px)] my-8 text-gray-600 text-base'>
							<Routes>
								<Route path="/" element={<Dashboard token={token} />} />
								<Route path="/dashboard" element={<Dashboard token={token} />} />
								<Route path='/add' element={<Add token={token} />} />
								<Route path='/list' element={<List token={token} />} />
								<Route path='/orders' element={<Orders token={token} />} />
								<Route path="/inventory" element={<Inventory token={token} />} />
								<Route path="/newsletter" element={<Newsletter token={token} />} />
								<Route path="/categories" element={<Categories token={token} />} />
								<Route path="/subcategories" element={<Subcategories token={token} />} />
								<Route path='/users' element={<Users token={token} />} />
							</Routes>
						</div>
					</div>
				</>
			}
		</div>
	)
}

export default App