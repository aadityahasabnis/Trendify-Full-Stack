import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { backendUrl } from '../src/App';

const Inventory = ({ token }) => {
    const [products, setProducts] = useState([]);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await axios.get(`${backendUrl}/api/product/list`, { headers: { token } });
                if (response.data.success) {
                    setProducts(response.data.products);
                }
            } catch (error) {
                console.error("Error fetching products:", error);
            }
        };

        fetchProducts();
    }, [token]);

    const updateStock = async (productId, newStock) => {
        try {
            const response = await axios.post(`${backendUrl}/api/product/update-stock`, { productId, stock: newStock }, { headers: { token } });
            if (response.data.success) {
                setProducts(products.map(product => product._id === productId ? { ...product, stock: newStock } : product));
            }
        } catch (error) {
            console.error("Error updating stock:", error);
        }
    };

    return (
        <div>
            <h1>Inventory Management</h1>
            <ul>
                {products.map(product => (
                    <li key={product._id}>
                        {product.name} - Stock: {product.stock}
                        <input type="number" min="0" value={product.stock} onChange={(e) => updateStock(product._id, e.target.value)} />
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Inventory;