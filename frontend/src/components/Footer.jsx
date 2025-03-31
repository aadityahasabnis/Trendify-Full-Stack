import React from 'react'
import { assets } from '../assets/frontend_assets/assets'

const Footer = () => {
    return (
        <div>
            <div className='grid grid-col sm:grid-cols-[3fr_1fr_1fr] gap-14 my-10 text-sm'>
                <div>
                    <img src={assets.logo} className='w-32 mb-5' alt="" />
                    <p className='w-full text-gray-600 md:w-2/3'>
                        Lorem ipsum dolor sit amet consectetur adipisicing elit. Ratione iure quod at dicta, deserunt officia, eaque expedita et quam similique ipsum dolore odio qui cumque. Sit ratione vitae corporis repellendus.
                    </p>
                </div>

                <div>
                    <p className='mb-5 text-xl font-medium'>COMPANY</p>
                    <ul className='flex-col gap-1 text-gray-600'>
                        <li>Home</li>
                        <li>About Us</li>
                        <li>Delivery</li>
                        <li>Privacy Policy</li>
                    </ul>
                </div>

                <div>
                    <p className='mb-5 text-xl font-medium'>GET IN TOUCH</p>
                    <ul className='flex-col gap-1 text-gray-600'>
                        <li>+91 9960553107</li>
                        <li>contact@trendify.com</li>
                    </ul>
                </div>
            </div>
            <div>
                <hr />
                <p className='py-5 text-sm text-center'> Copyright 2025 &#xA9; trendify.com - All Rights Reserved.</p>
            </div>
        </div>
    )
}

export default Footer