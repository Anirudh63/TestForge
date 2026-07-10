import Image from 'next/image'
import React from 'react'
import { Button } from '../ui/button'
import { LinkIcon } from 'lucide-react'

function EmptyWorkspace() {
    return (
        <div className='flex flex-col items-center justify-center py-16 px-6'>
            <Image src={'/folder.png'} alt='folder' width={80} height={80} className='mb-6' />
            <h2 className='font-semibold text-2xl text-gray-900 mb-2'>No Repository Connected</h2>
            <p className='text-center text-gray-500 max-w-md mb-6 leading-relaxed'>
                Connect your Github accounts and add a repository to generate and run test cases
            </p>

            <Button className='bg-[#2b5c37] hover:bg-[#1e4227] text-white px-5 py-2 rounded-md font-semibold text-sm flex items-center gap-2 transition-all cursor-pointer'>
                <LinkIcon className='h-4 w-4' />
                Connect Repo
            </Button>
        </div>
    )
}

export default EmptyWorkspace