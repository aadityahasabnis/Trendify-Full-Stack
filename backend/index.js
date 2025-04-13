// Import routes
import productRoutes from './routes/productRoutes.js';
import userRoutes from './routes/userRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import newsletterRoutes from './routes/newsletterRoutes.js';
import emailRoutes from './routes/emailRoutes.js';
import chatbotRoutes from './routes/chatbotRoute.js';

// Routes 
app.use('/api/products', productRoutes);
app.use('/api/user', userRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/chatbot', chatbotRoutes); 