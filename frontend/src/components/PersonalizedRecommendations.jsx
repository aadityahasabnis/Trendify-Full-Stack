import React from 'react'

const PersonalizedRecommendations = () => {
    return (
        <div>
            <div className='flex flex-col items-center gap-5 py-20 text-center border border-gray-300 rounded'>
                <p className='text-2xl'>See personalized recommendations</p>
                
                <div className='flex flex-col w-1/4 gap-5'>
                    <button className='px-20 py-2 bg-orange-400 cursor-pointer rounded-2xl' type='button'>Sign in</button>
                    <div className="flex items-center justify-center gap-1 text-center">
                        <p>New Customer?</p>
                        <p className='text-blue-700 underline underline-offset-2'>Start here</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PersonalizedRecommendations