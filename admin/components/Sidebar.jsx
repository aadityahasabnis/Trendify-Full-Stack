import React from 'react'
import { NavLink } from 'react-router-dom'

const Sidebar = () => {
  return (
    <div className='w-[18%] min-h-screen border-r-2 border-gray-300 bg-white shadow-lg'>
      <div className='flex flex-col gap-4 pt-6 pl-[20%] text-[15px]'>
        <NavLink
          className={({ isActive }) =>
            `flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l transition-colors ${isActive ? 'bg-orange-100 border-orange-500' : 'hover:bg-gray-50'
            }`
          }
          to='/dashboard'
        >
          <i className="material-icons text-gray-600" style={{ fontSize: '20px' }}>dashboard</i>
          <p className='hidden md:block'>Dashboard</p>
        </NavLink>

        <NavLink
          className={({ isActive }) =>
            `flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l transition-colors ${isActive ? 'bg-orange-100 border-orange-500' : 'hover:bg-gray-50'
            }`
          }
          to='/categories'
        >
          <i className="material-icons text-gray-600" style={{ fontSize: '20px' }}>category</i>
          <p className='hidden md:block'>Categories</p>
        </NavLink>

        <NavLink
          className={({ isActive }) =>
            `flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l transition-colors ${isActive ? 'bg-orange-100 border-orange-500' : 'hover:bg-gray-50'
            }`
          }
          to='/subcategories'
        >
          <i className="material-icons text-gray-600" style={{ fontSize: '20px' }}>tag</i>
          <p className='hidden md:block'>Subcategories</p>
        </NavLink>

        <NavLink
          className={({ isActive }) =>
            `flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l transition-colors ${isActive ? 'bg-orange-100 border-orange-500' : 'hover:bg-gray-50'
            }`
          }
          to='/add'
        >
          <i className="material-icons text-gray-600" style={{ fontSize: '20px' }}>add_circle</i>
          <p className='hidden md:block'>Add Product</p>
        </NavLink>

        <NavLink
          className={({ isActive }) =>
            `flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l transition-colors ${isActive ? 'bg-orange-100 border-orange-500' : 'hover:bg-gray-50'
            }`
          }
          to='/list'
        >
          <i className="material-icons text-gray-600" style={{ fontSize: '20px' }}>list</i>
          <p className='hidden md:block'>Products List</p>
        </NavLink>

        <NavLink
          className={({ isActive }) =>
            `flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l transition-colors ${isActive ? 'bg-orange-100 border-orange-500' : 'hover:bg-gray-50'
            }`
          }
          to='/orders'
        >
          <i className="material-icons text-gray-600" style={{ fontSize: '20px' }}>shopping_bag</i>
          <p className='hidden md:block'>Orders</p>
        </NavLink>

        <NavLink
          className={({ isActive }) =>
            `flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l transition-colors ${isActive ? 'bg-orange-100 border-orange-500' : 'hover:bg-gray-50'
            }`
          }
          to='/inventory'
        >
          <i className="material-icons text-gray-600" style={{ fontSize: '20px' }}>inventory</i>
          <p className='hidden md:block'>Inventory</p>
        </NavLink>

        <NavLink
          className={({ isActive }) =>
            `flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l transition-colors ${isActive ? 'bg-orange-100 border-orange-500' : 'hover:bg-gray-50'
            }`
          }
          to='/newsletter'
        >
          <i className="material-icons text-gray-600" style={{ fontSize: '20px' }}>email</i>
          <p className='hidden md:block'>Newsletter</p>
        </NavLink>
      </div>
    </div>
  )
}

export default Sidebar