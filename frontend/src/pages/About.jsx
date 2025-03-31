import React from 'react';
import Title from '../components/Title';
import NewsletterBox from '../components/NewsletterBox';
import { assets } from '../assets/frontend_assets/assets';

const About = () => {
	return (
		<div className="container mx-auto px-4 pb-10">
			<div className="text-2xl text-center pt-8 border-t">
				<Title text1="ABOUT" text2="US" />
			</div>

			<div className="my-10 flex flex-col md:flex-row gap-16 mb-20">
				<img
					className="w-full md:max-w-[450px] rounded-lg shadow-md object-cover"
					src={assets.about_img}
					alt="About Trendify"
				/>
				<div className="flex flex-col justify-center gap-6 md:w-2/4 text-gray-600">
					<p className="leading-relaxed">
						At Trendify, we believe everyone deserves to express their unique style. We curate the latest trends in fashion, accessories, and home goods to bring you high-quality, on-trend pieces you'll love. We're passionate about providing a seamless shopping experience and helping you discover your next favorite find.
					</p>
					<p className="leading-relaxed">
						Trendify was born from a love of discovering and sharing the best in fashion and lifestyle products. We carefully handpick each item in our collection, focusing on quality craftsmanship and contemporary design. We're committed to offering a diverse range of products that reflect the ever-evolving world of trends, all while maintaining exceptional value.
					</p>
					<b>Our mission</b>
					<p className="leading-relaxed">
						Our mission is to make staying stylish effortless and enjoyable. We believe in providing a personalized shopping experience, and we're always here to help you find the perfect piece to complement your individual style.
					</p>
					<p className="leading-relaxed">
						Welcome to Trendify! We're more than just an online store; we're a community of trendsetters and style enthusiasts. Join us on our mission to make style accessible to everyone.
					</p>
				</div>
			</div>

			{/* Why Choose Us Section */}
			<div className="text-2xl text-center pt-10 border-t border-gray-300">
				<Title text1="WHY" text2="CHOOSE US" />
			</div>
			<div className=" text-center">
				
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					<div className="p-6 bg-white rounded-lg shadow-md">
						<h3 className="text-xl font-semibold mb-4 text-gray-700">Quality Assurance</h3>
						<p className="text-gray-600">
							We meticulously select and vet each product to ensure it meets our stringent quality standards.
						</p>
					</div>
					<div className="p-6 bg-white rounded-lg shadow-md">
						<h3 className="text-xl font-semibold mb-4 text-gray-700">Convenience</h3>
						<p className="text-gray-600">
							With our user-friendly interface and hassle-free ordering process, shopping has never been easier.
						</p>
					</div>
					<div className="p-6 bg-white rounded-lg shadow-md">
						<h3 className="text-xl font-semibold mb-4 text-gray-700">Exceptional Customer Service</h3>
						<p className="text-gray-600">
							Our team of dedicated professionals is here to assist you the way, ensuring your satisfaction is our top priority.
						</p>
					</div>
				</div>
			</div>

			{/* Newsletter */}
			<div className='my-15 mt-20'>
				<NewsletterBox />
			</div>
		</div>
	);
};

export default About;