import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import { backendUrl } from '../src/App';

const Add = ({ token }) => {
	const [image1, setImage1] = useState(null);
	const [image2, setImage2] = useState(null);
	const [image3, setImage3] = useState(null);
	const [image4, setImage4] = useState(null);
	const [imageLinks, setImageLinks] = useState(['', '', '', '']);
	const [useLinks, setUseLinks] = useState(false);

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

	const onDrop1 = useCallback((acceptedFiles) => {
		if (acceptedFiles && acceptedFiles[0]) {
			// Clean up previous file URL if it exists
			if (image1) {
				URL.revokeObjectURL(image1);
			}
			setImage1(acceptedFiles[0]);
		}
	}, [image1]);

	const onDrop2 = useCallback((acceptedFiles) => {
		if (acceptedFiles && acceptedFiles[0]) {
			// Clean up previous file URL if it exists
			if (image2) {
				URL.revokeObjectURL(image2);
			}
			setImage2(acceptedFiles[0]);
		}
	}, [image2]);

	const onDrop3 = useCallback((acceptedFiles) => {
		if (acceptedFiles && acceptedFiles[0]) {
			// Clean up previous file URL if it exists
			if (image3) {
				URL.revokeObjectURL(image3);
			}
			setImage3(acceptedFiles[0]);
		}
	}, [image3]);

	const onDrop4 = useCallback((acceptedFiles) => {
		if (acceptedFiles && acceptedFiles[0]) {
			// Clean up previous file URL if it exists
			if (image4) {
				URL.revokeObjectURL(image4);
			}
			setImage4(acceptedFiles[0]);
		}
	}, [image4]);

	const { getRootProps: getRootProps1, getInputProps: getInputProps1, isDragActive: isDragActive1 } = useDropzone({
		onDrop: onDrop1,
		accept: {
			'image/*': ['.jpeg', '.jpg', '.png', '.webp']
		},
		maxFiles: 1
	});

	const { getRootProps: getRootProps2, getInputProps: getInputProps2, isDragActive: isDragActive2 } = useDropzone({
		onDrop: onDrop2,
		accept: {
			'image/*': ['.jpeg', '.jpg', '.png', '.webp']
		},
		maxFiles: 1
	});

	const { getRootProps: getRootProps3, getInputProps: getInputProps3, isDragActive: isDragActive3 } = useDropzone({
		onDrop: onDrop3,
		accept: {
			'image/*': ['.jpeg', '.jpg', '.png', '.webp']
		},
		maxFiles: 1
	});

	const { getRootProps: getRootProps4, getInputProps: getInputProps4, isDragActive: isDragActive4 } = useDropzone({
		onDrop: onDrop4,
		accept: {
			'image/*': ['.jpeg', '.jpg', '.png', '.webp']
		},
		maxFiles: 1
	});

	// Fetch categories and subcategories
	useEffect(() => {
		const fetchCategoriesAndSubcategories = async () => {
			try {
				const [categoriesRes, subcategoriesRes] = await Promise.all([
					axios.get(`${backendUrl}/api/categories`, { headers: { token } }),
					axios.get(`${backendUrl}/api/subcategories`, { headers: { token } })
				]);

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
	}, [token]);

	// Filter subcategories based on selected category
	useEffect(() => {
		if (categoryId) {
			const filtered = subcategories.filter(sub => {
				if (sub.categoryId && typeof sub.categoryId === 'object') {
					return sub.categoryId._id === categoryId;
				}
				return sub.categoryId === categoryId;
			});

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

	// Add cleanup effect
	useEffect(() => {
		return () => {
			// Clean up all object URLs when component unmounts
			if (image1) URL.revokeObjectURL(image1);
			if (image2) URL.revokeObjectURL(image2);
			if (image3) URL.revokeObjectURL(image3);
			if (image4) URL.revokeObjectURL(image4);
		};
	}, [image1, image2, image3, image4]);

	const handleSizeChange = (sizeValue) => {
		setSizes((prevSizes) =>
			prevSizes.includes(sizeValue)
				? prevSizes.filter((s) => s !== sizeValue)
				: [...prevSizes, sizeValue]
		);
	};

	const handleImageLinkChange = (index, value) => {
		const newLinks = [...imageLinks];
		newLinks[index] = value;
		setImageLinks(newLinks);
	};

	const onSubmitHandler = async (e) => {
		e.preventDefault();
		setLoading(true);

		try {
			// Validate at least one image is selected or one link is provided
			if (!useLinks && !image1 && !image2 && !image3 && !image4) {
				toast.error("Please upload at least one product image");
				setLoading(false);
				return;
			}

			if (useLinks && imageLinks.every(link => !link)) {
				toast.error("Please provide at least one image link");
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
			formData.append("useLinks", useLinks.toString());
			formData.append("imageLinks", JSON.stringify(imageLinks));

			if (!useLinks) {
				try {
					if (image1) formData.append("image1", image1);
					if (image2) formData.append("image2", image2);
					if (image3) formData.append("image3", image3);
					if (image4) formData.append("image4", image4);
				} catch (error) {
					console.error("Error appending files to FormData:", error);
					toast.error("Error processing image files");
					setLoading(false);
					return;
				}
			}

			const response = await axios.post(`${backendUrl}/api/product/add`, formData, {
				headers: {
					token: token,
					'Content-Type': 'multipart/form-data',
				},
			});

			if (response.data.success) {
				toast.success(response.data.message);
				// Reset form and clean up files
				setName("");
				setDescription("");
				setPrice("");
				setStock(0);
				setBestseller(false);
				setIsActive(true);
				setSizes([]);
				if (image1) URL.revokeObjectURL(image1);
				if (image2) URL.revokeObjectURL(image2);
				if (image3) URL.revokeObjectURL(image3);
				if (image4) URL.revokeObjectURL(image4);
				setImage1(null);
				setImage2(null);
				setImage3(null);
				setImage4(null);
				setImageLinks(['', '', '', '']);
				setUseLinks(false);
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
				<div className="mb-4">
					<label className="flex items-center gap-2 cursor-pointer">
						<input
							type="checkbox"
							checked={useLinks}
							onChange={(e) => setUseLinks(e.target.checked)}
							className="w-4 h-4 accent-orange-500"
						/>
						<span>Use image links instead of file upload</span>
					</label>
				</div>

				{useLinks ? (
					<div className='grid grid-cols-2 gap-4'>
						{[0, 1, 2, 3].map((index) => (
							<div key={index} className="flex flex-col gap-2">
								<input
									type="url"
									value={imageLinks[index]}
									onChange={(e) => handleImageLinkChange(index, e.target.value)}
									placeholder={`Image ${index + 1} URL`}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500"
								/>
								{imageLinks[index] && (
									<img
										src={imageLinks[index]}
										alt={`Preview ${index + 1}`}
										className="w-24 h-24 object-cover rounded-md"
										onError={(e) => {
											e.target.src = 'https://via.placeholder.com/100?text=Invalid+URL';
										}}
									/>
								)}
							</div>
						))}
					</div>
				) : (
					<div className='grid grid-cols-2 gap-4'>
						<div {...getRootProps1()} className={`w-full h-32 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer transition-colors ${isDragActive1 ? 'border-orange-500 bg-orange-50' : 'border-gray-300 hover:border-orange-500'}`}>
							<input {...getInputProps1()} />
							{image1 ? (
								<img src={URL.createObjectURL(image1)} alt="Preview" className="w-full h-full object-cover rounded-lg" />
							) : (
								<div className="text-center">
									<span className="material-icons text-gray-400 text-4xl">add_photo_alternate</span>
									<p className="text-sm text-gray-500 mt-1">Drag & drop or click to upload</p>
								</div>
							)}
						</div>

						<div {...getRootProps2()} className={`w-full h-32 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer transition-colors ${isDragActive2 ? 'border-orange-500 bg-orange-50' : 'border-gray-300 hover:border-orange-500'}`}>
							<input {...getInputProps2()} />
							{image2 ? (
								<img src={URL.createObjectURL(image2)} alt="Preview" className="w-full h-full object-cover rounded-lg" />
							) : (
								<div className="text-center">
									<span className="material-icons text-gray-400 text-4xl">add_photo_alternate</span>
									<p className="text-sm text-gray-500 mt-1">Drag & drop or click to upload</p>
								</div>
							)}
						</div>

						<div {...getRootProps3()} className={`w-full h-32 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer transition-colors ${isDragActive3 ? 'border-orange-500 bg-orange-50' : 'border-gray-300 hover:border-orange-500'}`}>
							<input {...getInputProps3()} />
							{image3 ? (
								<img src={URL.createObjectURL(image3)} alt="Preview" className="w-full h-full object-cover rounded-lg" />
							) : (
								<div className="text-center">
									<span className="material-icons text-gray-400 text-4xl">add_photo_alternate</span>
									<p className="text-sm text-gray-500 mt-1">Drag & drop or click to upload</p>
								</div>
							)}
						</div>

						<div {...getRootProps4()} className={`w-full h-32 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer transition-colors ${isDragActive4 ? 'border-orange-500 bg-orange-50' : 'border-gray-300 hover:border-orange-500'}`}>
							<input {...getInputProps4()} />
							{image4 ? (
								<img src={URL.createObjectURL(image4)} alt="Preview" className="w-full h-full object-cover rounded-lg" />
							) : (
								<div className="text-center">
									<span className="material-icons text-gray-400 text-4xl">add_photo_alternate</span>
									<p className="text-sm text-gray-500 mt-1">Drag & drop or click to upload</p>
								</div>
							)}
						</div>
					</div>
				)}
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
