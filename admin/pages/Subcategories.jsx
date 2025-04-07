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

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [subcategoriesRes, categoriesRes] = await Promise.all([
                axios.get(`${backendUrl}/api/subcategories`, { headers: { token } }),
                axios.get(`${backendUrl}/api/categories`, { headers: { token } })
            ]);

            if (subcategoriesRes.data.success) {
                setSubcategories(subcategoriesRes.data.subcategories);
            }
            if (categoriesRes.data.success) {
                setCategories(categoriesRes.data.categories);
                if (categoriesRes.data.categories.length > 0 && !newSubcategory.categoryId) {
                    setNewSubcategory(prev => ({
                        ...prev,
                        categoryId: categoriesRes.data.categories[0]._id
                    }));
                }
            }
        } catch (error) {
            toast.error('Error fetching data');
            console.error(error);
        } finally {
            setLoading(false);
        }
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subcategories.map((subcategory) => (
                    <div
                        key={subcategory._id}
                        className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <div className="flex gap-4 items-center">
                                    {subcategory.image && (
                                        <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                                            <img
                                                src={subcategory.image}
                                                alt={subcategory.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="text-xl font-semibold">{subcategory.name}</h3>
                                        <p className="text-sm text-gray-500 flex items-center gap-1">
                                            <span className="material-icons text-xs">category</span>
                                            {categories.find(c => c._id === subcategory.categoryId)?.name || 'Unknown'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setEditingSubcategory(subcategory);
                                        if (subcategory.image) {
                                            setEditPreviewImage(subcategory.image);
                                        }
                                    }}
                                    className="text-blue-500 hover:text-blue-600"
                                >
                                    <span className="material-icons">edit</span>
                                </button>
                                <button
                                    onClick={() => handleDeleteSubcategory(subcategory._id)}
                                    className="text-red-500 hover:text-red-600"
                                >
                                    <span className="material-icons">delete</span>
                                </button>
                            </div>
                        </div>
                        <p className="text-gray-600 mt-2">{subcategory.description}</p>
                        <div className="mt-4 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                                <span className="material-icons text-xs">inventory_2</span>
                                <p>Products: {subcategory.productCount || 0}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Subcategory Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
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
                <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
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