import React, { useEffect, useState, useRef } from 'react'
import axios from 'axios';
import { backendUrl, currency } from './../src/App';
import { toast } from 'react-toastify';
import { assets } from '../assets/assets';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const Orders = ({ token }) => {
  // Main data states
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderTimeline, setOrderTimeline] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  // UI control states
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [orderNote, setOrderNote] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5); // Set default page size to 5
  const [totalOrders, setTotalOrders] = useState(0);

  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' });
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('date-desc');
  const [ageingFilter, setAgeingFilter] = useState('all');
  const [customerTypeFilter, setCustomerTypeFilter] = useState('all');
  const [filterVisible, setFilterVisible] = useState(false);

  // Analytics data
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    avgOrderValue: 0,
    totalOrders: 0,
    pendingOrders: 0,
    deliveredOrders: 0
  });

  // UI refs
  const invoiceRef = useRef(null);

  // State for items modal visibility
  const [showItemsModal, setShowItemsModal] = useState(false);
  // State for items to display in the modal
  const [itemsToShow, setItemsToShow] = useState([]);
  // Store Order ID for modal title
  const [currentItemOrderId, setCurrentItemOrderId] = useState('');

  // Main data fetching function
  const fetchOrders = async (page = currentPage) => {
    if (!token) return null;

    setLoading(true);
    try {
      const response = await axios.post(
        `${backendUrl}/api/order/list`,
        { page, limit: pageSize },
        { headers: { token } }
      );

      if (response.data.success) {
        const orderData = response.data.orders;
        setOrders(orderData);
        setFilteredOrders(orderData);
        setTotalOrders(response.data.totalCount || orderData.length);
        calculateAnalytics(orderData);
        identifyTopProducts(orderData);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error("Error fetching orders: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate analytics from order data
  const calculateAnalytics = (orderData) => {
    const totalRevenue = orderData.reduce((sum, order) => sum + order.amount, 0);
    const avgOrderValue = orderData.length ? totalRevenue / orderData.length : 0;
    const pendingOrders = orderData.filter(order =>
      ["Order Placed", "Packing", "Shipped", "Out for delivery"].includes(order.status)
    ).length;
    const deliveredOrders = orderData.filter(order => order.status === "Delivered").length;

    setAnalytics({
      totalRevenue,
      avgOrderValue,
      totalOrders: orderData.length,
      pendingOrders,
      deliveredOrders
    });
  };

  // Identify top products from orders (More Robust Logging)
  const identifyTopProducts = (orderData) => {
    const productCounts = {};

    (orderData || []).forEach((order, orderIndex) => { // Add safety check for orderData
      (order.items || []).forEach((item, itemIndex) => { // Add safety check for order.items
        // --- Log the item structure FIRST ---
        // console.log(`Order ${orderIndex}, Item ${itemIndex} Structure:`, JSON.stringify(item));

        // --- Check for either productId or _id ---
        const productId = item.productId || item._id; // Use whichever is present

        if (!productId) {
          console.warn(`Order ${orderIndex}, Item ${itemIndex}: Skipping item with missing product identifier (productId or _id). Item Data:`, item);
          return; // Skip this item if identifier is missing
        }
        // Ensure productId is treated as a string for consistency
        const productIdStr = productId.toString();

        if (!productCounts[productIdStr]) {
          productCounts[productIdStr] = {
            id: productIdStr, // Store the found ID
            name: item.name || 'Unknown Product',
            image: item.image?.[0] || '', // Use optional chaining for image
            count: 0,
            quantity: 0,
            revenue: 0
          };
        }
        // Use the string ID for accessing the count object
        productCounts[productIdStr].count += 1;
        productCounts[productIdStr].quantity += item.quantity || 0; // Add safety check for quantity
        productCounts[productIdStr].revenue += (item.price || 0) * (item.quantity || 0); // Add safety check for price/quantity
      });
    });

    // Filter out any entries that might still have ended up with an invalid ID (just in case)
    const validProductCounts = Object.values(productCounts).filter(p => p.id);

    const topProductsArray = validProductCounts
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5); // Slice top 5 for the detailed modal

    setTopProducts(topProductsArray); // State holds top 5
  };

  // Fetch order timeline/history
  const fetchOrderTimeline = async (orderId) => {
    if (!orderId || !token) {
      setOrderTimeline([]);
      return;
    }
    try {
      const response = await axios.get(
        `${backendUrl}/api/order/timeline/${orderId}`, // Corrected Route
        { headers: { token } }
      );

      if (response.data.success) {
        setOrderTimeline(response.data.timeline || []);
      } else {
        toast.error("Failed to fetch order timeline: " + response.data.message);
        setOrderTimeline([]);
      }
    } catch (error) {
      console.error("Error fetching timeline:", error);
      // Check for 404 specifically
      if (error.response && error.response.status === 404) {
        toast.error("Timeline data not found for this order (404).");
      } else {
        toast.error("Error fetching timeline data.");
      }
      setOrderTimeline([]);
    }
  };

  // Apply all filters to orders
  const applyFilters = () => {
    let result = [...orders];

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(order => order.status === statusFilter);
    }

    // Date range filter
    if (dateFilter.from && dateFilter.to) {
      const fromDate = new Date(dateFilter.from).getTime();
      const toDate = new Date(dateFilter.to).getTime() + (24 * 60 * 60 * 1000 - 1); // End of the day
      result = result.filter(order => {
        const orderDate = new Date(order.date).getTime();
        return orderDate >= fromDate && orderDate <= toDate;
      });
    }

    // Payment method filter
    if (paymentMethodFilter !== 'all') {
      result = result.filter(order => order.paymentMethod === paymentMethodFilter);
    }

    // City filter
    if (cityFilter) {
      result = result.filter(order =>
        order.address.city.toLowerCase().includes(cityFilter.toLowerCase())
      );
    }

    // Product filter
    if (productFilter) {
      result = result.filter(order =>
        order.items.some(item =>
          item.name.toLowerCase().includes(productFilter.toLowerCase())
        )
      );
    }

    // Search query (customer name, ID, email, product)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(order =>
        order._id.toLowerCase().includes(query) ||
        `${order.address.firstName} ${order.address.lastName}`.toLowerCase().includes(query) ||
        order.items.some(item => item.name.toLowerCase().includes(query))
      );
    }

    // Customer type filter (new vs returning)
    if (customerTypeFilter !== 'all') {
      // Group by userId to count orders per user
      const userOrderCounts = {};
      orders.forEach(order => {
        userOrderCounts[order.userId] = (userOrderCounts[order.userId] || 0) + 1;
      });

      result = result.filter(order => {
        const orderCount = userOrderCounts[order.userId] || 0;
        return customerTypeFilter === 'new' ? orderCount === 1 : orderCount > 1;
      });
    }

    // Order aging filter
    if (ageingFilter !== 'all') {
      const now = Date.now();
      if (ageingFilter === '24h') {
        result = result.filter(order => (now - order.date) <= 24 * 60 * 60 * 1000);
      } else if (ageingFilter === '3days') {
        result = result.filter(order => (now - order.date) <= 3 * 24 * 60 * 60 * 1000);
      } else if (ageingFilter === '7days') {
        result = result.filter(order => (now - order.date) <= 7 * 24 * 60 * 60 * 1000);
      } else if (ageingFilter === 'older') {
        result = result.filter(order => (now - order.date) > 7 * 24 * 60 * 60 * 1000);
      }
    }

    // Apply sorting
    switch (sortOption) {
      case 'date-asc':
        result.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      case 'date-desc':
        result.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
      case 'value-asc':
        result.sort((a, b) => a.amount - b.amount);
        break;
      case 'value-desc':
        result.sort((a, b) => b.amount - a.amount);
        break;
      case 'status':
        result.sort((a, b) => a.status.localeCompare(b.status));
        break;
      default:
        // Default to newest first
        result.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    setFilteredOrders(result);
  };

  // Reset all filters to default
  const resetFilters = () => {
    setStatusFilter('all');
    setDateFilter({ from: '', to: '' });
    setPaymentMethodFilter('all');
    setCityFilter('');
    setProductFilter('');
    setSearchQuery('');
    setAgeingFilter('all');
    setCustomerTypeFilter('all');
    setSortOption('date-desc');

    // Apply default sorting
    const sorted = [...orders].sort((a, b) => new Date(b.date) - new Date(a.date));
    setFilteredOrders(sorted);
  };

  // Handle select all orders
  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map(order => order._id));
    }
    setIsAllSelected(!isAllSelected);
  };

  // Handle individual order selection
  const handleSelectOrder = (orderId) => {
    if (selectedOrderIds.includes(orderId)) {
      setSelectedOrderIds(selectedOrderIds.filter(id => id !== orderId));
    } else {
      setSelectedOrderIds([...selectedOrderIds, orderId]);
    }
  };

  // Update filters when any filter changes
  useEffect(() => {
    applyFilters();
  }, [statusFilter, dateFilter, paymentMethodFilter, cityFilter, productFilter, searchQuery, sortOption, ageingFilter, customerTypeFilter]);

  // Function to update a single order status
  const openStatusConfirmation = (event, orderId) => {
    // Prevent event propagation
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Find the current order
    const order = orders.find(o => o._id === orderId);
    if (!order) {
      toast.error("Order not found");
      return;
    }

    // Get the selected status
    const newStatus = event.target.value;

    // If it's the same status, do nothing
    if (order.status === newStatus) {
      return;
    }

    // Set pending update and show confirmation
    setPendingUpdate({ orderId, newStatus, currentStatus: order.status });
    setShowConfirm(true);
  };

  // Handle bulk status update
  const handleBulkStatusUpdate = async (newStatus) => {
    if (!newStatus) {
      toast.error("Please select a status");
      return;
    }

    if (selectedOrderIds.length === 0) {
      toast.warning("No orders selected");
      return;
    }

    setIsUpdating(true);
    try {
      const response = await axios.post(
        `${backendUrl}/api/order/bulk-status-update`,
        {
          orderIds: selectedOrderIds,
          status: newStatus
        },
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success(`Successfully updated ${response.data.modifiedCount || selectedOrderIds.length} orders`);
        await fetchOrders();
        setSelectedOrderIds([]);
        setIsAllSelected(false);
        setShowBulkUpdate(false);
      } else {
        toast.error(response.data.message || "Failed to update orders");
      }
    } catch (error) {
      console.error("Error updating orders:", error);
      const errorMessage = error.response?.data?.message || error.message || "Error updating orders";
      toast.error(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const cancelStatusUpdate = () => {
    setShowConfirm(false);
    setPendingUpdate(null);
  };

  const confirmStatusUpdate = async () => {
    if (!pendingUpdate) return;

    setIsUpdating(true);
    try {
      const response = await axios.post(
        `${backendUrl}/api/order/status`,
        { orderId: pendingUpdate.orderId, status: pendingUpdate.newStatus },
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success("Order status updated successfully");
        await fetchOrders();

        // Add to timeline 
        // In a production system, this should be handled server-side
        const timelineEntry = {
          status: pendingUpdate.newStatus,
          timestamp: Date.now(),
          note: "Status updated by admin"
        };

        setOrderTimeline([timelineEntry, ...orderTimeline]);
      } else {
        toast.error("Failed to update order status: " + response.data.message);
      }
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Error updating order: " + error.message);
    } finally {
      setIsUpdating(false);
      setShowConfirm(false);
      setPendingUpdate(null);
    }
  };

  // View order details
  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    fetchOrderTimeline(order._id);
    setShowOrderDetails(true);
  };

  // Close order details modal
  const closeOrderDetails = () => {
    setShowOrderDetails(false);
    setSelectedOrder(null);
    setOrderTimeline([]);
  };

  // Save order note
  const saveOrderNote = async () => {
    if (!selectedOrder?._id || !orderNote.trim()) {
      toast.warning("Please enter a note.");
      return;
    }

    try {
      const response = await axios.post(
        `${backendUrl}/api/order/add-note`, // Corrected Route
        {
          orderId: selectedOrder._id,
          note: orderNote.trim()
        },
        { headers: { token } }
      );

      if (response.data.success && response.data.note) {
        toast.success("Note added successfully");
        // Optimistically add note to the local timeline state
        setOrderTimeline([response.data.note, ...orderTimeline].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
        setOrderNote('');
        setShowNoteModal(false);
      } else {
        toast.error(response.data.message || "Failed to add note.");
      }
    } catch (error) {
      console.error("Error adding note:", error);
      toast.error("Failed to add note: " + (error.response?.data?.message || error.message));
    }
  };

  // Generate invoice for printing
  const generateInvoice = (order) => {
    setSelectedOrder(order);
    setShowInvoice(true);
  };

  // Export invoice as PDF
  const exportInvoice = () => {
    if (!selectedOrder) return;

    try {
      // Initialize jsPDF
      const doc = new jsPDF();

      // Add header with logo
      doc.setFontSize(24);
      doc.setTextColor(40, 40, 40);
      doc.text("TRENDIFY", 105, 20, { align: "center" });

      // Add invoice title
      doc.setFontSize(16);
      doc.setTextColor(100, 100, 100);
      doc.text("INVOICE", 105, 30, { align: "center" });

      // Add company details
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text("Trendify", 20, 45);
      doc.text("123 Fashion Street", 20, 50);
      doc.text("Style City, SC 12345", 20, 55);
      doc.text("support@trendify.com", 20, 60);

      // Add invoice details
      doc.setFontSize(10);
      doc.text(`Invoice #: ${selectedOrder._id}`, 150, 45, { align: "right" });
      doc.text(`Date: ${new Date(selectedOrder.date).toLocaleDateString()}`, 150, 50, { align: "right" });
      doc.text(`Payment: ${selectedOrder.payment ? "Paid" : "Pending"}`, 150, 55, { align: "right" });
      doc.text(`Method: ${selectedOrder.paymentMethod}`, 150, 60, { align: "right" });

      // Add customer details
      doc.setFontSize(12);
      doc.setTextColor(40, 40, 40);
      doc.text("Bill To:", 20, 75);
      doc.setFontSize(10);
      doc.text(`${selectedOrder.address.firstName} ${selectedOrder.address.lastName}`, 20, 82);
      doc.text(selectedOrder.address.street, 20, 87);
      doc.text(`${selectedOrder.address.city}, ${selectedOrder.address.state} ${selectedOrder.address.zipcode}`, 20, 92);
      doc.text(selectedOrder.address.country, 20, 97);
      doc.text(`Phone: ${selectedOrder.address.phone}`, 20, 102);

      // Calculate subtotal
      const subtotal = selectedOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const shipping = 10; // Fixed shipping cost
      const total = subtotal + shipping;

      // Prepare table data
      const tableColumn = ["Item", "Quantity", "Size", "Price", "Total"];
      const tableRows = selectedOrder.items.map(item => [
        item.name,
        item.quantity,
        item.size || "-",
        `${currency} ${item.price.toFixed(2)}`,
        `${currency} ${(item.price * item.quantity).toFixed(2)}`
      ]);

      // Add table using autoTable
      autoTable(doc, {
        startY: 110,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        headStyles: {
          fillColor: [255, 102, 0],
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [40, 40, 40]
        },
        foot: [
          ["", "", "", "Subtotal", `${currency} ${subtotal.toFixed(2)}`],
          ["", "", "", "Shipping", `${currency} ${shipping.toFixed(2)}`],
          ["", "", "", "Total", `${currency} ${total.toFixed(2)}`]
        ],
        footStyles: {
          fillColor: [240, 240, 240],
          textColor: [40, 40, 40],
          fontSize: 10,
          fontStyle: 'bold'
        }
      });

      // Add footer text
      const finalY = doc.lastAutoTable.finalY + 20;
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text("Thank you for shopping with Trendify!", 105, finalY, { align: "center" });
      doc.text("Questions? Contact support@trendify.com", 105, finalY + 5, { align: "center" });

      // Save the PDF with a proper filename
      const fileName = `Trendify_Invoice_${selectedOrder._id}.pdf`;
      doc.save(fileName);
      toast.success("Invoice downloaded successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate invoice: " + error.message);
    }
  };

  // Export orders as CSV
  const exportOrdersCSV = () => {
    const ordersToExport = selectedOrderIds.length > 0
      ? filteredOrders.filter(order => selectedOrderIds.includes(order._id))
      : filteredOrders;

    if (ordersToExport.length === 0) {
      toast.warning("No orders to export");
      return;
    }

    // Format data for CSV
    const csvData = ordersToExport.map(order => ({
      'Order ID': order._id,
      'Date': new Date(order.date).toLocaleDateString(),
      'Customer': `${order.address.firstName} ${order.address.lastName}`,
      'Email': order.address.email || 'N/A',
      'Phone': order.address.phone,
      'Address': `${order.address.street}, ${order.address.city}, ${order.address.state} ${order.address.zipcode}, ${order.address.country}`,
      'Items': order.items.length,
      'Amount': order.amount,
      'Payment Method': order.paymentMethod,
      'Payment Status': order.payment ? 'Paid' : 'Pending',
      'Order Status': order.status
    }));

    // Convert to CSV
    const worksheet = XLSX.utils.json_to_sheet(csvData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");

    // Generate file name
    const fileName = `Trendify_Orders_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Trigger download
    XLSX.writeFile(workbook, fileName);

    toast.success(`Exported ${ordersToExport.length} orders to Excel`);
  };

  // Contact customer via WhatsApp
  const contactViaWhatsApp = (phone, orderNumber, customerName, items) => {
    if (!phone) {
      toast.error("Phone number not available");
      return;
    }
    const formattedPhone = phone.replace(/\D/g, '');
    const orderIdShort = orderNumber.substring(orderNumber.length - 8);

    // Create a more detailed message
    let message = `Hello ${customerName || 'there'}! 👋\n\nThis is Trendify regarding your order #${orderIdShort}.\n\n`;
    message += `Items:\n`;
    items.forEach(item => {
      message += `- ${item.name} (Qty: ${item.quantity}${item.size ? `, Size: ${item.size}` : ''})\n`;
    });
    message += `\nHow can we assist you today? 😊`;

    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Contact customer via email with invoice
  const contactViaEmail = async (email, orderNumber) => {
    if (!email) {
      toast.error("Email not available");
      return;
    }

    if (!selectedOrder) {
      toast.error("Order details not available");
      return;
    }

    setIsUpdating(true);

    try {
      // Create email subject and body with HTML
      const subject = `🧾 Invoice for Your Trendify Order #${orderNumber.substring(orderNumber.length - 8)}`;

      // Generate invoice HTML
      const items = selectedOrder.items.map(item => `
        <tr style="vertical-align:top;">
          <td style="padding:10px 8px;border-bottom:1px solid #eee;">
              <img src="${item.image?.[0] || 'https://via.placeholder.com/50'}" alt="${item.name}" style="width:40px;height:40px;object-fit:cover;border-radius:4px;margin-right:10px;vertical-align:middle;">
              ${item.name}
          </td>
          <td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:center;">${item.size || '-'}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:right;">${currency} ${item.price.toFixed(2)}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:right;">${currency} ${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
      `).join('');

      // Create HTML email content
      const emailContent = `
        <!DOCTYPE html>
        <html>
        <head>
        <style> body { font-family: Arial, sans-serif; color: #333; } .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #eee; } .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #eee; } .header h1 { color: #6c63ff; margin: 0; } .section { margin-bottom: 20px; } .section h3 { font-size: 16px; color: #444; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; } .address p, .details p { font-size: 14px; line-height: 1.6; margin: 0 0 5px 0; } .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px; } .items-table th, .items-table td { padding: 10px 8px; border-bottom: 1px solid #eee; text-align: left; } .items-table th { background-color: #f8f8f8; font-weight: bold; } .items-table .text-right { text-align: right; } .items-table .text-center { text-align: center; } .items-table img { width: 40px; height: 40px; object-fit: cover; border-radius: 4px; margin-right: 10px; vertical-align: middle; } .totals { text-align: right; margin-top: 20px; } .totals p { margin: 5px 0; font-size: 14px; } .totals strong { font-size: 15px; } .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #888; } .footer a { color: #6c63ff; text-decoration: none; } </style>
        </head>
        <body>
          <div class="container">
            <div class="header"><h1>Trendify Order Invoice</h1></div>
            <div class="section details" style="display: flex; justify-content: space-between;">
              <div>
                <p><strong>Trendify</strong><br/>123 Fashion Street<br/>Style City, SC 12345</p>
              </div>
              <div style="text-align: right;">
                <p><strong>Invoice #:</strong> ${selectedOrder._id}<br/>
                   <strong>Date:</strong> ${new Date(selectedOrder.date).toLocaleDateString()}<br/>
                   <strong>Payment:</strong> ${selectedOrder.payment ? "Paid" : "Pending"} (${selectedOrder.paymentMethod})
                </p>
              </div>
            </div>
            <div class="section address">
              <h3>Bill To:</h3>
              <p>${selectedOrder.address.firstName} ${selectedOrder.address.lastName}<br/>
                 ${selectedOrder.address.street}<br/>
                 ${selectedOrder.address.city}, ${selectedOrder.address.state} ${selectedOrder.address.zipcode}<br/>
                 ${selectedOrder.address.country}<br/>
                 Phone: ${selectedOrder.address.phone}
              </p>
            </div>
            <div class="section items">
              <h3>Order Items:</h3>
              <table class="items-table">
                <thead><tr><th>Item</th><th class="text-center">Qty</th><th class="text-center">Size</th><th class="text-right">Price</th><th class="text-right">Total</th></tr></thead>
                <tbody>${items}</tbody>
              </table>
            </div>
            <div class="totals">
              <p>Subtotal: <span style="float:right;">${currency} ${selectedOrder.amount.toFixed(2)}</span></p>
              <p>Shipping: <span style="float:right;">${currency} 0.00</span></p>
              <p><strong>Total: <span style="float:right;">${currency} ${selectedOrder.amount.toFixed(2)}</span></strong></p>
            </div>
            <div class="footer">
              <p>Thank you for your purchase!</p>
              <p>Questions? Contact <a href="mailto:support@trendify.com">support@trendify.com</a></p>
            </div>
          </div>
        </body>
        </html>
      `;

      // Send API request to send email
      const response = await axios.post(
        `${backendUrl}/api/email/send-invoice`,
        {
          email: email,
          subject: subject,
          html: emailContent,
          orderId: selectedOrder._id,
          orderNumber: orderNumber,
          customerName: `${selectedOrder.address.firstName} ${selectedOrder.address.lastName}`,
          orderDate: new Date(selectedOrder.date).toLocaleDateString(),
          totalAmount: selectedOrder.amount
        },
        {
          headers: {
            token,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      if (response.data.success) {
        toast.success("Invoice sent successfully!");
        // Add to timeline
        const timelineEntry = {
          type: 'note',
          text: `Invoice sent to ${email}`,
          timestamp: Date.now(),
          addedBy: 'System'
        };
        setOrderTimeline([timelineEntry, ...orderTimeline]);
      } else {
        toast.error(response.data.message || "Failed to send invoice");
      }

    } catch (error) {
      console.error("Error sending invoice:", error);
      if (error.code === 'ECONNABORTED') {
        toast.error("Email request timed out. Please try again.");
      } else if (error.response) {
        toast.error(`Email Server Error: ${error.response.data.message || error.response.status}`);
      } else if (error.request) {
        toast.error("No response from email server. Please check your connection.");
      } else {
        toast.error(`Failed to send invoice: ${error.message}`);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  // Detect delayed orders (orders older than 3 days not marked as delivered)
  const getDelayedOrders = () => {
    const threeDay = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds
    const now = Date.now();

    return orders.filter(order =>
      (now - order.date) > threeDay &&
      order.status !== "Delivered" &&
      order.status !== "Cancelled"
    );
  };

  // Calculate order aging
  const calculateOrderAge = (date) => {
    const now = Date.now();
    const orderDate = new Date(date).getTime();
    const diffDays = Math.floor((now - orderDate) / (24 * 60 * 60 * 1000));

    if (diffDays < 1) return "Today";
    if (diffDays === 1) return "1 day";
    return `${diffDays} days`;
  };

  // Format date with time
  const formatDateTime = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  // Format date only
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString();
  };

  useEffect(() => {
    fetchOrders();
  }, [token, currentPage, pageSize]);

  // Update isAllSelected when selectedOrderIds or filteredOrders change
  useEffect(() => {
    setIsAllSelected(
      filteredOrders.length > 0 &&
      selectedOrderIds.length === filteredOrders.length
    );
  }, [selectedOrderIds, filteredOrders]);

  // Add this function inside the Orders component
  const handleMarkCodPaid = async (orderId) => {
    if (!orderId || !token) {
      toast.error("Invalid request");
      return;
    }

    // Optional: Add a confirmation dialog here if desired
    const confirmPayment = window.confirm("Are you sure you want to mark this COD order as paid?");
    if (!confirmPayment) {
      return;
    }

    setIsUpdating(true); // Use existing loading state or create a specific one
    try {
      const response = await axios.post(
        `${backendUrl}/api/order/mark-cod-paid/${orderId}`,
        {}, // No body needed for this request
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success("Order marked as paid successfully!");
        await fetchOrders(); // Refresh the order list
        // If the order details modal is open and showing this order, update its state too
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder({ ...selectedOrder, payment: true });
          // Also potentially update the timeline if fetched
          fetchOrderTimeline(orderId);
        }
      } else {
        toast.error(response.data.message || "Failed to mark order as paid.");
      }
    } catch (error) {
      console.error("Error marking COD as paid:", error);
      toast.error("Error: " + (error.response?.data?.message || error.message));
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Analytics Widgets */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-gray-500 text-sm font-medium">Total Revenue</h3>
          <p className="text-2xl font-semibold text-gray-800 mt-1">{currency} {analytics.totalRevenue.toFixed(2)}</p>
          <div className="flex items-center mt-2">
            <span className="text-green-500 text-xs font-medium flex items-center">
              <i className="material-icons text-xs mr-1">arrow_upward</i>
              2.5%
            </span>
            <span className="text-xs text-gray-400 ml-1">vs last month</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-gray-500 text-sm font-medium">Avg. Order Value</h3>
          <p className="text-2xl font-semibold text-gray-800 mt-1">{currency} {analytics.avgOrderValue.toFixed(2)}</p>
          <div className="flex items-center mt-2">
            <span className="text-green-500 text-xs font-medium flex items-center">
              <i className="material-icons text-xs mr-1">arrow_upward</i>
              1.2%
            </span>
            <span className="text-xs text-gray-400 ml-1">vs last month</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-gray-500 text-sm font-medium">Orders</h3>
          <p className="text-2xl font-semibold text-gray-800 mt-1">{analytics.totalOrders}</p>
          <div className="mt-2 flex justify-between">
            <div>
              <span className="text-xs text-gray-500">Pending</span>
              <p className="text-sm font-medium text-blue-600">{analytics.pendingOrders}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Delivered</span>
              <p className="text-sm font-medium text-green-600">{analytics.deliveredOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-gray-500 text-sm font-medium">Delayed Orders</h3>
          <p className="text-2xl font-semibold text-orange-500 mt-1">{getDelayedOrders().length}</p>
          <p className="text-xs text-gray-500 mt-2">Orders delayed 3+ days</p>
        </div>

        {/* Modified Top Products Widget */}
        <div
          className="bg-white rounded-lg shadow-sm p-4 cursor-pointer hover:bg-gray-50 transition-colors flex flex-col justify-between" // Added flex-col and justify-between
          onClick={() => setShowAnalytics(true)} // Keep onClick to open the modal
        >
          <div> {/* Wrapper for title and list */}
            <h3 className="text-gray-500 text-sm font-medium mb-2">Top Selling Products</h3>
            {topProducts.length > 0 ? (
              <ul className="space-y-2"> {/* Use an unordered list */}
                {topProducts.slice(0, 3).map((product) => ( // Show top 3
                  <li key={product.id} className="flex items-center gap-2 text-xs">
                    <img
                      src={product.image || assets.parcel_icon} // Fallback image
                      alt={product.name}
                      className="w-6 h-6 object-cover rounded-md border-gray-300 flex-shrink-0 border bg-gray-100" // Added background
                    />
                    <span className="flex-grow font-medium text-gray-700 truncate" title={product.name}>
                      {product.name}
                    </span>
                    <span className="text-gray-500 font-semibold flex-shrink-0">
                      ({product.quantity} sold)
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No sales data yet.</p>
            )}
          </div>
          <button
            type="button" // Prevent form submission if inside a form
            className="text-xs text-blue-600 hover:underline mt-2 text-right w-full focus:outline-none" // Added focus style
            onClick={(e) => { e.stopPropagation(); setShowAnalytics(true); }} // Ensure modal opens even if button clicked
          >
            View Full Analytics
          </button>
        </div>
      </div>

      {/* Order Management Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6">
        <div className="flex flex-col lg:flex-row justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 lg:mb-0">Orders Management</h2>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-md border border-gray-300 w-full"
              />
              <i className="material-icons absolute left-3 top-2.5 text-gray-400" style={{ fontSize: '18px' }}>search</i>
            </div>

            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
              <button
                onClick={() => setFilterVisible(!filterVisible)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-50 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
              >
                <i className="material-icons" style={{ fontSize: '18px' }}>filter_list</i>
                <span className="text-sm">Filters</span>
              </button>

              <button
                onClick={() => exportOrdersCSV()}
                className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
              >
                <i className="material-icons" style={{ fontSize: '18px' }}>download</i>
                <span className="text-sm">Export</span>
              </button>

              <button
                onClick={fetchOrders}
                className="flex items-center gap-2 px-3 py-2 bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100 transition-colors border border-gray-300"
              >
                <i className="material-icons" style={{ fontSize: '18px' }}>refresh</i>
                <span className="text-sm hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Advanced filters section - only visible when filterVisible is true */}
        {filterVisible && (
          <div className="bg-white rounded-xl p-6 mb-6 border border-gray-200 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="Order Placed">Order Placed</option>
                  <option value="Packing">Packing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Out for delivery">Out for delivery</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <input
                      type="date"
                      value={dateFilter.from}
                      onChange={(e) => setDateFilter({ ...dateFilter, from: e.target.value })}
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="dd-mm-yyyy"
                    />
                  </div>
                  <div className="relative">
                    <input
                      type="date"
                      value={dateFilter.to}
                      onChange={(e) => setDateFilter({ ...dateFilter, to: e.target.value })}
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="dd-mm-yyyy"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment</label>
                <select
                  value={paymentMethodFilter}
                  onChange={(e) => setPaymentMethodFilter(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="all">All Methods</option>
                  <option value="COD">COD</option>
                  <option value="Stripe">Stripe</option>
                  <option value="Razorpay">Razorpay</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="value-desc">Highest Value</option>
                  <option value="value-asc">Lowest Value</option>
                  <option value="status">By Status</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={resetFilters}
                className="px-5 py-2.5 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={() => {
                  applyFilters();
                  setFilterVisible(false);
                }}
                className="px-5 py-2.5 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions - Only visible when orders are selected */}
      {selectedOrderIds.length > 0 && (
        <div className="bg-blue-50 p-3 rounded-md mb-4 flex flex-wrap items-center justify-between">
          <div className="flex items-center mb-2 sm:mb-0">
            <span className="text-blue-700 font-medium">{selectedOrderIds.length} orders selected</span>
            <button
              onClick={() => setSelectedOrderIds([])}
              className="ml-2 text-blue-600 underline text-sm"
            >
              Clear
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowBulkUpdate(true)}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              Update Status
            </button>
            <button
              onClick={exportOrdersCSV}
              className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
            >
              Export Selected
            </button>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 sm:px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                />
              </th>
              <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order Details
              </th>
              <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                Customer
              </th>
              <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                Order Status
              </th>
              <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                Amount
              </th>
              <th className="px-2 sm:px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading && (
              <tr>
                <td colSpan="6" className="px-4 py-4 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-gray-900"></div>
                  </div>
                </td>
              </tr>
            )}

            {!loading && filteredOrders.length === 0 && (
              <tr>
                <td colSpan="6" className="px-4 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center">
                    <i className="material-icons text-gray-300 text-5xl mb-2">shopping_bag</i>
                    <p className="text-xl">No orders found</p>
                    <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
                  </div>
                </td>
              </tr>
            )}

            {!loading && filteredOrders.map((order) => (
              <tr
                key={order._id}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => viewOrderDetails(order)}
              >
                <td className="px-2 sm:px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedOrderIds.includes(order._id)}
                    onChange={() => handleSelectOrder(order._id)}
                    className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                  />
                </td>
                <td className="px-2 sm:px-4 py-3">
                  <div className="flex items-start">
                    <img
                      src={assets.parcel_icon}
                      alt=""
                      className="w-8 h-8 sm:w-10 sm:h-10 mr-2 sm:mr-3 object-contain"
                    />
                    <div>
                      <div className="font-medium text-gray-900 mb-1 text-sm sm:text-base">#{order._id.substring(order._id.length - 8)}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <i className="material-icons" style={{ fontSize: '14px' }}>schedule</i>
                        {formatDate(order.date)}
                        <span className="ml-1 text-xs hidden sm:inline">({calculateOrderAge(order.date)})</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1 hidden sm:flex">
                        {order.items.slice(0, 1).map((item, idx) => (
                          <span key={idx} className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-800 text-xs rounded-md">
                            {item.name.length > 10 ? item.name.substring(0, 10) + '...' : item.name}
                            <span className="ml-1 text-gray-500">x{item.quantity}</span>
                          </span>
                        ))}
                        {order.items.length > 1 && (
                          <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-800 text-xs rounded-md">
                            +{order.items.length - 1} more
                          </span>
                        )}
                      </div>
                      {/* Mobile visible status */}
                      <div className="sm:hidden mt-1">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full ${order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                          order.status === 'Shipped' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'Out for delivery' ? 'bg-purple-100 text-purple-800' :
                              order.status === 'Packing' ? 'bg-yellow-100 text-yellow-800' :
                                order.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                          }`}>
                          {order.status}
                        </span>
                      </div>
                      {/* Mobile visible amount */}
                      <div className="sm:hidden mt-1 font-medium text-gray-900 text-sm">
                        {currency} {order.amount}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-2 sm:px-4 py-3 hidden md:table-cell">
                  <div className="font-medium text-gray-900 text-sm">{order.address.firstName} {order.address.lastName}</div>
                  <div className="text-xs text-gray-500 mt-1">{order.address.city}, {order.address.state}</div>
                  <div className="text-xs text-gray-500">{order.address.phone}</div>
                </td>
                <td className="px-2 sm:px-4 py-3 hidden sm:table-cell">
                  <div className="flex flex-col">
                    <div className="mb-2">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full ${order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'Shipped' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'Out for delivery' ? 'bg-purple-100 text-purple-800' :
                            order.status === 'Packing' ? 'bg-yellow-100 text-yellow-800' :
                              order.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                        }`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="flex items-center">
                      <span className={`inline-block w-2 h-2 rounded-full ${order.payment ? 'bg-green-500' : 'bg-yellow-500'
                        } mr-1`}></span>
                      <span className="text-xs text-gray-600">
                        {order.payment ? 'Paid' : 'Pending'} · {order.paymentMethod}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-2 sm:px-4 py-3 whitespace-nowrap font-medium text-gray-900 hidden sm:table-cell">
                  {currency} {order.amount}
                </td>
                <td className="px-2 sm:px-4 py-3">
                  <div className="flex items-center justify-center gap-1 sm:gap-2 bg-gray-50 rounded p-1" onClick={(e) => e.stopPropagation()}>
                    {/* Existing Invoice Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        generateInvoice(order);
                      }}
                      className="p-1.5 text-orange-600 hover:text-orange-800 rounded-md hover:bg-orange-50 transition-colors flex items-center border border-orange-200"
                      title="Generate Invoice"
                    >
                      <i className="material-icons" style={{ fontSize: '16px' }}>receipt</i>
                      <span className="ml-1 text-xs hidden sm:inline">Invoice</span>
                    </button>

                    {/* Existing WhatsApp Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        contactViaWhatsApp(order.address.phone, order._id, `${order.address.firstName} ${order.address.lastName}`, order.items);
                      }}
                      className="p-1.5 bg-white text-green-600 hover:bg-green-50 rounded-md transition-colors border border-green-300"
                      title="WhatsApp"
                    >
                      <i className="material-icons" style={{ fontSize: '18px' }}>chat</i>
                    </button>

                    {/* --- Add Conditional COD Payment Button --- */}
                    {order.paymentMethod === 'COD' && !order.payment && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent row click
                          handleMarkCodPaid(order._id);
                        }}
                        disabled={isUpdating}
                        className="p-1.5 text-emerald-600 hover:text-emerald-800 rounded-md hover:bg-emerald-50 transition-colors flex items-center border border-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Mark COD as Paid"
                      >
                        <i className="material-icons" style={{ fontSize: '16px' }}>price_check</i>
                        <span className="ml-1 text-xs hidden sm:inline">Paid</span>
                      </button>
                    )}
                    {/* ------------------------------------------- */}


                    {/* Existing Status Dropdown */}
                    <select
                      onChange={(event) => {
                        event.stopPropagation();
                        if (event.target.value !== order.status) {
                          openStatusConfirmation(event, order._id);
                        }
                      }}
                      value={order.status}
                      className="p-1.5 text-xs border rounded-md text-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="Order Placed">Order Placed</option>
                      <option value="Packing">Packing</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Out for delivery">Out for delivery</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-4 bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center mb-3 sm:mb-0">
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="mr-2 p-2 border rounded-md text-sm"
          >
            <option value="5">5 per page</option>
            <option value="10">10 per page</option>
            <option value="20">20 per page</option>
            <option value="50">50 per page</option>
            <option value="100">100 per page</option>
          </select>
          <span className="text-sm text-gray-600">
            Showing {Math.min((currentPage - 1) * pageSize + 1, totalOrders)} to {Math.min(currentPage * pageSize, totalOrders)} of {totalOrders} orders
          </span>
        </div>

        <div className="flex gap-1">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="material-icons" style={{ fontSize: '18px' }}>chevron_left</i>
          </button>

          {[...Array(Math.min(3, Math.ceil(totalOrders / pageSize)))].map((_, i) => {
            const pageNumber = i + 1;
            return (
              <button
                key={i}
                onClick={() => setCurrentPage(pageNumber)}
                className={`px-3 py-1 rounded-md ${pageNumber === currentPage
                  ? 'bg-blue-600 text-white'
                  : 'border hover:bg-gray-50'
                  }`}
              >
                {pageNumber}
              </button>
            );
          })}

          <button
            onClick={() => setCurrentPage(Math.min(Math.ceil(totalOrders / pageSize), currentPage + 1))}
            disabled={currentPage >= Math.ceil(totalOrders / pageSize)}
            className="px-3 py-1 border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="material-icons" style={{ fontSize: '18px' }}>chevron_right</i>
          </button>
        </div>
      </div>

      {/* Status Update Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4 border border-gray-200">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Update Order Status</h3>

            <p className="mb-5 text-gray-600">
              Are you sure you want to change the order status from
              <span className="font-semibold text-gray-800"> {pendingUpdate?.currentStatus}</span> to
              <span className="font-semibold text-gray-800"> {pendingUpdate?.newStatus}</span>?
            </p>

            <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 justify-end">
              <button
                onClick={cancelStatusUpdate}
                disabled={isUpdating}
                className="px-5 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusUpdate}
                disabled={isUpdating}
                className="px-5 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-orange-300"
              >
                {isUpdating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  'Confirm Update'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Status Update Modal */}
      {showBulkUpdate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4 border border-gray-200">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Bulk Update Order Status</h3>

            <p className="mb-4 text-gray-600">
              Update the status for {selectedOrderIds.length} selected orders:
            </p>

            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const newStatus = formData.get('bulkStatus');
              handleBulkStatusUpdate(newStatus);
            }}>
              <div className="mb-5">
                <select
                  name="bulkStatus"
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                  required
                >
                  <option value="">Select new status</option>
                  <option value="Order Placed">Order Placed</option>
                  <option value="Packing">Packing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Out for delivery">Out for delivery</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowBulkUpdate(false)}
                  className="px-5 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-orange-300"
                >
                  {isUpdating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    'Update Orders'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-4xl w-full mx-4 border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Invoice Preview</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowInvoice(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-md"
                >
                  <i className="material-icons">close</i>
                </button>
              </div>
            </div>

            <div className="mb-6 p-4 border border-gray-200 rounded-lg" ref={invoiceRef}>
              <div className="flex justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Invoice</h2>
                  <p className="text-gray-600">Trendify</p>
                  <p className="text-gray-600">123 Fashion Street</p>
                  <p className="text-gray-600">Style City, SC 12345</p>
                  <p className="text-gray-600">support@trendify.com</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-600">Invoice #: {selectedOrder?._id}</p>
                  <p className="text-gray-600">Date: {formatDateTime(selectedOrder?.date)}</p>
                  <p className="text-gray-600">Payment: {selectedOrder?.payment ? "Paid" : "Pending"}</p>
                  <p className="text-gray-600">Method: {selectedOrder?.paymentMethod}</p>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Customer:</h3>
                <p className="text-gray-600">{selectedOrder?.address.firstName} {selectedOrder?.address.lastName}</p>
                <p className="text-gray-600">{selectedOrder?.address.street}</p>
                <p className="text-gray-600">{selectedOrder?.address.city}, {selectedOrder?.address.state} {selectedOrder?.address.zipcode}</p>
                <p className="text-gray-600">{selectedOrder?.address.country}</p>
                <p className="text-gray-600">Phone: {selectedOrder?.address.phone}</p>
                {selectedOrder?.address.email && (
                  <p className="text-gray-600">Email: {selectedOrder?.address.email}</p>
                )}
              </div>

              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Order Items:</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Item</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-600">Quantity</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-600">Size</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">Price</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedOrder?.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2">
                            <div className="flex items-center">
                              {item.image && item.image[0] && (
                                <img src={item.image[0]} alt={item.name} className="w-10 h-10 mr-3 object-cover rounded" />
                              )}
                              <span className="text-sm text-gray-700">{item.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-center text-sm text-gray-700">{item.quantity}</td>
                          <td className="px-4 py-2 text-center text-sm text-gray-700">{item.size || '-'}</td>
                          <td className="px-4 py-2 text-right text-sm text-gray-700">{currency} {item.price.toFixed(2)}</td>
                          <td className="px-4 py-2 text-right text-sm text-gray-700">{currency} {(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="text-center mt-8 text-gray-600 text-sm">
                <p>Thank you for shopping with Trendify!</p>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowInvoice(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={exportInvoice}
                className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 flex items-center"
              >
                <i className="material-icons mr-1" style={{ fontSize: '18px' }}>download</i>
                Download PDF
              </button>
              <button
                onClick={() => {
                  contactViaEmail(selectedOrder?.address.email, selectedOrder?._id);
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <i className="material-icons mr-1" style={{ fontSize: '18px' }}>email</i>
                    Email Invoice
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-5xl w-full mx-4 border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Order Details</h3>
              <button
                onClick={closeOrderDetails}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-md"
              >
                <i className="material-icons">close</i>
              </button>
            </div>

            {selectedOrder && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg flex-1">
                    <h4 className="font-medium text-gray-700 mb-3">Order Information</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <p className="text-sm text-gray-500">Order ID:</p>
                      <p className="text-sm font-medium">{selectedOrder._id}</p>

                      <p className="text-sm text-gray-500">Date:</p>
                      <p className="text-sm font-medium">{formatDateTime(selectedOrder.date)}</p>

                      <p className="text-sm text-gray-500">Status:</p>
                      <p className="text-sm font-medium">{selectedOrder.status}</p>

                      <p className="text-sm text-gray-500">Payment:</p>
                      <p className="text-sm font-medium">{selectedOrder.payment ? "Paid" : "Pending"}</p>

                      <p className="text-sm text-gray-500">Method:</p>
                      <p className="text-sm font-medium">{selectedOrder.paymentMethod}</p>

                      <p className="text-sm text-gray-500">Amount:</p>
                      <p className="text-sm font-medium">{currency} {selectedOrder.amount.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg flex-1">
                    <h4 className="font-medium text-gray-700 mb-3">Customer Information</h4>
                    <p className="text-sm font-medium">{selectedOrder.address.firstName} {selectedOrder.address.lastName}</p>
                    <p className="text-sm text-gray-600">{selectedOrder.address.street}</p>
                    <p className="text-sm text-gray-600">{selectedOrder.address.city}, {selectedOrder.address.state} {selectedOrder.address.zipcode}</p>
                    <p className="text-sm text-gray-600">{selectedOrder.address.country}</p>
                    <p className="text-sm text-gray-600 mt-2">Phone: {selectedOrder.address.phone}</p>
                    {selectedOrder.address.email && (
                      <p className="text-sm text-gray-600">Email: {selectedOrder.address.email}</p>
                    )}

                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => contactViaWhatsApp(selectedOrder.address.phone, selectedOrder._id, `${selectedOrder.address.firstName} ${selectedOrder.address.lastName}`, selectedOrder.items)}
                        className="px-3 py-1.5 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm flex items-center"
                      >
                        <i className="material-icons mr-1" style={{ fontSize: '14px' }}>chat</i>
                        WhatsApp
                      </button>

                      {selectedOrder.address.email && (
                        <button
                          onClick={() => contactViaEmail(selectedOrder.address.email, selectedOrder._id)}
                          className="px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm flex items-center"
                        >
                          <i className="material-icons mr-1" style={{ fontSize: '14px' }}>email</i>
                          Email
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-3">Order Items</h4>
                  <div className="flex justify-between items-center mb-3"> {/* Add this div */}
                    <h4 className="font-medium text-gray-700">Order Items</h4>
                    {/* --- Add View Items Button --- */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setItemsToShow(selectedOrder.items || []); // Set the items
                        setCurrentItemOrderId(selectedOrder._id); // Set the order ID
                        setShowItemsModal(true); // Show the modal
                      }}
                      className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 text-sm flex items-center"
                      title="View All Items"
                    >
                      <i className="material-icons mr-1" style={{ fontSize: '14px' }}>visibility</i>
                      View Items
                    </button>
                    {/* ----------------------------- */}
                  </div>
                  {/* Existing items table */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Product</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-600">Quantity</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-600">Size</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">Price</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedOrder.items.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2">
                              <div className="flex items-center">
                                {item.image && item.image[0] && (
                                  <img src={item.image[0]} alt={item.name} className="w-10 h-10 mr-3 object-cover rounded" />
                                )}
                                <span className="text-sm text-gray-700">{item.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-2 text-center text-sm text-gray-700">{item.quantity}</td>
                            <td className="px-4 py-2 text-center text-sm text-gray-700">{item.size || '-'}</td>
                            <td className="px-4 py-2 text-right text-sm text-gray-700">{currency} {item.price.toFixed(2)}</td>
                            <td className="px-4 py-2 text-right text-sm text-gray-700">{currency} {(item.price * item.quantity).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan="4" className="px-4 py-2 text-right text-sm font-medium text-gray-900">Total</td>
                          <td className="px-4 py-2 text-right text-sm font-medium text-gray-900">{currency} {selectedOrder.amount.toFixed(2)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-gray-700">Order Timeline</h4>
                    <button
                      onClick={() => setShowNoteModal(true)}
                      className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 text-sm flex items-center"
                    >
                      <i className="material-icons mr-1" style={{ fontSize: '14px' }}>note_add</i>
                      Add Note
                    </button>
                  </div>

                  {orderTimeline.length === 0 ? (
                    <p className="text-sm text-gray-500 py-2">No timeline events available.</p>
                  ) : (
                    <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                      {orderTimeline // Already sorted by backend
                        .map((entry, index) => (
                          <div key={index} className="flex gap-3 border-l-2 border-gray-300 pl-4 relative">
                            {/* Timeline Dot - Different color based on type */}
                            <div className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white ${entry.type === 'status_change' ? 'bg-green-500' :
                              entry.type === 'note' ? 'bg-yellow-500' :
                                'bg-blue-500' // Default/event color
                              }`}></div>

                            <div className="flex-1 pb-2">
                              <div className="flex justify-between items-center">
                                <p className="text-sm font-semibold text-gray-800">
                                  {/* Display specific action text based on type */}
                                  {entry.type === 'note' ? `Note Added by ${entry.addedBy}` :
                                    entry.type === 'status_change' ? `Status Changed` :
                                      entry.text /* Display text for 'event' or fallback */}
                                </p>
                                <p className="text-xs text-gray-500">{formatDateTime(entry.timestamp)}</p>
                              </div>
                              {/* Display details based on type */}
                              {entry.type === 'note' && (
                                <p className="text-sm text-gray-600 mt-1 bg-white p-2 rounded border border-gray-200 shadow-sm">{entry.text}</p>
                              )}
                              {entry.type === 'status_change' && (
                                <p className="text-sm text-gray-600 mt-1">
                                  From <span className="font-medium">{entry.previousStatus}</span> to <span className="font-medium">{entry.newStatus}</span>
                                  <span className="text-xs text-gray-400 ml-2">(by {entry.addedBy})</span>
                                </p>
                              )}
                              {entry.type === 'event' && entry.note && ( // Display note for 'event' type if present
                                <p className="text-sm text-gray-600 mt-1">{entry.note}</p>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={closeOrderDetails}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => generateInvoice(selectedOrder)}
                    className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 flex items-center"
                  >
                    <i className="material-icons mr-1" style={{ fontSize: '18px' }}>receipt</i>
                    Generate Invoice
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4 border border-gray-200">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Add Order Note</h3>

            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Note</label>
              <textarea
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 min-h-[120px]"
                placeholder="Enter your note about this order..."
              ></textarea>
            </div>

            <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 justify-end">
              <button
                onClick={() => setShowNoteModal(false)}
                className="px-5 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={saveOrderNote}
                className="px-5 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-300"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      {showAnalytics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-4xl w-full mx-4 border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Analytics Dashboard</h3>
              <button
                onClick={() => setShowAnalytics(false)}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-md"
              >
                <i className="material-icons">close</i>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="text-blue-800 text-sm font-medium mb-1">Total Revenue</h4>
                <p className="text-2xl font-semibold text-blue-900">{currency} {analytics.totalRevenue.toFixed(2)}</p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="text-green-800 text-sm font-medium mb-1">Average Order Value</h4>
                <p className="text-2xl font-semibold text-green-900">{currency} {analytics.avgOrderValue.toFixed(2)}</p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="text-purple-800 text-sm font-medium mb-1">Total Orders</h4>
                <p className="text-2xl font-semibold text-purple-900">{analytics.totalOrders}</p>
              </div>

              <div className="bg-amber-50 p-4 rounded-lg">
                <h4 className="text-amber-800 text-sm font-medium mb-1">Pending Orders</h4>
                <p className="text-2xl font-semibold text-amber-900">{analytics.pendingOrders}</p>
              </div>
            </div>

            <div className="mb-8">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Top Selling Products</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity Sold</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {topProducts.map((product, index) => (
                      <tr key={product.id || index}> {/* Use product.id as key if available */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {product.image && (
                              <img src={product.image} alt={product.name} className="w-10 h-10 rounded-md object-cover mr-3" />
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900">{product.name || 'N/A'}</div>
                              {/* Use optional chaining for ID */}
                              <div className="text-xs text-gray-500">ID: {product.id?.substring(0, 8) || 'N/A'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium">{product.quantity || 0}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium">{currency} {(product.revenue || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowAnalytics(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Order Items Modal --- */}
      {showItemsModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center backdrop-blur-sm bg-black/40 p-4" onClick={() => setShowItemsModal(false)}> {/* Higher z-index */}
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-3xl w-full mx-4 border border-gray-200 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}> {/* Stop propagation */}
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-4 pb-3 border-b">
              <h3 className="text-lg font-semibold text-gray-800">
                Items for Order #{currentItemOrderId.substring(currentItemOrderId.length - 8)}
              </h3>
              <button
                onClick={() => setShowItemsModal(false)}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-md"
              >
                <i className="material-icons">close</i>
              </button>
            </div>

            {/* Modal Body - Items Table */}
            <div className="overflow-y-auto flex-grow">
              {itemsToShow.length === 0 ? (
                <p className="text-center text-gray-500 py-10">No items found for this order.</p>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100 sticky top-0"> {/* Sticky header */}
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Product</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">Quantity</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">Size</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Price</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {itemsToShow.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2">
                          <div className="flex items-center">
                            {item.image && item.image[0] && (
                              <img src={item.image[0]} alt={item.name} className="w-10 h-10 mr-3 object-cover rounded shadow-sm" />
                            )}
                            <span className="text-sm font-medium text-gray-800">{item.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-center text-sm text-gray-700">{item.quantity}</td>
                        <td className="px-4 py-2 text-center text-sm text-gray-700">{item.size || '-'}</td>
                        <td className="px-4 py-2 text-right text-sm text-gray-700">{currency} {item.price.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right text-sm font-semibold text-gray-800">{currency} {(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Footer (Optional) */}
            <div className="pt-4 border-t mt-4 flex justify-end">
              <button
                onClick={() => setShowItemsModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders; 