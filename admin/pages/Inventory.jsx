import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { backendUrl, currency } from '../src/App';
import { toast } from 'react-toastify';

const Inventory = ({ token }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [newStock, setNewStock] = useState('');
    const [updating, setUpdating] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [stockFilter, setStockFilter] = useState('all');
    const [exportLoading, setExportLoading] = useState(false);

    // Stock history state
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [stockHistory, setStockHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyProduct, setHistoryProduct] = useState(null);

    // Stock summary
    const [summary, setSummary] = useState({
        inStock: 0,
        lowStock: 0,
        outOfStock: 0
    });

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${backendUrl}/api/product/list`);
            if (response.data.success) {
                // Fetch product details including category names
                const productDetails = await Promise.all(
                    response.data.products.map(async (product) => {
                        try {
                            const detailsResponse = await axios.get(`${backendUrl}/api/product/details/${product._id}`);
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

                setProducts(productDetails);

                // Calculate stock summary
                const summary = productDetails.reduce(
                    (acc, product) => {
                        const stock = product.stock || 0;
                        if (stock === 0) acc.outOfStock++;
                        else if (stock <= 5) acc.lowStock++;
                        else acc.inStock++;
                        return acc;
                    },
                    { inStock: 0, lowStock: 0, outOfStock: 0 }
                );
                setSummary(summary);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error(error);
            toast.error("Error fetching products");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const openUpdateModal = (product) => {
        setSelectedProduct(product);
        setNewStock(product.stock || 0);
        setShowUpdateModal(true);
    };

    // Function to fetch stock history for a product
    const fetchStockHistory = async (product) => {
        setHistoryProduct(product);
        setHistoryLoading(true);
        setShowHistoryModal(true);

        try {
            // Fetch real history data from the backend
            const response = await axios.get(
                `${backendUrl}/api/inventory/history/${product._id}`,
                { headers: { token } }
            );

            if (response.data) {
                // Set the product data for the history modal
                const productData = {
                    _id: product._id,
                    name: product.name,
                    stock: product.stock,
                    categoryName: product.categoryName || 'Unknown Category',
                    categoryId: product.categoryId,
                    image: Array.isArray(product.image) ? product.image[0] : product.image
                };

                setHistoryProduct(productData);

                // Transform inventory history items for the UI
                const historyItems = response.data.map(item => ({
                    id: item._id,
                    date: item.timestamp,
                    action: item.action.charAt(0).toUpperCase() + item.action.slice(1).replace(/_/g, ' '),
                    previous: item.previousStock,
                    new: item.newStock,
                    change: item.change > 0 ? `+${item.change}` : `${item.change}`,
                    user: item.userId ? item.userId.name : 'System',
                    note: item.note || '',
                    orderId: item.orderId ? item.orderId._id : null
                }));

                setStockHistory(historyItems);
            } else {
                toast.error("Failed to fetch stock history");
                setStockHistory([]);
            }
        } catch (error) {
            console.error("Error fetching stock history:", error);
            toast.error("Failed to load stock history");
            setStockHistory([]);
        } finally {
            setHistoryLoading(false);
        }
    };

    // Function to update stock with tracking
    const updateStock = async () => {
        if (newStock === '' || isNaN(Number(newStock)) || Number(newStock) < 0) {
            toast.error("Please enter a valid stock quantity");
            return;
        }

        setUpdating(true);
        try {
            const response = await axios.post(
                `${backendUrl}/api/product/update-stock`,
                {
                    productId: selectedProduct._id,
                    stock: Number(newStock),
                    previousStock: selectedProduct.stock, // Add for tracking
                    note: "Manual stock update" // Add a note for the log
                },
                { headers: { token } }
            );

            if (response.data.success) {
                toast.success("Stock updated successfully");
                setShowUpdateModal(false);

                // Update the product in the local state
                const updatedProducts = products.map(product =>
                    product._id === selectedProduct._id
                        ? { ...product, stock: Number(newStock) }
                        : product
                );
                setProducts(updatedProducts);

                // Update summary
                const updatedSummary = { ...summary };

                // Remove from previous category
                const oldStock = selectedProduct.stock || 0;
                if (oldStock === 0) updatedSummary.outOfStock--;
                else if (oldStock <= 5) updatedSummary.lowStock--;
                else updatedSummary.inStock--;

                // Add to new category
                if (Number(newStock) === 0) updatedSummary.outOfStock++;
                else if (Number(newStock) <= 5) updatedSummary.lowStock++;
                else updatedSummary.inStock++;

                setSummary(updatedSummary);

                // Get the latest product data from backend to ensure everything is sync
                fetchProducts();
            } else {
                toast.error(response.data.message || "Failed to update stock");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error updating stock");
        } finally {
            setUpdating(false);
        }
    };

    // Function to filter products based on search and stock criteria
    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (product.categoryName && product.categoryName.toLowerCase().includes(searchTerm.toLowerCase()));

        if (stockFilter === 'all') return matchesSearch;
        if (stockFilter === 'inStock') return matchesSearch && product.stock > 5;
        if (stockFilter === 'lowStock') return matchesSearch && product.stock > 0 && product.stock <= 5;
        if (stockFilter === 'outOfStock') return matchesSearch && (!product.stock || product.stock === 0);

        return matchesSearch;
    });

    // Sort products
    const sortedProducts = [...filteredProducts].sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'price') return a.price - b.price;
        if (sortBy === 'stock') return (a.stock || 0) - (b.stock || 0);
        return 0;
    });

    // Export inventory data to CSV
    const exportInventoryCSV = async () => {
        setExportLoading(true);
        try {
            // Get CSV data from the backend API
            const response = await axios.get(
                `${backendUrl}/api/inventory/export/csv`,
                {
                    headers: { token },
                    responseType: 'blob' // Important for handling binary data
                }
            );

            // Create a download link for the blob
            const csvUrl = window.URL.createObjectURL(new Blob([response.data]));
            const csvLink = document.createElement('a');
            csvLink.href = csvUrl;
            csvLink.setAttribute('download', `inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(csvLink);
            csvLink.click();
            csvLink.remove();
            window.URL.revokeObjectURL(csvUrl);

            toast.success("Inventory exported as CSV");
        } catch (error) {
            console.error("Error exporting inventory:", error);
            toast.error("Failed to export inventory");
        } finally {
            setExportLoading(false);
        }
    };

    // Export inventory data to Excel (XLSX)
    const exportInventoryExcel = async () => {
        setExportLoading(true);
        try {
            // Get Excel data from the backend API
            const response = await axios.get(
                `${backendUrl}/api/inventory/export/excel`,
                {
                    headers: { token },
                    responseType: 'blob' // Important for handling binary data
                }
            );

            // Create a download link for the blob
            const excelUrl = window.URL.createObjectURL(new Blob([response.data]));
            const excelLink = document.createElement('a');
            excelLink.href = excelUrl;
            excelLink.setAttribute('download', `inventory_export_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(excelLink);
            excelLink.click();
            excelLink.remove();
            window.URL.revokeObjectURL(excelUrl);

            toast.success("Inventory exported as Excel");
        } catch (error) {
            console.error("Error exporting inventory:", error);
            toast.error("Failed to export inventory");
        } finally {
            setExportLoading(false);
        }
    };

    // Format date
    const formatDate = (dateString) => {
        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    return (
        <div className="bg-white rounded-lg shadow-sm p-6 overflow-auto w-full">
            <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
                <h1 className="text-2xl font-semibold text-gray-800">Inventory Management</h1>
                <div className="flex flex-wrap gap-2">
                    <div className="relative group">
                        <button
                            disabled={exportLoading || products.length === 0}
                            className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-md hover:bg-green-100 transition-colors disabled:opacity-50"
                        >
                            {exportLoading ? (
                                <div className="w-4 h-4 border-2 border-green-700 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <i className="material-icons" style={{ fontSize: '18px' }}>file_download</i>
                            )}
                            Export
                            <i className="material-icons" style={{ fontSize: '18px' }}>arrow_drop_down</i>
                        </button>
                        <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 w-48 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300">
                            <ul className="py-1">
                                <li>
                                    <button
                                        onClick={exportInventoryCSV}
                                        className="flex items-center gap-2 px-4 py-2 w-full text-left hover:bg-gray-50 text-sm"
                                    >
                                        <i className="material-icons text-green-600" style={{ fontSize: '16px' }}>description</i>
                                        Export as CSV
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={exportInventoryExcel}
                                        className="flex items-center gap-2 px-4 py-2 w-full text-left hover:bg-gray-50 text-sm"
                                    >
                                        <i className="material-icons text-green-600" style={{ fontSize: '16px' }}>table_chart</i>
                                        Export as Excel
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <button
                        onClick={fetchProducts}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
                    >
                        <i className="material-icons" style={{ fontSize: '18px' }}>refresh</i>
                        Refresh
                    </button>
                </div>
            </div>

            {/* Stock Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-sm text-green-600 font-medium">In Stock</p>
                            <p className="text-2xl font-bold text-green-700">{summary.inStock}</p>
                        </div>
                        <div className="bg-green-100 p-2 rounded-full">
                            <i className="material-icons text-green-600">inventory</i>
                        </div>
                    </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-sm text-yellow-600 font-medium">Low Stock</p>
                            <p className="text-2xl font-bold text-yellow-700">{summary.lowStock}</p>
                        </div>
                        <div className="bg-yellow-100 p-2 rounded-full">
                            <i className="material-icons text-yellow-600">report_problem</i>
                        </div>
                    </div>
                </div>

                <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-sm text-red-600 font-medium">Out of Stock</p>
                            <p className="text-2xl font-bold text-red-700">{summary.outOfStock}</p>
                        </div>
                        <div className="bg-red-100 p-2 rounded-full">
                            <i className="material-icons text-red-600">remove_shopping_cart</i>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Filter Controls */}
            <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <i className="material-icons text-gray-400" style={{ fontSize: '20px' }}>search</i>
                        </div>
                        <input
                            type="text"
                            placeholder="Search products..."
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="w-40">
                    <select
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                        value={stockFilter}
                        onChange={(e) => setStockFilter(e.target.value)}
                    >
                        <option value="all">All Stock</option>
                        <option value="inStock">In Stock</option>
                        <option value="lowStock">Low Stock</option>
                        <option value="outOfStock">Out of Stock</option>
                    </select>
                </div>

                <div className="w-40">
                    <select
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        <option value="name">Sort by Name</option>
                        <option value="price">Sort by Price</option>
                        <option value="stock">Sort by Stock</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500"></div>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-[200px]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {sortedProducts.length > 0 ? (
                                sortedProducts.map((product) => (
                                    <tr key={product._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 flex-shrink-0">
                                                    <img className="h-10 w-10 rounded-md object-cover" src={product.image[0]} alt="" />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {product.name.length > 25 ? `${product.name.substring(0, 25)}...` : product.name}
                                                    </div>
                                                    <div className="text-xs text-gray-500">{product.categoryName || product.categoryId}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{currency}{product.price}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${product.stock > 5
                                                ? 'bg-green-50 border border-green-200 text-green-700'
                                                : product.stock > 0
                                                    ? 'bg-yellow-50 border border-yellow-200 text-yellow-700'
                                                    : 'bg-red-50 border border-red-200 text-red-700'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${product.stock > 5
                                                    ? 'bg-green-500'
                                                    : product.stock > 0
                                                        ? 'bg-yellow-500'
                                                        : 'bg-red-500'
                                                    }`}></span>
                                                <span>{product.stock || 0}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
                                                    onClick={() => fetchStockHistory(product)}
                                                >
                                                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                                    <span className="font-medium">History</span>
                                                </button>
                                                <button
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 border border-orange-200 text-orange-700 rounded-md hover:bg-orange-100 transition-colors"
                                                    onClick={() => openUpdateModal(product)}
                                                >
                                                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                                                    <span className="font-medium">Update</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center">
                                            <i className="material-icons text-gray-300 text-5xl mb-2">inventory_2</i>
                                            {searchTerm || stockFilter !== 'all' ? (
                                                <>
                                                    <p>No products match your search criteria</p>
                                                    <button
                                                        onClick={() => { setSearchTerm(''); setStockFilter('all'); }}
                                                        className="mt-2 text-orange-500 hover:text-orange-600"
                                                    >
                                                        Clear filters
                                                    </button>
                                                </>
                                            ) : (
                                                <p>No products available in your inventory</p>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Stock Update Modal */}
            {showUpdateModal && selectedProduct && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50" onClick={() => !updating && setShowUpdateModal(false)}>
                    <div className="bg-white rounded-lg max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-800">Update Stock</h2>
                            <button
                                onClick={() => !updating && setShowUpdateModal(false)}
                                className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
                                disabled={updating}
                            >
                                <i className="material-icons">close</i>
                            </button>
                        </div>

                        <div className="mb-6">
                            <div className="flex items-center gap-4 mb-4">
                                <img
                                    src={selectedProduct.image[0]}
                                    alt={selectedProduct.name}
                                    className="w-16 h-16 rounded-md object-cover"
                                />
                                <div>
                                    <p className="font-medium">
                                        {selectedProduct.name.length > 30 ? `${selectedProduct.name.substring(0, 30)}...` : selectedProduct.name}
                                    </p>
                                    <p className="text-sm text-gray-500">{selectedProduct.categoryName || selectedProduct.categoryId}</p>
                                    <p className={`text-sm font-medium ${selectedProduct.stock > 5 ? 'text-green-600' :
                                        selectedProduct.stock > 0 ? 'text-yellow-600' :
                                            'text-red-600'
                                        }`}>
                                        Current stock: {selectedProduct.stock || 0}
                                    </p>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">New Stock Quantity</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={newStock}
                                    onChange={(e) => setNewStock(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                                    disabled={updating}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => !updating && setShowUpdateModal(false)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                                disabled={updating}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={updateStock}
                                disabled={updating || newStock === selectedProduct.stock}
                                className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:bg-orange-300"
                            >
                                {updating ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Updating...
                                    </div>
                                ) : (
                                    'Update Stock'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Stock History Modal */}
            {showHistoryModal && historyProduct && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowHistoryModal(false)}>
                    <div className="bg-white rounded-lg max-w-5xl w-full p-6 shadow-xl transform transition-all max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <i className="material-icons text-blue-600" style={{ fontSize: '16px' }}>history</i>
                                </div>
                                <h2 className="text-lg font-semibold text-gray-800">Stock History</h2>
                            </div>
                            <button
                                onClick={() => setShowHistoryModal(false)}
                                className="text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                <i className="material-icons">close</i>
                            </button>
                        </div>

                        <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-6">
                            <div className="flex items-center gap-4">
                                {historyProduct.image && (
                                    <img
                                        src={historyProduct.image}
                                        alt={historyProduct.name}
                                        className="w-16 h-16 rounded-md object-cover border border-gray-200"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = 'https://via.placeholder.com/64?text=No+Image';
                                        }}
                                    />
                                )}
                                <div>
                                    <p className="font-medium text-gray-900">
                                        {historyProduct.name.length > 30 ? `${historyProduct.name.substring(0, 30)}...` : historyProduct.name}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">{historyProduct.categoryName || historyProduct.categoryId}</p>
                                    <div className="flex items-center mt-2">
                                        <div className={`flex items-center px-2 py-1 rounded-full text-xs ${historyProduct.stock > 5
                                            ? 'bg-green-50 border border-green-200 text-green-700'
                                            : historyProduct.stock > 0
                                                ? 'bg-yellow-50 border border-yellow-200 text-yellow-700'
                                                : 'bg-red-50 border border-red-200 text-red-700'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${historyProduct.stock > 5
                                                ? 'bg-green-500'
                                                : historyProduct.stock > 0
                                                    ? 'bg-yellow-500'
                                                    : 'bg-red-500'
                                                }`}></span>
                                            <span className="font-medium">Current stock: {historyProduct.stock || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {historyLoading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 table-fixed">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">Date & Time</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[12%]">Action</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[8%]">Previous</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[8%]">New</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[8%]">Change</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[12%]">User</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[37%]">Note</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {stockHistory.length > 0 ? (
                                            stockHistory.map((item) => (
                                                <tr key={item.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                        {formatDate(item.date)}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.action.includes('Order')
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : item.action.includes('Manual')
                                                                ? 'bg-yellow-100 text-yellow-800'
                                                                : item.action.includes('Status')
                                                                    ? 'bg-purple-100 text-purple-800'
                                                                    : 'bg-green-100 text-green-800'
                                                            }`}>
                                                            {item.action}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                        {item.previous}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                        {item.new}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                        <span className={`font-medium ${item.change.startsWith('+')
                                                            ? 'text-green-600'
                                                            : 'text-red-600'
                                                            }`}>
                                                            {item.change}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                        {item.user}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-500 break-words">
                                                        {item.note}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                                                    No history records found for this product
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;