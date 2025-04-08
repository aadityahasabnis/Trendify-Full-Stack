import React, { useEffect, useState } from 'react'
import { backendUrl, currency } from '../src/App';
import axios from 'axios';
import { toast } from 'react-toastify';

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
							const detailsResponse = await axios.get(`${backendUrl}/api/product/details/${product._id}`, {
								headers: { token }
							});
							if (detailsResponse.data.success) {
								return detailsResponse.data.product;
							}
							return product;
						} catch (error) {
							console.error(`Error fetching details for product ${product._id}:`, error);
							return product;
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
	}, []);

	// Fetch product reviews and orders when a product is selected
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
				setSelectedProduct(detailsResponse.data.product);
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
			const response = await axios.post(
				`${backendUrl}/api/product/remove`,
				{ id: productToDelete._id },
				{ headers: { token } }
			);

			if (response.data.success) {
				toast.success(response.data.message);
				setShowDeleteConfirm(false);
				setProductToDelete(null);

				// If the deleted product is currently being viewed, close the modal
				if (selectedProduct && selectedProduct._id === productToDelete._id) {
					setShowModal(false);
					setSelectedProduct(null);
				}

				await fetchList();
			} else {
				toast.error(response.data.message);
			}
		} catch (error) {
			console.error(error);
			toast.error("Something went wrong while removing the product.");
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

				// Update the selected product if it's the one being modified
				if (selectedProduct && selectedProduct._id === id) {
					setSelectedProduct({ ...selectedProduct, isActive });
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
					>
						<i className="material-icons" style={{ fontSize: '18px' }}>refresh</i>
						<span className="hidden sm:inline text-sm">Refresh</span>
					</button>
				</div>
			</div>

			{loading ? (
				<div className="flex justify-center items-center h-64">
					<div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500"></div>
				</div>
			) : (
				<div className="overflow-x-auto bg-white rounded-lg">
					<table className="min-w-full divide-y divide-gray-200">
						<thead>
							<tr className="bg-gray-50">
								<th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
								<th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Category</th>
								<th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Price</th>
								<th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Stock</th>
								<th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									<div className="flex items-center">
										<span>Status</span>
										<span className="ml-1 w-2 h-2 rounded-full bg-gray-300"></span>
									</div>
								</th>
								<th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{filteredList.length > 0 ? (
								filteredList.map((item) => (
									<tr
										key={item._id}
										className={`hover:bg-gray-50 cursor-pointer transition-colors ${!item.isActive ? 'bg-gray-50 opacity-75' : ''}`}
									>
										<td
											className="px-3 sm:px-6 py-4 whitespace-nowrap"
											onClick={() => openProductModal(item)}
										>
											<div className="flex items-center">
												<div className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
													<img className={`h-8 w-8 sm:h-10 sm:w-10 rounded-md object-cover ${!item.isActive ? 'grayscale' : ''}`} src={item.image[0]} alt="" />
												</div>
												<div className="ml-3 sm:ml-4">
													<div className={`text-sm font-medium ${!item.isActive ? 'text-gray-500' : 'text-gray-900'}`}>{item.name}</div>
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
											className="px-3 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell"
											onClick={() => openProductModal(item)}
										>
											<div className="text-sm font-medium text-gray-900">{item.categoryName || item.categoryId}</div>
											<div className="text-xs text-gray-500">{item.subcategoryName || item.subcategoryId}</div>
										</td>
										<td
											className="px-3 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell"
											onClick={() => openProductModal(item)}
										>
											<div className="text-sm font-medium text-gray-900">{currency}{item.price}</div>
										</td>
										<td
											className="px-3 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell"
											onClick={() => openProductModal(item)}
										>
											<div className={`text-sm font-medium ${item.stock > 5 ? 'text-green-600' : item.stock > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
												{item.stock || 0}
											</div>
										</td>
										<td
											className="px-3 sm:px-6 py-4 whitespace-nowrap"
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
											<div className="flex justify-end gap-1 sm:gap-2">
												<button
													onClick={(e) => {
														e.stopPropagation();
														updateProductStatus(item._id, !item.isActive);
													}}
													className={`py-1 px-2 sm:py-1.5 sm:px-3 rounded-md flex items-center gap-1 sm:gap-1.5 ${item.isActive
														? 'bg-red-50 border border-red-200 text-red-700 hover:bg-red-100'
														: 'bg-green-50 border border-green-200 text-green-700 hover:bg-green-100'
														}`}
													title={item.isActive ? 'Deactivate Product' : 'Activate Product'}
												>
													<span className="w-2 h-2 rounded-full inline-block" style={{
														backgroundColor: item.isActive ? '#EF4444' : '#10B981'
													}}></span>
													<span className="text-xs font-medium">
														{item.isActive ? 'Deactivate' : 'Activate'}
													</span>
												</button>
												<button
													onClick={(e) => {
														e.stopPropagation();
														openProductModal(item);
													}}
													className="py-1 px-2 sm:py-1.5 sm:px-3 rounded-md flex items-center gap-1 sm:gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100"
													title="View Details"
												>
													<span className="w-2 h-2 bg-blue-500 rounded-full"></span>
													<span className="text-xs font-medium">Details</span>
												</button>
												<button
													onClick={(e) => {
														e.stopPropagation();
														openDeleteConfirmation(item);
													}}
													className="py-1 px-2 sm:py-1.5 sm:px-3 rounded-md flex items-center gap-1 sm:gap-1.5 bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100"
													title="Delete"
												>
													<span className="w-2 h-2 bg-gray-500 rounded-full"></span>
													<span className="text-xs font-medium">Delete</span>
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
										<div className="grid grid-cols-2 gap-2 mb-4">
											{selectedProduct.image.map((img, idx) => (
												<img
													key={idx}
													src={img}
													alt={`${selectedProduct.name} - ${idx + 1}`}
													className="aspect-square object-cover rounded-md border border-gray-200"
												/>
											))}
										</div>

										<div className="mt-4">
											<h3 className="text-sm font-medium text-gray-500">Sizes</h3>
											<div className="flex flex-wrap gap-2 mt-1">
												{selectedProduct.sizes?.map((size, idx) => (
													<span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
														{size}
													</span>
												))}
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

										<div className="mb-4">
											<h4 className="text-sm font-medium text-gray-500 mb-1">Category</h4>
											<p className="text-sm">{selectedProduct.categoryName || 'Unknown Category'}</p>
										</div>

										<div className="mb-4">
											<h4 className="text-sm font-medium text-gray-500 mb-1">Subcategory</h4>
											<p className="text-sm">{selectedProduct.subcategoryName || 'Unknown Subcategory'}</p>
										</div>

										<div className="mb-4">
											<h4 className="text-sm font-medium text-gray-500 mb-1">Added On</h4>
											<p className="text-sm">{formatDate(selectedProduct.date)}</p>
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