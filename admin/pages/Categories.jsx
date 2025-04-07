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

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await axios.get(`${backendUrl}/api/categories`, {
                headers: { token }
            });
            if (response.data.success) {
                setCategories(response.data.categories);
            }
        } catch (error) {
            toast.error('Error fetching categories');
            console.error(error);
        } finally {
            setLoading(false);
        }
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
                        className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex gap-4 items-center">
                                {category.image && (
                                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                                        <img
                                            src={category.image}
                                            alt={category.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                                <h3 className="text-xl font-semibold">{category.name}</h3>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setEditingCategory(category);
                                        if (category.image) {
                                            setEditPreviewImage(category.image);
                                        }
                                    }}
                                    className="text-blue-500 hover:text-blue-600"
                                >
                                    <span className="material-icons">edit</span>
                                </button>
                                <button
                                    onClick={() => handleDeleteCategory(category._id)}
                                    className="text-red-500 hover:text-red-600"
                                >
                                    <span className="material-icons">delete</span>
                                </button>
                            </div>
                        </div>
                        <p className="text-gray-600">{category.description}</p>
                        <div className="mt-4 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                                <span className="material-icons text-xs">inventory_2</span>
                                <p>Products: {category.productCount || 0}</p>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="material-icons text-xs">tag</span>
                                <p>Subcategories: {category.subcategoryCount || 0}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Category Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
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
                <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
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