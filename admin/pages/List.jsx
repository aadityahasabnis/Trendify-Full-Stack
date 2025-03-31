import React, { useEffect, useState } from 'react'
import { backendUrl, currency } from '../src/App';
import axios from 'axios';
import { toast } from 'react-toastify';
const List = ({token}) => {

	const [list, setList] = useState([]);
	const fetchList = async () => {
		try {
			const response = await axios.get(backendUrl + '/api/product/list');
			if (response.data.success) {
				setList(response.data.products);
				// console.log(response.data.products);
				// toast.success("List fetched successfully.");
			} else {
				toast.error(response.data.message);
			}

		} catch (error) {
			console.log(error);
			toast.error("Something went wrong while fetching the list.");
		}
	}
	useEffect(() => {
		fetchList();
	}, [])


	const removeProduct = async (id) => {
		try {
			const response = await axios.post(backendUrl + '/api/product/remove', { id }, {headers: {token}});
			if (response.data.success) {
				toast.success(response.data.message);
				await fetchList(); // Refresh the list after removing a product
			} else {
				toast.error(response.data.message);
			}
		} catch (error) {
			console.log(error);
			toast.error("Something went wrong while removing the product.");
			
		}
	}
	return (
		<>
			<p className='mb-2'>All Products List</p>
			<div>
				{/* List Table Title */}
				<div className='hidden md:grid grid-cols-[1fr_3fr_1fr_1fr_1fr] items-center py-2 px-3 bg-gray-200 text-sm'>
					<b>Image</b>
					<b>Name</b>
					<b>Category</b>
					<b>Price</b>
					<b className='text-center'>Action</b>
				</div>

				{/* Product List */}

				{
					list.map((item, index) => {
						return (
							<div className='flex flex-col mt-3' key={index}>	
								<div className='grid grid-cols-[1fr_3fr_1fr_] md:grid-cols-[1fr_3fr_1fr_1fr_1fr] items-center gap-2 py-2 px-3 border text-sm' key={index}>
									<img className='w-12' src={item.image[0]} alt="Product Image" />
									<p>{item.name}</p>
									<p>{item.category}</p>
									<p>{currency}{item.price}</p>
									<p onClick={() => removeProduct(item._id)} className='text-right md:text-center cursor-pointer text-lg'>X</p>
								</div>
							</div>
							
						);
					})
				}

			</div>
		</>
	)
}

export default List