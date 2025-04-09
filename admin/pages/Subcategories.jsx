import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { backendUrl } from '../src/App';

const Subcategories = ({ token }) => {
    const [subcategories, setSubcategories] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newSubcategory, setNewSubcategory] = useState({ name: '', description: '', categoryId: '', image: null });
    const [previewImage, setPreviewImage] = useState(null);
    const [editingSubcategory, setEditingSubcategory] = useState(null);
    const [editPreviewImage, setEditPreviewImage] = useState(null);
    const [selectedSubcategory, setSelectedSubcategory] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [productsList, setProductsList] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (categories.length > 0 && !selectedCategory) {
            setSelectedCategory(categories[0]._id);
        }
    }, [categories]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch subcategories - Assuming backend populates 'category'
            const subcategoriesRes = await axios.get(`${backendUrl}/api/subcategories`, { headers: { token } });
            let fetchedSubcategories = [];
            if (subcategoriesRes.data.success) {
                // Assuming subcategory.category is populated by the backend
                fetchedSubcategories = subcategoriesRes.data.subcategories;
            } else {
                toast.error("Failed to load subcategories.");
            }

            // Fetch all products to calculate counts
            const productsRes = await axios.get(`${backendUrl}/api/product/list`, { headers: { token } });
            const allProducts = productsRes.data.success ? productsRes.data.products : [];

            // Enhance subcategories with product counts
            const enhancedSubcategories = fetchedSubcategories.map(sub => {
                const subIdStr = sub._id.toString();
                const subcategoryProducts = allProducts.filter(product => product.subcategoryId?.toString() === subIdStr);
                return {
                    ...sub,
                    // category object should already be populated from backend
                    productCount: subcategoryProducts.length
                };
            });

            setSubcategories(enhancedSubcategories);

            // Fetch categories separately for the dropdown in the Add/Edit modals
            const categoriesRes = await axios.get(`${backendUrl}/api/categories`, { headers: { token } });
            if (categoriesRes.data.success) {
                const fetchedCategories = categoriesRes.data.categories;
                setCategories(fetchedCategories);
                // Set default category for add modal
                if (fetchedCategories.length > 0 && !newSubcategory.categoryId) {
                    setNewSubcategory(prev => ({
                        ...prev,
                        categoryId: fetchedCategories[0]._id
                    }));
                }
            } else {
                toast.error("Failed to load categories for dropdown.");
                setCategories([]); // Set empty array on failure
            }

        } catch (error) {
            toast.error('Error fetching initial data');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSubcategoryProducts = async (subcategoryId) => {
        setLoadingProducts(true);
        try {
            const response = await axios.get(`${backendUrl}/api/product/list`, {
                headers: { token },
                params: { subcategoryId }
            });
            if (response.data.success) {
                setProductsList(response.data.products);
            }
        } catch (error) {
            toast.error('Error fetching products');
            console.error(error);
        } finally {
            setLoadingProducts(false);
        }
    };

    const handleViewDetails = async (subcategory) => {
        setSelectedSubcategory(subcategory);
        setShowDetailsModal(true);
        await fetchSubcategoryProducts(subcategory._id);
    };

    const handleImageChange = (e, isEdit = false) => {
        const file = e.target.files[0];
        if (file) {
            if (isEdit) {
                setEditingSubcategory(prev => ({ ...prev, newImage: file }));
                setEditPreviewImage(URL.createObjectURL(file));
            } else {
                setNewSubcategory(prev => ({ ...prev, image: file }));
                setPreviewImage(URL.createObjectURL(file));
            }
        }
    };

    const handleAddSubcategory = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('name', newSubcategory.name);
            formData.append('description', newSubcategory.description);
            formData.append('categoryId', newSubcategory.categoryId);
            if (newSubcategory.image) {
                formData.append('image', newSubcategory.image);
            }

            const response = await axios.post(
                `${backendUrl}/api/subcategories`,
                formData,
                {
                    headers: {
                        token,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            if (response.data.success) {
                toast.success('Subcategory added successfully');
                setShowAddModal(false);
                setNewSubcategory({ name: '', description: '', categoryId: categories[0]?._id || '', image: null });
                setPreviewImage(null);
                fetchData();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error adding subcategory');
        }
    };

    const handleEditSubcategory = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('name', editingSubcategory.name);
            formData.append('description', editingSubcategory.description);
            formData.append('categoryId', editingSubcategory.categoryId);
            if (editingSubcategory.newImage) {
                formData.append('image', editingSubcategory.newImage);
            }

            const response = await axios.put(
                `${backendUrl}/api/subcategories/${editingSubcategory._id}`,
                formData,
                {
                    headers: {
                        token,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            if (response.data.success) {
                toast.success('Subcategory updated successfully');
                setEditingSubcategory(null);
                setEditPreviewImage(null);
                fetchData();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error updating subcategory');
        }
    };

    const handleDeleteSubcategory = async (subcategoryId) => {
        if (window.confirm('Are you sure you want to delete this subcategory?')) {
            try {
                const response = await axios.delete(
                    `${backendUrl}/api/subcategories/${subcategoryId}`,
                    { headers: { token } }
                );
                if (response.data.success) {
                    toast.success('Subcategory deleted successfully');
                    fetchData();
                }
            } catch (error) {
                toast.error(error.response?.data?.message || 'Error deleting subcategory');
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
                <h2 className="text-2xl font-semibold">Subcategories</h2>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors flex items-center gap-2"
                >
                    <span className="material-icons">add</span>
                    Add Subcategory
                </button>
            </div>

            {/* Subcategories Grid */}
            <div className="space-y-8">
                {categories.map(category => {
                    const categorySubcategories = subcategories.filter(sub => sub.categoryId?._id === category._id);
                    if (categorySubcategories.length === 0) return null;

                    return (
                        <div key={category._id} className="space-y-4">
                            <div className="flex items-center gap-2 border-b pb-2">
                                <span className="material-icons text-orange-500">category</span>
                                <h3 className="text-xl font-semibold">{category.name}</h3>
                                <span className="text-sm text-gray-500">({categorySubcategories.length} subcategories)</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {categorySubcategories.map((subcategory) => (
                                    <div
                                        key={subcategory._id}
                                        className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow flex flex-col"
                                    >
                                        <div className="flex flex-col gap-4">
                                            <div className="flex items-start gap-4">
                                                {subcategory.image && (
                                                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                                                        <img
                                                            src={subcategory.image}
                                                            alt={subcategory.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-xl font-semibold truncate" title={subcategory.name}>
                                                        {subcategory.name}
                                                    </h3>
                                                    <p className="text-gray-600 text-sm line-clamp-2 mt-1">
                                                        {subcategory.description}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between mt-2">
                                                <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                                                    <span className="material-icons text-blue-500" style={{ fontSize: '18px' }}>inventory_2</span>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs text-gray-500">Products</span>
                                                        <span className="text-sm font-semibold text-blue-600">{subcategory.productCount || 0}</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => handleViewDetails(subcategory)}
                                                        className="p-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                                        title="View Details"
                                                    >
                                                        <span className="material-icons text-xl">visibility</span>
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setEditingSubcategory(subcategory);
                                                            if (subcategory.image) {
                                                                setEditPreviewImage(subcategory.image);
                                                            }
                                                        }}
                                                        className="p-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                                        title="Edit Subcategory"
                                                    >
                                                        <span className="material-icons text-xl">edit</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteSubcategory(subcategory._id)}
                                                        className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                                        title="Delete Subcategory"
                                                    >
                                                        <span className="material-icons text-xl">delete</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Details Modal */}
            {showDetailsModal && selectedSubcategory && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-xl">
                        <div className="flex justify-between items-center p-6 border-b">
                            <div>
                                <h3 className="text-xl font-semibold">{selectedSubcategory.name}</h3>
                                <p className="text-sm text-gray-500">Category: {selectedSubcategory.categoryId?.name}</p>
                            </div>
                            <button onClick={() => setShowDetailsModal(false)} className="text-gray-500 hover:text-gray-700">
                                <span className="material-icons">close</span>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
                            <div className="grid grid-cols-1 gap-6">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="font-medium mb-4 text-lg text-gray-800 border-b pb-2">Subcategory Details</h4>
                                    <div className="space-y-3">
                                        <p className="flex items-center gap-2">
                                            <span className="font-medium text-gray-700 w-24 flex-shrink-0">Category:</span>
                                            <span className="text-gray-900 font-semibold">{selectedSubcategory.categoryId?.name || <span className='text-red-500'>Missing Category</span>}</span>
                                        </p>
                                        <p className="flex items-start gap-2">
                                            <span className="font-medium text-gray-700 w-24 flex-shrink-0">Description:</span>
                                            <span className="text-gray-900">{selectedSubcategory.description || <span className="text-gray-400 italic">No description</span>}</span>
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <span className="font-medium text-gray-700 w-24 flex-shrink-0">Total Products:</span>
                                            <span className="text-gray-900 font-semibold">{productsList.length}</span>
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <span className="font-medium text-gray-700 w-24 flex-shrink-0">Created:</span>
                                            <span className="text-gray-900">{new Date(selectedSubcategory.createdAt).toLocaleDateString()}</span>
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-medium mb-4 text-lg text-gray-800 border-b pb-2">Products in this Subcategory</h4>
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
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tr-lg">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {productsList.map((product) => (
                                                            <tr key={product._id} className="hover:bg-gray-50">
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="flex items-center">
                                                                        <div className="h-10 w-10 flex-shrink-0">
                                                                            <img className="h-10 w-10 rounded-full object-cover" src={product.image[0]} alt="" />
                                                                        </div>
                                                                        <div className="ml-4">
                                                                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                                                            <div className="text-sm text-gray-500">{product.description?.substring(0, 50)}...</div>
                                                                        </div>
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
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            No products found in this subcategory
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Subcategory Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold">Add New Subcategory</h3>
                            <button onClick={() => {
                                setShowAddModal(false);
                                setNewSubcategory({ name: '', description: '', categoryId: categories[0]?._id || '', image: null });
                                setPreviewImage(null);
                            }} className="text-gray-500 hover:text-gray-700">
                                <span className="material-icons">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleAddSubcategory}>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    value={newSubcategory.name}
                                    onChange={(e) => setNewSubcategory({ ...newSubcategory, name: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    Category
                                </label>
                                <select
                                    value={newSubcategory.categoryId}
                                    onChange={(e) => setNewSubcategory({ ...newSubcategory, categoryId: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500"
                                    required
                                >
                                    <option value="">Select a category</option>
                                    {categories.map((category) => (
                                        <option key={category._id} value={category._id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={newSubcategory.description}
                                    onChange={(e) => setNewSubcategory({ ...newSubcategory, description: e.target.value })}
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
                                                <img className="w-full h-full object-cover" src={previewImage} alt="Subcategory" />
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
                                        <p>Upload a subcategory image</p>
                                        <p>Recommended: 300x300px</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddModal(false);
                                        setNewSubcategory({ name: '', description: '', categoryId: categories[0]?._id || '', image: null });
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
                                    Add Subcategory
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Subcategory Modal */}
            {editingSubcategory && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold">Edit Subcategory</h3>
                            <button onClick={() => {
                                setEditingSubcategory(null);
                                setEditPreviewImage(null);
                            }} className="text-gray-500 hover:text-gray-700">
                                <span className="material-icons">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleEditSubcategory}>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    value={editingSubcategory.name}
                                    onChange={(e) => setEditingSubcategory({ ...editingSubcategory, name: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    Category
                                </label>
                                <select
                                    value={editingSubcategory.categoryId}
                                    onChange={(e) => setEditingSubcategory({ ...editingSubcategory, categoryId: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500"
                                    required
                                >
                                    {categories.map((category) => (
                                        <option key={category._id} value={category._id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={editingSubcategory.description}
                                    onChange={(e) => setEditingSubcategory({ ...editingSubcategory, description: e.target.value })}
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
                                                <img className="w-full h-full object-cover" src={editPreviewImage} alt="Subcategory" />
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
                                        <p>Update the subcategory image</p>
                                        <p>Recommended: 300x300px</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingSubcategory(null);
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
                                    Update Subcategory
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Subcategories; 