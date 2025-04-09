import React from 'react'
import { assets } from "../assets/frontend_assets/assets";

const OurPolicy = () => {
  return (
    <div className="bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-medium text-gray-900">Our Policies</h2>
          <p className="mt-2 text-sm text-gray-600">
            We are committed to providing the best shopping experience
          </p>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8'>
          <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex flex-col items-center">
              <img src={assets.exchange_icon} className='w-16 h-16 mb-4' alt="Exchange Policy" />
              <h3 className='text-lg font-semibold text-gray-800 mb-2'>Easy Exchange Policy</h3>
              <p className='text-gray-600 text-center'>
                We offer hassle-free exchange policy for all our products within 30 days of purchase.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex flex-col items-center">
              <img src={assets.quality_icon} className='w-16 h-16 mb-4' alt="Return Policy" />
              <h3 className='text-lg font-semibold text-gray-800 mb-2'>7 Days Return Policy</h3>
              <p className='text-gray-600 text-center'>
                Not satisfied with your purchase? Return it within 7 days for a full refund.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex flex-col items-center">
              <img src={assets.support_img} className='w-16 h-16 mb-4' alt="Customer Support" />
              <h3 className='text-lg font-semibold text-gray-800 mb-2'>Best Customer Support</h3>
              <p className='text-gray-600 text-center'>
                Our dedicated team is available 24/7 to assist you with any queries or concerns.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OurPolicy