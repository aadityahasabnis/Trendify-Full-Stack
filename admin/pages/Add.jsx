import React, { useState } from 'react';
import { assets } from '../assets/assets';
import axios from 'axios';
import { toast } from 'react-toastify';
// import { backendUrl } from '../src/App'; // Make sure this is correctly pointing to your backend
const backendUrl = "http://localhost:4000"; //added this line



const Add = ({ token }) => { // Removed TypeScript type for token prop
	const [image1, setImage1] = useState(null);
	const [image2, setImage2] = useState(null);
	const [image3, setImage3] = useState(null);
	const [image4, setImage4] = useState(null);

	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [price, setPrice] = useState("");

	const [category, setCategory] = useState("Men");
	const [subCategory, setSubCategory] = useState("Topwear");
	const [sizes, setSizes] = useState([]);
	const [bestseller, setBestseller] = useState(false);

	const handleSizeChange = (sizeValue) => {
		setSizes((prevSizes) =>
			prevSizes.includes(sizeValue)
				? prevSizes.filter((s) => s !== sizeValue)
				: [...prevSizes, sizeValue]
		);
	};

	const onSubmitHandler = async (e) => {
		e.preventDefault();
		try {
			const formData = new FormData();
			formData.append("name", name);
			formData.append("description", description);
			formData.append("price", price);
			formData.append("category", category);
			formData.append("subCategory", subCategory);
			formData.append("sizes", JSON.stringify(sizes));
			formData.append("bestseller", bestseller.toString());

			if (image1) formData.append("image1", image1);
			if (image2) formData.append("image2", image2);
			if (image3) formData.append("image3", image3);
			if (image4) formData.append("image4", image4);

			const response = await axios.post(backendUrl + '/api/product/add', formData, {
				headers: {
					token: token, // Use the token prop
					'Content-Type': 'multipart/form-data', // Explicitly set content type
				},
			});
			if (response.data.success) {
				toast.success(response.data.message);
				setName("");
				setDescription("");
				setPrice("");
				setBestseller(false);
				setSizes([]);
				setImage1(null);
				setImage2(null);
				setImage3(null);
				setImage4(null);
				
			}
		} catch (error) {
			console.error("Error adding product:", error);
			if (error.response) {
				console.log("Server response:", error.response.data);
			}
		}
	};

	return (
		<form onSubmit={onSubmitHandler} className='flex flex-col w-full items-start gap-3'>
			<div>
				<p>Upload Image</p>
				<div className='flex gap-2 mt-4'>
					<label htmlFor="image1">
						<img
							className='w-25 h-25 object-cover cursor-pointer border border-dashed border-gray-400'
							src={!image1 ? assets.upload_area : URL.createObjectURL(image1)}
							alt="upload-area"
						/>
						<input
							onChange={(e) => {
								if (e.target.files && e.target.files[0]) {
									setImage1(e.target.files[0]);
								}
							}}
							type="file"
							name="image1"
							id="image1"
							hidden
							accept="image/*" // Restrict to images
						/>
					</label>
					<label htmlFor="image2">
						<img
							className='w-25 h-25 object-cover cursor-pointer border border-dashed border-gray-400'
							src={!image2 ? assets.upload_area : URL.createObjectURL(image2)}
							alt="upload-area"
						/>
						<input
							onChange={(e) => {
								if (e.target.files && e.target.files[0]) {
									setImage2(e.target.files[0]);
								}
							}}
							type="file"
							name="image2"
							id="image2"
							hidden
							accept="image/*"
						/>
					</label>
					<label htmlFor="image3">
						<img
							className='w-25 h-25 object-cover cursor-pointer border border-dashed border-gray-400'
							src={!image3 ? assets.upload_area : URL.createObjectURL(image3)}
							alt="upload-area"
						/>
						<input
							onChange={(e) => {
								if (e.target.files && e.target.files[0]) {
									setImage3(e.target.files[0]);
								}
							}}
							type="file"
							name="image3"
							id="image3"
							hidden
							accept="image/*"
						/>
					</label>
					<label htmlFor="image4">
						<img
							className='w-25 h-25 object-cover cursor-pointer border border-dashed border-gray-400'
							src={!image4 ? assets.upload_area : URL.createObjectURL(image4)}
							alt="upload-area"
						/>
						<input
							onChange={(e) => {
								if (e.target.files && e.target.files[0]) {
									setImage4(e.target.files[0]);
								}
							}}
							type="file"
							name="image4"
							id="image4"
							hidden
							accept="image/*"
						/>
					</label>
				</div>
			</div>

			<div className='w-full'>
				<p className='mb-2'>Product Name</p>
				<input
					onChange={(e) => setName(e.target.value)}
					value={name}
					className='w-full max-w-[500px] px-3 py-2 border border-gray-300 rounded-md'
					type="text"
					placeholder='Type here'
					name="name"
					id="name"
					required
				/>
			</div>

			<div className='w-full'>
				<p className='mb-2'>Product Description</p>
				<textarea
					onChange={(e) => setDescription(e.target.value)}
					value={description}
					className='w-full max-w-[500px] px-3 py-2 border border-gray-300 rounded-md'
					placeholder='Write content here'
					name="description"
					id="description"
					required
				></textarea>
			</div>

			<div className='flex sm:flex-row flex-col gap-2 w-full sm:gap-8'>
				<div>
					<p className='mb-2 '>Product Category</p>
					<select
						onChange={(e) => setCategory(e.target.value)}
						value={category}
						className='w-full px-3 py-2 border border-gray-300 rounded-md'
					>
						<option value="Men">Men</option>
						<option value="Women">Women</option>
						<option value="Kids">Kids</option>
					</select>
				</div>
				<div>
					<p>Sub category</p>
					<select
						onChange={(e) => setSubCategory(e.target.value)}
						value={subCategory}
						className='w-full px-3 py-2 border border-gray-300 rounded-md'
					>
						<option value="Topwear">Topwear</option>
						<option value="Bottomwear">Bottomwear</option>
						<option value="Winterwear">Winterwear</option>
					</select>
				</div>

				<div>
					<p className='mb-2 '>Product price</p>
					<input
						onChange={(e) => setPrice(e.target.value)}
						value={price}
						className='w-full px-3 py-2 sm:w-[120px] border border-gray-300 rounded-md'
						type="number"
						placeholder='25'
						name="price"
						required
					/>
				</div>
			</div>

			<div>
				<p className='mb-2'>Product sizes</p>
				<div className='flex gap-3'>
					<div
						onClick={() => handleSizeChange("S")}
						className={
							`px-3 py-1 cursor-pointer rounded-md ${sizes.includes("S") ? "bg-orange-300" : "bg-slate-200"}`
						}
					>
						<p>S</p>
					</div>
					<div
						onClick={() => handleSizeChange("M")}
						className={
							`px-3 py-1 cursor-pointer rounded-md ${sizes.includes("M") ? "bg-orange-300" : "bg-slate-200"}`
						}
					>
						<p>M</p>
					</div>
					<div
						onClick={() => handleSizeChange("L")}
						className={
							`px-3 py-1 cursor-pointer rounded-md ${sizes.includes("L") ? "bg-orange-300" : "bg-slate-200"}`
						}
					>
						<p>L</p>
					</div>
					<div
						onClick={() => handleSizeChange("XL")}
						className={
							`px-3 py-1 cursor-pointer rounded-md ${sizes.includes("XL") ? "bg-orange-300" : "bg-slate-200"}`
						}
					>
						<p>XL</p>
					</div>
					<div
						onClick={() => handleSizeChange("XXL")}
						className={
							`px-3 py-1 cursor-pointer rounded-md ${sizes.includes("XXL") ? "bg-orange-300" : "bg-slate-200"}`
						}
					>
						<p>XXL</p>
					</div>
				</div>
			</div>

			<div className='flex gap-3 mt-2'>
				<input
					onChange={() => setBestseller((prev) => !prev)}
					checked={bestseller}
					className='cursor-pointer'
					type="checkbox"
					name="bestseller"
					id="bestseller"
				/>
				<label className='cursor-pointer' htmlFor="bestseller">Add to bestseller</label>
			</div>

			<button type='submit' className='w-28 py-3 mt-4 bg-black text-white rounded-md'>ADD</button>

		</form>
	);
};

export default Add;
