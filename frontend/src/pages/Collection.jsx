import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import { assets } from '../assets/frontend_assets/assets';
import Title from '../components/Title';
import ProductItem from '../components/ProductItem';

const Collection = () => {
	// const { products, subcategories, search } = useContext(ShopContext);
	const { products, search } = useContext(ShopContext);
	const [showFilter, setShowFilter] = useState(false);
	const [selectedFilters, setSelectedFilters] = useState([]);
	const [filterProducts, setFilterProducts] = useState([]);
	const [category, setCategory] = useState([]);
	const [subCategory, setSubCategory] = useState([]);
	const [sortType, setSortType] = useState('relevant');

	const toggleCategory = (e) => {
		if(category.includes(e.target.value)) {
			setCategory(prev => prev.filter(item => item !== e.target.value))
		}
		else {
			setCategory(prev => [...prev, e.target.value])
		}
	}

	const toggleSubCategory = (e) => {
		if(subCategory.includes(e.target.value)) {
			setSubCategory(prev=> prev.filter(item=> item !== e.target.value));
		}
		else {
			setSubCategory(prev => [...prev, e.target.value])
		}
	}

	const applyFilter = () => {
		let productsCopy = [...products]; // Copy array

		if(search) {
			productsCopy = productsCopy.filter(item => item.name.toLowerCase().includes(search.toLowerCase()))
		}

		// Filter by category if selected
		if (category.length > 0) {
			productsCopy = productsCopy.filter(item => category.includes(item.category));
		}

		// Filter by subCategory if selected
		if (subCategory.length > 0) {
			productsCopy = productsCopy.filter(item =>
				Array.isArray(item.subCategory)
					? item.subCategory.some(sub => subCategory.includes(sub)) // ✅ Works if subCategory is an array
					: subCategory.includes(item.subCategory) // ✅ Works if it's a string
			);
		}

		setFilterProducts(productsCopy);
	};

	const sortProduct = () => {
		let fpCopy = [...filterProducts]; // Copy array
		switch (sortType) {
			case 'low-high':
				setFilterProducts(fpCopy.sort((a,b)=>(a.price - b.price)))
				break;
			case 'high-low':
				setFilterProducts(fpCopy.sort((a, b) => (b.price - a.price)))
				break;
			case 'bestsellers':
				setFilterProducts(fpCopy.filter((a) => (a.bestseller === true)))
				break;
			case 'customer-reviews':
				setFilterProducts(fpCopy.sort((a, b) => (b.price - a.price)))
				break;
		
			default:
				applyFilter();
				break;
		}

	}

 

	// Run `applyFilter` when category or subCategory changes
	useEffect(() => {
		applyFilter();
	}, [category, subCategory, products, search]); // ✅ Include `products` to ensure filtering works when product list updates

	useEffect(()=> {
		sortProduct();
	},[sortType])



	// * printing categories
	// useEffect(()=> {
	// 	console.log(category);
	// }, [category])

	// useEffect(()=> {
	// 	console.log(subCategory);
	// }, [subCategory])

	// * Categories << Next
	// const categories = [
	// 	"Books", "Electronics", "Furniture", "Grocery",
	// 	"Health & Personal Care", "Home & Kitchen", "Jewellery", "Movies & TV Shows",
	// 	"Music", "Office Products", "Pet Supplies", "Shoes & Handbags", "Software",
	// 	"Sports & Outdoors", "Toys & Games", "Video Games", "Watches"
	// ];
	const subcategories = [
		"Topwear", "Bottomwear", "Winterwear"
	];

	const handleCheckboxChange = (category) => {
		setSelectedFilters((prev) =>
			prev.includes(category)
				? prev.filter((item) => item !== category)
				: [...prev, category]
		);
	};

	return (
		<div className='flex flex-col sm:flex-row gap-1 sm:gap-10 pt-10 border-t'>
			{/* Filter Options */}
			<div className='min-w-60'>
				<p
					onClick={() => {
						if (window.innerWidth < 640) setShowFilter(!showFilter); // Works only on small screens (<640px)
					}}
					className="my-2 text-xl flex items-center cursor-pointer gap-2 sm:cursor-default"
				>
					FILTERS
					<img
						className={`h-3 sm:hidden ${showFilter ? "rotate-90" : ""}`}
						src={assets.dropdown_icon}
						alt=""
					/>
				</p>

				{/* Ensure showFilter is always true on larger screens */}
				{useEffect(() => {
					if (window.innerWidth >= 640) setShowFilter(true);
				}, [])}

				{/* Category Filter */}
				<div className={`border border-gray-300 pl-5 py-3 mt-6 ${showFilter ? '' : 'hidden'}`}>
					<p className='mb-3 text-sm font-medium'>CATEGORIES</p>
					<div className='flex flex-col gap-2 text-sm font-light text-gray-700'>
						<p className='flex gap-2'>
							<input className='w-3' type="checkbox" value={"Men"} onChange={toggleCategory}/> Men
						</p>
						<p className='flex gap-2'>
							<input className='w-3' type="checkbox" value={"Women"} onChange={toggleCategory}/> Women
						</p>
						<p className='flex gap-2'>
							<input className='w-3' type="checkbox" value={"Kids"} onChange={toggleCategory}/> Kids
						</p>
					</div>
				</div>

				{/* Sub category filter*/}
				<div className={`border border-gray-300 pl-5 py-3 my-5 ${showFilter ? "" : "hidden"}`}>
					<p className="mb-3 text-sm font-medium">TYPE</p>
					<div className="flex flex-col gap-2 text-sm font-light text-gray-700">
						{subcategories.map((category, index) => (
							<label key={index} className="flex items-center gap-2 cursor-pointer">
								<input
									type="checkbox"
									className="w-4 h-4 accent-blue-500 cursor-pointer"
									value={category}
									checked={selectedFilters.includes(category)}
									onChange={(e) => {
										toggleSubCategory(e);  // Call first function
										handleCheckboxChange(category);  // Call second function
									}}
								/>

								{category}
							</label>
						))}
					</div>
				</div>
			</div>

			{/* Right side */}
			<div className='flex-1'>
				<div className='flex justify-between text-base sm:text-2xl mb-4'>
					<Title text1={"ALL"} text2={"COLLECTIONS"} />
						{/* Product sort */}
					<select onChange={(e) => setSortType(e.target.value)} className="border-gray-300 border text-sm px-2 rounded hover:border-orange-500 focus:border-orange-500">
						<option value="relevant">Sort by: Relevant</option>
						<option value="low-high">Sort by: Low to High</option>
						<option value="high-low">Sort by: High to Low</option>
						<option value="bestsellers">Sort by: Bestsellers</option>
						<option value="customer-reviews">Sort by: Customer Reviews [Function Not Added]</option>
					</select>
				</div>

				{/* Map Products */}
				<div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6'>
					{
						filterProducts.map((item, index)=>(
							<ProductItem key={index} id={item._id} image={item.image} name={item.name} price={item.price} />
						))
					}
				</div>
			</div>


		</div>
	)
}

export default Collection