import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { backendUrl } from '../src/App';

const Categories = ({ token }) => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newCategory, setNewCategory] = useState({ name: '', description: '', image: null });
    const [previewImage, setPreviewImage] = useState(null);
    const [editingCategory, setEditingCategory] = useState(null);
    const [editPreviewImage, setEditPreviewImage] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [productsList, setProductsList] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            // Fetch categories - Assuming backend populates 'subcategories'
            const categoriesRes = await axios.get(`${backendUrl}/api/categories`, { headers: { token } });
            let fetchedCategories = [];
            if (categoriesRes.data.success) {
                fetchedCategories = categoriesRes.data.categories;
            } else {
                toast.error("Failed to load categories.");
            }

            // Fetch all products to calculate counts (frontend calculation)
            const productsRes = await axios.get(`${backendUrl}/api/product/list`, { headers: { token } });
            const allProducts = productsRes.data.success ? productsRes.data.products : [];

            // Enhance categories with product counts
            const enhancedCategories = fetchedCategories.map(category => {
                const categoryIdStr = category._id.toString();
                const categoryProducts = allProducts.filter(product => product.categoryId?.toString() === categoryIdStr);
                // Assume category.subcategories is populated by backend
                const subcategoryCount = category.subcategories?.length || 0;

                return {
                    ...category,
                    // subcategories array should already be populated from backend
                    productCount: categoryProducts.length,
                    subcategoryCount: subcategoryCount
                };
            });

            setCategories(enhancedCategories);

            // We might still need a flat list of subcategories for other purposes, 
            // but let's fetch it separately if needed, or rely on the populated data.
            // For now, let's remove setting subcategoriesList here if categories endpoint provides them.
            // If needed later, we can add a separate fetch for all subcategories.
            // setSubcategoriesList(...) 

        } catch (error) {
            toast.error('Error fetching initial category data');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategoryProducts = async (categoryId) => {
        setLoadingProducts(true);
        try {
            const response = await axios.get(`${backendUrl}/api/product/list`, {
                headers: { token },
                params: { categoryId }
            });
            if (response.data.success) {
                setProductsList(response.data.products);
            } else {
                toast.error('Error fetching products for this category');
                setProductsList([]); // Clear list on error
            }
        } catch (error) {
            toast.error('Error fetching products');
            console.error(error);
            setProductsList([]); // Clear list on error
        } finally {
            setLoadingProducts(false);
        }
    };

    const handleViewDetails = async (category) => {
        setSelectedCategory(category);
        setShowDetailsModal(true);
        await fetchCategoryProducts(category._id);
    };

    const handleImageChange = (e, isEdit = false) => {
        const file = e.target.files[0];
        if (file) {
            if (isEdit) {
                setEditingCategory(prev => ({ ...prev, newImage: file }));
                setEditPreviewImage(URL.createObjectURL(file));
            } else {
                setNewCategory(prev => ({ ...prev, image: file }));
                setPreviewImage(URL.createObjectURL(file));
            }
        }
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('name', newCategory.name);
            formData.append('description', newCategory.description);
            if (newCategory.image) {
                formData.append('image', newCategory.image);
            }

            const response = await axios.post(
                `${backendUrl}/api/categories`,
                formData,
                {
                    headers: {
                        token,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            if (response.data.success) {
                toast.success('Category added successfully');
                setShowAddModal(false);
                setNewCategory({ name: '', description: '', image: null });
                setPreviewImage(null);
                fetchCategories();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error adding category');
        }
    };

    const handleEditCategory = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('name', editingCategory.name);
            formData.append('description', editingCategory.description);
            if (editingCategory.newImage) {
                formData.append('image', editingCategory.newImage);
            }

            const response = await axios.put(
                `${backendUrl}/api/categories/${editingCategory._id}`,
                formData,
                {
                    headers: {
                        token,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            if (response.data.success) {
                toast.success('Category updated successfully');
                setEditingCategory(null);
                setEditPreviewImage(null);
                fetchCategories();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error updating category');
        }
    };

    const handleDeleteCategory = async (categoryId) => {
        if (window.confirm('Are you sure you want to delete this category?')) {
            try {
                const response = await axios.delete(
                    `${backendUrl}/api/categories/${categoryId}`,
                    { headers: { token } }
                );
                if (response.data.success) {
                    toast.success('Category deleted successfully');
                    fetchCategories();
                }
            } catch (error) {
                toast.error(error.response?.data?.message || 'Error deleting category');
            }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Categories</h2>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors flex items-center gap-2"
                >
                    <span className="material-icons">add</span>
                    Add Category
                </button>
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category) => (
                    <div
                        key={category._id}
                        className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow flex flex-col"
                    >
                        <div className="flex flex-col gap-4">
                            <div className="flex items-start gap-4">
                                {category.image && (
                                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                                        <img
                                            src={category.image}
                                            alt={category.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-xl font-semibold truncate" title={category.name}>
                                        {category.name}
                                    </h3>
                                    <p className="text-gray-600 text-sm line-clamp-2 mt-1">
                                        {category.description}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100">
                                    <span className="material-icons text-orange-500" style={{ fontSize: '18px' }}>category</span>
                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-500">Subcategories</span>
                                        <span className="text-sm font-semibold text-orange-600">{category.subcategoryCount || 0}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                                    <span className="material-icons text-blue-500" style={{ fontSize: '18px' }}>inventory_2</span>
                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-500">Products</span>
                                        <span className="text-sm font-semibold text-blue-600">{category.productCount || 0}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="flex justify-center gap-1">
                                <button
                                    onClick={() => handleViewDetails(category)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm"
                                    title="View Details"
                                >
                                    <span className="material-icons text-xl">visibility</span>
                                    <span>View</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setEditingCategory(category);
                                        if (category.image) {
                                            setEditPreviewImage(category.image);
                                        }
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm"
                                    title="Edit Category"
                                >
                                    <span className="material-icons text-xl">edit</span>
                                    <span>Edit</span>
                                </button>
                                <button
                                    onClick={() => handleDeleteCategory(category._id)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
                                    title="Delete Category"
                                >
                                    <span className="material-icons text-xl">delete</span>
                                    <span>Delete</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Details Modal */}
            {showDetailsModal && selectedCategory && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-xl">
                        <div className="flex justify-between items-center p-6 border-b">
                            <div>
                                <h3 className="text-xl font-semibold">{selectedCategory.name}</h3>
                                <p className="text-sm text-gray-500">{selectedCategory.subcategoryCount} Subcategories</p>
                            </div>
                            <button onClick={() => setShowDetailsModal(false)} className="text-gray-500 hover:text-gray-700">
                                <span className="material-icons">close</span>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
                            <div className="grid grid-cols-1 gap-6">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="font-medium mb-2">Category Details</h4>
                                    <div className="space-y-2">
                                        <p><span className="font-medium">Description:</span> {selectedCategory.description || 'No description'}</p>
                                        <p><span className="font-medium">Total Products:</span> {productsList.length}</p>
                                        <p><span className="font-medium">Created:</span> {new Date(selectedCategory.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                {/* Subcategories Section */}
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="font-medium mb-4 text-lg text-gray-800">Subcategories ({selectedCategory.subcategoryCount || 0})</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                        {selectedCategory.subcategories && selectedCategory.subcategories.length > 0 ? (
                                            selectedCategory.subcategories.map(subcategory => {
                                                // Calculate product count for this specific subcategory within the modal's product list
                                                const subcategoryProductCount = productsList.filter(p => p.subcategoryId === subcategory._id).length;

                                                return (
                                                    <div key={subcategory._id} className="bg-white p-4 rounded-lg border shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                                                        <div>
                                                            <div className="flex items-center gap-3 mb-2">
                                                                {subcategory.image ? (
                                                                    <img src={subcategory.image} alt={subcategory.name} className="w-10 h-10 rounded-full object-cover border" />
                                                                ) : (
                                                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                                                                        <span className="material-icons">category</span>
                                                                    </div>
                                                                )}
                                                                <div>
                                                                    <h5 className="font-semibold text-gray-800 text-sm leading-tight">{subcategory.name}</h5>
                                                                </div>
                                                            </div>
                                                            {subcategory.description && (
                                                                <p className="mb-2 text-xs text-gray-600 leading-snug">{subcategory.description}</p>
                                                            )}
                                                        </div>
                                                        <div className="mt-auto pt-2 border-t border-gray-100">
                                                            <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                                                                <span className="material-icons text-orange-500" style={{ fontSize: '14px' }}>inventory_2</span>
                                                                {subcategoryProductCount} products
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="col-span-full text-center py-6 text-gray-400">
                                                <span className="material-icons text-4xl mb-2">sentiment_dissatisfied</span>
                                                <p>No subcategories associated with this category.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Products Section - Renders productsList fetched by fetchCategoryProducts */}
                                <div>
                                    <h4 className="font-medium mb-4 text-lg text-gray-800 border-b pb-2">Products in this Category ({productsList.length})</h4>
                                    {loadingProducts ? (
                                        <div className="flex justify-center py-8">
                                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
                                        </div>
                                    ) : productsList.length > 0 ? (
                                        <div className="bg-white rounded-lg border shadow-sm">
                                            <div className="overflow-hidden">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead>
                                                        <tr className="bg-gray-50">
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tl-lg">Product</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subcategory</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tr-lg">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {productsList.map((product) => {
                                                            // Find subcategory name from the parent category's populated subcategories
                                                            const subcategoryName = selectedCategory.subcategories?.find(sub => sub._id === product.subcategoryId)?.name || 'N/A';
                                                            return (
                                                                <tr key={product._id} className="hover:bg-gray-50">
                                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                                        <div className="flex items-center">
                                                                            <div className="h-10 w-10 flex-shrink-0">
                                                                                {/* Ensure product has image and image is an array */}
                                                                                <img className="h-10 w-10 rounded-full object-cover" src={product.image?.[0]} alt="" />
                                                                            </div>
                                                                            <div className="ml-4">
                                                                                <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                                                                <div className="text-sm text-gray-500">{product.description?.substring(0, 50)}...</div>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                                        <div className="text-sm text-gray-900">
                                                                            {subcategoryName}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                                        <div className="text-sm text-gray-900">₹{product.price}</div>
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                                        <div className="text-sm text-gray-900">{product.stock}</div>
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.isActive
                                                                            ? 'bg-green-100 text-green-800'
                                                                            : 'bg-red-100 text-red-800'
                                                                            }`}>
                                                                            {product.isActive ? 'Active' : 'Inactive'}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            No products found in this category
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Category Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold">Add New Category</h3>
                            <button onClick={() => {
                                setShowAddModal(false);
                                setNewCategory({ name: '', description: '', image: null });
                                setPreviewImage(null);
                            }} className="text-gray-500 hover:text-gray-700">
                                <span className="material-icons">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleAddCategory}>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    value={newCategory.name}
                                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={newCategory.description}
                                    onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500"
                                    rows="3"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    Image (optional)
                                </label>
                                <div className="flex gap-4 items-center">
                                    <label className="cursor-pointer">
                                        <div className="w-20 h-20 flex items-center justify-center border border-dashed border-gray-400 rounded-lg overflow-hidden bg-gray-50 hover:bg-gray-100 transition">
                                            {!previewImage ? (
                                                <span className="material-icons text-gray-400">add_photo_alternate</span>
                                            ) : (
                                                <img className="w-full h-full object-cover" src={previewImage} alt="Category" />
                                            )}
                                        </div>
                                        <input
                                            type="file"
                                            onChange={(e) => handleImageChange(e)}
                                            className="hidden"
                                            accept="image/*"
                                        />
                                    </label>
                                    <div className="text-sm text-gray-500">
                                        <p>Upload a category image</p>
                                        <p>Recommended: 300x300px</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddModal(false);
                                        setNewCategory({ name: '', description: '', image: null });
                                        setPreviewImage(null);
                                    }}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
                                >
                                    Add Category
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Category Modal */}
            {editingCategory && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold">Edit Category</h3>
                            <button onClick={() => {
                                setEditingCategory(null);
                                setEditPreviewImage(null);
                            }} className="text-gray-500 hover:text-gray-700">
                                <span className="material-icons">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleEditCategory}>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    value={editingCategory.name}
                                    onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={editingCategory.description}
                                    onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500"
                                    rows="3"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    Image
                                </label>
                                <div className="flex gap-4 items-center">
                                    <label className="cursor-pointer">
                                        <div className="w-20 h-20 flex items-center justify-center border border-dashed border-gray-400 rounded-lg overflow-hidden bg-gray-50 hover:bg-gray-100 transition">
                                            {!editPreviewImage ? (
                                                <span className="material-icons text-gray-400">add_photo_alternate</span>
                                            ) : (
                                                <img className="w-full h-full object-cover" src={editPreviewImage} alt="Category" />
                                            )}
                                        </div>
                                        <input
                                            type="file"
                                            onChange={(e) => handleImageChange(e, true)}
                                            className="hidden"
                                            accept="image/*"
                                        />
                                    </label>
                                    <div className="text-sm text-gray-500">
                                        <p>Update the category image</p>
                                        <p>Recommended: 300x300px</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingCategory(null);
                                        setEditPreviewImage(null);
                                    }}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
                                >
                                    Update Category
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Categories; 
