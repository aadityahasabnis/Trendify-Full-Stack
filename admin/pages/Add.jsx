import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { backendUrl } from '../src/App';

const Add = ({ token }) => {
	const [image1, setImage1] = useState(null);
	const [image2, setImage2] = useState(null);
	const [image3, setImage3] = useState(null);
	const [image4, setImage4] = useState(null);

	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [price, setPrice] = useState("");
	const [stock, setStock] = useState(0);
	const [categories, setCategories] = useState([]);
	const [subcategories, setSubcategories] = useState([]);
	const [filteredSubcategories, setFilteredSubcategories] = useState([]);
	const [categoryId, setCategoryId] = useState("");
	const [subcategoryId, setSubcategoryId] = useState("");
	const [sizes, setSizes] = useState([]);
	const [bestseller, setBestseller] = useState(false);
	const [isActive, setIsActive] = useState(true);
	const [loading, setLoading] = useState(false);

	// Fetch categories and subcategories
	useEffect(() => {
		const fetchCategoriesAndSubcategories = async () => {
			try {
				const [categoriesRes, subcategoriesRes] = await Promise.all([
					axios.get(`${backendUrl}/api/categories`),
					axios.get(`${backendUrl}/api/subcategories`)
				]);

				// console.log('Categories response:', categoriesRes.data);
				// console.log('Subcategories response:', subcategoriesRes.data);

				if (categoriesRes.data.success) {
					setCategories(categoriesRes.data.categories);
					if (categoriesRes.data.categories.length > 0) {
						setCategoryId(categoriesRes.data.categories[0]._id);
					}
				}
				if (subcategoriesRes.data.success) {
					setSubcategories(subcategoriesRes.data.subcategories);
				}
			} catch (error) {
				console.error('Error fetching categories:', error);
				toast.error('Failed to load categories and subcategories');
			}
		};

		fetchCategoriesAndSubcategories();
	}, []);

	// Filter subcategories based on selected category
	useEffect(() => {
		if (categoryId) {
			// console.log('Selected category ID:', categoryId);
			// console.log('All subcategories:', subcategories);

			const filtered = subcategories.filter(sub => {
				// Check if categoryId is an object (populated) or a string
				if (sub.categoryId && typeof sub.categoryId === 'object') {
					return sub.categoryId._id === categoryId;
				}
				// If it's a string ID
				return sub.categoryId === categoryId;
			});

			// console.log('Filtered subcategories:', filtered);
			setFilteredSubcategories(filtered);
			if (filtered.length > 0) {
				setSubcategoryId(filtered[0]._id);
			} else {
				setSubcategoryId("");
			}
		} else {
			setFilteredSubcategories([]);
			setSubcategoryId("");
		}
	}, [categoryId, subcategories]);

	const handleSizeChange = (sizeValue) => {
		setSizes((prevSizes) =>
			prevSizes.includes(sizeValue)
				? prevSizes.filter((s) => s !== sizeValue)
				: [...prevSizes, sizeValue]
		);
	};

	const onSubmitHandler = async (e) => {
		e.preventDefault();
		setLoading(true);

		try {
			// Validate at least one image is selected
			if (!image1 && !image2 && !image3 && !image4) {
				toast.error("Please upload at least one product image");
				setLoading(false);
				return;
			}

			const formData = new FormData();
			formData.append("name", name);
			formData.append("description", description);
			formData.append("price", price);
			formData.append("stock", stock);
			formData.append("category", categoryId);
			formData.append("subCategory", subcategoryId);
			formData.append("sizes", JSON.stringify(sizes));
			formData.append("bestseller", bestseller.toString());
			formData.append("isActive", isActive.toString());
			formData.append("date", Date.now());

			if (image1) formData.append("image1", image1);
			if (image2) formData.append("image2", image2);
			if (image3) formData.append("image3", image3);
			if (image4) formData.append("image4", image4);

			// console.log("Submitting form data with:");
			// console.log("- Category:", categoryId);
			// console.log("- SubCategory:", subcategoryId);
			// console.log("- Images:", image1 ? "Yes" : "No");

			const response = await axios.post(`${backendUrl}/api/product/add`, formData, {
				headers: {
					token: token,
					'Content-Type': 'multipart/form-data',
				},
			});

			// console.log("Server response:", response.data);

			if (response.data.success) {
				toast.success(response.data.message);
				// Reset form
				setName("");
				setDescription("");
				setPrice("");
				setStock(0);
				setBestseller(false);
				setIsActive(true);
				setSizes([]);
				setImage1(null);
				setImage2(null);
				setImage3(null);
				setImage4(null);
			} else {
				toast.error(response.data.message || "Failed to add product");
			}
		} catch (error) {
			console.error("Error adding product:", error);
			toast.error(error.response?.data?.message || "Failed to add product");
		} finally {
			setLoading(false);
		}
	};

	return (
		<form onSubmit={onSubmitHandler} className='flex flex-col w-full items-start gap-3'>
			<div>
				<p className="font-medium text-gray-700 mb-2">Product Images</p>
				<div className='flex gap-2 mt-2'>
					<label htmlFor="image1" className="cursor-pointer">
						<div className="w-24 h-24 flex items-center justify-center border border-dashed border-gray-400 rounded-lg overflow-hidden bg-gray-50 hover:bg-gray-100 transition">
							{!image1 ? (
								<span className="material-icons text-gray-400">add_photo_alternate</span>
							) : (
								<img className="w-full h-full object-cover" src={URL.createObjectURL(image1)} alt="Product" />
							)}
						</div>
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
							accept="image/*"
						/>
					</label>
					<label htmlFor="image2" className="cursor-pointer">
						<div className="w-24 h-24 flex items-center justify-center border border-dashed border-gray-400 rounded-lg overflow-hidden bg-gray-50 hover:bg-gray-100 transition">
							{!image2 ? (
								<span className="material-icons text-gray-400">add_photo_alternate</span>
							) : (
								<img className="w-full h-full object-cover" src={URL.createObjectURL(image2)} alt="Product" />
							)}
						</div>
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
					<label htmlFor="image3" className="cursor-pointer">
						<div className="w-24 h-24 flex items-center justify-center border border-dashed border-gray-400 rounded-lg overflow-hidden bg-gray-50 hover:bg-gray-100 transition">
							{!image3 ? (
								<span className="material-icons text-gray-400">add_photo_alternate</span>
							) : (
								<img className="w-full h-full object-cover" src={URL.createObjectURL(image3)} alt="Product" />
							)}
						</div>
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
					<label htmlFor="image4" className="cursor-pointer">
						<div className="w-24 h-24 flex items-center justify-center border border-dashed border-gray-400 rounded-lg overflow-hidden bg-gray-50 hover:bg-gray-100 transition">
							{!image4 ? (
								<span className="material-icons text-gray-400">add_photo_alternate</span>
							) : (
								<img className="w-full h-full object-cover" src={URL.createObjectURL(image4)} alt="Product" />
							)}
						</div>
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
				<p className="text-xs text-gray-500 mt-1">Upload at least one product image (max 4)</p>
			</div>

			<div className='w-full'>
				<p className='mb-2 font-medium text-gray-700'>Product Name</p>
				<input
					onChange={(e) => setName(e.target.value)}
					value={name}
					className='w-full max-w-[500px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500'
					type="text"
					placeholder='Type here'
					name="name"
					id="name"
					required
				/>
			</div>

			<div className='w-full'>
				<p className='mb-2 font-medium text-gray-700'>Product Description</p>
				<textarea
					onChange={(e) => setDescription(e.target.value)}
					value={description}
					className='w-full max-w-[500px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500'
					placeholder='Write content here'
					name="description"
					id="description"
					rows="4"
					required
				></textarea>
			</div>

			<div className='flex flex-wrap gap-4 w-full'>
				<div className="flex-1 min-w-[200px]">
					<p className='mb-2 font-medium text-gray-700'>Category</p>
					<select
						onChange={(e) => setCategoryId(e.target.value)}
						value={categoryId}
						className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500'
						required
					>
						<option value="">Select Category</option>
						{categories.map(category => (
							<option key={category._id} value={category._id}>{category.name}</option>
						))}
					</select>
				</div>

				<div className="flex-1 min-w-[200px]">
					<p className='mb-2 font-medium text-gray-700'>Subcategory</p>
					<select
						onChange={(e) => setSubcategoryId(e.target.value)}
						value={subcategoryId}
						className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500'
						required
						disabled={!categoryId || filteredSubcategories.length === 0}
					>
						<option value="">Select Subcategory</option>
						{filteredSubcategories.map(subcategory => (
							<option key={subcategory._id} value={subcategory._id}>{subcategory.name}</option>
						))}
					</select>
					{!categoryId && (
						<p className="text-xs text-amber-600 mt-1">Please select a category first</p>
					)}
					{categoryId && filteredSubcategories.length === 0 && (
						<p className="text-xs text-red-500 mt-1">No subcategories available for this category</p>
					)}
				</div>

				<div className="flex-1 min-w-[120px]">
					<p className='mb-2 font-medium text-gray-700'>Price (₹)</p>
					<input
						onChange={(e) => setPrice(e.target.value)}
						value={price}
						className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500'
						type="number"
						placeholder='0'
						name="price"
						min="0"
						required
					/>
				</div>

				<div className="flex-1 min-w-[120px]">
					<p className='mb-2 font-medium text-gray-700'>Stock</p>
					<input
						onChange={(e) => setStock(e.target.value)}
						value={stock}
						className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500'
						type="number"
						placeholder='0'
						name="stock"
						min="0"
					/>
				</div>
			</div>

			<div>
				<p className='mb-2 font-medium text-gray-700'>Product sizes</p>
				<div className='flex flex-wrap gap-3'>
					{["S", "M", "L", "XL", "XXL"].map(size => (
						<div
							key={size}
							onClick={() => handleSizeChange(size)}
							className={`px-3 py-1 cursor-pointer rounded-md transition-colors ${sizes.includes(size)
								? "bg-orange-500 text-white"
								: "bg-gray-200 text-gray-700 hover:bg-gray-300"
								}`}
						>
							{size}
						</div>
					))}
				</div>
			</div>

			<div className='flex flex-wrap gap-6 mt-2'>
				<div className="flex items-center gap-2">
					<input
						onChange={() => setBestseller(prev => !prev)}
						checked={bestseller}
						className='w-4 h-4 cursor-pointer accent-orange-500'
						type="checkbox"
						name="bestseller"
						id="bestseller"
					/>
					<label className='cursor-pointer' htmlFor="bestseller">Add to bestseller</label>
				</div>

				<div className="flex items-center gap-2">
					<input
						onChange={() => setIsActive(prev => !prev)}
						checked={isActive}
						className='w-4 h-4 cursor-pointer accent-orange-500'
						type="checkbox"
						name="isActive"
						id="isActive"
					/>
					<label className='cursor-pointer' htmlFor="isActive">Active product</label>
				</div>
			</div>

			<button
				type='submit'
				className='w-28 py-3 mt-4 bg-orange-500 text-white rounded-md transition-colors hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center'
				disabled={loading}
			>
				{loading ? (
					<span className="material-icons animate-spin">refresh</span>
				) : (
					"ADD PRODUCT"
				)}
			</button>

		</form>
	);
};

export default Add;
