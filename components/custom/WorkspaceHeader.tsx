import { UserButton } from '@clerk/nextjs'
import Image from 'next/image'
import React from 'react'

function WorkspaceHeader() {
    return (
        <div className='flex w-full justify-between items-center p-4 border-b border-gray-100 bg-white px-8'>
            {/* Logo  */}
            <Image src={'/logo.svg'} alt='logo' width={150} height={40} style={{ width: 'auto', height: 'auto' }} />

            {/* menu Options  */}
            <ul className='flex gap-8 text-base font-semibold text-gray-700'>
                <li className='hover:text-blue-600 cursor-pointer transition-colors'>Workspace</li>
                <li className='hover:text-blue-600 cursor-pointer transition-colors'>Pricing</li>
                <li className='hover:text-blue-600 cursor-pointer transition-colors'>Support</li>
            </ul>

            {/* User Button  */}
            <div className='flex items-center'>
                <UserButton />
            </div>
        </div>
    )
}

export default WorkspaceHeader