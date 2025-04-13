import React, { useEffect, useState } from 'react'
import { backendUrl, currency } from '../src/App';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const List = ({ token }) => {
	const [list, setList] = useState([]);
	const [filteredList, setFilteredList] = useState([]);
	const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'active', 'inactive'
	const [loading, setLoading] = useState(true);
	const [selectedProduct, setSelectedProduct] = useState(null);
	const [showModal, setShowModal] = useState(false);
	const [productReviews, setProductReviews] = useState([]);
	const [productOrders, setProductOrders] = useState([]);
	const [modalTab, setModalTab] = useState('details');
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [productToDelete, setProductToDelete] = useState(null);
	const [deleteLoading, setDeleteLoading] = useState(false);

	// --- State for Edit Modal ---
	const [showEditModal, setShowEditModal] = useState(false);
	const [productToEdit, setProductToEdit] = useState(null);
	const [editFormData, setEditFormData] = useState(null);
	const [editLoading, setEditLoading] = useState(false);
	const [editCategories, setEditCategories] = useState([]);
	const [editSubcategories, setEditSubcategories] = useState([]);
	const [editFilteredSubcategories, setEditFilteredSubcategories] = useState([]);
	const [editImagePreviews, setEditImagePreviews] = useState([null, null, null, null]);
	const [editImageFiles, setEditImageFiles] = useState([null, null, null, null]);
	// ---------------------------

	const fetchList = async () => {
		setLoading(true);
		try {
			const response = await axios.get(`${backendUrl}/api/product/list`, {
				headers: { token }
			});
			if (response.data.success) {
				// Fetch category and subcategory details for each product
				const productsWithDetails = await Promise.all(
					response.data.products.map(async (product) => {
						try {
							// Use the new /details/:id endpoint which should provide names
							const detailsResponse = await axios.get(`${backendUrl}/api/product/details/${product._id}`, {
								// No token needed if details endpoint is public, adjust if needed
							});
							if (detailsResponse.data.success) {
								return detailsResponse.data.product;
							}
							return product; // Fallback
						} catch (error) {
							console.error(`Error fetching details for product ${product._id}:`, error);
							return product; // Fallback
						}
					})
				);
				setList(productsWithDetails);
			} else {
				toast.error(response.data.message);
			}
		} catch (error) {
			console.error(error);
			toast.error("Something went wrong while fetching the list.");
		} finally {
			setLoading(false);
		}
	}

	// Fetch categories and subcategories for the Edit modal dropdowns
	const fetchCategoriesAndSubcategoriesForEdit = async () => {
		try {
			const [categoriesRes, subcategoriesRes] = await Promise.all([
				axios.get(`${backendUrl}/api/categories`), // Assuming public endpoint
				axios.get(`${backendUrl}/api/subcategories`) // Assuming public endpoint
			]);
			if (categoriesRes.data.success) setEditCategories(categoriesRes.data.categories);
			if (subcategoriesRes.data.success) setEditSubcategories(subcategoriesRes.data.subcategories);
		} catch (error) {
			console.error('Error fetching cats/subcats for edit:', error);
			toast.error('Failed to load categories/subcategories for editing.');
		}
	};

	// Filter subcategories for Edit Modal based on selected category
	useEffect(() => {
		if (editFormData?.categoryId && editSubcategories.length > 0) {
			const filtered = editSubcategories.filter(sub =>
				(sub.categoryId?._id || sub.categoryId) === editFormData.categoryId
			);
			setEditFilteredSubcategories(filtered);
			// If current subcategory is not in the filtered list, maybe reset it?
			const currentSubCatExists = filtered.some(sub => sub._id === editFormData.subcategoryId);
			if (!currentSubCatExists && filtered.length > 0) {
				setEditFormData(prev => ({ ...prev, subcategoryId: filtered[0]._id })); // Auto-select first if current invalid
			} else if (filtered.length === 0) {
				setEditFormData(prev => ({ ...prev, subcategoryId: "" })); // Reset if no subcats
			}
		} else {
			setEditFilteredSubcategories([]);
		}
	}, [editFormData?.categoryId, editSubcategories]); // Depend on categoryId within formData


	// Filter products based on active status
	const filterProducts = () => {
		if (activeFilter === 'all') {
			setFilteredList(list);
		} else if (activeFilter === 'active') {
			setFilteredList(list.filter(product => product.isActive));
		} else if (activeFilter === 'inactive') {
			setFilteredList(list.filter(product => !product.isActive));
		}
	};

	// Update filtered list when list or activeFilter changes
	useEffect(() => {
		filterProducts();
	}, [list, activeFilter]);

	// Fetch products on component mount
	useEffect(() => {
		fetchList();
		fetchCategoriesAndSubcategoriesForEdit(); // Fetch data for edit modal upfront
	}, []);

	// Fetch product reviews and orders when a product is selected for *details* modal
	useEffect(() => {
		if (selectedProduct && showModal) {
			fetchProductDetails(selectedProduct._id);
		}
	}, [selectedProduct, showModal]);

	const fetchProductDetails = async (productId) => {
		try {
			// Fetch product details with category and subcategory names
			const detailsResponse = await axios.get(`${backendUrl}/api/product/details/${productId}`);
			if (detailsResponse.data.success) {
				setSelectedProduct(detailsResponse.data.product); // Update details modal product state
			}

			// Fetch reviews
			const reviewsResponse = await axios.get(`${backendUrl}/api/reviews/product/${productId}`);
			if (reviewsResponse.data.success) {
				setProductReviews(reviewsResponse.data.reviews || []);
			}

			// Fetch orders containing this product
			const ordersResponse = await axios.get(`${backendUrl}/api/product/${productId}/orders`, {
				headers: { token }
			});
			if (ordersResponse.data.success) {
				setProductOrders(ordersResponse.data.orders || []);
			}
		} catch (error) {
			console.error("Error fetching product details:", error);
			toast.error("Could not load all product details");
		}
	};

	const openDeleteConfirmation = (product) => {
		setProductToDelete(product);
		setShowDeleteConfirm(true);
	};

	const removeProduct = async () => {
		setDeleteLoading(true);
		try {
			const response = await axios.delete(
				`${backendUrl}/api/product/${selectedProduct._id}`,
				{ headers: { token } }
			);

			if (response.data.success) {
				toast.success('Product deleted successfully');
				setShowDeleteConfirm(false);
				setSelectedProduct(null);
				await fetchList();
			} else {
				toast.error(response.data.message || 'Failed to delete product');
			}
		} catch (error) {
			console.error('Error deleting product:', error);
			toast.error('Error deleting product');
		} finally {
			setDeleteLoading(false);
		}
	};

	const updateProductStatus = async (id, isActive) => {
		try {
			// Show loading toast
			const toastId = toast.loading(`${isActive ? 'Activating' : 'Deactivating'} product...`);

			const response = await axios.post(
				`${backendUrl}/api/product/update-status`,
				{ productId: id, isActive },
				{ headers: { token } }
			);

			if (response.data.success) {
				// Update the toast to success
				toast.update(toastId, {
					render: `Product ${isActive ? 'activated' : 'deactivated'} successfully`,
					type: "success",
					isLoading: false,
					autoClose: 3000,
					closeButton: true
				});

				// Update the product in the list state
				const updatedList = list.map(item =>
					item._id === id ? { ...item, isActive } : item
				);
				setList(updatedList);

				// Update the selected product if it's the one being modified in details modal
				if (selectedProduct && selectedProduct._id === id) {
					setSelectedProduct({ ...selectedProduct, isActive });
				}
				// Update the product if it's the one being edited
				if (productToEdit && productToEdit._id === id) {
					setProductToEdit({ ...productToEdit, isActive });
					setEditFormData(prev => ({ ...prev, isActive })); // Also update form data state
				}

				// Optionally refetch product details to ensure we have latest data
				if (selectedProduct && selectedProduct._id === id) {
					fetchProductDetails(id);
				}
			} else {
				// Update the toast to error
				toast.update(toastId, {
					render: response.data.message || "Failed to update product status",
					type: "error",
					isLoading: false,
					autoClose: 3000,
					closeButton: true
				});
			}
		} catch (error) {
			console.error(error);
			toast.error("Failed to update product status");
		}
	};

	const openProductModal = (product) => {
		setSelectedProduct(product);
		setShowModal(true);
		setModalTab('details');
	};

	const formatDate = (timestamp) => {
		return new Date(timestamp).toLocaleDateString();
	};

	// --- Edit Modal Logic ---
	const openEditModal = (product) => {
		setProductToEdit(product);
		// Initialize form data from the product
		setEditFormData({
			name: product.name || "",
			description: product.description || "",
			price: product.price || "",
			stock: product.stock || 0,
			categoryId: product.categoryId || "", // Use categoryId directly
			subcategoryId: product.subcategoryId || "", // Use subcategoryId directly
			sizes: product.sizes || [],
			bestseller: product.bestseller || false,
			isActive: product.isActive !== undefined ? product.isActive : true, // Default to true if undefined
		});
		// Initialize image previews from existing product images
		const initialPreviews = [null, null, null, null];
		(product.image || []).slice(0, 4).forEach((imgUrl, index) => {
			initialPreviews[index] = imgUrl;
		});
		setEditImagePreviews(initialPreviews);
		setEditImageFiles([null, null, null, null]); // Reset file inputs
		setShowEditModal(true);
	};

	const handleEditFormChange = (e) => {
		const { name, value, type, checked } = e.target;
		setEditFormData(prev => ({
			...prev,
			[name]: type === 'checkbox' ? checked : value
		}));
	};

	const handleEditSizeChange = (sizeValue) => {
		setEditFormData(prev => {
			const currentSizes = prev.sizes || [];
			const newSizes = currentSizes.includes(sizeValue)
				? currentSizes.filter((s) => s !== sizeValue)
				: [...currentSizes, sizeValue];
			return { ...prev, sizes: newSizes };
		});
	};

	const handleEditImageChange = (e, index) => {
		const file = e.target.files && e.target.files[0];
		if (file) {
			// Update file state
			const newFiles = [...editImageFiles];
			newFiles[index] = file;
			setEditImageFiles(newFiles);

			// Update preview state
			const newPreviews = [...editImagePreviews];
			newPreviews[index] = URL.createObjectURL(file);
			setEditImagePreviews(newPreviews);
		}
	};

	const handleUpdateProduct = async (e) => {
		e.preventDefault();
		if (!productToEdit?._id) return;
		setEditLoading(true);

		try {
			const formData = new FormData();
			// Append text fields
			formData.append("name", editFormData.name);
			formData.append("description", editFormData.description);
			formData.append("price", editFormData.price);
			formData.append("stock", editFormData.stock);
			formData.append("category", editFormData.categoryId); // Use categoryId
			formData.append("subCategory", editFormData.subcategoryId); // Use subcategoryId
			formData.append("sizes", JSON.stringify(editFormData.sizes));
			formData.append("bestseller", editFormData.bestseller.toString());
			formData.append("isActive", editFormData.isActive.toString());

			// Append images ONLY if a new file was selected for that slot
			editImageFiles.forEach((file, index) => {
				if (file) {
					formData.append(`image${index + 1}`, file);
				}
			});

			// Make the PUT request
			const response = await axios.put(
				`${backendUrl}/api/product/update/${productToEdit._id}`,
				formData,
				{
					headers: {
						token: token,
						'Content-Type': 'multipart/form-data', // Important for file uploads
					},
				}
			);

			if (response.data.success) {
				toast.success("Product updated successfully!");
				setShowEditModal(false);
				setProductToEdit(null);
				fetchList(); // Refresh the list to show updated data
			} else {
				toast.error(response.data.message || "Failed to update product");
			}
		} catch (error) {
			console.error("Error updating product:", error);
			toast.error(error.response?.data?.message || "Failed to update product");
		} finally {
			setEditLoading(false);
		}
	};

	// ------------------------

	return (
		<div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
			<div className="flex flex-col sm:flex-row justify-between items-center mb-6">
				<h1 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-3 sm:mb-0">Products List</h1>
				<div className="flex gap-2 w-full sm:w-auto">
					{/* Status Filter */}
					<select
						value={activeFilter}
						onChange={(e) => setActiveFilter(e.target.value)}
						className="px-3 py-2 border border-gray-300 bg-white rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 flex-grow sm:flex-grow-0"
					>
						<option value="all">All Products</option>
						<option value="active">Active Products</option>
						<option value="inactive">Inactive Products</option>
					</select>

					{/* Refresh Button */}
					<button
						onClick={fetchList}
						className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
						disabled={loading} // Disable while loading
						title="Refresh List"
					>
						<i className={`material-icons ${loading ? 'animate-spin' : ''}`} style={{ fontSize: '18px' }}>refresh</i>
						<span className="hidden sm:inline text-sm">Refresh</span>
					</button>
				</div>
			</div>

			{loading ? (
				<div className="flex justify-center items-center h-64">
					<div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500"></div>
				</div>
			) : (
				<div className="overflow-x-auto bg-white rounded-lg border">
					<table className="min-w-full divide-y divide-gray-200">
						<thead>
							<tr className="bg-gray-50">
								<th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tl-lg">Product</th>
								<th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Category</th>
								<th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Price</th>
								<th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Stock</th>
								<th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									<div className="flex items-center">
										<span>Status</span>
										{/* <span className="ml-1 w-2 h-2 rounded-full bg-gray-300"></span> */}
									</div>
								</th>
								<th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tr-lg">Actions</th>
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{filteredList.length > 0 ? (
								filteredList.map((item) => (
									<tr
										key={item._id}
										className={`hover:bg-gray-50 transition-colors ${!item.isActive ? 'bg-gray-50 opacity-75' : ''}`}
									>
										{/* Make table cells clickable for details modal */}
										<td
											className="px-3 sm:px-6 py-4 whitespace-nowrap cursor-pointer"
											onClick={() => openProductModal(item)}
										>
											<div className="flex items-center">
												<div className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
													<img className={`h-8 w-8 sm:h-10 sm:w-10 rounded-md object-cover border ${!item.isActive ? 'grayscale' : ''}`} src={item.image?.[0]} alt={item.name} />
												</div>
												<div className="ml-3 sm:ml-4">
													<div className={`text-sm font-medium ${!item.isActive ? 'text-gray-500' : 'text-gray-900'}`}>
														{item.name.length > 30 ? `${item.name.substring(0, 30)}...` : item.name}
													</div>
													<div className="text-xs text-gray-500 hidden sm:block">{item.sizes?.join(", ") || "No sizes"}</div>

													{/* Mobile-only price and stock */}
													<div className="flex items-center space-x-2 sm:hidden mt-1">
														<span className="text-xs font-medium">{currency}{item.price}</span>
														<span className={`text-xs font-medium ${item.stock > 5 ? 'text-green-600' : item.stock > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
															(Stock: {item.stock || 0})
														</span>
													</div>
												</div>
											</div>
										</td>
										<td
											className="px-3 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell cursor-pointer"
											onClick={() => openProductModal(item)}
										>
											{/* Use names fetched via details endpoint */}
											<div className="text-sm font-medium text-gray-900">{item.categoryName || 'N/A'}</div>
											<div className="text-xs text-gray-500">{item.subcategoryName || 'N/A'}</div>
										</td>
										<td
											className="px-3 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell cursor-pointer"
											onClick={() => openProductModal(item)}
										>
											<div className="text-sm font-medium text-gray-900">{currency}{item.price}</div>
										</td>
										<td
											className="px-3 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell cursor-pointer"
											onClick={() => openProductModal(item)}
										>
											<div className={`text-sm font-medium ${item.stock > 5 ? 'text-green-600' : item.stock > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
												{item.stock || 0}
											</div>
										</td>
										<td
											className="px-3 sm:px-6 py-4 whitespace-nowrap cursor-pointer"
											onClick={() => openProductModal(item)}
										>
											<div className="flex items-center">
												{item.isActive ? (
													<div className="flex items-center px-2 py-1 sm:px-3 sm:py-1.5 bg-green-50 border border-green-200 text-green-700 rounded-full">
														<span className="w-2 h-2 bg-green-500 rounded-full mr-1 sm:mr-2"></span>
														<span className="text-xs font-medium">Active</span>
													</div>
												) : (
													<div className="flex items-center px-2 py-1 sm:px-3 sm:py-1.5 bg-red-50 border border-red-200 text-red-700 rounded-full">
														<span className="w-2 h-2 bg-red-500 rounded-full mr-1 sm:mr-2"></span>
														<span className="text-xs font-medium">Inactive</span>
													</div>
												)}
											</div>
										</td>
										<td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
											{/* Actions Buttons */}
											<div className="flex justify-end items-center gap-1 sm:gap-2">
												{/* Edit Button */}
												<button
													onClick={(e) => {
														e.stopPropagation(); // Prevent row click
														openEditModal(item);
													}}
													className="p-1 sm:p-1.5 rounded-md text-blue-600 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
													title="Edit Product"
												>
													<span className="material-icons" style={{ fontSize: '18px' }}>edit</span>
												</button>

												{/* Details Button */}
												<button
													onClick={(e) => {
														e.stopPropagation(); // Prevent row click
														openProductModal(item);
													}}
													className="p-1 sm:p-1.5 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1"
													title="View Details"
												>
													<span className="material-icons" style={{ fontSize: '18px' }}>visibility</span>
												</button>

												{/* Activate/Deactivate Button */}
												<button
													onClick={(e) => {
														e.stopPropagation();
														updateProductStatus(item._id, !item.isActive);
													}}
													className={`p-1 sm:p-1.5 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 ${item.isActive
														? 'text-yellow-600 hover:bg-yellow-100 focus:ring-yellow-500'
														: 'text-green-600 hover:bg-green-100 focus:ring-green-500'
														}`}
													title={item.isActive ? 'Deactivate' : 'Activate'}
												>
													<span className="material-icons" style={{ fontSize: '18px' }}>
														{item.isActive ? 'toggle_off' : 'toggle_on'}
													</span>
												</button>

												{/* Delete Button */}
												<button
													onClick={(e) => {
														e.stopPropagation();
														openDeleteConfirmation(item);
													}}
													className="p-1 sm:p-1.5 rounded-md text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
													title="Delete"
												>
													<span className="material-icons" style={{ fontSize: '18px' }}>delete</span>
												</button>
											</div>
										</td>
									</tr>
								))
							) : (
								<tr>
									<td colSpan="6" className="px-6 py-12 text-center text-gray-500">
										<div className="flex flex-col items-center">
											<i className="material-icons text-gray-300 text-5xl mb-2">inventory_2</i>
											<p>No products found</p>
											<p className="text-sm text-gray-400 mt-1">
												{activeFilter === 'all'
													? 'Add some products to get started'
													: activeFilter === 'active'
														? 'No active products found'
														: 'No inactive products found'}
											</p>
										</div>
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			)}

			{/* Product Details Modal */}
			{showModal && selectedProduct && (
				<div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
					<div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-xl transform transition-all" onClick={e => e.stopPropagation()}>
						<div className="flex justify-between items-center p-4 border-b">
							<h2 className="text-xl font-semibold text-gray-800">Product Details</h2>
							<button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700 transition-colors">
								<i className="material-icons">close</i>
							</button>
						</div>

						{/* Modal Tabs */}
						<div className="flex border-b overflow-x-auto">
							<button
								className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${modalTab === 'details' ? 'border-b-2 border-orange-500 text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
								onClick={() => setModalTab('details')}
							>
								Details
							</button>
							<button
								className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${modalTab === 'reviews' ? 'border-b-2 border-orange-500 text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
								onClick={() => setModalTab('reviews')}
							>
								Reviews ({productReviews.length})
							</button>
							<button
								className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${modalTab === 'orders' ? 'border-b-2 border-orange-500 text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
								onClick={() => setModalTab('orders')}
							>
								Orders ({productOrders.length})
							</button>
						</div>

						<div className="overflow-y-auto p-4" style={{ maxHeight: 'calc(90vh - 120px)' }}>
							{modalTab === 'details' && (
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div>
										{/* Display up to 4 images */}
										<div className="grid grid-cols-2 gap-2 mb-4">
											{(selectedProduct.image || []).slice(0, 4).map((img, idx) => (
												<img
													key={idx}
													src={img}
													alt={`${selectedProduct.name} - ${idx + 1}`}
													className="aspect-square object-cover rounded-md border border-gray-200 bg-gray-50" // Added bg color
												/>
											))}
											{/* Placeholders if fewer than 4 images */}
											{Array.from({ length: 4 - (selectedProduct.image?.length || 0) }).map((_, idx) => (
												<div key={`placeholder-${idx}`} className="aspect-square flex items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50 text-gray-300">
													<span className="material-icons">image</span>
												</div>
											))}
										</div>

										<div className="mt-4">
											<h3 className="text-sm font-medium text-gray-500">Sizes</h3>
											<div className="flex flex-wrap gap-2 mt-1">
												{selectedProduct.sizes?.length > 0 ? selectedProduct.sizes.map((size, idx) => (
													<span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
														{size}
													</span>
												)) : <span className="text-xs text-gray-400">No sizes specified</span>}
											</div>
										</div>
									</div>

									<div>
										<h3 className="text-xl font-medium text-gray-800 mb-2">{selectedProduct.name}</h3>
										<p className="text-sm text-gray-600 mb-4">{selectedProduct.description}</p>

										<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
											<div>
												<h4 className="text-sm font-medium text-gray-500">Price</h4>
												<p className="text-lg font-semibold text-gray-800">{currency}{selectedProduct.price}</p>
											</div>
											<div>
												<h4 className="text-sm font-medium text-gray-500">Stock</h4>
												<p className={`text-lg font-semibold ${selectedProduct.stock > 5 ? 'text-green-600' : selectedProduct.stock > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
													{selectedProduct.stock || 0} units
												</p>
											</div>
											<div>
												<h4 className="text-sm font-medium text-gray-500">Status</h4>
												{selectedProduct.isActive ? (
													<div className="flex items-center px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 rounded-md w-fit">
														<span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
														<span className="text-sm font-medium">Active</span>
													</div>
												) : (
													<div className="flex items-center px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 rounded-md w-fit">
														<span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
														<span className="text-sm font-medium">Inactive</span>
													</div>
												)}
											</div>
											<div>
												<h4 className="text-sm font-medium text-gray-500">Featured</h4>
												<p className="text-sm font-semibold">
													{selectedProduct.bestseller ? 'Yes' : 'No'}
												</p>
											</div>
										</div>

										<div className="mb-4 p-3 bg-gray-50 rounded-md border">
											<h4 className="text-sm font-medium text-gray-500 mb-1">Category</h4>
											<p className="text-sm font-semibold">{selectedProduct.categoryName || 'Unknown Category'}</p>
										</div>

										<div className="mb-4 p-3 bg-gray-50 rounded-md border">
											<h4 className="text-sm font-medium text-gray-500 mb-1">Subcategory</h4>
											<p className="text-sm font-semibold">{selectedProduct.subcategoryName || 'Unknown Subcategory'}</p>
										</div>

										<div className="mb-4">
											<h4 className="text-sm font-medium text-gray-500 mb-1">Added On</h4>
											<p className="text-sm">{formatDate(selectedProduct.date || selectedProduct.createdAt)}</p>
										</div>
									</div>
								</div>
							)}

							{modalTab === 'reviews' && (
								<div>
									{productReviews.length > 0 ? (
										<div className="space-y-4">
											{productReviews.map(review => (
												<div key={review._id} className="border rounded-lg p-4">
													<div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
														<div className="flex items-center gap-2 mb-2 sm:mb-0">
															<div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
																<i className="material-icons text-gray-500 text-sm">person</i>
															</div>
															<span className="font-medium">{review.userId?.name || 'Anonymous'}</span>
														</div>
														<div className="flex items-center">
															{[...Array(5)].map((_, i) => (
																<i key={i} className="material-icons text-yellow-400" style={{ fontSize: '16px' }}>
																	{i < review.rating ? 'star' : 'star_border'}
																</i>
															))}
														</div>
													</div>
													<p className="mt-2 text-gray-600">{review.comment}</p>
													<p className="mt-1 text-xs text-gray-400">{formatDate(review.date)}</p>
												</div>
											))}
										</div>
									) : (
										<div className="text-center py-8 text-gray-500">
											<i className="material-icons text-gray-300 text-5xl mb-2">rate_review</i>
											<p>No reviews yet</p>
										</div>
									)}
								</div>
							)}

							{modalTab === 'orders' && (
								<div>
									{productOrders.length > 0 ? (
										<div className="overflow-x-auto">
											<table className="min-w-full divide-y divide-gray-200">
												<thead>
													<tr className="bg-gray-50">
														<th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
														<th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
														<th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
														<th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
														<th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
													</tr>
												</thead>
												<tbody className="bg-white divide-y divide-gray-200">
													{productOrders.map(order => (
														<tr key={order._id} className="hover:bg-gray-50">
															<td className="px-2 sm:px-4 py-2 whitespace-nowrap text-xs sm:text-sm overflow-hidden text-ellipsis" style={{ maxWidth: '100px' }}>
																{order._id}
															</td>
															<td className="px-2 sm:px-4 py-2 whitespace-nowrap text-xs sm:text-sm">{formatDate(order.date)}</td>
															<td className="px-2 sm:px-4 py-2 whitespace-nowrap text-xs sm:text-sm">
																{order.items.find(item => item.productId === selectedProduct._id)?.quantity || 1}
															</td>
															<td className="px-2 sm:px-4 py-2 whitespace-nowrap text-xs sm:text-sm">
																<span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
																	order.status === 'Shipped' ? 'bg-blue-100 text-blue-800' :
																		'bg-yellow-100 text-yellow-800'
																	}`}>
																	{order.status}
																</span>
															</td>
															<td className="px-2 sm:px-4 py-2 whitespace-nowrap text-xs sm:text-sm font-medium">{currency}{order.amount}</td>
														</tr>
													))}
												</tbody>
											</table>
										</div>
									) : (
										<div className="text-center py-8 text-gray-500">
											<i className="material-icons text-gray-300 text-5xl mb-2">shopping_bag</i>
											<p>No orders for this product</p>
										</div>
									)}
								</div>
							)}
						</div>
					</div>
				</div>
			)}

			{/* --- Edit Product Modal --- */}
			{showEditModal && productToEdit && editFormData && (
				<div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={() => setShowEditModal(false)}>
					<div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-xl transform transition-all flex flex-col" onClick={e => e.stopPropagation()}>
						{/* Modal Header */}
						<div className="flex justify-between items-center p-4 border-b flex-shrink-0">
							<h2 className="text-xl font-semibold text-gray-800">Edit Product</h2>
							<button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-700 transition-colors">
								<i className="material-icons">close</i>
							</button>
						</div>

						{/* Modal Body - Scrollable Form */}
						<form onSubmit={handleUpdateProduct} className='flex-grow overflow-y-auto p-6 space-y-4'>
							{/* Images */}
							<div>
								<p className="font-medium text-gray-700 mb-2">Product Images</p>
								<div className='grid grid-cols-4 gap-3'>
									{[0, 1, 2, 3].map(index => (
										<label key={index} htmlFor={`edit-image-${index}`} className="cursor-pointer block aspect-square">
											<div className="w-full h-full flex items-center justify-center border border-dashed border-gray-400 rounded-lg overflow-hidden bg-gray-50 hover:bg-gray-100 transition relative group">
												{!editImagePreviews[index] ? (
													<span className="material-icons text-gray-400 text-3xl">add_photo_alternate</span>
												) : (
													<img className="w-full h-full object-cover" src={editImagePreviews[index]} alt={`Product ${index + 1}`} />
												)}
												<div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
													<span className="material-icons text-white"> {editImagePreviews[index] ? 'edit' : 'add'} </span>
												</div>
											</div>
											<input
												onChange={(e) => handleEditImageChange(e, index)}
												type="file"
												name={`image${index + 1}`}
												id={`edit-image-${index}`}
												hidden
												accept="image/*"
											/>
										</label>
									))}
								</div>
								<p className="text-xs text-gray-500 mt-1">Click to change images (Uploads replace existing)</p>
							</div>

							{/* Name */}
							<div className='w-full'>
								<label htmlFor="edit-name" className='mb-1 block font-medium text-gray-700 text-sm'>Product Name</label>
								<input
									onChange={handleEditFormChange}
									value={editFormData.name}
									className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500'
									type="text" placeholder='Type here' name="name" id="edit-name" required
								/>
							</div>

							{/* Description */}
							<div className='w-full'>
								<label htmlFor="edit-description" className='mb-1 block font-medium text-gray-700 text-sm'>Product Description</label>
								<textarea
									onChange={handleEditFormChange}
									value={editFormData.description}
									className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500'
									placeholder='Write content here' name="description" id="edit-description" rows="4" required
								></textarea>
							</div>

							{/* Category, Subcategory, Price, Stock */}
							<div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full'>
								<div>
									<label htmlFor="edit-category" className='mb-1 block font-medium text-gray-700 text-sm'>Category</label>
									<select
										name="categoryId"
										id="edit-category"
										onChange={handleEditFormChange}
										value={editFormData.categoryId}
										className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white'
										required
									>
										<option value="">Select Category</option>
										{editCategories.map(category => (
											<option key={category._id} value={category._id}>{category.name}</option>
										))}
									</select>
								</div>
								<div>
									<label htmlFor="edit-subcategory" className='mb-1 block font-medium text-gray-700 text-sm'>Subcategory</label>
									<select
										name="subcategoryId"
										id="edit-subcategory"
										onChange={handleEditFormChange}
										value={editFormData.subcategoryId}
										className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white'
										required
										disabled={!editFormData.categoryId || editFilteredSubcategories.length === 0}
									>
										<option value="">Select Subcategory</option>
										{editFilteredSubcategories.map(subcategory => (
											<option key={subcategory._id} value={subcategory._id}>{subcategory.name}</option>
										))}
									</select>
									{editFormData.categoryId && editFilteredSubcategories.length === 0 && (
										<p className="text-xs text-red-500 mt-1">No subcategories for selected category</p>
									)}
								</div>
								<div>
									<label htmlFor="edit-price" className='mb-1 block font-medium text-gray-700 text-sm'>Price ({currency})</label>
									<input
										name="price"
										id="edit-price"
										onChange={handleEditFormChange}
										value={editFormData.price}
										className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500'
										type="number" placeholder='0.00' min="0" step="0.01" required
									/>
								</div>
								<div>
									<label htmlFor="edit-stock" className='mb-1 block font-medium text-gray-700 text-sm'>Stock</label>
									<input
										name="stock"
										id="edit-stock"
										onChange={handleEditFormChange}
										value={editFormData.stock}
										className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500'
										type="number" placeholder='0' min="0" required
									/>
								</div>
							</div>

							{/* Sizes */}
							<div>
								<p className='mb-1 font-medium text-gray-700 text-sm'>Product sizes</p>
								<div className='flex flex-wrap gap-2'>
									{["S", "M", "L", "XL", "XXL"].map(size => (
										<button
											type="button" // Important: prevent form submission
											key={size}
											onClick={() => handleEditSizeChange(size)}
											className={`px-3 py-1 cursor-pointer rounded-md transition-colors text-sm ${editFormData.sizes.includes(size)
												? "bg-orange-500 text-white ring-1 ring-orange-600"
												: "bg-gray-200 text-gray-700 hover:bg-gray-300"
												}`}
										>
											{size}
										</button>
									))}
								</div>
							</div>

							{/* Bestseller & Active */}
							<div className='flex flex-wrap gap-6'>
								<div className="flex items-center gap-2">
									<input
										onChange={handleEditFormChange}
										checked={editFormData.bestseller}
										className='w-4 h-4 cursor-pointer accent-orange-500'
										type="checkbox" name="bestseller" id="edit-bestseller"
									/>
									<label className='cursor-pointer text-sm' htmlFor="edit-bestseller">Featured (Bestseller)</label>
								</div>
								<div className="flex items-center gap-2">
									<input
										onChange={handleEditFormChange}
										checked={editFormData.isActive}
										className='w-4 h-4 cursor-pointer accent-orange-500'
										type="checkbox" name="isActive" id="edit-isActive"
									/>
									<label className='cursor-pointer text-sm' htmlFor="edit-isActive">Active product</label>
								</div>
							</div>

							{/* Modal Footer - Actions */}
							<div className="pt-4 border-t flex justify-end gap-3 mt-auto flex-shrink-0">
								<button
									type="button"
									onClick={() => setShowEditModal(false)}
									className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
								>
									Cancel
								</button>
								<button
									type='submit'
									className='px-5 py-2 bg-orange-500 text-white rounded-md transition-colors hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2'
									disabled={editLoading}
								>
									{editLoading ? (
										<>
											<span className="material-icons animate-spin text-base">refresh</span>
											Updating...
										</>
									) : (
										<>
											<span className="material-icons text-base">save</span>
											Save Changes
										</>
									)}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Delete Confirmation Modal */}
			{showDeleteConfirm && productToDelete && (
				<div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50">
					<div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl transform transition-all" onClick={e => e.stopPropagation()}>
						<div className="flex items-center gap-2 mb-4">
							<div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
								<i className="material-icons text-red-600" style={{ fontSize: '16px' }}>delete</i>
							</div>
							<h3 className="text-lg font-semibold text-gray-800">Delete Product</h3>
						</div>

						<div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
							<p className="text-red-700 text-sm">
								Warning: This action cannot be undone. The product will be permanently removed from your inventory.
							</p>
						</div>

						<div className="flex items-center gap-4 p-3 bg-gray-50 border border-gray-200 rounded-md mb-4">
							<img
								src={productToDelete.image[0]}
								alt={productToDelete.name}
								className="w-16 h-16 rounded-md object-cover"
							/>
							<div>
								<p className="font-medium text-gray-900">{productToDelete.name}</p>
								<p className="text-sm text-gray-500 mt-1">ID: {productToDelete._id}</p>
								<div className="flex items-center mt-2">
									{productToDelete.isActive ? (
										<div className="flex items-center px-2 py-1 bg-green-50 border border-green-200 text-green-700 rounded-full text-xs">
											<span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
											<span className="font-medium">Active</span>
										</div>
									) : (
										<div className="flex items-center px-2 py-1 bg-red-50 border border-red-200 text-red-700 rounded-full text-xs">
											<span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5"></span>
											<span className="font-medium">Inactive</span>
										</div>
									)}
								</div>
							</div>
						</div>

						<div className="flex justify-end gap-3">
							<button
								onClick={() => setShowDeleteConfirm(false)}
								className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
							>
								Cancel
							</button>
							<button
								onClick={removeProduct}
								disabled={deleteLoading}
								className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-300 flex items-center gap-2"
							>
								{deleteLoading ? (
									<>
										<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
										<span>Deleting...</span>
									</>
								) : (
									<>
										<i className="material-icons" style={{ fontSize: '16px' }}>delete_forever</i>
										<span>Delete Product</span>
									</>
								)}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

export default List