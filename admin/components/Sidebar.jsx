import React from 'react'
import { NavLink } from 'react-router-dom'
import { assets } from './../assets/assets';

const Sidebar = () => {
  return (
    <div className='w-[18%] min-h-screen border-r-2 border-gray-300 bg-white shadow-lg'>
      <div className='flex flex-col gap-4 pt-6 pl-[20%] text-[15px]'>
        <NavLink className='flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l' to='/add'>
          <img className='w-5 h05 ' src={assets.add_icon} alt="add" />
          <p className='hidden md:block'>Add Items</p>
        </NavLink>
        <NavLink className='flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l'
          to='/list'>
          <img className='w-5 h05 ' src={assets.order_icon} alt="list" />
          <p className='hidden md:block'>List Items</p>
        </NavLink>
        <NavLink className='flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l'
          to='/orders'>
          <img className='w-5 h05 ' src={assets.order_icon} alt="orders" />
          <p className='hidden md:block'>Orders</p>
        </NavLink>
      </div>
    </div>
  )
}

export default Sidebar