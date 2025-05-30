import React, { useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import ProductGrid from '../components/ProductGrid';
import useScrollToTop from '../hooks/useScrollToTop';

const Collection = () => {
	useScrollToTop();
	const { products } = useContext(ShopContext);

	return (
		<ProductGrid
			title="ALL COLLECTIONS"
			products={products}
			showFilters={true}
		/>
	);
};

export default Collection;