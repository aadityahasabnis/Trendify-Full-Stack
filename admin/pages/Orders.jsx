import React, { useEffect, useState, useRef } from 'react'
import axios from 'axios';
import { backendUrl, currency } from './../src/App';
import { toast } from 'react-toastify';
import { assets } from '../assets/assets';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

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
  const [pageSize, setPageSize] = useState(10);
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

  // Identify top products from orders
  const identifyTopProducts = (orderData) => {
    const productCounts = {};

    orderData.forEach(order => {
      order.items.forEach(item => {
        const productId = item.productId;
        if (!productCounts[productId]) {
          productCounts[productId] = {
            id: productId,
            name: item.name,
            image: item.image?.[0] || '',
            count: 0,
            quantity: 0,
            revenue: 0
          };
        }
        productCounts[productId].count += 1;
        productCounts[productId].quantity += item.quantity;
        productCounts[productId].revenue += item.price * item.quantity;
      });
    });

    const topProductsArray = Object.values(productCounts)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    setTopProducts(topProductsArray);
  };

  // Fetch order timeline/history
  const fetchOrderTimeline = async (orderId) => {
    try {
      const response = await axios.get(
        `${backendUrl}/api/order/timeline/${orderId}`,
        { headers: { token } }
      );

      if (response.data.success) {
        setOrderTimeline(response.data.timeline || []);
      } else {
        setOrderTimeline([]);
      }
    } catch (error) {
      console.error("Error fetching timeline:", error);
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
    if (!selectedOrder || !orderNote.trim()) {
      return;
    }

    try {
      const response = await axios.post(
        `${backendUrl}/api/order/add-note`,
        {
          orderId: selectedOrder._id,
          note: orderNote.trim()
        },
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success("Note added successfully");

        // Add note to timeline (in production, this would come from the server)
        const timelineEntry = {
          action: "Note added",
          timestamp: Date.now(),
          note: orderNote.trim()
        };

        setOrderTimeline([timelineEntry, ...orderTimeline]);
        setOrderNote('');
        setShowNoteModal(false);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Error adding note:", error);
      toast.error("Failed to add note: " + error.message);
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
      const doc = new jsPDF();

      // Add header
      doc.setFontSize(20);
      doc.text("Invoice", 105, 20, { align: "center" });

      // Add company details
      doc.setFontSize(10);
      doc.text("Trendify", 20, 30);
      doc.text("123 Fashion Street", 20, 35);
      doc.text("Style City, SC 12345", 20, 40);
      doc.text("support@trendify.com", 20, 45);

      // Add invoice details
      doc.setFontSize(10);
      doc.text(`Invoice #: ${selectedOrder._id}`, 150, 30, { align: "right" });
      doc.text(`Date: ${new Date(selectedOrder.date).toLocaleDateString()}`, 150, 35, { align: "right" });
      doc.text(`Payment: ${selectedOrder.payment ? "Paid" : "Pending"}`, 150, 40, { align: "right" });
      doc.text(`Method: ${selectedOrder.paymentMethod}`, 150, 45, { align: "right" });

      // Add customer details
      doc.setFontSize(12);
      doc.text("Customer:", 20, 60);
      doc.setFontSize(10);
      doc.text(`${selectedOrder.address.firstName} ${selectedOrder.address.lastName}`, 20, 67);
      doc.text(selectedOrder.address.street, 20, 72);
      doc.text(`${selectedOrder.address.city}, ${selectedOrder.address.state} ${selectedOrder.address.zipcode}`, 20, 77);
      doc.text(selectedOrder.address.country, 20, 82);
      doc.text(`Phone: ${selectedOrder.address.phone}`, 20, 87);

      // Add items table
      const tableColumn = ["Item", "Quantity", "Size", "Price", "Total"];
      const tableRows = [];

      selectedOrder.items.forEach(item => {
        const itemData = [
          item.name,
          item.quantity,
          item.size || "-",
          `${currency} ${item.price.toFixed(2)}`,
          `${currency} ${(item.price * item.quantity).toFixed(2)}`
        ];
        tableRows.push(itemData);
      });

      doc.autoTable({
        startY: 95,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [255, 102, 0] },
        foot: [
          ["", "", "", "Subtotal", `${currency} ${selectedOrder.amount.toFixed(2)}`],
          ["", "", "", "Shipping", `${currency} 0.00`],
          ["", "", "", "Total", `${currency} ${selectedOrder.amount.toFixed(2)}`]
        ],
        footStyles: { fillColor: [240, 240, 240] }
      });

      // Add footer text
      const finalY = doc.lastAutoTable.finalY + 20;
      doc.setFontSize(10);
      doc.text("Thank you for shopping with Trendify!", 105, finalY, { align: "center" });

      // Save the PDF
      doc.save(`Trendify_Invoice_${selectedOrder._id}.pdf`);
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
  const contactViaWhatsApp = (phone, orderNumber) => {
    if (!phone) {
      toast.error("Phone number not available");
      return;
    }

    // Format phone number (remove any non-digit characters)
    const formattedPhone = phone.replace(/\D/g, '');

    // Create WhatsApp message
    const message = `Hello! This is Trendify regarding your order #${orderNumber}. How can we assist you today?`;

    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;

    // Open WhatsApp in new tab
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
      const subject = `Invoice for Your Trendify Order #${orderNumber.substring(orderNumber.length - 8)}`;

      // Generate invoice HTML
      const items = selectedOrder.items.map(item => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #eee;">${item.name}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${item.size || '-'}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${currency} ${item.price.toFixed(2)}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${currency} ${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
      `).join('');

      // Create HTML email content
      const emailContent = `
        <div style="max-width:600px;margin:0 auto;padding:20px;background-color:#f4f4f4;font-family:Arial,sans-serif;">
          <div style="background:#ffffff;padding:30px;border-radius:10px;box-shadow:0 2px 6px rgba(0,0,0,0.05);color:#333;">
            <h1 style="color:#FF6600;font-size:24px;text-align:center;">Invoice for Order #${selectedOrder._id.substring(selectedOrder._id.length - 8)}</h1>
            
            <div style="display:flex;justify-content:space-between;margin-bottom:20px;">
              <div>
                <p style="font-size:14px;line-height:1.6;margin:0;">
                  <strong>Trendify</strong><br/>
                  123 Fashion Street<br/>
                  Style City, SC 12345<br/>
                  support@trendify.com
                </p>
              </div>
              <div style="text-align:right;">
                <p style="font-size:14px;line-height:1.6;margin:0;">
                  <strong>Invoice #:</strong> ${selectedOrder._id}<br/>
                  <strong>Date:</strong> ${new Date(selectedOrder.date).toLocaleDateString()}<br/>
                  <strong>Payment:</strong> ${selectedOrder.payment ? "Paid" : "Pending"}<br/>
                  <strong>Method:</strong> ${selectedOrder.paymentMethod}
                </p>
              </div>
            </div>
            
            <div style="margin-bottom:20px;">
              <h3 style="font-size:16px;margin-bottom:10px;">Customer:</h3>
              <p style="font-size:14px;line-height:1.6;margin:0;">
                ${selectedOrder.address.firstName} ${selectedOrder.address.lastName}<br/>
                ${selectedOrder.address.street}<br/>
                ${selectedOrder.address.city}, ${selectedOrder.address.state} ${selectedOrder.address.zipcode}<br/>
                ${selectedOrder.address.country}<br/>
                Phone: ${selectedOrder.address.phone}
              </p>
            </div>
            
            <div style="margin-bottom:20px;">
              <h3 style="font-size:16px;margin-bottom:10px;">Order Items:</h3>
              <table style="width:100%;border-collapse:collapse;">
                <thead>
                  <tr style="background-color:#f4f4f4;">
                    <th style="padding:10px;text-align:left;border-bottom:2px solid #ddd;">Item</th>
                    <th style="padding:10px;text-align:center;border-bottom:2px solid #ddd;">Quantity</th>
                    <th style="padding:10px;text-align:center;border-bottom:2px solid #ddd;">Size</th>
                    <th style="padding:10px;text-align:right;border-bottom:2px solid #ddd;">Price</th>
                    <th style="padding:10px;text-align:right;border-bottom:2px solid #ddd;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${items}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="3" style="padding:8px;"></td>
                    <td style="padding:8px;text-align:right;font-weight:bold;">Subtotal</td>
                    <td style="padding:8px;text-align:right;">${currency} ${selectedOrder.amount.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colspan="3" style="padding:8px;"></td>
                    <td style="padding:8px;text-align:right;font-weight:bold;">Shipping</td>
                    <td style="padding:8px;text-align:right;">${currency} 0.00</td>
                  </tr>
                  <tr style="background-color:#f4f4f4;">
                    <td colspan="3" style="padding:8px;"></td>
                    <td style="padding:8px;text-align:right;font-weight:bold;">Total</td>
                    <td style="padding:8px;text-align:right;font-weight:bold;">${currency} ${selectedOrder.amount.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            <div style="text-align:center;margin-top:30px;padding-top:20px;border-top:1px solid #eee;">
              <p style="font-size:14px;color:#666;">Thank you for shopping with Trendify!</p>
              <p style="font-size:12px;color:#999;margin-top:15px;">
                If you have any questions, please contact us at
                <a href="mailto:support@trendify.com" style="color:#FF6600;">support@trendify.com</a>
              </p>
            </div>
          </div>
        </div>
      `;

      // Check if we're in development mode (for demo/testing purposes)
      const isDevelopmentMode = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

      // Alternative implementation for development environment
      if (isDevelopmentMode) {
        // Create simulated response with a timeout to simulate server response
        setTimeout(() => {
          toast.success("Invoice sent successfully! (Development mode)");
          setShowInvoice(false);
          setIsUpdating(false);
        }, 1500);
        return;
      }

      // Send API request to send email
      const response = await axios.post(
        `${backendUrl}/api/email/send-invoice`,
        {
          email: email,
          subject: subject,
          html: emailContent,
          orderId: selectedOrder._id
        },
        {
          headers: { token },
          timeout: 10000 // 10 second timeout
        }
      );

      if (response.data.success) {
        toast.success("Invoice sent successfully!");
        setShowInvoice(false);
      } else {
        toast.error(response.data.message || "Failed to send invoice");
      }
    } catch (error) {
      console.error("Error sending invoice:", error);

      // Handle different types of errors
      if (error.code === 'ECONNABORTED') {
        toast.error("Request timed out. Please try again later.");
      } else if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        toast.error(`Server error: ${error.response.data.message || error.response.status}`);
      } else if (error.request) {
        // The request was made but no response was received
        toast.error("No response from server. Please check if the backend is running.");
      } else {
        // Something happened in setting up the request that triggered an Error
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

        <div
          className="bg-white rounded-lg shadow-sm p-4 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setShowAnalytics(true)}
        >
          <h3 className="text-gray-500 text-sm font-medium">Top Products</h3>
          <div className="flex mt-2 items-center justify-between">
            <div className="flex flex-col">
              {topProducts.length > 0 ? (
                <p className="font-medium text-gray-800">
                  {topProducts[0].name.length > 12
                    ? topProducts[0].name.substring(0, 12) + '...'
                    : topProducts[0].name}
                </p>
              ) : (
                <p className="text-gray-500">No data</p>
              )}
              <button className="text-xs text-blue-600 mt-2">View All</button>
            </div>
            {topProducts.length > 0 && topProducts[0].image && (
              <img
                src={topProducts[0].image}
                alt={topProducts[0].name}
                className="w-10 h-10 object-cover rounded-md"
              />
            )}
          </div>
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
                  <div className="flex items-center justify-center gap-2 bg-gray-50 rounded p-1" onClick={(e) => e.stopPropagation()}>
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

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        contactViaWhatsApp(order.address.phone, order._id);
                      }}
                      className="p-1.5 bg-white text-green-600 hover:bg-green-50 rounded-md transition-colors border border-green-300"
                      title="WhatsApp"
                    >
                      <i className="material-icons" style={{ fontSize: '18px' }}>chat</i>
                    </button>

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
                        onClick={() => contactViaWhatsApp(selectedOrder.address.phone, selectedOrder._id)}
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
                    <p className="text-sm text-gray-500 py-2">No timeline data available</p>
                  ) : (
                    <div className="space-y-3">
                      {orderTimeline.map((entry, index) => (
                        <div key={index} className="flex gap-3 border-l-2 border-gray-300 pl-3">
                          <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">
                              {entry.status || entry.action || "Update"}
                            </p>
                            <p className="text-xs text-gray-500">{formatDateTime(entry.timestamp)}</p>
                            {entry.note && <p className="text-sm text-gray-600 mt-1">{entry.note}</p>}
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
                      <tr key={index}>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {product.image && (
                              <img src={product.image} alt={product.name} className="w-10 h-10 rounded-md object-cover mr-3" />
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900">{product.name}</div>
                              <div className="text-xs text-gray-500">ID: {product.id.substring(0, 8)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium">{product.quantity}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium">{currency} {product.revenue.toFixed(2)}</td>
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
    </div>
  );
};

export default Orders; 